import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppState = {
  hasSeenOnboarding: boolean;
  hasHydrated: boolean;
  dismissedCancelledSurveyIds: string[];
  setHasSeenOnboarding: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  dismissCancelledSurveyPrompt: (surveyId: string) => void;
};

export const useAppStore = create<AppState>()(persist((set) => ({
  hasSeenOnboarding: false,
  hasHydrated: false,
  dismissedCancelledSurveyIds: [],
  setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
  setHasHydrated: (value) => set({ hasHydrated: value }),
  dismissCancelledSurveyPrompt: (surveyId) => set((state) => {
    const normalizedSurveyId = surveyId.trim();
    if (!normalizedSurveyId || state.dismissedCancelledSurveyIds.includes(normalizedSurveyId)) return state;
    return {
      dismissedCancelledSurveyIds: [...state.dismissedCancelledSurveyIds, normalizedSurveyId]
    };
  })
}), {
  name: 'kaamasaan-app-state',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    hasSeenOnboarding: state.hasSeenOnboarding,
    dismissedCancelledSurveyIds: state.dismissedCancelledSurveyIds
  }),
  onRehydrateStorage: () => (state) => {
    state?.setHasHydrated(true);
  }
}));
