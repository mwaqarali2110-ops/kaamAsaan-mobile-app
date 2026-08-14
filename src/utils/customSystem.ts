import type { Product } from '@/types/product.types';
import type { SelectedPackageSnapshot } from '@/types/survey.types';
import { calculatePanelCount } from '@/utils/calculations';
import {
  getPanelUnitPrice,
  getProductBrandName,
  getProductKw,
  getProductKwh,
  getProductWatt
} from '@/utils/packageBuilder';

/**
 * Custom System Builder — the customer assembles a system from individual
 * marketplace products instead of picking a generated Recommended Package.
 * Nothing in here may depend on RecommendedPackage / selectedRecommendedPackageId.
 */
export type CustomSystemComponent = 'panel' | 'inverter' | 'battery';

/** Where the missing-component router wants the customer to go next. */
export type CustomSystemStep = 'solar-panels' | 'inverter' | 'battery' | 'system-summary';

export type CustomSystemSelection = {
  selectedPanel: Product | null;
  selectedInverter: Product | null;
  selectedBattery: Product | null;
};

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const productModel = (product?: Product | null) =>
  product?.model?.trim() || product?.name?.trim() || 'Model unavailable';

export const customSystemComponentForProduct = (product: Product): CustomSystemComponent | null => {
  if (product.category === 'panel') return 'panel';
  if (product.category === 'inverter') return 'inverter';
  if (product.category === 'battery') return 'battery';
  return null;
};

export const componentToStep = (component: CustomSystemComponent): CustomSystemStep =>
  component === 'panel' ? 'solar-panels' : component;

export const getMissingSystemComponents = ({
  selectedPanel,
  selectedInverter,
  selectedBattery
}: CustomSystemSelection): CustomSystemComponent[] => {
  const missing: CustomSystemComponent[] = [];
  if (!selectedPanel) missing.push('panel');
  if (!selectedInverter) missing.push('inverter');
  if (!selectedBattery) missing.push('battery');
  return missing;
};

/**
 * Centralised router (spec J). Never returns a recommended-package destination —
 * once all three component groups exist the journey goes to the custom summary.
 */
export const getNextMissingSystemComponent = (selection: CustomSystemSelection): CustomSystemStep => {
  if (!selection.selectedPanel) return 'solar-panels';
  if (!selection.selectedInverter) return 'inverter';
  if (!selection.selectedBattery) return 'battery';
  return 'system-summary';
};

export const isCustomSystemComplete = (selection: CustomSystemSelection) =>
  getNextMissingSystemComponent(selection) === 'system-summary';

/** Panel wattage for a panel product, falling back to the builder default. */
export const resolvePanelWattage = (panel: Product | null, fallbackWattage: number) => {
  const wattage = panel ? Math.round(getProductWatt(panel)) : 0;
  return wattage > 0 ? wattage : Math.max(1, Math.round(fallbackWattage));
};

/**
 * Quantity for a panel product the customer picked straight from the marketplace
 * (i.e. without walking the Choose Solar Size step yet). Uses the existing panel
 * count helper so the number is consistent with the rest of the app.
 */
export const resolvePanelQuantity = ({
  explicitQuantity,
  panelQuantityOverride,
  targetSolarKw,
  panelWattage
}: {
  explicitQuantity?: number | null;
  panelQuantityOverride?: number | null;
  targetSolarKw: number;
  panelWattage: number;
}) => {
  if (explicitQuantity && explicitQuantity > 0) return Math.max(1, Math.round(explicitQuantity));
  if (panelQuantityOverride && panelQuantityOverride > 0) return Math.max(1, Math.round(panelQuantityOverride));
  return Math.max(1, calculatePanelCount(Math.max(0.1, targetSolarKw), Math.max(1, panelWattage)));
};

/** System size is derived from the panels only — never from the inverter (spec N). */
export const calculateCustomSystemSizeKw = (panelQuantity: number, panelWattage: number) =>
  (Math.max(0, panelQuantity) * Math.max(0, panelWattage)) / 1000;

