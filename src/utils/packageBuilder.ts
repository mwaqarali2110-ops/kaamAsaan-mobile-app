import type { Product } from '@/types/product.types';
import { parseCapacityKw, parseCapacityKwh, parseCapacityWatt } from '@/utils/capacity';

export type SystemRecommendation = {
  requiredSolarKw: number;
  requiredInverterKw: number;
  requiredBatteryKwh: number;
};

export type BatteryCompatibilityRule = {
  inverterBrand: string;
  batteryBrand: string;
};

export type PackageComponentMatch = {
  product: Product;
  exact: boolean;
  lowerThanRequired: boolean;
  size: number;
};

export type PackageBadgeTone = 'gold' | 'blue' | 'purple';

export type RecommendedPackage = {
  id: string;
  brand: string;
  title: string;
  badge: string;
  badgeTone: PackageBadgeTone;
  packageName: string;
  packageBrand: string;
  batteryBrand: string;
  panel: Product;
  panelProduct: Product;
  inverter: PackageComponentMatch;
  inverterProduct: Product;
  battery: PackageComponentMatch;
  batteryProduct: Product;
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
  totalPrice: number | null;
  inverterWarranty: string;
  batteryWarranty: string;
  image?: string;
  brandLogo?: string;
  compatibilityStatus: 'compatible';
  notes: string[];
  bestMatch: boolean;
  nearestAvailable: boolean;
  hasLowerInverter: boolean;
  outOfStock: boolean;
  score: number;
};

export type GenerateRecommendedPackagesInput = {
  requiredPanelKw: number;
  requiredInverterKw: number;
  requiredBatteryKwh: number;
  products: Product[];
  compatibilityRules?: BatteryCompatibilityRule[];
  selectedPanelWattage?: number;
};

const preferredPanelBrands = ['ja', 'astro', 'canadian', 'jinko'];

const fallbackBatteryCompatibility: Record<string, string[]> = {
  fox: ['fox'],
  solis: ['pylontech', 'dyness', 'solis'],
  goodwe: ['goodwe', 'pylontech', 'dyness'],
  itel: ['itel'],
  kstar: ['kstar'],
  photon: ['photon']
};

const normalize = (value?: string | null) => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const BRAND_ALIASES: Record<string, string[]> = {
  goodwe: ['goodwe', 'goodwee', 'good-we', 'good wee', 'goodwe solar'],
  fox: ['fox', 'foxess', 'fox ess', 'fox-ess', 'fox ess solar'],
  solis: ['solis', 'solis plus', 'solis lv', 'solis hv', 'ginlong solis'],
  kstar: ['kstar', 'k-star', 'k star'],
  itel: ['itel', 'i-tel', 'i tel'],
  photon: ['photon'],
  pylontech: ['pylontech', 'pylon tech', 'pylon-tech'],
  dyness: ['dyness', 'dy ness'],
  soluna: ['soluna', 'so luna'],
  hithium: ['hithium', 'hi-thium'],
  huawei: ['huawei'],
  sungrow: ['sungrow'],
  ja: ['ja', 'ja solar', 'jasolar'],
  astro: ['astro', 'astro energy', 'astro solar'],
  canadian: ['canadian', 'canadian solar', 'canadiansolar'],
  jinko: ['jinko', 'jinko solar', 'jinkosolar']
};

const BRAND_DISPLAY_NAMES: Record<string, string> = {
  goodwe: 'GoodWe',
  fox: 'Fox',
  solis: 'Solis',
  kstar: 'KSTAR',
  itel: 'Itel',
  photon: 'Photon',
  pylontech: 'Pylontech',
  dyness: 'Dyness',
  soluna: 'Soluna',
  hithium: 'Hithium',
  huawei: 'Huawei',
  sungrow: 'Sungrow',
  ja: 'JA Solar',
  astro: 'Astro',
  canadian: 'Canadian Solar',
  jinko: 'Jinko Solar'
};

const compactBrand = (value?: string | null) => (value ?? '')
  .toLowerCase()
  .trim()
  .replace(/[\s_-]+/g, '')
  .replace(/[^a-z0-9]/g, '');

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function fuzzyBrandMatches(value: string, target: string) {
  const longest = Math.max(value.length, target.length);
  const shortest = Math.min(value.length, target.length);
  if (shortest < 5) return false;
  const allowedDistance = longest > 5 ? 2 : 1;
  return levenshteinDistance(value, target) <= allowedDistance;
}

export function normalizeBrandName(value?: string | null): string {
  const compact = compactBrand(value);
  if (!compact) return '';

  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (compact === canonical || aliases.some((alias) => compact === compactBrand(alias))) {
      return canonical;
    }
  }

  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    const candidates = [canonical, ...aliases].map(compactBrand);
    if (candidates.some((candidate) => fuzzyBrandMatches(compact, candidate))) {
      return canonical;
    }
  }

  return compact;
}

