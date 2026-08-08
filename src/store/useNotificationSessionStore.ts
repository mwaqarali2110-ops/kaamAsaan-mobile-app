import { create } from 'zustand';

type NotificationSessionState = {
  userId: string | null;
  hasHandledStartupNotification: boolean;
  hasShownAutomaticNotification: boolean;
  knownNotificationIds: string[];
  beginSession: (userId: string) => void;
  markStartupHandled: (knownNotificationIds: string[]) => void;
  markAutomaticNotificationShown: () => void;
  rememberNotifications: (notificationIds: string[]) => void;
  resetSession: () => void;
};

export const useNotificationSessionStore = create<NotificationSessionState>((set) => ({
  userId: null,
  hasHandledStartupNotification: false,
  hasShownAutomaticNotification: false,
  knownNotificationIds: [],
  beginSession: (userId) => set((state) => state.userId === userId ? state : {
    userId,
    hasHandledStartupNotification: false,
    hasShownAutomaticNotification: false,
    knownNotificationIds: []
  }),
  markAutomaticNotificationShown: () => set({ hasShownAutomaticNotification: true }),
  markStartupHandled: (knownNotificationIds) => set({
    hasHandledStartupNotification: true,
    knownNotificationIds: Array.from(new Set(knownNotificationIds))
  }),
  rememberNotifications: (notificationIds) => set((state) => ({
    knownNotificationIds: Array.from(new Set([...state.knownNotificationIds, ...notificationIds]))
  })),
  resetSession: () => set({
    userId: null,
    hasHandledStartupNotification: false,
    hasShownAutomaticNotification: false,
    knownNotificationIds: []
  })
}));