export type CustomSystemPricing = {
  panelsPrice: number;
  panelUnitPrice: number;
  inverterPrice: number;
  batteryPrice: number;
  batteryUnitPrice: number;
  additionalCharges: number;
  total: number;
};

/**
 * Price breakdown from the actual selected products. `additionalCharges` is the
 * project's existing configured installation/structure/accessories value — it is
 * passed in by the caller and is never fabricated here.
 */
export const buildCustomSystemPricing = ({
  selectedPanel,
  selectedInverter,
  selectedBattery,
  panelQuantity,
  batteryQuantity,
  additionalCharges = 0
}: CustomSystemSelection & {
  panelQuantity: number;
  batteryQuantity: number;
  additionalCharges?: number;
}): CustomSystemPricing => {
  const panelUnitPrice = selectedPanel ? safeNumber(getPanelUnitPrice(selectedPanel)) : 0;
  const inverterPrice = selectedInverter ? safeNumber(selectedInverter.price) : 0;
  const batteryUnitPrice = selectedBattery ? safeNumber(selectedBattery.price) : 0;
  const panelsPrice = panelUnitPrice * Math.max(0, panelQuantity);
  const batteryPrice = batteryUnitPrice * Math.max(0, batteryQuantity);
  const charges = safeNumber(additionalCharges);

  return {
    panelsPrice,
    panelUnitPrice,
    inverterPrice,
    batteryPrice,
    batteryUnitPrice,
    additionalCharges: charges,
    total: panelsPrice + inverterPrice + batteryPrice + charges
  };
};

/**
 * Booking payload for a custom system. Reuses the existing SelectedPackageSnapshot
 * shape (whose `packageId` is nullable) so no recommendedPackageId is required.
 */
export const buildCustomSystemSnapshot = ({
  selectedPanel,
  selectedInverter,
  selectedBattery,
  panelQuantity,
  panelWattage,
  batteryQuantity,
  pricing,
  discountAmount = 0,
  promoCode = null
}: CustomSystemSelection & {
  panelQuantity: number;
  panelWattage: number;
  batteryQuantity: number;
  pricing: CustomSystemPricing;
  discountAmount?: number;
  promoCode?: string | null;
}): SelectedPackageSnapshot => {
  const systemSizeKw = calculateCustomSystemSizeKw(panelQuantity, panelWattage);
  const grossTotal = safeNumber(pricing.total);
  const discount = Math.min(safeNumber(discountAmount), grossTotal);
  const batteryUnitKwh = selectedBattery ? safeNumber(getProductKwh(selectedBattery)) : 0;

  return {
    packageId: null,
    packageName: 'Custom Designed System',
    packageBrand: selectedInverter ? getProductBrandName(selectedInverter) : 'KaamAsaan',
    isCustomized: true,
    systemSizeKw,
    panel: selectedPanel && panelQuantity > 0 ? {
      productId: selectedPanel.id || null,
      brand: getProductBrandName(selectedPanel),
      model: productModel(selectedPanel),
      wattage: panelWattage,
      quantity: panelQuantity,
      totalCapacityKw: systemSizeKw
    } : null,
    inverter: selectedInverter ? {
      productId: selectedInverter.id || null,
      brand: getProductBrandName(selectedInverter),
      model: productModel(selectedInverter),
      capacityKw: safeNumber(getProductKw(selectedInverter)),
      quantity: 1
    } : null,
    battery: selectedBattery && batteryQuantity > 0 ? {
      productId: selectedBattery.id || null,
      brand: getProductBrandName(selectedBattery),
      model: productModel(selectedBattery),
      unitCapacityKwh: batteryUnitKwh,
      quantity: batteryQuantity,
      totalCapacityKwh: batteryUnitKwh * batteryQuantity
    } : null,
    grossTotal,
    discountAmount: discount,
    finalTotal: Math.max(0, grossTotal - discount),
    promoCode: promoCode?.trim() || null
  };
};