export function normalizeBrand(value?: string | null) {
  return normalizeBrandName(value);
}

function brandMatches(productBrand: string, allowedBrands: readonly string[]) {
  const normalized = normalizeBrand(productBrand);
  if (!normalized) return false;
  return allowedBrands.some((brand) => {
    const allowed = normalizeBrand(brand);
    return Boolean(allowed) && normalized === allowed;
  });
}

const displayBrandName = (brand: string) => {
  const normalized = normalizeBrand(brand);
  if (BRAND_DISPLAY_NAMES[normalized]) return BRAND_DISPLAY_NAMES[normalized];
  return brand.trim() || 'KaamAsaan';
};

const isGenericBrandName = (brand?: string | null) => {
  const compact = compactBrand(brand);
  return !compact || compact.includes('kaamasaan') || compact.includes('verified') || compact === 'brand';
};

export const isOutOfStock = (product: Product) => normalize(product.stockStatus).includes('out of stock');

const normalizeCategoryKey = (value?: string | null) => (value ?? '')
  .toLowerCase()
  .trim()
  .replace(/[\s_-]+/g, '')
  .replace(/[^a-z0-9]/g, '');

const PANEL_CATEGORY_KEYS = new Set([
  'solarpanel',
  'solarpanels',
  'panel',
  'panels',
  'pvpanel',
  'pvmodule',
  'module',
  'modules'
]);

const BLOCKED_PANEL_CATEGORY_KEYS = new Set([
  'inverter',
  'hybridinverter',
  'battery',
  'lithiumbattery',
  'accessory',
  'accessories',
  'mountingstructure'
]);

const flattenSpecValues = (value: unknown): string[] => {
  if (value == null) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(flattenSpecValues);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(flattenSpecValues);
  return [];
};

