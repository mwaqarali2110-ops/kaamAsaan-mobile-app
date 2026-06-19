import { useMemo } from 'react';
import { useActiveSurveyJourney } from '@/hooks/useSurveyJourney';
import { useAuthStore } from '@/store/useAuthStore';
import { useSystemStore, type DesignSystemStep } from '@/store/useSystemStore';
import type { SurveyJourneyBooking } from '@/services/journey.api';
import type { Appliance, BackupDecision } from '@/types/system.types';
import type { Product } from '@/types/product.types';

type MySystemSnapshot = {
  appliances: Appliance[];
  backupAppliances: Appliance[];
  backupDecision: BackupDecision;
  designStarted: boolean;
  lastDesignStep: DesignSystemStep;
  recommendedSolarKw: number;
  selectedAccessories: Product[];
  selectedBattery: Product | null;
  selectedBatteryKwh: number;
  selectedInverter: Product | null;
  selectedPanelBrand: string | null;
  selectedPanels: Product | null;
};

export type MySystemMode = 'confirmedSurvey' | 'activeDesign' | 'empty';

export type MySystemState = {
  hasActiveDesign: boolean;
  hasConfirmedSurvey: boolean;
  mode: MySystemMode;
  noSystemYet: boolean;
};

const hasAnyQuantity = (items: Appliance[]) => items.some((item) => Number(item.quantity) > 0);

export const getMySystemState = (
  snapshot: MySystemSnapshot,
  activeSurvey?: SurveyJourneyBooking | null
): MySystemState => {
  const hasConfirmedSurvey = Boolean(activeSurvey?.id);
  const hasActiveDesign = Boolean(
    snapshot.designStarted ||
    snapshot.lastDesignStep !== 'appliances' ||
    hasAnyQuantity(snapshot.appliances) ||
    hasAnyQuantity(snapshot.backupAppliances) ||
    snapshot.recommendedSolarKw !== 3 ||
    snapshot.selectedBatteryKwh > 0 ||
    snapshot.selectedPanelBrand ||
    snapshot.backupDecision ||
    snapshot.selectedPanels ||
    snapshot.selectedInverter ||
    snapshot.selectedBattery ||
    snapshot.selectedAccessories.length > 0
  );

  if (hasConfirmedSurvey) {
    return { hasActiveDesign, hasConfirmedSurvey, mode: 'confirmedSurvey', noSystemYet: false };
  }

  if (hasActiveDesign) {
    return { hasActiveDesign, hasConfirmedSurvey, mode: 'activeDesign', noSystemYet: false };
  }

  return { hasActiveDesign: false, hasConfirmedSurvey: false, mode: 'empty', noSystemYet: true };
};

export const useMySystemStatus = () => {
  const userId = useAuthStore((state) => state.session?.user?.id);
  const activeSurveyQuery = useActiveSurveyJourney(userId);
  const appliances = useSystemStore((store) => store.appliances);
  const backupAppliances = useSystemStore((store) => store.backupAppliances);
  const backupDecision = useSystemStore((store) => store.backupDecision);
  const designStarted = useSystemStore((store) => store.designStarted);
  const lastDesignStep = useSystemStore((store) => store.lastDesignStep);
  const recommendedSolarKw = useSystemStore((store) => store.recommendedSolarKw);
  const selectedAccessories = useSystemStore((store) => store.selectedAccessories);
  const selectedBattery = useSystemStore((store) => store.selectedBattery);
  const selectedBatteryKwh = useSystemStore((store) => store.selectedBatteryKwh);
  const selectedInverter = useSystemStore((store) => store.selectedInverter);
  const selectedPanelBrand = useSystemStore((store) => store.selectedPanelBrand);
  const selectedPanels = useSystemStore((store) => store.selectedPanels);

  const snapshot = useMemo<MySystemSnapshot>(() => ({
    appliances,
    backupAppliances,
    backupDecision,
    designStarted,
    lastDesignStep,
    recommendedSolarKw,
    selectedAccessories,
    selectedBattery,
    selectedBatteryKwh,
    selectedInverter,
    selectedPanelBrand,
    selectedPanels,
  }), [
    appliances,
    backupAppliances,
    backupDecision,
    designStarted,
    lastDesignStep,
    recommendedSolarKw,
    selectedAccessories,
    selectedBattery,
    selectedBatteryKwh,
    selectedInverter,
    selectedPanelBrand,
    selectedPanels,
  ]);

  const state = useMemo(
    () => getMySystemState(snapshot, activeSurveyQuery.data),
    [activeSurveyQuery.data, snapshot]
  );

  return {
    ...state,
    activeSurvey: activeSurveyQuery.data ?? null,
    isLoadingSurvey: Boolean(userId) && activeSurveyQuery.isLoading,
  };
};
