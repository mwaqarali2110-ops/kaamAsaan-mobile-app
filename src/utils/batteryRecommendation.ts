import type { Product } from '../types/product.types';
import { normalizeBatteryCapacity } from './batteryCapacity';
import { isNormalizedBatteryCategory } from './productCategory';

export const BATTERY_DEPTH_OF_DISCHARGE = 0.8;
export const BATTERY_SYSTEM_EFFICIENCY = 0.9;

export type BatteryConfiguration = {
  id: string;
  capacityKwh: number;
  productIds: string[];
  quantity: number;
  brand: string;
  model: string;
  totalPrice: number | null;
  usableEnergyKwh: number;
  image?: string;
  primaryProduct: Product;
  applicableUsableFactor?: number;
  requiredBackupEnergyKwh?: number;
  coveragePercentage?: number;
  capacityShortfallKwh?: number;
  headroomKwh?: number;
  coversRequirement?: boolean;
  commercialTier?: 'loadManaged' | 'recommended' | 'extended';
  statusLabel?: string;
};

export type BatteryRecommendationOption = BatteryConfiguration & {
  tier: 'basic' | 'better' | 'recommended' | 'budget' | 'extended';
  capacityShortfallKwh: number;
  coversRequirement: boolean;
  coveragePercentage: number;
};

const numericValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const flattenValues = (value: unknown): unknown[] => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(flattenValues);
  return [value];
};

const normalize = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const isBatteryCatalogProduct = (product: Product) => {
  if (isNormalizedBatteryCategory({
    category: product.rawCategory ?? product.category,
    subCategory: product.subCategory,
    rawSubCategory: product.rawSubCategory,
    name: product.name,
    model: product.model
  })) return true;
  if (product.category === 'inverter' || product.category === 'panel') return false;

  const searchText = normalize([
    product.brand,
    product.brandName,
    product.name,
    product.model,
    product.capacity,
    ...flattenValues(product.specifications),
    ...product.specs
  ].join(' '));
  return searchText.includes('battery') ||
    searchText.includes('batteries') ||
    searchText.includes('lithium') ||
    searchText.includes('energy storage') ||
    searchText.includes('battery storage');
};

export const getBatteryCapacityKwh = (product: Product) => {
  if (!isBatteryCatalogProduct(product)) return 0;
  return normalizeBatteryCapacity(product as Product & Record<string, unknown>).capacityKwh ?? 0;
};

const getBrand = (product: Product) =>
  product.brandName || product.brands?.name || product.brand || 'KaamAsaan Verified';