const numericValue = (value?: number | string | null) => {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const rawBrandText = (product: Product) => {
  const productWithRaw = product as Omit<Product, 'brand'> & { brand?: string | { name?: string | null } | null };
  const rawBrand = typeof productWithRaw.brand === 'object' ? productWithRaw.brand?.name : productWithRaw.brand;
  return `${product.name || ''} ${product.brands?.name || ''} ${product.brandName || ''} ${rawBrand || ''}`;
};

export const getProductBrandName = (product: Product) => {
  const productWithRaw = product as {
    brand?: string | { name?: string | null } | null;
    brands?: { name?: string | null } | null;
    brandName?: string | null;
    manufacturer?: string | null;
  };
  if (typeof productWithRaw.brand === 'object' && productWithRaw.brand?.name) return productWithRaw.brand.name;
  const rawBrand = productWithRaw.brands?.name ??
    productWithRaw.brandName ??
    (typeof productWithRaw.brand === 'string' ? productWithRaw.brand : null) ??
    productWithRaw.manufacturer;

  if (rawBrand && !isGenericBrandName(rawBrand)) return rawBrand;

  const searchable = [
    product.name,
    product.model,
    product.capacity,
    product.subCategory,
    product.rawCategory,
    product.rawSubCategory,
    ...flattenSpecValues(product.specifications),
    ...product.specs
  ].filter(Boolean).join(' ');
  const compactSearchable = compactBrand(searchable);
  const inferred = Object.entries(BRAND_ALIASES).find(([canonical, aliases]) =>
    compactSearchable.includes(compactBrand(canonical)) ||
    aliases.some((alias) => compactSearchable.includes(compactBrand(alias)))
  )?.[0];

  return inferred ? displayBrandName(inferred) : rawBrand ?? 'KaamAsaan Verified';
};

const productSearchText = (product: Product) => [
  product.category,
  product.rawCategory,
  product.subCategory,
  product.rawSubCategory,
  (product as Product & { sub_category?: string | null }).sub_category,
  getProductBrandName(product),
  product.name,
  product.model,
  product.capacity,
  product.capacityWatt,
  product.capacity_watt,
  product.wattage,
  product.power,
  product.size,
  product.batteryCapacityKwh,
  (product as Product & { battery_capacity_kwh?: number | string | null }).battery_capacity_kwh,
  (product as Product & { capacity_value?: number | string | null }).capacity_value,
  (product as Product & { capacity_unit?: string | null }).capacity_unit,
  ...flattenSpecValues(product.specifications),
  ...product.specs
]
  .filter(Boolean)
  .join(' ');

export const isInverterProduct = (product: Product) => {
  const source = normalize(productSearchText(product));
  const category = normalizeCategoryKey([product.category, product.rawCategory, product.subCategory, product.rawSubCategory].filter(Boolean).join(' '));
  if (category === 'inverter') return true;
  if (category === 'battery' || category === 'panel') return false;
  return (
    source.includes('inverter') ||
    source.includes('hybrid') ||
    source.includes('solar inverter') ||
    normalizeCategoryKey(source).includes('hybridinverter') ||
    normalizeCategoryKey(source).includes('solarinverter') ||
    normalizeCategoryKey(source).includes('inverterhybrid') ||
    source.includes('single phase hybrid') ||
    source.includes('three phase hybrid')
  );
};

export const isBatteryProduct = (product: Product) => {
  const source = normalize(productSearchText(product));
  const category = normalizeCategoryKey([product.category, product.rawCategory, product.subCategory, product.rawSubCategory].filter(Boolean).join(' '));
  if (category === 'battery') return true;
  if (category === 'inverter' || category === 'panel') return false;
  return source.includes('battery') ||
    source.includes('batteries') ||
    source.includes('lithium') ||
    source.includes('storage') ||
    normalizeCategoryKey(source).includes('solarbattery') ||
    normalizeCategoryKey(source).includes('lithiumbattery') ||
    normalizeCategoryKey(source).includes('batterystorage');
};

export const isPanelProduct = (product: Product) => {
  const categoryCandidates = [
    product.category,
    product.rawCategory,
    product.subCategory,
    product.rawSubCategory,
    (product as Product & { sub_category?: string | null }).sub_category
  ].filter(Boolean).map((value) => normalizeCategoryKey(String(value)));

  if (categoryCandidates.some((category) => PANEL_CATEGORY_KEYS.has(category))) return true;
  if (categoryCandidates.some((category) => BLOCKED_PANEL_CATEGORY_KEYS.has(category))) return false;

  const source = normalize(productSearchText(product));
  const compactSource = normalizeCategoryKey(productSearchText(product));
  return source.includes('solar panel') ||
    source.includes('pv panel') ||
    source.includes('pv module') ||
    compactSource.includes('solarpanel') ||
    compactSource.includes('pvpanel') ||
    compactSource.includes('pvmodule');
};

export const getProductKw = (product: Product) => {
  if (isBatteryProduct(product)) return 0;
  const parsed = parseCapacityKw(product.capacityKw, 'kW', productSearchText(product)) ??
    parseCapacityKw(product.capacity, null, productSearchText(product));
  return parsed ?? 0;
};

export const getProductKwh = (product: Product) => {
  const productWithRaw = product as Product & {
    battery_capacity_kwh?: number | string | null;
    capacity_kw?: number | string | null;
    capacity_value?: number | string | null;
    capacity_unit?: string | null;
  };
  const searchText = productSearchText(product);
  const isBattery = isBatteryProduct(product);
  const directBatteryKwh = numericValue(product.batteryCapacityKwh) ?? numericValue(productWithRaw.battery_capacity_kwh);
  if (directBatteryKwh != null) return directBatteryKwh;

  const batteryKwAsKwh = isBattery
    ? numericValue(product.capacityKw) ?? numericValue(productWithRaw.capacity_kw)
    : null;
  if (batteryKwAsKwh != null) return batteryKwAsKwh;

  const parsed = parseCapacityKwh(product.capacity, null, searchText) ??
    parseCapacityKwh(productWithRaw.capacity_value, productWithRaw.capacity_unit, searchText);
  return parsed ?? 0;
};

export const extractInverterSizeKw = getProductKw;
export const extractBatterySizeKwh = getProductKwh;

export const getProductWatt = (product: Product) => {
  const parsed = parseCapacityWatt(product.capacityWatt, 'W', productSearchText(product)) ??
    parseCapacityWatt(product.capacityKw, 'kW', productSearchText(product)) ??
    parseCapacityWatt(product.capacity, null, productSearchText(product));
  return parsed ?? 0;
};

export const parsePanelWattage = (product: Product) => {
  if (!isPanelProduct(product)) return 0;
  const productWithRaw = product as Product & {
    capacity_watt?: number | string | null;
    capacityValue?: number | string | null;
    capacity_value?: number | string | null;
  };
  const directWattValues = [
    product.wattage,
    product.capacity_watt,
    product.capacityWatt,
    product.power,
    product.size,
    product.specifications?.wattage,
    product.specifications?.power,
    product.specifications?.capacity,
    product.specifications?.watts,
    productWithRaw.capacity_value,
    productWithRaw.capacityValue
  ];
  for (const value of directWattValues) {
    const parsedDirect = parseCapacityWatt(value as number | string | null | undefined, null, String(value ?? ''));
    if (parsedDirect && parsedDirect >= 300 && parsedDirect <= 800) return Math.round(parsedDirect);
  }

  const parsed = getProductWatt(product);
  if (parsed) return Math.round(parsed);

  const source = productSearchText(product);
  const explicitWattMatch = source.match(/\b([3-8]\d{2})\s*(?:w|watt|watts)\b/i);
  if (explicitWattMatch) return Number(explicitWattMatch[1]);

  const looseWattMatch = source.match(/\b([3-8]\d{2})\b/);
  const looseWatt = looseWattMatch ? Number(looseWattMatch[1]) : 0;
  if (looseWatt >= 300 && looseWatt <= 800) return looseWatt;

  if (__DEV__) console.log('Panel wattage not detected', product.name, product);
  return 0;
};

export const extractPanelWattage = parsePanelWattage;

const panelPricePerWatt = (product: Product) => {
  const wattage = parsePanelWattage(product);
  if (product.ratePerWatt && product.ratePerWatt > 0) return product.ratePerWatt;
  if (product.priceUnit === 'per_watt' && product.price && product.price > 0) return product.price;
  if (product.price && wattage) return product.price / wattage;
  return Number.MAX_SAFE_INTEGER;
};

export const getAvailablePanelWattages = (products: Product[]) => [...new Set(
  products
    .filter(isPanelProduct)
    .map(parsePanelWattage)
    .filter((wattage) => wattage > 0)
)]
  .sort((a, b) => a - b);

export const findBestPanelByWattage = (wattage: number, products: Product[]) => {
  const candidates = products
    .filter((product) => isPanelProduct(product) && parsePanelWattage(product) === wattage)
    .sort((a, b) => panelPricePerWatt(a) - panelPricePerWatt(b));
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
  return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
});

