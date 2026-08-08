import type { Product } from '@/types/product.types';
import { parseCapacityKw, parseCapacityWatt } from '@/utils/capacity';
import { getBatteryCapacityKwh, type BatteryConfiguration } from '@/utils/batteryRecommendation';
import {
  generateCatalogPackageDiagnostics,
  generateCatalogPackages,
  normalizePackageText,
  type PackageCompatibilityException,
  type PackageEngineProduct,
  type PackageGenerationDiagnostic,
  type PackagePhase,
  type PackageTier
} from '@/utils/packageEngine';
import {
  COMMERCIAL_V1_DEFAULT_DISCLAIMER,
  COMMERCIAL_V1_DEFAULT_USABLE_FACTOR,
} from '@/utils/recommendationDefaults';

export type SystemRecommendation = {
  requiredSolarKw: number;
  requiredInverterKw: number;
  requiredBatteryKwh: number;
};

export type BatteryCompatibilityRule = PackageCompatibilityException;

export type PackageComponentMatch = {
  product: Product;
  exact: boolean;
  lowerThanRequired: boolean;
  size: number;
  quantity?: number;
  configuration?: BatteryConfiguration;
};

export type PackageBadgeTone = 'gold' | 'blue' | 'purple';

export type PackagePriceBreakdown = {
  panelPrice: number | null;
  inverterPrice: number | null;
  batteryPrice: number | null;
  installationCharges: number;
  otherExistingCharges: number;
  grossTotal: number | null;
};

export type RecommendedPackage = {
  id: string;
  packageType: PackageTier;
  brand: string;
  title: string;
  badge: string;
  badgeTone: PackageBadgeTone;
  packageName: string;
  packageBrand: string;
  brandId?: string | null;
  batteryBrand?: string;
  panel: Product;
  panelProduct: Product;
  inverter: PackageComponentMatch;
  inverterProduct: Product;
  inverterQuantity: number;
  battery?: PackageComponentMatch;
  batteryProduct?: Product;
  panelQuantity: number;
  actualPanelKw: number;
  totalSolarKw: number;
  inverterSizeKw: number;
  batterySizeKwh: number;
  batteryQuantity: number;
  totalBatteryKwh: number;
  panelsPrice: number | null;
  inverterPrice: number | null;
  batteryPrice: number | null;
  installation: {
    title: string;
    price: number;
    included: boolean;
  };
  totalPrice: number | null;
  inverterWarranty: string;
  batteryWarranty?: string;
  image?: string;
  packageImageUrl?: string;
  brandLogo?: string;
  compatibilityStatus: 'compatible';
  compatibilityGroup?: string;
  recommendationReason: string;
  limitations: string[];
  notes: string[];
  bestMatch: boolean;
  nearestAvailable: boolean;
  hasLowerInverter: boolean;
  outOfStock: boolean;
  score: number;
  tier: 'budget' | 'recommended' | 'extended' | 'alternative';
  actualPvKwp: number;
  batteryUnitCapacityKwh: number;
  totalBatteryCapacityKwh: number;
  estimatedUsableBatteryEnergyKwh: number;
  requiredBackupEnergyKwh: number;
  coveragePercent: number;
  shortfallKwh: number;
  headroomKwh: number;
  phase?: PackagePhase | null;
  voltageClass?: 'LV' | 'HV' | 'NONE' | null;
  packagePrice: number | null;
  recommendationReasoning: string;
  isPreliminary: boolean;
  preliminaryDisclaimer: string;
  requiresExpertReview: boolean;
  originalPackageId?: string;
  isCustomized?: boolean;
  additionalPackageCharges?: number;
  priceBreakdown?: PackagePriceBreakdown;
  recommendedBatteryCapacityKwh?: number;
  customization?: {
    originalPackageId: string;
    packageBrand: string;
    selectedPanelProductId: string;
    panelQuantity: number;
    totalPanelCapacityKw: number;
    selectedInverterProductId: string;
    selectedBatteryProductId: string | null;
    batteryQuantity: number;
    totalBatteryCapacityKwh: number;
    panelPrice: number | null;
    inverterPrice: number | null;
    batteryPrice: number | null;
    totalPackagePrice: number | null;
    isCustomized: true;
  };
};

