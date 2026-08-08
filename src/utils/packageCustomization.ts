import { getPackageCompatibility, normalizePackageBrand } from '@/config/packageCustomization';
import type { Product } from '@/types/product.types';
import {
  getPanelUnitPrice,
  getProductBrandName,
  getProductKwh,
  getProductKw,
  getProductWatt,
  isBatteryProduct,
  isInverterProduct,
  isOutOfStock,
  isPanelProduct,
  type RecommendedPackage
} from '@/utils/packageBuilder';

export type PackageEditorMode = 'panel' | 'inverter' | 'battery';

const isActiveAndAvailable = (product: Product) =>
  product.isActive !== false && product.isVisible !== false && !isOutOfStock(product);

const productBrand = (product: Product) => normalizePackageBrand(getProductBrandName(product));

export const getPanelCustomizationOptions = (products: Product[]) => products
  .filter((product) => isPanelProduct(product) && isActiveAndAvailable(product) && getProductWatt(product) > 0)
  .sort((left, right) => getProductWatt(right) - getProductWatt(left) || getProductBrandName(left).localeCompare(getProductBrandName(right)));

export const getInverterCustomizationOptions = (pkg: RecommendedPackage, products: Product[]) => {
  const compatibility = getPackageCompatibility(pkg.packageBrand, pkg.batteryBrand);
  return products
    .filter((product) => isInverterProduct(product) && isActiveAndAvailable(product) && compatibility.inverterBrands.includes(productBrand(product) as never))
    .sort((left, right) => getProductKw(left) - getProductKw(right));
};

export const getBatteryCustomizationOptions = (pkg: RecommendedPackage, products: Product[]) => {
  const compatibility = getPackageCompatibility(pkg.packageBrand, pkg.batteryBrand);
  const inverterVoltage = pkg.inverter.product.voltageClass;
  return products
    .filter((product) => {
      if (!isBatteryProduct(product) || !isActiveAndAvailable(product)) return false;
      if (!compatibility.batteryBrands.includes(productBrand(product) as never)) return false;
      const batteryVoltage = product.voltageClass;
      if (!inverterVoltage || inverterVoltage === 'NONE' || !batteryVoltage || batteryVoltage === 'NONE') return true;
      return inverterVoltage === batteryVoltage;
    })
    .sort((left, right) => getProductKwh(left) - getProductKwh(right));
};

const productWarranty = (product: Product) => product.warranty || 'On request';

const originalAdditionalCharges = (pkg: RecommendedPackage) => {
  if (pkg.additionalPackageCharges != null) return pkg.additionalPackageCharges;
  if (pkg.totalPrice != null && pkg.panelsPrice != null && pkg.inverterPrice != null && pkg.batteryPrice != null) {
    return Math.max(0, pkg.totalPrice - pkg.panelsPrice - pkg.inverterPrice - pkg.batteryPrice);
  }
  return Math.max(0, pkg.installation.price || 0);
};