export function findBestInverter(requiredKw: number, brands: readonly string[], availableInverters: Product[]) {
  const minimumAllowedInverterKw = requiredKw * 0.90;
  const candidates = availableInverters.filter((product) =>
    isInverterProduct(product) &&
    brandMatches(getProductBrandName(product), brands) &&
    getProductKw(product) > 0 &&
    getProductKw(product) >= minimumAllowedInverterKw
  );
  const product = sortBySizePreference(candidates, requiredKw, getProductKw)[0] ?? null;
  if (!product) return null;
  const size = getProductKw(product);
  return { product, size, exact: isExactSize(size, requiredKw), lowerThanRequired: size < requiredKw };
}

export function findBestBattery(requiredKwh: number, allowedBatteryBrands: readonly string[], availableBatteries: Product[]) {
  const candidates = availableBatteries.filter((product) =>
    isBatteryProduct(product) &&
    brandMatches(getProductBrandName(product), allowedBatteryBrands) &&
    getProductKwh(product) > 0
  );
  const product = sortBySizePreference(candidates, requiredKwh, getProductKwh)[0] ?? null;
  if (!product) return null;
  const size = getProductKwh(product);
  return { product, size, exact: isExactSize(size, requiredKwh), lowerThanRequired: size < requiredKwh };
}

export const getPanelUnitPrice = (panel: Product) => {
  const watt = parsePanelWattage(panel);
  if (panel.ratePerWatt && watt) return panel.ratePerWatt * watt;
  if (panel.priceUnit === 'per_watt' && panel.price && watt) return panel.price * watt;
  return panel.price ?? null;
};

const panelBrandRank = (brand: string) => {
  const normalized = normalizeBrand(brand);
  const rank = preferredPanelBrands.findIndex((preferred) => brandMatches(normalized, [preferred]));
  return rank === -1 ? preferredPanelBrands.length : rank;
};

