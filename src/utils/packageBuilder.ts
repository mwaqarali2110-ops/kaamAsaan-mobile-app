import type { Product } from '@/types/product.types';
import { parseCapacityKw, parseCapacityKwh, parseCapacityWatt } from '@/utils/capacity';

export type SystemRecommendation = {
  requiredSolarKw: number;
  requiredInverterKw: number;
  requiredBatteryKwh: number;
};

export type PackageComponentMatch = {
  product: Product;
  exact: boolean;
  lowerThanRequired: boolean;
  size: number;
};

export type RecommendedPackage = {
  id: string;
  packageName: string;
  packageBrand: string;
  batteryBrand: string;
  panel: Product;
  inverter: PackageComponentMatch;
  battery: PackageComponentMatch;
  panelQuantity: number;
  totalSolarKw: number;
  panelsPrice: number | null;
  inverterPrice: number | null;
  batteryPrice: number | null;
  totalPrice: number | null;
  bestMatch: boolean;
  nearestAvailable: boolean;
  hasLowerInverter: boolean;
  outOfStock: boolean;
  score: number;
};

const RECOMMENDED_PACKAGE_CONFIG = [
  {
    packageBrand: 'FOX',
    inverterBrands: ['fox', 'foxess', 'fox ess'],
    batteryBrands: ['fox', 'foxess', 'fox ess']
  },
  {
    packageBrand: 'GoodWe',
    inverterBrands: ['goodwe', 'goodwee', 'goodwe inverter', 'goodwe • inverter'],
    batteryBrands: ['goodwe', 'goodwee', 'soluna', 'dyness', 'hithium']
  },
  {
    packageBrand: 'Solis',
    inverterBrands: ['solis'],
    batteryBrands: ['pylontech', 'soluna', 'dyness']
  },
  {
    packageBrand: 'Huawei',
    inverterBrands: ['huawei'],
    batteryBrands: ['huawei']
  },
  {
    packageBrand: 'Sungrow',
    inverterBrands: ['sungrow'],
    batteryBrands: ['sungrow']
  }
] as const;

