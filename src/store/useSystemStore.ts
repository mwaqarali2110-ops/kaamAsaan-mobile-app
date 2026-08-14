import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appliance, BackupDecision, SystemSummary } from '@/types/system.types';
import type { Product } from '@/types/product.types';
import { defaultAppliances } from '@/constants/products';
import {
  calculatePanelCount,
  calculateRoofSpace,
  recommendSolarKw,
  type BackupRequirementSummary,
  type PanelOrientation
} from '@/utils/calculations';
import { getRecommendedPackageById, type RecommendedPackage } from '@/utils/packageBuilder';
import {
  customSystemComponentForProduct,
  resolvePanelQuantity,
  resolvePanelWattage,
  type CustomSystemComponent
} from '@/utils/customSystem';
import type { BatteryConfiguration } from '@/utils/batteryRecommendation';
import { BATTERY_RECOMMENDATION_ENGINE_VERSION } from '@/utils/commercialRecommendation';
import type { CleaningEstimate } from '@/utils/cleaningPricing';
import type { PromoContext, PromoState } from '@/types/promo.types';
import { promoApi } from '@/services/promo.api';
import { createInitialPromoState, promoContextSignature, sanitizePromoInput } from '@/utils/promo';

export type InstallationStructureType = 'standard' | 'elevated' | 'ground_mounted' | 'shed';
export type BookingContext =
  | 'general'
  | 'solar_package'
  | 'custom_system'
  | 'cleaning'
  | 'installation'
  | 'electrical';

/**
 * Custom System Builder metadata. The selected products themselves live in the
 * existing selectedPanels / selectedInverter / selectedBattery fields so there is
 * only ever one source of truth for a chosen component.
 */
export type CustomSystemState = {
  active: boolean;
  sourceComponent: CustomSystemComponent | null;
  selectedComponentOrder: CustomSystemComponent[];
  panelQuantity: number | null;
  panelWattage: number | null;
  batteryQuantity: number;
};

const createInitialCustomSystemState = (): CustomSystemState => ({
  active: false,
  sourceComponent: null,
  selectedComponentOrder: [],
  panelQuantity: null,
  panelWattage: null,
  batteryQuantity: 1
});

const appendComponentOrder = (order: CustomSystemComponent[], component: CustomSystemComponent) =>
  order.includes(component) ? order : [...order, component];

export type InstallationDetails = {
  panelWattage: number;
  numberOfPanels: number;
  inverterSizeKw: number;
  inverterBrand: string;
  batterySizeKwh: number;
  batteryBrand: string;
  structureType: InstallationStructureType;
};

export const designSystemSteps = ['appliances', 'solar', 'roof', 'backupNeed', 'backupAppliances', 'backupPlan', 'recommended', 'packages'] as const;
export type DesignSystemStep = typeof designSystemSteps[number];