const buildCustomizedPackage = (
  pkg: RecommendedPackage,
  next: {
    panel: Product;
    panelQuantity: number;
    inverter: Product;
    inverterQuantity: number;
    battery?: Product;
    batteryQuantity: number;
  }
): RecommendedPackage => {
  const panelQuantity = Math.max(1, Math.floor(next.panelQuantity));
  const inverterQuantity = Math.max(1, Math.floor(next.inverterQuantity));
  const batteryQuantity = next.battery ? Math.max(1, Math.floor(next.batteryQuantity)) : 0;
  const panelWattage = getProductWatt(next.panel);
  const totalSolarKw = (panelWattage * panelQuantity) / 1000;
  const inverterUnitKw = getProductKw(next.inverter);
  const inverterSizeKw = inverterUnitKw * inverterQuantity;
  const batteryUnitCapacityKwh = next.battery ? getProductKwh(next.battery) : 0;
  const totalBatteryKwh = batteryUnitCapacityKwh * batteryQuantity;
  const panelUnitPrice = getPanelUnitPrice(next.panel);
  const panelsPrice = panelUnitPrice == null ? null : panelUnitPrice * panelQuantity;
  const inverterPrice = next.inverter.price == null ? null : next.inverter.price * inverterQuantity;
  const batteryPrice = next.battery?.price == null ? (next.battery ? null : 0) : next.battery.price * batteryQuantity;
  const additionalPackageCharges = originalAdditionalCharges(pkg);
  const installationCharges = Math.max(0, pkg.priceBreakdown?.installationCharges ?? 0);
  const otherExistingCharges = Math.max(
    0,
    pkg.priceBreakdown?.otherExistingCharges ?? (additionalPackageCharges - installationCharges)
  );
  const totalPrice = panelsPrice == null || inverterPrice == null || batteryPrice == null
    ? null
    : panelsPrice + inverterPrice + batteryPrice + additionalPackageCharges;
  const recommendedBatteryCapacityKwh = pkg.recommendedBatteryCapacityKwh ?? pkg.totalBatteryKwh;
  const usableFactor = pkg.totalBatteryKwh > 0
    ? Math.min(1, Math.max(0, pkg.estimatedUsableBatteryEnergyKwh / pkg.totalBatteryKwh))
    : 0.9;
  const estimatedUsableBatteryEnergyKwh = totalBatteryKwh * usableFactor;
  const requiredBackupEnergyKwh = pkg.requiredBackupEnergyKwh;
  const coveragePercent = requiredBackupEnergyKwh > 0 ? (estimatedUsableBatteryEnergyKwh / requiredBackupEnergyKwh) * 100 : 100;
  const shortfallKwh = Math.max(requiredBackupEnergyKwh - estimatedUsableBatteryEnergyKwh, 0);
  const headroomKwh = Math.max(estimatedUsableBatteryEnergyKwh - requiredBackupEnergyKwh, 0);

  return {
    ...pkg,
    originalPackageId: pkg.originalPackageId ?? pkg.id,
    isCustomized: true,
    additionalPackageCharges,
    priceBreakdown: {
      panelPrice: panelsPrice,
      inverterPrice,
      batteryPrice,
      installationCharges,
      otherExistingCharges,
      grossTotal: totalPrice,
    },
    recommendedBatteryCapacityKwh,
    panel: next.panel,
    panelProduct: next.panel,
    panelQuantity,
    actualPanelKw: totalSolarKw,
    totalSolarKw,
    actualPvKwp: totalSolarKw,
    panelsPrice,
    inverter: {
      ...pkg.inverter,
      product: next.inverter,
      size: inverterSizeKw,
      quantity: inverterQuantity,
      exact: true,
      lowerThanRequired: false
    },
    inverterProduct: next.inverter,
    inverterQuantity,
    inverterSizeKw,
    inverterPrice,
    inverterWarranty: productWarranty(next.inverter),
    phase: next.inverter.phase,
    voltageClass: next.inverter.voltageClass,
    battery: next.battery ? {
      ...pkg.battery,
      product: next.battery,
      size: totalBatteryKwh,
      quantity: batteryQuantity,
      exact: totalBatteryKwh >= recommendedBatteryCapacityKwh,
      lowerThanRequired: totalBatteryKwh < recommendedBatteryCapacityKwh,
      configuration: {
        id: `${next.battery.id}-x${batteryQuantity}`,
        capacityKwh: totalBatteryKwh,
        productIds: Array.from({ length: batteryQuantity }, () => next.battery!.id),
        quantity: batteryQuantity,
        brand: getProductBrandName(next.battery),
        model: next.battery.model ?? next.battery.name,
        totalPrice: batteryPrice,
        usableEnergyKwh: estimatedUsableBatteryEnergyKwh,
        image: next.battery.image,
        primaryProduct: next.battery
      }
    } : undefined,
    batteryProduct: next.battery,
    batteryBrand: next.battery ? getProductBrandName(next.battery) : undefined,
    batteryQuantity,
    batterySizeKwh: totalBatteryKwh,
    totalBatteryKwh,
    batteryUnitCapacityKwh,
    totalBatteryCapacityKwh: totalBatteryKwh,
    estimatedUsableBatteryEnergyKwh,
    batteryPrice,
    batteryWarranty: next.battery ? productWarranty(next.battery) : undefined,
    totalPrice,
    packagePrice: totalPrice,
    coveragePercent: Math.round(coveragePercent * 10) / 10,
    shortfallKwh: Math.round(shortfallKwh * 100) / 100,
    headroomKwh: Math.round(headroomKwh * 100) / 100,
    notes: [
      `${panelQuantity} x ${panelWattage}W panels`,
      inverterQuantity > 1 ? `${inverterQuantity} x ${inverterUnitKw} kW inverters (${inverterSizeKw} kW total)` : `${inverterSizeKw} kW inverter`,
      next.battery ? `${batteryQuantity} x ${batteryUnitCapacityKwh} kWh batteries (${totalBatteryKwh} kWh total)` : 'Battery backup not included'
    ],
    customization: {
      originalPackageId: pkg.originalPackageId ?? pkg.id,
      packageBrand: pkg.packageBrand,
      selectedPanelProductId: next.panel.id,
      panelQuantity,
      totalPanelCapacityKw: totalSolarKw,
      selectedInverterProductId: next.inverter.id,
      selectedBatteryProductId: next.battery?.id ?? null,
      batteryQuantity,
      totalBatteryCapacityKwh: totalBatteryKwh,
      panelPrice: panelsPrice,
      inverterPrice,
      batteryPrice,
      totalPackagePrice: totalPrice,
      isCustomized: true
    }
  };
};

export const customizePackagePanel = (pkg: RecommendedPackage, panel: Product, quantity: number) => buildCustomizedPackage(pkg, {
  panel,
  panelQuantity: quantity,
  inverter: pkg.inverter.product,
  inverterQuantity: pkg.inverterQuantity,
  battery: pkg.battery?.product,
  batteryQuantity: pkg.batteryQuantity
});

export const customizePackageInverter = (pkg: RecommendedPackage, inverter: Product) => buildCustomizedPackage(pkg, {
  panel: pkg.panel,
  panelQuantity: pkg.panelQuantity,
  inverter,
  inverterQuantity: pkg.inverterQuantity,
  battery: pkg.battery?.product,
  batteryQuantity: pkg.batteryQuantity
});

export const customizePackageBattery = (pkg: RecommendedPackage, battery: Product, quantity: number) => buildCustomizedPackage(pkg, {
  panel: pkg.panel,
  panelQuantity: pkg.panelQuantity,
  inverter: pkg.inverter.product,
  inverterQuantity: pkg.inverterQuantity,
  battery,
  batteryQuantity: quantity
});