const getModel = (product: Product) => product.model || product.name;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getBatteryProductDisplayName = (product: Product, capacityKwh = getBatteryCapacityKwh(product)) => {
  if (!isBatteryCatalogProduct(product)) return product.name || product.model || 'Battery';
  const brand = getBrand(product).trim();
  const rawDescriptor = (product.model || product.name || '').trim();
  const brandPattern = new RegExp(`^${escapeRegExp(brand)}(?:\\s+|$)`, 'i');
  const descriptor = rawDescriptor
    .replace(brandPattern, '')
    .replace(/\b\d+(?:\.\d+)?\s*k\s*w\s*h\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*k\s*w(?=\s*(?:battery|batteries|storage)\b)/gi, ' ')
    .replace(/\b(?:battery|batteries|storage)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = [brand, descriptor, capacityKwh > 0 ? `${capacityKwh.toFixed(1).replace('.0', '')} kWh` : null, 'Battery'];
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const getMaxModules = (product: Product) => {
  const specs = product.specifications ?? {};
  const rawProduct = product as Product & Record<string, unknown>;
  const modularText = normalize([
    specs.modular,
    specs.stackable,
    specs.module_type,
    specs.configuration,
    rawProduct.modular,
    rawProduct.stackable,
    product.name,
    product.model
  ].join(' '));
  const explicitlyModular = (product.maxParallelModules ?? 0) > 1 ||
    modularText.includes('modular') ||
    modularText.includes('stackable') ||
    modularText.includes('battery module');
  if (!explicitlyModular) return 1;

  const configuredMaximum = [
    product.maxParallelModules,
    specs.max_modules,
    specs.maximum_modules,
    specs.maxModuleQuantity,
    rawProduct.max_modules
  ].map(numericValue).find((value) => value != null && value > 1);
  return Math.min(8, Math.floor(configuredMaximum ?? 4));
};

export const buildBatteryConfigurations = (products: Product[]) => {
  const configurations = products
    .filter(isBatteryCatalogProduct)
    .flatMap((product) => {
      const unitCapacityKwh = getBatteryCapacityKwh(product);
      if (unitCapacityKwh <= 0) return [];
      const configuredUsableKwh = Number(product.usableCapacityKwh);
      const unitUsableEnergyKwh = Number.isFinite(configuredUsableKwh) && configuredUsableKwh > 0
        ? Math.min(unitCapacityKwh, configuredUsableKwh)
        : unitCapacityKwh * BATTERY_DEPTH_OF_DISCHARGE * BATTERY_SYSTEM_EFFICIENCY;
      const maxModules = getMaxModules(product);
      return Array.from({ length: maxModules }, (_, index): BatteryConfiguration => {
        const quantity = index + 1;
        return {
          id: quantity === 1 ? product.id : `${product.id}-x${quantity}`,
          capacityKwh: Math.round(unitCapacityKwh * quantity * 100) / 100,
          productIds: Array.from({ length: quantity }, () => product.id),
          quantity,
          brand: getBrand(product),
          model: getModel(product),
          totalPrice: product.price == null ? null : product.price * quantity,
          usableEnergyKwh: Math.round(unitUsableEnergyKwh * quantity * 100) / 100,
          image: product.image,
          primaryProduct: product
        };
      });
    })
    .sort((a, b) =>
      a.capacityKwh - b.capacityKwh ||
      (a.totalPrice ?? Number.MAX_SAFE_INTEGER) - (b.totalPrice ?? Number.MAX_SAFE_INTEGER)
    );

  const uniqueByCapacity = new Map<string, BatteryConfiguration>();
  configurations.forEach((configuration) => {
    const key = configuration.capacityKwh.toFixed(2);
    if (!uniqueByCapacity.has(key)) uniqueByCapacity.set(key, configuration);
  });
  return [...uniqueByCapacity.values()];
};

export const getBatteryRecommendationOptions = (
  requiredBackupEnergyKwh: number,
  configurations: BatteryConfiguration[]
) => {
  const sorted = [...configurations]
    .filter((configuration) => configuration.capacityKwh > 0)
    .sort((a, b) => a.capacityKwh - b.capacityKwh);
  const recommendedIndex = sorted.findIndex(
    (configuration) => configuration.capacityKwh >= requiredBackupEnergyKwh
  );
  if (recommendedIndex < 0) {
    const partialConfigurations = sorted.slice(-3);
    const options = partialConfigurations.map((configuration, index): BatteryRecommendationOption => {
      const shortfall = Math.max(0, requiredBackupEnergyKwh - configuration.capacityKwh);
      return {
        ...configuration,
        tier: index === partialConfigurations.length - 1 ? 'better' : 'basic',
        capacityShortfallKwh: Math.round(shortfall * 10) / 10,
        coversRequirement: false,
        coveragePercentage: requiredBackupEnergyKwh > 0
          ? Math.min(100, Math.round((configuration.capacityKwh / requiredBackupEnergyKwh) * 100))
          : 0
      };
    });
    return {
      recommended: null,
      options,
      exceedsAvailableCapacity: requiredBackupEnergyKwh > 0 && sorted.length > 0
    };
  }

  const selectedIndexes = [
    recommendedIndex - 2,
    recommendedIndex - 1,
    recommendedIndex
  ].filter((index) => index >= 0);
  const selected = selectedIndexes.map((index) => sorted[index]);
  const tiers = selected.length === 1
    ? ['recommended'] as const
    : selected.length === 2
      ? ['better', 'recommended'] as const
      : ['basic', 'better', 'recommended'] as const;
  const options = selected.map((configuration, index): BatteryRecommendationOption => {
    const shortfall = Math.max(0, requiredBackupEnergyKwh - configuration.capacityKwh);
    return {
      ...configuration,
      tier: tiers[index],
      capacityShortfallKwh: Math.round(shortfall * 10) / 10,
      coversRequirement: shortfall <= 0,
      coveragePercentage: requiredBackupEnergyKwh > 0
        ? Math.round((configuration.capacityKwh / requiredBackupEnergyKwh) * 100)
        : 100
    };
  });

  return {
    recommended: options[options.length - 1] ?? null,
    options,
    exceedsAvailableCapacity: false
  };
};