const normalize = (value?: string | null) => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function normalizeBrand(value?: string | null) {
  return String(value || '')
    .toLowerCase()
    .replace(/[•|–|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function brandMatches(productBrand: string, allowedBrands: readonly string[]) {
  const normalized = normalizeBrand(productBrand);
  if (!normalized) return false;
  return allowedBrands.some((brand) => {
    const allowed = normalizeBrand(brand);
    if (!allowed) return false;
    return normalized.includes(allowed) || allowed.includes(normalized);
  });
}

const displayBrandName = (brand: string) => {
  const normalized = normalizeBrand(brand);
  if (normalized.includes('goodwe') || normalized.includes('goodwee')) return 'GoodWe';
  if (normalized.includes('fox')) return 'Fox';
  if (normalized.includes('pylontech')) return 'Pylontech';
  if (normalized.includes('soluna')) return 'Soluna';
  if (normalized.includes('dyness')) return 'Dyness';
  if (normalized.includes('hithium')) return 'Hithium';
  if (normalized.includes('huawei')) return 'Huawei';
  if (normalized.includes('sungrow')) return 'Sungrow';
  return brand;
};

export const isOutOfStock = (product: Product) => normalize(product.stockStatus).includes('out of stock');

const isVisible = (product: Product) => product.isVisible !== false;
const isHiddenStockStatus = (product: Product) => {
  const status = normalize(product.stockStatus);
  return status.includes('hidden') || status.includes('inactive');
};
const stockRank = (product: Product) => {
  const status = normalize(product.stockStatus);
  if (status.includes('ready') || status.includes('in stock')) return 0;
  if (status.includes('eta') || status.includes('transit') || status.includes('preorder')) return 1;
  if (status.includes('booking')) return 2;
  if (status.includes('request')) return 3;
  if (status.includes('out')) return 4;
  return 2;
};

const productSearchText = (product: Product) => [
  product.category,
  product.subCategory,
  (product as Product & { sub_category?: string | null }).sub_category,
  product.brand,
  product.name,
  product.model,
  product.capacity,
  ...product.specs
]
  .filter(Boolean)
  .join(' ');

export const isInverterProduct = (product: Product) => {
  const source = normalize(productSearchText(product));
  const category = normalize(product.category);
  return category === 'inverter' ||
    source.includes('inverter') ||
    source.includes('hybrid') ||
    source.includes('hv hybrid') ||
    source.includes('single phase hybrid') ||
    source.includes('three phase hybrid');
};

export const isBatteryProduct = (product: Product) => {
  const source = normalize(productSearchText(product));
  const category = normalize(product.category);
  return category === 'battery' || source.includes('battery') || source.includes('lithium');
};

export const isPanelProduct = (product: Product) => {
  const source = normalize(productSearchText(product));
  const category = normalize(product.category);
  return category === 'panel' || source.includes('panel') || source.includes('solar panel');
};

export const getProductKw = (product: Product) => {
  const parsed = parseCapacityKw(product.capacityKw, 'kW', productSearchText(product)) ??
    parseCapacityKw(product.capacity, null, productSearchText(product));
  return parsed ?? 0;
};

export const getProductKwh = (product: Product) => {
  const parsed = parseCapacityKwh(product.batteryCapacityKwh, 'kWh', productSearchText(product)) ??
    parseCapacityKwh(product.capacity, null, productSearchText(product));
  return parsed ?? 0;
};

export const getProductWatt = (product: Product) => {
  const parsed = parseCapacityWatt(product.capacityWatt, 'W', productSearchText(product)) ??
    parseCapacityWatt(product.capacityKw, 'kW', productSearchText(product)) ??
    parseCapacityWatt(product.capacity, null, productSearchText(product));
  return parsed ?? 0;
};

export const parsePanelWattage = (product: Product) => {
  if (!isPanelProduct(product)) return 0;
  const parsed = getProductWatt(product);
  return parsed ? Math.round(parsed) : 0;
};

const panelPricePerWatt = (product: Product) => {
  const wattage = parsePanelWattage(product);
  if (product.ratePerWatt && product.ratePerWatt > 0) return product.ratePerWatt;
  if (product.price && wattage) return product.price / wattage;
  return Number.MAX_SAFE_INTEGER;
};

export const getAvailablePanelWattages = (products: Product[]) => [...new Set(
  products
    .filter((product) => isPanelProduct(product) && isVisible(product) && !isHiddenStockStatus(product))
    .map(parsePanelWattage)
    .filter((wattage) => wattage > 0)
)]
  .sort((a, b) => a - b);

export const findBestPanelByWattage = (wattage: number, products: Product[]) => {
  const candidates = products
    .filter((product) => isPanelProduct(product) && isVisible(product) && !isHiddenStockStatus(product) && parsePanelWattage(product) === wattage)
    .sort((a, b) => stockRank(a) - stockRank(b) || panelPricePerWatt(a) - panelPricePerWatt(b));
  return candidates[0] ?? null;
};

const isExactSize = (actual: number, required: number) => Math.abs(actual - required) < 0.001;

const sortBySizePreference = <T extends Product>(
  products: T[],
  requiredSize: number,
  getSize: (product: T) => number
) => [...products].sort((a, b) => {
  const sizeA = getSize(a);
  const sizeB = getSize(b);
  const tierA = isExactSize(sizeA, requiredSize) ? 0 : sizeA > requiredSize ? 1 : 2;
  const tierB = isExactSize(sizeB, requiredSize) ? 0 : sizeB > requiredSize ? 1 : 2;
  if (tierA !== tierB) return tierA - tierB;
  if (tierA === 1) return sizeA - sizeB;
  if (tierA === 2) return sizeB - sizeA;
  return 0;
});

const chooseAvailable = <T extends Product>(products: T[]) => {
  const preferred = products.filter((product) => !isOutOfStock(product));
  return preferred.length ? preferred[0] : products[0] ?? null;
};

export function findBestInverter(requiredKw: number, brands: readonly string[], availableInverters: Product[]) {
  const candidates = availableInverters.filter((product) => {
    const subCategory = normalize(product.subCategory);
    return isInverterProduct(product) &&
      isVisible(product) &&
      brandMatches(product.brand, brands) &&
      subCategory !== 'on grid inverter' &&
      getProductKw(product) > 0;
  });
  const product = chooseAvailable(sortBySizePreference(candidates, requiredKw, getProductKw));
  if (!product) return null;
  const size = getProductKw(product);
  return { product, size, exact: isExactSize(size, requiredKw), lowerThanRequired: size < requiredKw };
}

export function findBestBattery(requiredKwh: number, allowedBatteryBrands: readonly string[], availableBatteries: Product[]) {
  const candidates = availableBatteries.filter((product) =>
    isBatteryProduct(product) &&
    isVisible(product) &&
    brandMatches(product.brand, allowedBatteryBrands) &&
    getProductKwh(product) > 0
  );
  const product = chooseAvailable(sortBySizePreference(candidates, requiredKwh, getProductKwh));
  if (!product) return null;
  const size = getProductKwh(product);
  return { product, size, exact: isExactSize(size, requiredKwh), lowerThanRequired: size < requiredKwh };
}

export const getPanelUnitPrice = (panel: Product) => {
  const watt = getProductWatt(panel);
  if (panel.ratePerWatt && watt) return panel.ratePerWatt * watt;
  return panel.price ?? null;
};

export function buildRecommendedPackages(
  systemRecommendation: SystemRecommendation,
  selectedPanelProduct: Product | null,
  products: Product[]
) {
  if (!selectedPanelProduct) return [];

  const panelWatt = getProductWatt(selectedPanelProduct);
  if (!panelWatt) return [];

  const panelQuantity = Math.max(1, Math.ceil((systemRecommendation.requiredSolarKw * 1000) / panelWatt));
  const totalSolarKw = (panelQuantity * panelWatt) / 1000;
  const panelsPrice = getPanelUnitPrice(selectedPanelProduct);
  const panelTotalPrice = panelsPrice == null ? null : panelsPrice * panelQuantity;
  const inverters = products.filter(isInverterProduct);
  const batteries = products.filter(isBatteryProduct);

  const packages = RECOMMENDED_PACKAGE_CONFIG.flatMap((config) => {
    const inverter = findBestInverter(systemRecommendation.requiredInverterKw, config.inverterBrands, inverters);

    if (!inverter) return [];

    const battery = findBestBattery(systemRecommendation.requiredBatteryKwh, config.batteryBrands, batteries);

    if (!battery) return [];

    const inverterPrice = inverter.product.price ?? null;
    const batteryPrice = battery.product.price ?? null;
    const totalPrice = panelTotalPrice == null || inverterPrice == null || batteryPrice == null
      ? null
      : panelTotalPrice + inverterPrice + batteryPrice;
    const score = Math.abs(inverter.size - systemRecommendation.requiredInverterKw) +
      Math.abs(battery.size - systemRecommendation.requiredBatteryKwh) +
      (isOutOfStock(inverter.product) || isOutOfStock(battery.product) || isOutOfStock(selectedPanelProduct) ? 50 : 0);
    const batteryBrand = displayBrandName(battery.product.brand);
    const packageName = `${config.packageBrand} + ${batteryBrand} Package`;

    return [{
      id: `${config.packageBrand}-${inverter.product.id}-${battery.product.id}-${selectedPanelProduct.id}`,
      packageName,
      packageBrand: config.packageBrand,
      batteryBrand,
      panel: selectedPanelProduct,
      inverter,
      battery,
      panelQuantity,
      totalSolarKw,
      panelsPrice: panelTotalPrice,
      inverterPrice,
      batteryPrice,
      totalPrice,
      bestMatch: false,
      nearestAvailable: !inverter.exact || !battery.exact,
      hasLowerInverter: inverter.lowerThanRequired,
      outOfStock: isOutOfStock(inverter.product) || isOutOfStock(battery.product) || isOutOfStock(selectedPanelProduct),
      score
    }];
  });

  const bestScore = Math.min(...packages.map((item) => item.score));
  return packages
    .map((item) => ({ ...item, bestMatch: item.score === bestScore }));
}