export type GenerateRecommendedPackagesInput = {
  requiredPanelKw: number;
  requiredInverterKw: number;
  requiredBatteryKwh: number;
  runningLoadKw?: number;
  peakLoadKw?: number;
  backupHours?: number;
  phase?: PackagePhase | null;
  minimumBasicSizingPercentage?: number | null;
  products: Product[];
  compatibilityRules?: BatteryCompatibilityRule[];
  selectedPanelWattage?: number;
  requiredBackupEnergyKwh?: number;
  batteryUsableFactor?: number;
  preliminaryDisclaimer?: string;
  configuredInstallationCost?: number;
  configuredStructureCost?: number;
  configuredAccessoriesCost?: number;
  acceptableBatteryShortfallPercent?: number;
  selectedBatteryTier?: 'loadManaged' | 'recommended' | 'extended';
};

const normalize = (value?: string | null) => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const compact = (value?: string | null) => normalizePackageText(value ?? '');

export function normalizeBrandName(value?: string | null): string {
  return compact(value);
}

export function normalizeBrand(value?: string | null) {
  return normalizeBrandName(value);
}

const normalizeCategoryKey = (value?: string | null) => compact(value);
const flattenSpecValues = (value: unknown): string[] => {
  if (value == null) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(flattenSpecValues);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(flattenSpecValues);
  return [];
};

export const getProductBrandName = (product: Product) => {
  const raw = product as unknown as {
    brand?: string | { name?: string | null } | null;
    manufacturer?: string | null;
  };
  if (raw.brand && typeof raw.brand === 'object' && raw.brand.name) return raw.brand.name;
  return product.brands?.name ?? product.brandName ??
    (typeof raw.brand === 'string' ? raw.brand : null) ??
    raw.manufacturer ??
    'KaamAsaan Verified';
};

const productSearchText = (product: Product) => [
  product.category,
  product.rawCategory,
  product.subCategory,
  product.rawSubCategory,
  getProductBrandName(product),
  product.name,
  product.model,
  product.capacity,
  product.capacityWatt,
  product.capacityKw,
  product.batteryCapacityKwh,
  ...flattenSpecValues(product.specifications),
  ...product.specs
].filter(Boolean).join(' ');

export const isInverterProduct = (product: Product) => {
  const category = normalizeCategoryKey([product.category, product.rawCategory, product.subCategory, product.rawSubCategory].filter(Boolean).join(' '));
  if (category.includes('inverter')) return true;
  if (category.includes('battery') || category.includes('panel')) return false;
  const source = normalize(productSearchText(product));
  return source.includes('inverter') || source.includes('hybrid');
};

export const isBatteryProduct = (product: Product) => {
  const category = normalizeCategoryKey([product.category, product.rawCategory, product.subCategory, product.rawSubCategory].filter(Boolean).join(' '));
  if (category.includes('battery')) return true;
  if (category.includes('inverter') || category.includes('panel')) return false;
  const source = normalize(productSearchText(product));
  return source.includes('battery') || source.includes('lithium') || source.includes('energy storage');
};

export const isPanelProduct = (product: Product) => {
  const category = normalizeCategoryKey([product.category, product.rawCategory, product.subCategory, product.rawSubCategory].filter(Boolean).join(' '));
  if (category.includes('inverter') || category.includes('battery') || category.includes('accessory')) return false;
  if (category === 'panel' || category.includes('solarpanel') || category.includes('pvpanel') || category.includes('pvmodule')) return true;
  const source = normalize(productSearchText(product));
  return source.includes('solar panel') || source.includes('pv panel') || source.includes('pv module');
};

export const getProductKw = (product: Product) => {
  if (isBatteryProduct(product)) return 0;
  return parseCapacityKw(product.capacityKw, 'kW', productSearchText(product)) ??
    parseCapacityKw(product.capacity, null, productSearchText(product)) ??
    0;
};

export const getProductKwh = (product: Product) => getBatteryCapacityKwh(product);
export const extractInverterSizeKw = getProductKw;
export const extractBatterySizeKwh = getProductKwh;

export const getProductWatt = (product: Product) => parseCapacityWatt(
  product.panelWattage ?? product.capacityWatt ?? product.capacity_watt,
  'W',
  productSearchText(product)
) ?? parseCapacityWatt(product.capacityKw, 'kW', productSearchText(product)) ?? 0;

