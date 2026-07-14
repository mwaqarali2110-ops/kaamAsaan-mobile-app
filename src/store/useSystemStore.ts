import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appliance, BackupDecision, SystemSummary } from '@/types/system.types';
import type { Product } from '@/types/product.types';
import { defaultAppliances } from '@/constants/products';
import { calculatePanelCount, calculateRoofSpace, recommendSolarKw } from '@/utils/calculations';

export const designSystemSteps = ['appliances', 'solar', 'roof', 'backupNeed', 'backupAppliances', 'backupPlan', 'recommended', 'packages'] as const;
export type DesignSystemStep = typeof designSystemSteps[number];

type SystemState = {
  appliances: Appliance[];
  backupAppliances: Appliance[];
  designStarted: boolean;
  lastDesignStep: DesignSystemStep;
  recommendedSolarKw: number;
  selectedBatteryKwh: number;
  panelWattage: number;
  selectedPanelBrand: string | null;
  backupDecision: BackupDecision;
  selectedPanels: Product | null;
  selectedInverter: Product | null;
  selectedBattery: Product | null;
  selectedAccessories: Product[];
  packageName: string;
  setDesignProgress: (step: DesignSystemStep) => void;
  setApplianceQuantity: (id: string, quantity: number) => void;
  addAppliance: (appliance: Appliance) => void;
  setBackupApplianceQuantity: (id: string, quantity: number) => void;
  setBackupApplianceHours: (id: string, hours: number) => void;
  addBackupAppliance: (appliance: Appliance) => void;
  calculateRecommendation: () => void;
  setRecommendedSolarKw: (kw: number) => void;
  setSelectedBatteryKwh: (kwh: number) => void;
  setPanelWattage: (wattage: number) => void;
  setSelectedPanelBrand: (brand: string) => void;
  setBackupDecision: (decision: BackupDecision) => void;
  setSelectedProduct: (product: Product) => void;
  setPackageName: (name: string) => void;
  getSummary: () => SystemSummary;
  reset: () => void;
};

const initialAppliances = defaultAppliances;
const DEFAULT_BACKUP_HOURS = 1;

export const useSystemStore = create<SystemState>()(persist((set, get) => ({
  appliances: initialAppliances,
  backupAppliances: initialAppliances.map((item) => ({ ...item, quantity: 0, hours: DEFAULT_BACKUP_HOURS })),
  designStarted: false,
  lastDesignStep: 'appliances',
  recommendedSolarKw: 3,
  selectedBatteryKwh: 0,
  panelWattage: 610,
  selectedPanelBrand: null,
  backupDecision: null,
  selectedPanels: null,
  selectedInverter: null,
  selectedBattery: null,
  selectedAccessories: [],
  packageName: 'Balanced',
  setDesignProgress: (lastDesignStep) => set({ designStarted: true, lastDesignStep }),
  setApplianceQuantity: (id, quantity) => set((state) => ({
    designStarted: true,
    appliances: state.appliances.map((item) => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)
  })),
  addAppliance: (appliance) => set((state) => {
    if (state.appliances.some((item) => item.id === appliance.id)) {
      return {
        designStarted: true,
        appliances: state.appliances.map((item) => item.id === appliance.id ? { ...item, quantity: Math.max(1, item.quantity) } : item)
      };
    }
    return { designStarted: true, appliances: [...state.appliances, appliance] };
  }),
  setBackupApplianceQuantity: (id, quantity) => set((state) => ({
    designStarted: true,
    backupAppliances: state.backupAppliances.map((item) => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)
  })),
  setBackupApplianceHours: (id, hours) => set((state) => ({
    designStarted: true,
    backupAppliances: state.backupAppliances.map((item) => item.id === id ? { ...item, hours } : item)
  })),
  addBackupAppliance: (appliance) => set((state) => {
    if (state.backupAppliances.some((item) => item.id === appliance.id)) {
      return {
        designStarted: true,
        backupAppliances: state.backupAppliances.map((item) => item.id === appliance.id ? { ...item, quantity: Math.max(1, item.quantity) } : item)
      };
    }
    return { designStarted: true, backupAppliances: [...state.backupAppliances, appliance] };
  }),
  calculateRecommendation: () => set((state) => {
    const selectedQuantity = state.appliances.reduce(
      (total, item) => total + Math.max(0, Number(item.quantity) || 0),
      0
    );
    if (selectedQuantity <= 0) return {};
    return { designStarted: true, recommendedSolarKw: recommendSolarKw(state.appliances) };
  }),
  setRecommendedSolarKw: (recommendedSolarKw) => set({ designStarted: true, recommendedSolarKw }),
  setSelectedBatteryKwh: (selectedBatteryKwh) => set({ designStarted: true, selectedBatteryKwh }),
  setPanelWattage: (panelWattage) => set({ designStarted: true, panelWattage }),
  setSelectedPanelBrand: (selectedPanelBrand) => set({ designStarted: true, selectedPanelBrand }),
  setBackupDecision: (backupDecision) => set({ designStarted: true, backupDecision }),
  setSelectedProduct: (product) => set((state) => {
    if (product.category === 'panel') return { designStarted: true, selectedPanels: product };
    if (product.category === 'inverter') return { designStarted: true, selectedInverter: product };
    if (product.category === 'battery') return { designStarted: true, selectedBattery: product };
    return { designStarted: true, selectedAccessories: [...state.selectedAccessories.filter((item) => item.id !== product.id), product] };
  }),
  setPackageName: (packageName) => set({ designStarted: true, lastDesignStep: 'packages', packageName }),
  getSummary: () => {
    const state = get();
    const panelCount = calculatePanelCount(state.recommendedSolarKw, state.panelWattage);
    return {
      solarKw: state.recommendedSolarKw,
      panelWattage: state.panelWattage,
      selectedPanelBrand: state.selectedPanelBrand,
      panelCount,
      roofAreaSqFt: calculateRoofSpace(panelCount).areaSqFt,
      inverter: state.selectedInverter,
      battery: state.backupDecision === 'yes' ? state.selectedBattery : null,
      panels: state.selectedPanels,
      accessories: state.selectedAccessories,
      packageName: state.packageName
    };
  },
  reset: () => set({
    appliances: initialAppliances,
    backupAppliances: initialAppliances.map((item) => ({ ...item, quantity: 0, hours: DEFAULT_BACKUP_HOURS })),
    designStarted: false,
    lastDesignStep: 'appliances',
    recommendedSolarKw: 3,
    selectedBatteryKwh: 0,
    panelWattage: 610,
    selectedPanelBrand: null,
    backupDecision: null,
    selectedPanels: null,
    selectedInverter: null,
    selectedBattery: null,
    selectedAccessories: [],
    packageName: 'Balanced'
  })
}), {
  name: 'kaamasaan-system-draft',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    appliances: state.appliances,
    backupAppliances: state.backupAppliances,
    designStarted: state.designStarted,
    lastDesignStep: state.lastDesignStep,
    recommendedSolarKw: state.recommendedSolarKw,
    selectedBatteryKwh: state.selectedBatteryKwh,
    panelWattage: state.panelWattage,
    selectedPanelBrand: state.selectedPanelBrand,
    backupDecision: state.backupDecision,
    selectedPanels: state.selectedPanels,
    selectedInverter: state.selectedInverter,
    selectedBattery: state.selectedBattery,
    selectedAccessories: state.selectedAccessories,
    packageName: state.packageName
  })
}));
