import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { MaintenanceBooking, MaintenanceBookingInput, MaintenancePlanSelection } from '@/types/maintenance.types';
import { canCancelMaintenanceRequest, maintenanceApi } from '@/services/maintenance.api';
import { notificationsApi } from '@/services/notifications.api';
import { useAuthStore } from '@/store/useAuthStore';

const STORAGE_KEY = 'kaamasaan:maintenance-bookings';

type MaintenanceBookingState = {
  selectedPlan?: MaintenancePlanSelection;
  latestBooking?: MaintenanceBooking;
  bookings: MaintenanceBooking[];
  hydrated: boolean;
  setSelectedPlan: (plan: MaintenancePlanSelection) => void;
  createBooking: (input: MaintenanceBookingInput, idempotencyKey?: string) => Promise<MaintenanceBooking>;
  cancelBooking: (requestId: string, reason?: string, note?: string) => Promise<MaintenanceBooking>;
  hydrate: (force?: boolean) => Promise<void>;
};

const persistBookings = async (bookings: MaintenanceBooking[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

const pendingCancellations = new Set<string>();

const sortBookings = (bookings: MaintenanceBooking[]) => [...bookings]
  .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

const mergeBookings = (local: MaintenanceBooking[], remote: MaintenanceBooking[]) => {
  const byId = new Map(local.map((booking) => [booking.id, booking]));
  remote.forEach((booking) => byId.set(booking.id, booking));
  return sortBookings([...byId.values()]);
};

export const useMaintenanceBookingStore = create<MaintenanceBookingState>((set, get) => ({
  selectedPlan: undefined,
  latestBooking: undefined,
  bookings: [],
  hydrated: false,
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  createBooking: async (input, idempotencyKey) => {
    const plan = get().selectedPlan;
    if (!plan) throw new Error('Please select a maintenance plan first.');

    const now = new Date();
    const localBooking: MaintenanceBooking = {
      ...input,
      id: `maintenance-${now.getTime()}`,
      userId: useAuthStore.getState().session?.user.id,
      referenceNumber: `KM-MNT-${now.getTime().toString().slice(-6)}`,
      plan,
      status: 'received',
      createdAt: now.toISOString()
    };

    const remoteBooking = await maintenanceApi.createRequest({
      input,
      plan,
      referenceNumber: localBooking.referenceNumber,
      idempotencyKey
    });
    if (!remoteBooking?.maintenancePlanId && plan.planId === 'premium') {
      throw new Error('Premium Care plan creation did not complete. Please try again.');
    }
    const booking = remoteBooking;

    const bookings = [booking, ...get().bookings];
    await persistBookings(bookings);
    set({ bookings, latestBooking: booking });
    return booking;
  },
  cancelBooking: async (requestId, reason, note) => {
    if (pendingCancellations.has(requestId)) throw new Error('Cancellation is already in progress.');
    const existing = get().bookings.find((booking) => booking.id === requestId) ?? (
      get().latestBooking?.id === requestId ? get().latestBooking : undefined
    );
    if (!existing) throw new Error('Maintenance request was not found.');
    if (!canCancelMaintenanceRequest(existing.status)) throw new Error('This maintenance request can no longer be cancelled.');

    pendingCancellations.add(requestId);
    try {
      const cancelledAt = new Date().toISOString();
      const cancelled = existing.backendSynced
        ? await maintenanceApi.cancelRequest({ requestId, reason, note })
        : {
          ...existing,
          status: 'cancelled' as const,
          cancellationReason: reason?.trim() || null,
          cancellationNote: note?.trim() || null,
          cancelledAt,
          cancelledBy: 'customer' as const,
          updatedAt: cancelledAt
        };
      const currentBookings = get().bookings.some((booking) => booking.id === requestId)
        ? get().bookings
        : [existing, ...get().bookings];
      const bookings = currentBookings.map((booking) => booking.id === requestId ? cancelled : booking);
      await persistBookings(bookings);
      set({ bookings, latestBooking: get().latestBooking?.id === requestId ? cancelled : get().latestBooking });
      try {
        await notificationsApi.createMaintenanceCancellationNotificationOnce(cancelled);
      } catch (notificationError) {
        if (__DEV__) console.warn('Maintenance cancellation notification could not be created.', notificationError);
      }
      return cancelled;
    } finally {
      pendingCancellations.delete(requestId);
    }
  },
  hydrate: async (force = false) => {
    if (get().hydrated && !force) return;

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const currentUserId = useAuthStore.getState().session?.user.id;
    const storedBookings = stored ? (JSON.parse(stored) as MaintenanceBooking[]) : [];
    // Older local maintenance records predate user ownership metadata. Claim
    // them for the currently authenticated customer once, then persist it.
    const localBookings = storedBookings
      .filter((booking) => !booking.userId || booking.userId === currentUserId)
      .map((booking) => booking.userId || !currentUserId ? booking : { ...booking, userId: currentUserId });
    let bookings = sortBookings(localBookings);
    try {
      const remoteBookings = await maintenanceApi.getRequests();
      if (remoteBookings) bookings = mergeBookings(localBookings, remoteBookings);
    } catch (error) {
      if (__DEV__) console.warn('Maintenance requests could not be refreshed from Supabase.', error);
    }
    await persistBookings(bookings);
    set({ bookings, latestBooking: bookings[0], hydrated: true });
  }
}));