export const parsePanelWattage = (product: Product) => {
  if (!isPanelProduct(product)) return 0;
  const parsed = getProductWatt(product);
  if (parsed >= 100 && parsed <= 1000) return Math.round(parsed);
  const match = productSearchText(product).match(/\b([1-9]\d{2})\s*(?:w|watt|watts)\b/i);
  return match ? Number(match[1]) : 0;
};

export const extractPanelWattage = parsePanelWattage;
export const getAvailablePanelWattages = (products: Product[]) => [...new Set(
  products.filter(isPanelProduct).map(parsePanelWattage).filter((value) => value > 0)
)].sort((left, right) => left - right);

export const findBestPanelByWattage = (wattage: number, products: Product[]) => products
  .filter((product) => isPanelProduct(product) && parsePanelWattage(product) === wattage)
  .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0) || (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER))[0] ?? null;

export const isOutOfStock = (product: Product) => normalize(product.stockStatus).includes('out of stock');

const warrantyYears = (product: Product) => {
  const match = [product.warranty, ...product.specs].filter(Boolean).join(' ').match(/(\d+(?:\.\d+)?)\s*(?:year|yr)/i);
  return match ? Number(match[1]) : 0;
};

const warrantyLabel = (product: Product) => {
  const years = warrantyYears(product);
  return years > 0 ? `${years} Years` : 'On request';
};

export const getPanelUnitPrice = (panel: Product) => {
  const wattage = parsePanelWattage(panel);
  if (panel.ratePerWatt && wattage) return panel.ratePerWatt * wattage;
  if (panel.priceUnit === 'per_watt' && panel.price && wattage) return panel.price * wattage;
  return panel.price ?? null;
};

const numberFrom = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const maxBatteryModules = (product: Product) => {
  const configured = product.maxParallelModules ??
    numberFrom(product.specifications?.max_parallel_modules) ??
    numberFrom(product.specifications?.max_modules);
  return Math.max(1, Math.floor(configured ?? 1));
};

export const toPackageEngineProduct = (product: Product): PackageEngineProduct | null => {
  const category = isInverterProduct(product)
    ? 'inverter'
    : isBatteryProduct(product)
      ? 'battery'
      : isPanelProduct(product)
        ? 'panel'
        : null;
  if (!category) return null;
  const brandName = getProductBrandName(product);
  const compatibilityGroups = product.compatibilityGroups?.length
    ? product.compatibilityGroups
    : product.brandDefaultCompatibilityGroup
      ? [product.brandDefaultCompatibilityGroup]
      : [];
  return {
    id: product.id,
    category,
    brandId: product.brandId ?? product.brands?.id ?? compact(brandName),
    productFamilyId: product.productFamilyId ?? null,
    brandName,
    brandAliases: product.brandAliases ?? product.brands?.aliases ?? [],
    brandPriority: product.brandPriority ?? product.brands?.priority ?? 0,
    brandPackageGenerationEnabled: product.brandPackageGenerationEnabled ?? product.brands?.package_generation_enabled ?? false,
    brandPackageImageUrl: product.brandPackageImageUrl ?? product.brands?.package_image_url,
    brandLogo: product.brandLogo ?? product.brands?.logo_url,
    name: product.name,
    model: product.model,
    imageUrl: product.image,
    price: product.price,
    active: product.isActive ?? true,
    packageEligible: product.packageEligible ?? false,
    priority: product.priority ?? 0,
    available: !isOutOfStock(product),
    stockStatus: product.stockStatus ?? null,
    capacityKw: category === 'inverter' ? getProductKw(product) : undefined,
    capacityKwh: category === 'battery' ? getProductKwh(product) : undefined,
    usableCapacityKwh: category === 'battery' ? product.usableCapacityKwh : undefined,
    maximumRecommendedPvKwp: category === 'inverter' ? product.maximumRecommendedPvKwp : undefined,
    panelWattage: category === 'panel' ? parsePanelWattage(product) : undefined,
    pricePerWatt: category === 'panel' ? product.ratePerWatt : undefined,
    phase: product.phase,
    voltageClass: product.voltageClass,
    compatibilityGroups,
    parallelSupported: product.parallelSupported ?? false,
    maxParallelUnits: product.maxParallelUnits ?? 1,
    sameModelParallelOnly: product.sameModelParallelOnly ?? true,
    maxParallelModules: category === 'battery' ? maxBatteryModules(product) : undefined,
    commercialMaxParallelModules: category === 'battery' ? product.commercialMaxParallelModules : undefined,
    sameBrandCompatibilityEnabled: product.sameBrandCompatibilityEnabled ?? true
  };
};

