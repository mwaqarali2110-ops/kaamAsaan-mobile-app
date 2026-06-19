import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { MaintenanceBooking, MaintenanceBookingInput, MaintenancePlanSelection } from '@/types/maintenance.types';

const STORAGE_KEY = 'kaamasaan:maintenance-bookings';

type MaintenanceBookingState = {
  selectedPlan?: MaintenancePlanSelection;
  latestBooking?: MaintenanceBooking;
  bookings: MaintenanceBooking[];
  hydrated: boolean;
  setSelectedPlan: (plan: MaintenancePlanSelection) => void;
  createBooking: (input: MaintenanceBookingInput) => Promise<MaintenanceBooking>;
  hydrate: () => Promise<void>;
};

const persistBookings = async (bookings: MaintenanceBooking[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const useMaintenanceBookingStore = create<MaintenanceBookingState>((set, get) => ({
  selectedPlan: undefined,
  latestBooking: undefined,
  bookings: [],
  hydrated: false,
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  createBooking: async (input) => {
    const plan = get().selectedPlan;
    if (!plan) throw new Error('Please select a maintenance plan first.');

    const now = new Date();
    const booking: MaintenanceBooking = {
      ...input,
      id: `maintenance-${now.getTime()}`,
      referenceNumber: `KM-MNT-${now.getTime().toString().slice(-6)}`,
      plan,
      status: 'received',
      createdAt: now.toISOString()
    };

    const bookings = [booking, ...get().bookings];
    await persistBookings(bookings);
    set({ bookings, latestBooking: booking });
    return booking;
  },
  hydrate: async () => {
    if (get().hydrated) return;

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const bookings = stored ? (JSON.parse(stored) as MaintenanceBooking[]) : [];
    set({ bookings, latestBooking: bookings[0], hydrated: true });
  }
}));
