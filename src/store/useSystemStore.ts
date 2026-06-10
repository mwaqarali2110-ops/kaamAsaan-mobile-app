import { create } from 'zustand';
import type { Appliance, BackupDecision, SystemSummary } from '@/types/system.types';
import type { Product } from '@/types/product.types';
import { defaultAppliances } from '@/constants/products';
import { calculatePanelCount, calculateRoofSpace, recommendSolarKw } from '@/utils/calculations';

type SystemState = {
  appliances: Appliance[];
  backupAppliances: Appliance[];
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

export const useSystemStore = create<SystemState>((set, get) => ({
  appliances: initialAppliances,
  backupAppliances: initialAppliances.map((item) => ({ ...item, quantity: 0, hours: DEFAULT_BACKUP_HOURS })),
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
  setApplianceQuantity: (id, quantity) => set((state) => ({
    appliances: state.appliances.map((item) => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)
  })),
  addAppliance: (appliance) => set((state) => {
    if (state.appliances.some((item) => item.id === appliance.id)) {
      return {
        appliances: state.appliances.map((item) => item.id === appliance.id ? { ...item, quantity: Math.max(1, item.quantity) } : item)
      };
    }
    return { appliances: [...state.appliances, appliance] };
  }),
  setBackupApplianceQuantity: (id, quantity) => set((state) => ({
    backupAppliances: state.backupAppliances.map((item) => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item)
  })),
  setBackupApplianceHours: (id, hours) => set((state) => ({
    backupAppliances: state.backupAppliances.map((item) => item.id === id ? { ...item, hours } : item)
  })),
  addBackupAppliance: (appliance) => set((state) => {
    if (state.backupAppliances.some((item) => item.id === appliance.id)) {
      return {
        backupAppliances: state.backupAppliances.map((item) => item.id === appliance.id ? { ...item, quantity: Math.max(1, item.quantity) } : item)
      };
    }
    return { backupAppliances: [...state.backupAppliances, appliance] };
  }),
  calculateRecommendation: () => set((state) => ({ recommendedSolarKw: recommendSolarKw(state.appliances) })),
  setRecommendedSolarKw: (recommendedSolarKw) => set({ recommendedSolarKw }),
  setSelectedBatteryKwh: (selectedBatteryKwh) => set({ selectedBatteryKwh }),
  setPanelWattage: (panelWattage) => set({ panelWattage }),
  setSelectedPanelBrand: (selectedPanelBrand) => set({ selectedPanelBrand }),
  setBackupDecision: (backupDecision) => set({ backupDecision }),
  setSelectedProduct: (product) => set((state) => {
    if (product.category === 'panel') return { selectedPanels: product };
    if (product.category === 'inverter') return { selectedInverter: product };
    if (product.category === 'battery') return { selectedBattery: product };
    return { selectedAccessories: [...state.selectedAccessories.filter((item) => item.id !== product.id), product] };
  }),
  setPackageName: (packageName) => set({ packageName }),
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
}));