const packageTitle = (primaryBrand: string, batteryBrand?: string) => !batteryBrand
  ? `${primaryBrand} Solar Package`
  : compact(primaryBrand) === compact(batteryBrand)
    ? `${primaryBrand} Complete Package`
    : `${primaryBrand} + ${batteryBrand} Package`;

const badgeFor = (tier: PackageTier): { badge: string; badgeTone: PackageBadgeTone } => {
  if (tier === 'recommended') return { badge: 'Recommended', badgeTone: 'gold' };
  if (tier === 'basic') return { badge: 'Basic', badgeTone: 'blue' };
  if (tier === 'better') return { badge: 'Better', badgeTone: 'purple' };
  return { badge: 'Compatible option', badgeTone: 'blue' };
};

export function generateRecommendedPackages({
  requiredPanelKw,
  requiredInverterKw,
  requiredBatteryKwh,
  runningLoadKw,
  peakLoadKw,
  backupHours,
  phase,
  minimumBasicSizingPercentage,
  products,
  compatibilityRules = [],
  selectedPanelWattage,
  requiredBackupEnergyKwh = requiredBatteryKwh,
  batteryUsableFactor = COMMERCIAL_V1_DEFAULT_USABLE_FACTOR,
  preliminaryDisclaimer = COMMERCIAL_V1_DEFAULT_DISCLAIMER,
  configuredInstallationCost = 0,
  configuredStructureCost = 0,
  configuredAccessoriesCost = 0,
  acceptableBatteryShortfallPercent,
  selectedBatteryTier,
}: GenerateRecommendedPackagesInput): RecommendedPackage[] {
  const engineProducts = products
    .map(toPackageEngineProduct)
    .filter((product): product is PackageEngineProduct => Boolean(product));
  const productById = new Map(products.map((product) => [product.id, product]));
  const generated = generateCatalogPackages({
    requiredSolarKw: requiredPanelKw,
    requiredInverterKw,
    requiredBatteryKwh,
    runningLoadKw,
    peakLoadKw,
    backupHours,
    phase,
    minimumBasicSizingPercentage,
    products: engineProducts,
    compatibilityExceptions: compatibilityRules,
    selectedPanelWattage,
    configuredInstallationCost,
    configuredStructureCost,
    configuredAccessoriesCost,
    acceptableBatteryShortfallPercent,
    selectedBatteryTier,
  });

  return generated.flatMap((item): RecommendedPackage[] => {
    const inverterProduct = productById.get(item.inverter.productId);
    const batteryProduct = item.battery ? productById.get(item.battery.productId) : undefined;
    const panelProduct = productById.get(item.panel.productId);
    if (!inverterProduct || !panelProduct || (item.battery && !batteryProduct)) return [];

    const inverterExact = Math.abs(item.inverter.totalCapacityKw - requiredInverterKw) < 0.001;
    const batteryExact = item.battery ? Math.abs(item.battery.totalCapacityKwh - requiredBatteryKwh) < 0.001 : true;
    const batteryBrand = batteryProduct ? getProductBrandName(batteryProduct) : undefined;
    const title = packageTitle(item.primaryBrand, batteryBrand);
    const badge = badgeFor(item.packageType);
    const panelUnitPrice = getPanelUnitPrice(panelProduct);
    const inverterPrice = inverterProduct.price == null ? null : inverterProduct.price * item.inverter.quantity;
    const batteryPrice = batteryProduct?.price == null
      ? item.battery ? null : 0
      : batteryProduct.price * (item.battery?.quantity ?? 0);
    const batteryConfiguration: BatteryConfiguration | undefined = item.battery && batteryProduct ? {
      id: `${batteryProduct.id}-x${item.battery.quantity}`,
      capacityKwh: item.battery.totalCapacityKwh,
      productIds: Array.from({ length: item.battery.quantity }, () => batteryProduct.id),
      quantity: item.battery.quantity,
      brand: batteryBrand ?? item.primaryBrand,
      model: batteryProduct.model ?? batteryProduct.name,
      totalPrice: batteryPrice,
      usableEnergyKwh: 0,
      image: batteryProduct.image,
      primaryProduct: batteryProduct
    } : undefined;

    const batteryUnitCapacityKwh = item.battery ? item.battery.totalCapacityKwh / item.battery.quantity : 0;
    const configuredUsableFactor = batteryProduct?.usableFactorOverride ??
      (batteryProduct?.usableCapacityKwh && batteryUnitCapacityKwh > 0
        ? batteryProduct.usableCapacityKwh / batteryUnitCapacityKwh
        : batteryUsableFactor);
    const applicableUsableFactor = Number.isFinite(configuredUsableFactor) && configuredUsableFactor > 0 && configuredUsableFactor <= 1
      ? configuredUsableFactor
      : batteryUsableFactor;
    const estimatedUsableBatteryEnergyKwh = (item.battery?.totalCapacityKwh ?? 0) * applicableUsableFactor;
    const coveragePercent = requiredBackupEnergyKwh > 0
      ? (estimatedUsableBatteryEnergyKwh / requiredBackupEnergyKwh) * 100
      : 100;
    const shortfallKwh = Math.max(requiredBackupEnergyKwh - estimatedUsableBatteryEnergyKwh, 0);
    const headroomKwh = Math.max(estimatedUsableBatteryEnergyKwh - requiredBackupEnergyKwh, 0);

    if (batteryConfiguration) batteryConfiguration.usableEnergyKwh = estimatedUsableBatteryEnergyKwh;

    const panelsPrice = panelUnitPrice == null ? null : panelUnitPrice * item.panel.quantity;
    const installationCharges = Math.max(0, configuredInstallationCost);
    const otherExistingCharges = Math.max(0, configuredStructureCost + configuredAccessoriesCost);

    return [{
      id: item.id,
      packageType: item.packageType,
      brand: item.primaryBrand,
      title,
      ...badge,
      packageName: title,
      packageBrand: item.primaryBrand,
      brandId: item.primaryBrandId,
      batteryBrand,
      panel: panelProduct,
      panelProduct,
      inverter: {
        product: inverterProduct,
        exact: inverterExact,
        lowerThanRequired: item.inverter.totalCapacityKw < requiredInverterKw,
        size: item.inverter.totalCapacityKw,
        quantity: item.inverter.quantity
      },
      inverterProduct,
      inverterQuantity: item.inverter.quantity,
      battery: item.battery && batteryProduct ? {
        product: batteryProduct,
        exact: batteryExact,
        lowerThanRequired: item.battery.totalCapacityKwh < requiredBatteryKwh,
        size: item.battery.totalCapacityKwh,
        quantity: item.battery.quantity,
        configuration: batteryConfiguration
      } : undefined,
      batteryProduct,
      panelQuantity: item.panel.quantity,
      actualPanelKw: item.panel.totalCapacityKw,
      totalSolarKw: item.panel.totalCapacityKw,
      inverterSizeKw: item.inverter.totalCapacityKw,
      batterySizeKwh: item.battery?.totalCapacityKwh ?? 0,
      batteryQuantity: item.battery?.quantity ?? 0,
      totalBatteryKwh: item.battery?.totalCapacityKwh ?? 0,
      panelsPrice,
      inverterPrice,
      batteryPrice,
      installation: {
        title: 'Structure, installation & accessories',
        price: configuredInstallationCost + configuredStructureCost + configuredAccessoriesCost,
        included: true,
      },
      totalPrice: item.totalPrice,
      inverterWarranty: warrantyLabel(inverterProduct),
      batteryWarranty: batteryProduct ? warrantyLabel(batteryProduct) : undefined,
      packageImageUrl: item.packageImageUrl || undefined,
      brandLogo: item.brandLogo || inverterProduct.brandLogo || inverterProduct.brands?.logo_url || undefined,
      image: inverterProduct.image || batteryProduct?.image || panelProduct.image,
      compatibilityStatus: 'compatible',
      compatibilityGroup: item.compatibilityGroup,
      recommendationReason: item.recommendationReason,
      limitations: item.limitations,
      notes: [
        `${item.panel.quantity} x ${item.panel.panelWattage}W panels`,
        item.inverter.quantity > 1
          ? `${item.inverter.quantity} x ${item.inverter.totalCapacityKw / item.inverter.quantity} kW inverters (${item.inverter.totalCapacityKw} kW total)`
          : `${item.inverter.totalCapacityKw} kW inverter`,
        item.battery
          ? item.battery.quantity > 1
            ? `${item.battery.quantity} x ${item.battery.totalCapacityKwh / item.battery.quantity} kWh batteries (${item.battery.totalCapacityKwh} kWh total)`
            : `${item.battery.totalCapacityKwh} kWh battery`
          : 'Battery backup not included',
        ...item.limitations
      ],
      bestMatch: item.packageType === 'recommended',
      nearestAvailable: !inverterExact || !batteryExact,
      hasLowerInverter: item.inverter.totalCapacityKw < requiredInverterKw,
      outOfStock: isOutOfStock(inverterProduct) || isOutOfStock(panelProduct) || Boolean(batteryProduct && isOutOfStock(batteryProduct)),
      score: item.score,
      tier: item.packageType === 'basic' ? 'budget' : item.packageType === 'better' ? 'extended' : item.packageType,
      actualPvKwp: item.panel.totalCapacityKw,
      batteryUnitCapacityKwh,
      totalBatteryCapacityKwh: item.battery?.totalCapacityKwh ?? 0,
      estimatedUsableBatteryEnergyKwh,
      requiredBackupEnergyKwh,
      coveragePercent: Math.round(coveragePercent * 10) / 10,
      shortfallKwh: Math.round(shortfallKwh * 100) / 100,
      headroomKwh: Math.round(headroomKwh * 100) / 100,
      phase: inverterProduct.phase,
      voltageClass: inverterProduct.voltageClass,
      packagePrice: item.totalPrice,
      recommendationReasoning: item.recommendationReason,
      isPreliminary: true,
      preliminaryDisclaimer,
      requiresExpertReview: false,
      originalPackageId: item.id,
      isCustomized: false,
      additionalPackageCharges: configuredInstallationCost + configuredStructureCost + configuredAccessoriesCost,
      priceBreakdown: {
        panelPrice: panelsPrice,
        inverterPrice,
        batteryPrice,
        installationCharges,
        otherExistingCharges,
        grossTotal: item.totalPrice,
      },
      recommendedBatteryCapacityKwh: item.battery?.totalCapacityKwh ?? 0,
    }];
  });
}