type SystemState = {
  appliances: Appliance[];
  backupAppliances: Appliance[];
  designStarted: boolean;
  lastDesignStep: DesignSystemStep;
  recommendedSolarKw: number;
  selectedBatteryKwh: number;
  backupRequirementSummary: BackupRequirementSummary | null;
  selectedBatteryConfiguration: BatteryConfiguration | null;
  batteryRecommendationRequirementKwh: number | null;
  batteryRecommendationEngineVersion: number;
  panelWattage: number;
  panelOrientation: PanelOrientation;
  panelQuantityOverride: number | null;
  selectedPanelBrand: string | null;
  backupDecision: BackupDecision;
  selectedPanels: Product | null;
  selectedInverter: Product | null;
  selectedBattery: Product | null;
  selectedAccessories: Product[];
  packageName: string;
  recommendedPackages: RecommendedPackage[];
  selectedRecommendedPackageId: string | null;
  selectedRecommendedPackage: RecommendedPackage | null;
  bookingContext: BookingContext;
  customSystem: CustomSystemState;
  cleaningEstimate: CleaningEstimate | null;
  installationDetails: InstallationDetails | null;
  promo: PromoState;
  setDesignProgress: (step: DesignSystemStep) => void;
  setApplianceQuantity: (id: string, quantity: number) => void;
  addAppliance: (appliance: Appliance) => void;
  setBackupApplianceQuantity: (id: string, quantity: number) => void;
  setBackupApplianceHours: (id: string, hours: number) => void;
  addBackupAppliance: (appliance: Appliance) => void;
  calculateRecommendation: () => void;
  setRecommendedSolarKw: (kw: number) => void;
  setSelectedBatteryKwh: (kwh: number) => void;
  setBackupRequirementSummary: (summary: BackupRequirementSummary | null) => void;
  setSelectedBatteryConfiguration: (
    configuration: BatteryConfiguration | null,
    requirementKwh?: number | null
  ) => void;
  setPanelWattage: (wattage: number) => void;
  setPanelOrientation: (orientation: PanelOrientation) => void;
  setPanelLayoutSelection: (selection: {
    panelQuantity: number;
    panelWattage: number;
    orientation: PanelOrientation;
    panelProduct?: Product | null;
  }) => void;
  setSelectedPanelBrand: (brand: string) => void;
  setBackupDecision: (decision: BackupDecision) => void;
  setSelectedProduct: (product: Product) => void;
  setPackageName: (name: string) => void;
  setRecommendedPackages: (packages: RecommendedPackage[]) => void;
  setSelectedRecommendedPackage: (recommendedPackage: RecommendedPackage | null) => void;
  clearSelectedRecommendedPackage: () => void;
  startCustomSystem: (product: Product) => void;
  setCustomSystemComponent: (product: Product, options?: { quantity?: number }) => void;
  setCustomSystemPanelSelection: (selection: {
    panelProduct: Product | null;
    panelQuantity: number;
    panelWattage: number;
  }) => void;
  clearCustomSystem: () => void;
  startBooking: (context: BookingContext) => void;
  setCleaningEstimate: (estimate: CleaningEstimate) => void;
  clearCleaningEstimate: () => void;
  setInstallationDetails: (details: InstallationDetails) => void;
  clearInstallationDetails: () => void;
  setPromoInput: (value: string) => void;
  applyPromo: (context: PromoContext, codeOverride?: string) => Promise<boolean>;
  syncPromoContext: (context: PromoContext) => Promise<void>;
  removePromo: (originalTotal?: number) => void;
  resetPromo: () => void;
  getRecommendedPackageById: (packageId: string) => RecommendedPackage | null;
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
  backupRequirementSummary: null,
  selectedBatteryConfiguration: null,
  batteryRecommendationRequirementKwh: null,
  batteryRecommendationEngineVersion: BATTERY_RECOMMENDATION_ENGINE_VERSION,
  panelWattage: 610,
  panelOrientation: 'landscape',
  panelQuantityOverride: null,
  selectedPanelBrand: null,
  backupDecision: null,
  selectedPanels: null,
  selectedInverter: null,
  selectedBattery: null,
  selectedAccessories: [],
  packageName: 'Balanced',
  recommendedPackages: [],
  selectedRecommendedPackageId: null,
  selectedRecommendedPackage: null,
  bookingContext: 'general',
  customSystem: createInitialCustomSystemState(),
  cleaningEstimate: null,
  installationDetails: null,
  promo: createInitialPromoState(),
  setDesignProgress: (lastDesignStep) => set({ designStarted: true, lastDesignStep }),
  setApplianceQuantity: (id, quantity) => set((state) => ({
    designStarted: true,
    appliances: state.appliances.map((item) => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item),
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  })),
  addAppliance: (appliance) => set((state) => {
    if (state.appliances.some((item) => item.id === appliance.id)) {
      return {
        designStarted: true,
        appliances: state.appliances.map((item) => item.id === appliance.id ? { ...item, quantity: Math.max(1, item.quantity) } : item),
        recommendedPackages: [],
        selectedRecommendedPackageId: null,
        selectedRecommendedPackage: null
      };
    }
    return {
      designStarted: true,
      appliances: [...state.appliances, appliance],
      recommendedPackages: [],
      selectedRecommendedPackageId: null,
      selectedRecommendedPackage: null
    };
  }),
  setBackupApplianceQuantity: (id, quantity) => set((state) => ({
    designStarted: true,
    backupAppliances: state.backupAppliances.map((item) => item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item),
    backupRequirementSummary: null,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  })),
  setBackupApplianceHours: (id, hours) => set((state) => ({
    designStarted: true,
    backupAppliances: state.backupAppliances.map((item) => item.id === id ? { ...item, hours } : item),
    backupRequirementSummary: null,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  })),
  addBackupAppliance: (appliance) => set((state) => {
    if (state.backupAppliances.some((item) => item.id === appliance.id)) {
      return {
        designStarted: true,
        backupAppliances: state.backupAppliances.map((item) => item.id === appliance.id ? { ...item, quantity: Math.max(1, item.quantity) } : item),
        backupRequirementSummary: null,
        recommendedPackages: [],
        selectedRecommendedPackageId: null,
        selectedRecommendedPackage: null
      };
    }
    return {
      designStarted: true,
      backupAppliances: [...state.backupAppliances, appliance],
      backupRequirementSummary: null,
      recommendedPackages: [],
      selectedRecommendedPackageId: null,
      selectedRecommendedPackage: null
    };
  }),
  calculateRecommendation: () => set((state) => {
    const selectedQuantity = state.appliances.reduce(
      (total, item) => total + Math.max(0, Number(item.quantity) || 0),
      0
    );
    if (selectedQuantity <= 0) return {};
    return {
      designStarted: true,
      recommendedSolarKw: recommendSolarKw(state.appliances),
      panelQuantityOverride: null,
      recommendedPackages: [],
      selectedRecommendedPackageId: null,
      selectedRecommendedPackage: null
    };
  }),
  setRecommendedSolarKw: (recommendedSolarKw) => set({
    designStarted: true,
    recommendedSolarKw,
    panelQuantityOverride: null,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  }),
  setSelectedBatteryKwh: (selectedBatteryKwh) => set((state) => ({
    designStarted: true,
    selectedBatteryKwh,
    selectedBatteryConfiguration: state.selectedBatteryConfiguration?.capacityKwh === selectedBatteryKwh
      ? state.selectedBatteryConfiguration
      : null,
    batteryRecommendationRequirementKwh: null,
    batteryRecommendationEngineVersion: BATTERY_RECOMMENDATION_ENGINE_VERSION,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  })),
  setBackupRequirementSummary: (backupRequirementSummary) => set({
    designStarted: true,
    backupRequirementSummary
  }),
  setSelectedBatteryConfiguration: (
    selectedBatteryConfiguration,
    batteryRecommendationRequirementKwh = null
  ) => set({
    designStarted: true,
    selectedBatteryKwh: selectedBatteryConfiguration?.capacityKwh ?? 0,
    selectedBatteryConfiguration,
    batteryRecommendationRequirementKwh,
    batteryRecommendationEngineVersion: BATTERY_RECOMMENDATION_ENGINE_VERSION,
    selectedBattery: selectedBatteryConfiguration?.primaryProduct ?? null,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  }),
  setPanelWattage: (panelWattage) => set({
    designStarted: true,
    panelWattage,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  }),
  setPanelOrientation: (panelOrientation) => set({ designStarted: true, panelOrientation }),
  setPanelLayoutSelection: ({ panelQuantity, panelWattage, orientation, panelProduct = null }) => set({
    designStarted: true,
    lastDesignStep: 'roof',
    panelWattage,
    panelOrientation: orientation,
    panelQuantityOverride: Math.max(1, Math.ceil(panelQuantity || 1)),
    recommendedSolarKw: (Math.max(1, Math.ceil(panelQuantity || 1)) * panelWattage) / 1000,
    selectedPanels: panelProduct,
    selectedPanelBrand: panelProduct?.brandName ?? panelProduct?.brand ?? null,
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  }),
  setSelectedPanelBrand: (selectedPanelBrand) => set({ designStarted: true, selectedPanelBrand }),
  setBackupDecision: (backupDecision) => set((state) => ({
    designStarted: true,
    backupDecision,
    selectedBatteryKwh: backupDecision === 'no' ? 0 : state.selectedBatteryKwh,
    backupRequirementSummary: backupDecision === 'no' ? null : state.backupRequirementSummary,
    selectedBatteryConfiguration: backupDecision === 'no' ? null : state.selectedBatteryConfiguration,
    batteryRecommendationRequirementKwh: backupDecision === 'no'
      ? null
      : state.batteryRecommendationRequirementKwh,
    batteryRecommendationEngineVersion: BATTERY_RECOMMENDATION_ENGINE_VERSION,
    selectedBattery: backupDecision === 'no' ? null : state.selectedBattery,
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  })),
  setSelectedProduct: (product) => set((state) => {
    if (product.category === 'panel') return { designStarted: true, selectedPanels: product };
    if (product.category === 'inverter') return { designStarted: true, selectedInverter: product };
    if (product.category === 'battery') return { designStarted: true, selectedBattery: product };
    return { designStarted: true, selectedAccessories: [...state.selectedAccessories.filter((item) => item.id !== product.id), product] };
  }),
  setPackageName: (packageName) => set({ designStarted: true, lastDesignStep: 'packages', packageName }),
  setRecommendedPackages: (recommendedPackages) => set((state) => {
    const regeneratedSelection = getRecommendedPackageById(
      recommendedPackages,
      state.selectedRecommendedPackageId
    );
    const selectedRecommendedPackage = state.selectedRecommendedPackage?.isCustomized && regeneratedSelection
      ? state.selectedRecommendedPackage
      : regeneratedSelection;
    return {
      recommendedPackages,
      selectedRecommendedPackageId: selectedRecommendedPackage ? selectedRecommendedPackage.id : null,
      selectedRecommendedPackage
    };
  }),
  setSelectedRecommendedPackage: (selectedRecommendedPackage) => set({
    designStarted: true,
    lastDesignStep: 'packages',
    packageName: selectedRecommendedPackage?.packageName ?? 'Balanced',
    selectedRecommendedPackageId: selectedRecommendedPackage?.id ?? null,
    selectedRecommendedPackage,
    bookingContext: selectedRecommendedPackage ? 'solar_package' : 'general',
    cleaningEstimate: null,
    installationDetails: null
  }),
  clearSelectedRecommendedPackage: () => set({
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null
  }),
  /**
   * "Add to My System" from a marketplace product. Starts a NEW custom build
   * seeded with only that product, so leftover components from a previous
   * journey can never make the router skip a step. Never carries a recommended
   * package (spec Q).
   */
  startCustomSystem: (product) => set((state) => {
    const sourceComponent = customSystemComponentForProduct(product);
    if (!sourceComponent) return {};

    const isPanel = sourceComponent === 'panel';
    const panelWattage = isPanel ? resolvePanelWattage(product, state.panelWattage) : null;
    const panelQuantity = isPanel
      ? resolvePanelQuantity({
          panelQuantityOverride: state.panelQuantityOverride,
          targetSolarKw: state.recommendedSolarKw,
          panelWattage: panelWattage ?? state.panelWattage
        })
      : null;

    return {
      designStarted: true,
      selectedPanels: isPanel ? product : null,
      selectedInverter: sourceComponent === 'inverter' ? product : null,
      selectedBattery: sourceComponent === 'battery' ? product : null,
      selectedPanelBrand: isPanel ? product.brandName ?? product.brand ?? null : null,
      panelWattage: panelWattage ?? state.panelWattage,
      backupDecision: sourceComponent === 'battery' ? 'yes' : state.backupDecision,
      recommendedPackages: [],
      selectedRecommendedPackageId: null,
      selectedRecommendedPackage: null,
      bookingContext: 'custom_system',
      cleaningEstimate: null,
      installationDetails: null,
      promo: createInitialPromoState(),
      customSystem: {
        active: true,
        sourceComponent,
        selectedComponentOrder: [sourceComponent],
        panelQuantity,
        panelWattage,
        batteryQuantity: 1
      }
    };
  }),
  /** Records one component chosen during a custom build. Never touches the others (spec K). */
  setCustomSystemComponent: (product, options) => set((state) => {
    const component = customSystemComponentForProduct(product);
    if (!component) return {};

    const quantity = Math.max(1, Math.round(options?.quantity ?? 1));
    const base = {
      designStarted: true,
      customSystem: {
        ...state.customSystem,
        active: true,
        sourceComponent: state.customSystem.sourceComponent ?? component,
        selectedComponentOrder: appendComponentOrder(state.customSystem.selectedComponentOrder, component)
      }
    };

    if (component === 'inverter') {
      return { ...base, selectedInverter: product };
    }

    if (component === 'battery') {
      return {
        ...base,
        selectedBattery: product,
        backupDecision: 'yes' as BackupDecision,
        customSystem: { ...base.customSystem, batteryQuantity: quantity }
      };
    }

    const panelWattage = resolvePanelWattage(product, state.panelWattage);
    const panelQuantity = resolvePanelQuantity({
      explicitQuantity: options?.quantity,
      panelQuantityOverride: state.panelQuantityOverride,
      targetSolarKw: state.recommendedSolarKw,
      panelWattage
    });
    return {
      ...base,
      selectedPanels: product,
      selectedPanelBrand: product.brandName ?? product.brand ?? null,
      panelWattage,
      customSystem: { ...base.customSystem, panelQuantity, panelWattage }
    };
  }),
  /** Result of the existing Choose Solar Size / panel step inside a custom build. */
  setCustomSystemPanelSelection: ({ panelProduct, panelQuantity, panelWattage }) => set((state) => {
    const quantity = Math.max(1, Math.round(panelQuantity || 1));
    const wattage = Math.max(1, Math.round(panelWattage || state.panelWattage));
    return {
      designStarted: true,
      selectedPanels: panelProduct ?? state.selectedPanels,
      selectedPanelBrand: panelProduct?.brandName ?? panelProduct?.brand ?? state.selectedPanelBrand,
      panelWattage: wattage,
      panelQuantityOverride: quantity,
      recommendedSolarKw: (quantity * wattage) / 1000,
      customSystem: {
        ...state.customSystem,
        active: true,
        sourceComponent: state.customSystem.sourceComponent ?? 'panel',
        selectedComponentOrder: appendComponentOrder(state.customSystem.selectedComponentOrder, 'panel'),
        panelQuantity: quantity,
        panelWattage: wattage
      }
    };
  }),
  clearCustomSystem: () => set({ customSystem: createInitialCustomSystemState() }),
  startBooking: (bookingContext) => set(() => {
    if (bookingContext === 'cleaning') {
      return {
        bookingContext,
        selectedRecommendedPackageId: null,
        selectedRecommendedPackage: null,
        installationDetails: null,
        promo: createInitialPromoState()
      };
    }
    if (bookingContext === 'installation') {
      return {
        bookingContext,
        selectedRecommendedPackageId: null,
        selectedRecommendedPackage: null,
        cleaningEstimate: null,
        promo: createInitialPromoState()
      };
    }
    if (bookingContext === 'solar_package') {
      return {
        bookingContext,
        cleaningEstimate: null,
        installationDetails: null
      };
    }
    if (bookingContext === 'custom_system') {
      // Keep the custom build intact; it is the payload for this booking.
      return {
        bookingContext,
        selectedRecommendedPackageId: null,
        selectedRecommendedPackage: null,
        cleaningEstimate: null,
        installationDetails: null
      };
    }
    if (bookingContext === 'electrical') {
      return {
        bookingContext,
        selectedRecommendedPackageId: null,
        selectedRecommendedPackage: null,
        cleaningEstimate: null,
        installationDetails: null,
        promo: createInitialPromoState()
      };
    }
    return {
      bookingContext: 'general',
      selectedRecommendedPackageId: null,
      selectedRecommendedPackage: null,
      cleaningEstimate: null,
      installationDetails: null,
      promo: createInitialPromoState()
    };
  }),
  setCleaningEstimate: (cleaningEstimate) => set({
    bookingContext: 'cleaning',
    cleaningEstimate,
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null,
    installationDetails: null,
    promo: createInitialPromoState()
  }),
  clearCleaningEstimate: () => set({ cleaningEstimate: null }),
  setInstallationDetails: (installationDetails) => set({
    bookingContext: 'installation',
    installationDetails,
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null,
    cleaningEstimate: null,
    promo: createInitialPromoState()
  }),
  clearInstallationDetails: () => set({ installationDetails: null }),
  setPromoInput: (value) => set((state) => {
    const enteredCode = sanitizePromoInput(value);
    if (state.promo.appliedCode && enteredCode !== state.promo.appliedCode) {
      return {
        promo: {
          ...createInitialPromoState(state.promo.originalTotal),
          enteredCode
        }
      };
    }
    return {
      promo: {
        ...state.promo,
        enteredCode,
        status: state.promo.status !== 'applied' && state.promo.status !== 'loading' ? 'idle' : state.promo.status,
        message: state.promo.status !== 'applied' && state.promo.status !== 'loading' ? null : state.promo.message
      }
    };
  }),
  applyPromo: async (context, codeOverride) => {
    const current = get().promo;
    if (current.status === 'loading') return false;
    const enteredCode = sanitizePromoInput(codeOverride ?? current.enteredCode);
    if (!enteredCode) {
      set({
        promo: {
          ...createInitialPromoState(context.originalTotal),
          status: 'invalid',
          message: 'Enter a promo code.'
        }
      });
      return false;
    }

    set({
      promo: {
        ...current,
        enteredCode,
        originalTotal: context.originalTotal,
        finalTotal: context.originalTotal,
        discountAmount: 0,
        status: 'loading',
        message: 'Applying promo code...'
      }
    });

    const result = await promoApi.validatePromoCode(enteredCode, context);
    if (!result.valid) {
      set({
        promo: {
          ...createInitialPromoState(result.originalTotal),
          enteredCode,
          status: result.status,
          message: result.message
        }
      });
      return false;
    }

    set({
      promo: {
        enteredCode: result.code,
        appliedCode: result.code,
        promoId: result.promoId,
        discountType: result.discountType,
        discountValue: result.discountValue,
        appliesTo: result.appliesTo,
        eligibleAmount: result.eligibleAmount,
        discountAmount: result.discountAmount,
        originalTotal: result.originalTotal,
        finalTotal: result.finalTotal,
        appliedPackageId: context.packageId,
        appliedContextSignature: promoContextSignature(context),
        status: 'applied',
        message: result.message
      }
    });
    return true;
  },
  syncPromoContext: async (context) => {
    const current = get().promo;
    const contextChanged = current.appliedContextSignature !== promoContextSignature(context);
    if (current.appliedCode && contextChanged) {
      await get().applyPromo(context, current.appliedCode);
      return;
    }
    if (!current.appliedCode && current.finalTotal !== context.originalTotal) {
      set({
        promo: {
          ...current,
          originalTotal: context.originalTotal,
          finalTotal: context.originalTotal,
          discountAmount: 0
        }
      });
    }
  },
  removePromo: (originalTotal) => set((state) => ({
    promo: createInitialPromoState(originalTotal ?? state.promo.originalTotal)
  })),
  resetPromo: () => set({ promo: createInitialPromoState() }),
  getRecommendedPackageById: (packageId) => getRecommendedPackageById(get().recommendedPackages, packageId),
  getSummary: () => {
    const state = get();
    const panelCount = state.panelQuantityOverride ?? calculatePanelCount(state.recommendedSolarKw, state.panelWattage);
    return {
      solarKw: state.recommendedSolarKw,
      panelWattage: state.panelWattage,
      selectedPanelBrand: state.selectedPanelBrand,
      panelCount,
      roofAreaSqFt: calculateRoofSpace(panelCount).areaSqFt,
      inverter: state.selectedInverter,
      battery: state.backupDecision === 'yes'
        ? state.selectedBatteryConfiguration?.primaryProduct ?? state.selectedBattery
        : null,
      panels: state.selectedPanels,
      accessories: state.selectedAccessories,
      packageName: state.selectedRecommendedPackage?.packageName ?? state.packageName,
      selectedRecommendedPackageId: state.selectedRecommendedPackageId,
      selectedRecommendedPackage: state.selectedRecommendedPackage,
      selectedBatteryConfiguration: state.selectedBatteryConfiguration
    };
  },
  reset: () => set({
    appliances: initialAppliances,
    backupAppliances: initialAppliances.map((item) => ({ ...item, quantity: 0, hours: DEFAULT_BACKUP_HOURS })),
    designStarted: false,
    lastDesignStep: 'appliances',
    recommendedSolarKw: 3,
    selectedBatteryKwh: 0,
    backupRequirementSummary: null,
    selectedBatteryConfiguration: null,
    batteryRecommendationRequirementKwh: null,
    batteryRecommendationEngineVersion: BATTERY_RECOMMENDATION_ENGINE_VERSION,
    panelWattage: 610,
    panelOrientation: 'landscape',
    panelQuantityOverride: null,
    selectedPanelBrand: null,
    backupDecision: null,
    selectedPanels: null,
    selectedInverter: null,
    selectedBattery: null,
    selectedAccessories: [],
    packageName: 'Balanced',
    recommendedPackages: [],
    selectedRecommendedPackageId: null,
    selectedRecommendedPackage: null,
    bookingContext: 'general',
    customSystem: createInitialCustomSystemState(),
    cleaningEstimate: null,
    installationDetails: null,
    promo: createInitialPromoState()
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
    selectedBatteryConfiguration: state.selectedBatteryConfiguration,
    backupRequirementSummary: state.backupRequirementSummary,
    batteryRecommendationRequirementKwh: state.batteryRecommendationRequirementKwh,
    batteryRecommendationEngineVersion: state.batteryRecommendationEngineVersion,
    panelWattage: state.panelWattage,
    panelOrientation: state.panelOrientation,
    panelQuantityOverride: state.panelQuantityOverride,
    selectedPanelBrand: state.selectedPanelBrand,
    backupDecision: state.backupDecision,
    selectedPanels: state.selectedPanels,
    selectedInverter: state.selectedInverter,
    selectedBattery: state.selectedBattery,
    selectedAccessories: state.selectedAccessories,
    packageName: state.packageName,
    selectedRecommendedPackageId: state.selectedRecommendedPackageId,
    selectedRecommendedPackage: state.selectedRecommendedPackage,
    bookingContext: state.bookingContext,
    customSystem: state.customSystem,
    cleaningEstimate: state.cleaningEstimate,
    installationDetails: state.installationDetails,
    promo: state.promo
  }),
  version: 7,
  migrate: (persistedState) => {
    const state = persistedState as Partial<SystemState> | undefined;
    return {
      ...state,
      selectedBatteryKwh: 0,
      selectedBatteryConfiguration: null,
      batteryRecommendationRequirementKwh: null,
      batteryRecommendationEngineVersion: BATTERY_RECOMMENDATION_ENGINE_VERSION,
      selectedBattery: null,
      panelOrientation: state?.panelOrientation ?? 'landscape',
      panelQuantityOverride: state?.panelQuantityOverride ?? null,
      recommendedPackages: [],
      selectedRecommendedPackageId: null,
      selectedRecommendedPackage: null,
      bookingContext: state?.bookingContext ?? 'general',
      customSystem: state?.customSystem ?? createInitialCustomSystemState(),
      promo: state?.promo ?? createInitialPromoState()
    };
  }
}));