const selectBestPanelSet = (requiredSolarKw: number, products: Product[], selectedPanelWattage?: number) => {
  const candidates = products
    .filter(isPanelProduct)
    .map((product) => {
      const wattage = parsePanelWattage(product);
      if (wattage <= 0) return null;
      const quantity = Math.max(1, Math.ceil((requiredSolarKw * 1000) / wattage));
      const actualPanelKw = (quantity * wattage) / 1000;
      return {
        product,
        quantity,
        actualPanelKw,
        oversize: Math.max(0, actualPanelKw - requiredSolarKw),
        wattagePreference: selectedPanelWattage && wattage === selectedPanelWattage ? 0 : 1
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((a, b) =>
      a.oversize - b.oversize ||
      a.wattagePreference - b.wattagePreference ||
      panelBrandRank(a.product.brand) - panelBrandRank(b.product.brand) ||
      panelPricePerWatt(a.product) - panelPricePerWatt(b.product)
    );

  if (selectedPanelWattage) {
    const selectedWattageCandidates = candidates.filter((candidate) =>
      parsePanelWattage(candidate.product) === selectedPanelWattage
    );
    if (selectedWattageCandidates.length > 0) return selectedWattageCandidates[0];
  }

  return candidates[0] ?? null;
};

const normalizeCompatibilityValues = (value: unknown): string[] => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeCompatibilityValues);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(normalizeCompatibilityValues);
  return String(value)
    .split(/[,/|;&]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const productCompatibilityBrands = (product: Product) => {
  const productWithCompatibility = product as Product & {
    compatible_battery_brands?: unknown;
    compatibleBatteryBrands?: unknown;
    compatible_batteries?: unknown;
    compatibleBatteries?: unknown;
    battery_compatibility?: unknown;
    batteryCompatibility?: unknown;
  };
  const specifications = product.specifications ?? {};
  return [
    ...normalizeCompatibilityValues(productWithCompatibility.compatible_battery_brands),
    ...normalizeCompatibilityValues(productWithCompatibility.compatibleBatteryBrands),
    ...normalizeCompatibilityValues(productWithCompatibility.compatible_batteries),
    ...normalizeCompatibilityValues(productWithCompatibility.compatibleBatteries),
    ...normalizeCompatibilityValues(productWithCompatibility.battery_compatibility),
    ...normalizeCompatibilityValues(productWithCompatibility.batteryCompatibility),
    ...normalizeCompatibilityValues(specifications.compatible_battery_brands),
    ...normalizeCompatibilityValues(specifications.compatibleBatteryBrands),
    ...normalizeCompatibilityValues(specifications.compatible_batteries),
    ...normalizeCompatibilityValues(specifications.compatibleBatteries),
    ...normalizeCompatibilityValues(specifications.battery_compatibility),
    ...normalizeCompatibilityValues(specifications.batteryCompatibility)
  ];
};

const compatibleBatteryBrandsFor = (
  inverter: Product,
  batteries: Product[],
  rules: BatteryCompatibilityRule[]
) => {
  const inverterBrand = getProductBrandName(inverter);
  const normalizedInverterBrand = normalizeBrand(inverterBrand);
  const explicitCompatibility = productCompatibilityBrands(inverter);
  const configured = rules
    .filter((rule) => brandMatches(normalizedInverterBrand, [rule.inverterBrand]))
    .map((rule) => rule.batteryBrand);

  const fallbackKey = Object.keys(fallbackBatteryCompatibility)
    .find((brand) => normalizedInverterBrand === normalizeBrand(brand));
  const fallback = fallbackKey ? fallbackBatteryCompatibility[fallbackKey] : [inverterBrand];
  const metadataMatches = batteries
    .filter((battery) =>
      normalizeBrand(getProductBrandName(battery)) === normalizedInverterBrand ||
      normalizeBrand(productSearchText(battery)) === normalizedInverterBrand
    )
    .map((battery) => getProductBrandName(battery));

  return [...new Set([...explicitCompatibility, ...configured, ...fallback, inverterBrand, ...metadataMatches])];
};

const warrantyYears = (product: Product) => {
  const source = [product.warranty, ...product.specs].filter(Boolean).join(' ');
  const match = source.match(/(\d+(?:\.\d+)?)\s*(?:year|yr)/i);
  return match ? Number(match[1]) : 0;
};

const warrantyLabel = (product: Product) => {
  const years = warrantyYears(product);
  return years > 0 ? `${years} Years` : 'On request';
};

const packageTitle = (inverterBrand: string, batteryBrand: string) =>
  normalizeBrand(inverterBrand) === normalizeBrand(batteryBrand)
    ? `${inverterBrand} Complete Package`
    : `${inverterBrand} + ${batteryBrand} Package`;

export function generateRecommendedPackages({
  requiredPanelKw,
  requiredInverterKw,
  requiredBatteryKwh,
  products,
  compatibilityRules = [],
  selectedPanelWattage
}: GenerateRecommendedPackagesInput): RecommendedPackage[] {
  const panelSet = selectBestPanelSet(requiredPanelKw, products, selectedPanelWattage);
  const inverters = products.filter(isInverterProduct);
  const batteries = products.filter(isBatteryProduct);
  const panelProducts = products.filter(isPanelProduct);
  const logPackageDebug = (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  };

  logPackageDebug('Required system:', {
    requiredPanelKw,
    requiredInverterKw,
    requiredBatteryKwh
  });
  logPackageDebug('All products count:', products.length);
  logPackageDebug('Detected panel products:', panelProducts);
  logPackageDebug('Detected inverter products:', inverters);
  logPackageDebug('Detected battery products:', batteries);
  logPackageDebug('GOODWE DEBUG all products:', products.filter((product) => {
    const normalizedBrandText = rawBrandText(product).toLowerCase();
    return normalizedBrandText.includes('goodwe') || normalizedBrandText.includes('goodwee');
  }));
  logPackageDebug('SOLIS DEBUG all products:', products.filter((product) =>
    rawBrandText(product).toLowerCase().includes('solis')
  ));
  const goodweInverters = inverters.filter((product) => normalizeBrandName(getProductBrandName(product)) === 'goodwe');
  const goodweBatteries = batteries.filter((product) => normalizeBrandName(getProductBrandName(product)) === 'goodwe');
  const solisInverters = inverters.filter((product) => normalizeBrandName(getProductBrandName(product)) === 'solis');
  logPackageDebug('GOODWE DEBUG inverters:', goodweInverters.map((product) => ({
    name: product.name,
    brand: getProductBrandName(product),
    normalizedBrand: normalizeBrandName(getProductBrandName(product)),
    category: product.category,
    sizeKw: extractInverterSizeKw(product),
    specifications: product.specifications,
  })));
  logPackageDebug('GOODWE DEBUG batteries:', goodweBatteries.map((product) => ({
    name: product.name,
    brand: getProductBrandName(product),
    normalizedBrand: normalizeBrandName(getProductBrandName(product)),
    category: product.category,
    sizeKwh: extractBatterySizeKwh(product),
    specifications: product.specifications,
  })));
  logPackageDebug('SOLIS DEBUG inverters:', solisInverters.map((product) => ({
    name: product.name,
    brand: getProductBrandName(product),
    normalizedBrand: normalizeBrandName(getProductBrandName(product)),
    category: product.category,
    sizeKw: extractInverterSizeKw(product),
    price: product.price,
    stock: product.stockStatus,
    status: product.stockStatus,
    specifications: product.specifications,
  })));

  if (!panelSet) {
    logPackageDebug('Skipping package generation: no panel product exists');
    return [];
  }

  const inverterBrandGroups = [...inverters
    .filter((product) => getProductKw(product) > 0 && normalizeBrand(getProductBrandName(product)))
    .reduce((groups, product) => {
      const productBrand = getProductBrandName(product);
      const packageBrand = displayBrandName(productBrand);
      const key = normalizeBrand(productBrand).replace(/\s+/g, '');
      const current = groups.get(key) ?? { packageBrand, aliases: [] as string[] };
      if (!current.aliases.includes(productBrand)) current.aliases.push(productBrand);
      groups.set(key, current);
      return groups;
    }, new Map<string, { packageBrand: string; aliases: string[] }>())
    .values()];
  logPackageDebug('PACKAGE DEBUG inverter brands found:', inverterBrandGroups.map((group) => ({
    packageBrand: group.packageBrand,
    aliases: group.aliases
  })));

  const panelUnitPrice = getPanelUnitPrice(panelSet.product);
  const panelTotalPrice = panelUnitPrice == null ? null : panelUnitPrice * panelSet.quantity;

  const generatedPackages: RecommendedPackage[] = [];

  inverterBrandGroups.forEach(({ packageBrand, aliases }) => {
    const isGoodwePackage = normalizeBrandName(packageBrand) === 'goodwe' ||
      aliases.some((alias) => normalizeBrandName(alias) === 'goodwe');
    const isSolisPackage = normalizeBrandName(packageBrand) === 'solis' ||
      aliases.some((alias) => normalizeBrandName(alias) === 'solis');
    let goodweSkipReason = '';
    let solisSkipReason = '';
    const brandInverters = inverters
      .filter((product) => brandMatches(getProductBrandName(product), aliases))
      .map((product) => ({
        id: product.id,
        name: product.name,
        brand: getProductBrandName(product),
        normalizedBrand: normalizeBrandName(getProductBrandName(product)),
        sizeKw: getProductKw(product),
        category: product.rawCategory ?? product.category
      }));
    logPackageDebug('Checking brand:', normalizeBrand(packageBrand) || packageBrand);
    logPackageDebug('Required inverter:', requiredInverterKw);
    logPackageDebug('Brand inverters:', brandInverters);
    const inverter = findBestInverter(requiredInverterKw, aliases, inverters);
    if (!inverter) {
      const minimumAllowedInverterKw = requiredInverterKw * 0.90;
      const largestDetectedInverter = [...brandInverters]
        .filter((item) => item.sizeKw > 0)
        .sort((a, b) => b.sizeKw - a.sizeKw)[0];
      if (largestDetectedInverter && largestDetectedInverter.sizeKw < minimumAllowedInverterKw) {
        goodweSkipReason = `${largestDetectedInverter.sizeKw}kW inverter is too small for required ${requiredInverterKw}kW system`;
        solisSkipReason = goodweSkipReason;
        logPackageDebug(`Skipping ${packageBrand}: ${largestDetectedInverter.sizeKw}kW inverter is too small for required ${requiredInverterKw}kW system`);
        logPackageDebug('Package created/skipped:', normalizeBrand(packageBrand), 'skipped - inverter too small');
      } else {
        goodweSkipReason = 'no inverter found';
        solisSkipReason = brandInverters.length === 0 ? 'no Solis inverter detected' : 'Solis inverter size not parsed';
        logPackageDebug(`Skipping ${packageBrand}: no inverter found`);
        logPackageDebug('Package created/skipped:', normalizeBrand(packageBrand), 'skipped - no inverter found');
      }
      if (isGoodwePackage) {
        logPackageDebug('GOODWE DEBUG selected inverter:', null);
        logPackageDebug('GOODWE DEBUG selected battery:', null);
        logPackageDebug('GOODWE DEBUG skip reason:', goodweSkipReason);
      }
      if (isSolisPackage) {
        logPackageDebug('SOLIS DEBUG selected inverter:', null);
        logPackageDebug('SOLIS DEBUG selected battery:', null);
        logPackageDebug('SOLIS DEBUG skip reason:', solisSkipReason);
      }
      return;
    }
    if (getProductKw(inverter.product) <= 0) {
      goodweSkipReason = 'no inverter size detected';
      solisSkipReason = 'Solis inverter size not parsed';
      logPackageDebug(`Skipping ${packageBrand}: no inverter size detected`);
      logPackageDebug('Package created/skipped:', normalizeBrand(packageBrand), 'skipped - no inverter size detected');
      if (isGoodwePackage) {
        logPackageDebug('GOODWE DEBUG selected inverter:', inverter);
        logPackageDebug('GOODWE DEBUG selected battery:', null);
        logPackageDebug('GOODWE DEBUG skip reason:', goodweSkipReason);
      }
      if (isSolisPackage) {
        logPackageDebug('SOLIS DEBUG selected inverter:', inverter);
        logPackageDebug('SOLIS DEBUG selected battery:', null);
        logPackageDebug('SOLIS DEBUG skip reason:', solisSkipReason);
      }
      return;
    }
    logPackageDebug(`Selected inverter for ${normalizeBrand(packageBrand) || packageBrand}:`, {
      id: inverter.product.id,
      name: inverter.product.name,
      brand: getProductBrandName(inverter.product),
      normalizedBrand: normalizeBrandName(getProductBrandName(inverter.product)),
      sizeKw: inverter.size
    });

    const allowedBatteryBrands = compatibleBatteryBrandsFor(inverter.product, batteries, compatibilityRules);
    const compatibleBatteries = batteries.filter((batteryProduct) =>
      brandMatches(getProductBrandName(batteryProduct), allowedBatteryBrands) &&
      getProductKwh(batteryProduct) > 0
    );
    logPackageDebug('Required battery:', requiredBatteryKwh);
    logPackageDebug(`Compatible batteries for ${normalizeBrand(packageBrand) || packageBrand}:`, compatibleBatteries.map((batteryProduct) => ({
      id: batteryProduct.id,
      name: batteryProduct.name,
      brand: getProductBrandName(batteryProduct),
      normalizedBrand: normalizeBrandName(getProductBrandName(batteryProduct)),
      sizeKwh: getProductKwh(batteryProduct),
      category: batteryProduct.rawCategory ?? batteryProduct.category
    })));
    if (isSolisPackage) {
      logPackageDebug('SOLIS DEBUG compatible batteries:', compatibleBatteries.map((batteryProduct) => ({
        name: batteryProduct.name,
        brand: getProductBrandName(batteryProduct),
        normalizedBrand: normalizeBrandName(getProductBrandName(batteryProduct)),
        category: batteryProduct.category,
        sizeKwh: extractBatterySizeKwh(batteryProduct),
        price: batteryProduct.price,
        stock: batteryProduct.stockStatus,
        status: batteryProduct.stockStatus,
        specifications: batteryProduct.specifications,
      })));
    }
    const battery = findBestBattery(requiredBatteryKwh, allowedBatteryBrands, batteries);
    if (!battery) {
      const reason = compatibleBatteries.length === 0 ? 'no compatible battery found' : 'no battery size detected';
      goodweSkipReason = reason;
      solisSkipReason = compatibleBatteries.length === 0 ? 'no compatible battery found' : 'battery size not parsed';
      logPackageDebug(`Skipping ${packageBrand}: ${reason}`);
      logPackageDebug('Package created/skipped:', normalizeBrand(packageBrand), `skipped - ${reason}`);
      if (isGoodwePackage) {
        logPackageDebug('GOODWE DEBUG selected inverter:', inverter);
        logPackageDebug('GOODWE DEBUG selected battery:', null);
        logPackageDebug('GOODWE DEBUG skip reason:', goodweSkipReason);
      }
      if (isSolisPackage) {
        logPackageDebug('SOLIS DEBUG selected inverter:', inverter);
        logPackageDebug('SOLIS DEBUG selected battery:', null);
        logPackageDebug('SOLIS DEBUG skip reason:', solisSkipReason);
      }
      return;
    }
    logPackageDebug(`Selected battery for ${normalizeBrand(packageBrand) || packageBrand}:`, {
      id: battery.product.id,
      name: battery.product.name,
      brand: getProductBrandName(battery.product),
      normalizedBrand: normalizeBrandName(getProductBrandName(battery.product)),
      sizeKwh: battery.size
    });

    const batteryQuantity = battery.size >= requiredBatteryKwh ? 1 : Math.max(1, Math.ceil(requiredBatteryKwh / battery.size));
    const totalBatteryKwh = batteryQuantity * battery.size;
    const inverterPrice = inverter.product.price ?? null;
    const batteryUnitPrice = battery.product.price ?? null;
    const batteryPrice = batteryUnitPrice == null ? null : batteryUnitPrice * batteryQuantity;
    const totalPrice = panelTotalPrice == null || inverterPrice == null || batteryPrice == null
      ? null
      : panelTotalPrice + inverterPrice + batteryPrice;
    const inverterDifference = Math.abs(inverter.size - requiredInverterKw);
    const batteryDifference = Math.abs(totalBatteryKwh - requiredBatteryKwh);
    const panelDifference = Math.abs(panelSet.actualPanelKw - requiredPanelKw);
    const lowerSizePenalty = (inverter.lowerThanRequired ? 2 : 0) + (battery.lowerThanRequired ? 1 : 0);
    const score = inverterDifference * 3 + batteryDifference * 2 + panelDifference + lowerSizePenalty;
    const batteryBrand = displayBrandName(getProductBrandName(battery.product));
    const title = packageTitle(packageBrand, batteryBrand);

    const generatedPackage = {
      id: `${normalizeBrand(packageBrand).replace(/\s+/g, '-')}-${inverter.product.id}-${battery.product.id}-${panelSet.product.id}`,
      brand: packageBrand,
      title,
      badge: '',
      badgeTone: 'blue' as PackageBadgeTone,
      packageName: title,
      packageBrand,
      batteryBrand,
      panel: panelSet.product,
      panelProduct: panelSet.product,
      inverter,
      inverterProduct: inverter.product,
      battery,
      batteryProduct: battery.product,
      panelQuantity: panelSet.quantity,
      actualPanelKw: panelSet.actualPanelKw,
      totalSolarKw: panelSet.actualPanelKw,
      inverterSizeKw: inverter.size,
      batterySizeKwh: battery.size,
      batteryQuantity,
      totalBatteryKwh,
      panelsPrice: panelTotalPrice,
      inverterPrice,
      batteryPrice,
      totalPrice,
      inverterWarranty: warrantyLabel(inverter.product),
      batteryWarranty: warrantyLabel(battery.product),
      image: inverter.product.image || battery.product.image || panelSet.product.image,
      compatibilityStatus: 'compatible' as const,
      notes: [
        `${panelSet.quantity} x ${Math.round(getProductWatt(panelSet.product))}W panels`,
        `${inverter.size} kW inverter`,
        `${batteryQuantity > 1 ? `${batteryQuantity} x ` : ''}${battery.size} kWh compatible battery`
      ],
      bestMatch: false,
      nearestAvailable: !inverter.exact || !battery.exact,
      hasLowerInverter: inverter.lowerThanRequired,
      outOfStock: isOutOfStock(inverter.product) || isOutOfStock(battery.product) || isOutOfStock(panelSet.product),
      score
    };
    generatedPackages.push(generatedPackage);
    logPackageDebug(`Created ${packageBrand} package`);
    logPackageDebug('Package created/skipped:', normalizeBrand(packageBrand), 'created');
    if (isGoodwePackage) {
      logPackageDebug('GOODWE DEBUG selected inverter:', inverter);
      logPackageDebug('GOODWE DEBUG selected battery:', battery);
      logPackageDebug('GOODWE DEBUG skip reason:', '');
    }
    if (isSolisPackage) {
      logPackageDebug('SOLIS DEBUG selected inverter:', inverter);
      logPackageDebug('SOLIS DEBUG selected battery:', battery);
      logPackageDebug('SOLIS DEBUG skip reason:', '');
    }
  });

  const packages = generatedPackages.sort((a, b) =>
    a.score - b.score ||
    (a.totalPrice ?? Number.MAX_SAFE_INTEGER) - (b.totalPrice ?? Number.MAX_SAFE_INTEGER) ||
    (warrantyYears(b.inverter.product) + warrantyYears(b.battery.product)) -
      (warrantyYears(a.inverter.product) + warrantyYears(a.battery.product))
  );
  logPackageDebug('Generated packages:', generatedPackages);

  if (packages.length === 0) return [];

  const lowestPricedId = [...packages]
    .filter((item) => item.totalPrice != null)
    .sort((a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0))[0]?.id;
  const bestWarrantyId = [...packages]
    .sort((a, b) =>
      (warrantyYears(b.inverter.product) + warrantyYears(b.battery.product)) -
      (warrantyYears(a.inverter.product) + warrantyYears(a.battery.product))
    )[0]?.id;

  return packages.map((item, index) => {
    let badge = 'High Performance';
    let badgeTone: PackageBadgeTone = 'blue';
    if (index === 0) {
      badge = 'Most Balanced';
      badgeTone = 'gold';
    } else if (item.id === lowestPricedId) {
      badge = 'Best Value';
      badgeTone = 'gold';
    } else if (item.id === bestWarrantyId) {
      badge = 'Best Warranty';
      badgeTone = 'purple';
    }
    return { ...item, bestMatch: index === 0, badge, badgeTone };
  });
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