export function getPackageGenerationDiagnostics({
  requiredPanelKw,
  requiredInverterKw,
  requiredBatteryKwh,
  runningLoadKw,
  peakLoadKw,
  backupHours,
  phase,
  minimumBasicSizingPercentage,
  acceptableBatteryShortfallPercent,
  selectedBatteryTier,
  products,
  compatibilityRules = [],
  selectedPanelWattage
}: GenerateRecommendedPackagesInput): PackageGenerationDiagnostic[] {
  const engineProducts = products
    .map(toPackageEngineProduct)
    .filter((product): product is PackageEngineProduct => Boolean(product));

  return generateCatalogPackageDiagnostics({
    requiredSolarKw: requiredPanelKw,
    requiredInverterKw,
    requiredBatteryKwh,
    runningLoadKw,
    peakLoadKw,
    backupHours,
    phase,
    minimumBasicSizingPercentage,
    products: engineProducts,
    compatibilityExceptions: compatibilityRules,
    selectedPanelWattage,
    acceptableBatteryShortfallPercent,
    selectedBatteryTier,
  });
}

export function getRecommendedPackageById(packages: RecommendedPackage[], packageId?: string | null) {
  if (!packageId) return null;
  return packages.find((item) => item.id === packageId) ?? null;
}

export function buildRecommendedPackages(
  systemRecommendation: SystemRecommendation,
  selectedPanelProduct: Product | null,
  products: Product[]
) {
  return generateRecommendedPackages({
    requiredPanelKw: systemRecommendation.requiredSolarKw,
    requiredInverterKw: systemRecommendation.requiredInverterKw,
    requiredBatteryKwh: systemRecommendation.requiredBatteryKwh,
    products,
    selectedPanelWattage: selectedPanelProduct ? getProductWatt(selectedPanelProduct) : undefined
  });
}
