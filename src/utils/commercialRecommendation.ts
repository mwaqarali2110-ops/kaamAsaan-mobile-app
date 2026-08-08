import type { Appliance } from '@/types/system.types';
import type { Product } from '@/types/product.types';
import {
  DEFAULT_BATTERY_SAFETY_MARGIN_PERCENT,
  calculateBackupRequirementSummary,
  type BackupRequirementSummary,
} from '@/utils/calculations';
import { getBatteryCapacityKwh, isBatteryCatalogProduct } from '@/utils/batteryRecommendation';
import {
  getPanelUnitPrice,
  getProductBrandName,
  getProductKw,
  isInverterProduct,
  isOutOfStock,
  isPanelProduct,
  parsePanelWattage,
} from '@/utils/packageBuilder';
import {
  COMMERCIAL_V1_DEFAULT_DISCLAIMER,
  COMMERCIAL_V1_DEFAULT_USABLE_FACTOR,
} from '@/utils/recommendationDefaults';
import {
  createRecommendedCapacityShortlist,
  DEFAULT_ACCEPTABLE_BATTERY_SHORTFALL_PERCENT,
  DEFAULT_RECOMMENDED_CAPACITY_WINDOW_PERCENT,
  isFiveKwhCommercialClass,
  resolveAllowedBatteryQuantity,
} from '@/utils/batteryCommercialRules';

export const PRELIMINARY_RECOMMENDATION_DISCLAIMER =
  COMMERCIAL_V1_DEFAULT_DISCLAIMER;
export const EXPERT_REVIEW_MESSAGE = 'Your requirement needs a customized system review.';
export const BATTERY_RECOMMENDATION_ENGINE_VERSION = 5;

export type CommercialRecommendationSettings = {
  batteryUsableFactor: number;
  batterySafetyMarginPercent: number;
  acceptableBatteryShortfallPercent: number;
  extendedBackupStepPercent: number;
  minimumBudgetCoveragePercent: number;
  expertReviewBatteryThresholdKwh: number;
  preliminaryRecommendationDisclaimer: string;
  configuredInstallationCost: number;
  configuredStructureCost: number;
  configuredAccessoriesCost: number;
};

export type LoadSizingRule = {
  id: string;
  minRunningLoadKw: number;
  maxRunningLoadKw: number | null;
  baseInverterKw: number | null;
  basePvKwp: number | null;
  requiresExpertReview: boolean;
  label: string;
  priority: number;
};

export type BatteryUpliftRule = {
  id: string;
  minBatteryBankKwh: number;
  maxBatteryBankKwh: number | null;
  minimumInverterKw: number | null;
  minimumPvKwp: number | null;
  requiresExpertReview: boolean;
  label: string;
  priority: number;
};

export type CommercialRecommendationConfiguration = {
  settings: CommercialRecommendationSettings;
  loadSizingRules: LoadSizingRule[];
  batteryUpliftRules: BatteryUpliftRule[];
  source: 'supabase' | 'fallback';
};

export const DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION: CommercialRecommendationConfiguration = {
  settings: {
    batteryUsableFactor: COMMERCIAL_V1_DEFAULT_USABLE_FACTOR,
    batterySafetyMarginPercent: DEFAULT_BATTERY_SAFETY_MARGIN_PERCENT,
    acceptableBatteryShortfallPercent: DEFAULT_ACCEPTABLE_BATTERY_SHORTFALL_PERCENT,
    extendedBackupStepPercent: 15,
    minimumBudgetCoveragePercent: 75,
    expertReviewBatteryThresholdKwh: 32,
    preliminaryRecommendationDisclaimer: PRELIMINARY_RECOMMENDATION_DISCLAIMER,
    configuredInstallationCost: 0,
    configuredStructureCost: 0,
    configuredAccessoriesCost: 0,
  },
  loadSizingRules: [
    { id: 'load-0-3', minRunningLoadKw: 0, maxRunningLoadKw: 3, baseInverterKw: 5, basePvKwp: 6, requiresExpertReview: false, label: 'Up to 3 kW running load', priority: 10 },
    { id: 'load-3-5', minRunningLoadKw: 3, maxRunningLoadKw: 5, baseInverterKw: 6, basePvKwp: 8, requiresExpertReview: false, label: 'Above 3 to 5 kW running load', priority: 20 },
    { id: 'load-5-8', minRunningLoadKw: 5, maxRunningLoadKw: 8, baseInverterKw: 10, basePvKwp: 12, requiresExpertReview: false, label: 'Above 5 to 8 kW running load', priority: 30 },
    { id: 'load-8-10', minRunningLoadKw: 8, maxRunningLoadKw: 10, baseInverterKw: 12, basePvKwp: 15, requiresExpertReview: false, label: 'Above 8 to 10 kW running load', priority: 40 },
    { id: 'load-over-10', minRunningLoadKw: 10, maxRunningLoadKw: null, baseInverterKw: null, basePvKwp: null, requiresExpertReview: true, label: 'Above 10 kW — Expert Review', priority: 50 },
  ],
  batteryUpliftRules: [
    { id: 'battery-0-16', minBatteryBankKwh: 0, maxBatteryBankKwh: 16, minimumInverterKw: 6, minimumPvKwp: 8, requiresExpertReview: false, label: 'Up to 16 kWh battery bank', priority: 10 },
    { id: 'battery-16-24', minBatteryBankKwh: 16, maxBatteryBankKwh: 24, minimumInverterKw: 8, minimumPvKwp: 10, requiresExpertReview: false, label: 'Above 16 to 24 kWh battery bank', priority: 20 },
    { id: 'battery-24-32', minBatteryBankKwh: 24, maxBatteryBankKwh: 32, minimumInverterKw: 12, minimumPvKwp: 15, requiresExpertReview: false, label: 'Above 24 to 32 kWh battery bank', priority: 30 },
    { id: 'battery-over-32', minBatteryBankKwh: 32, maxBatteryBankKwh: null, minimumInverterKw: null, minimumPvKwp: null, requiresExpertReview: true, label: 'Above 32 kWh — Expert Review', priority: 40 },
  ],
  source: 'fallback',
};

export type CommercialBatteryTier = 'loadManaged' | 'recommended' | 'extended';

export type BatteryTierCandidatePools = Record<CommercialBatteryTier, CommercialBatteryBank[]>;

export type BatteryProductAssessment = {
  productId: string;
  name: string;
  brand: string;
  active: boolean;
  published: boolean;
  stockStatus: string | null;
  normalizedCapacityKwh: number | null;
  voltageClass: Product['voltageClass'];
  supportsParallel: boolean;
  maximumParallelQuantity: number;
  eligible: boolean;
  exclusionReasons: string[];
  limitations: string[];
};

export type CommercialBatteryBank = {
  id: string;
  tier?: CommercialBatteryTier;
  product: Product;
  batteryProductId: string;
  brand: string;
  model: string;
  voltageClass: 'LV' | 'HV';
  quantity: number;
  unitCapacityKwh: number;
  batteryBankCapacityKwh: number;
  applicableUsableFactor: number;
  batteryUsableEnergyKwh: number;
  requiredBackupEnergyKwh: number;
  coveragePercent: number;
  shortfallKwh: number;
  headroomKwh: number;
  totalPrice: number | null;
  coversRequirement: boolean;
  statusLabel?: string;
};

export type CommercialSystemTargets = {
  loadSizingRule: LoadSizingRule | null;
  batteryUpliftRule: BatteryUpliftRule | null;
  targetInverterKw: number | null;
  targetPvKwp: number | null;
  requiresExpertReview: boolean;
  expertReviewReasons: string[];
};

export type SolarPanelConfiguration = {
  product: Product;
  panelProductId: string;
  panelWattage: number;
  panelCount: number;
  targetPvKwp: number;
  actualPvKwp: number;
  panelCost: number | null;
};

export type CommercialRecommendationInput = {
  appliances: Appliance[];
  products: Product[];
  phase?: 'single' | 'three' | null;
  selectedPanelWattage?: number | null;
  configuration?: CommercialRecommendationConfiguration;
};

export type RecommendationResult = {
  strategy: 'commercial-rules-v1';
  backupRequirement: BackupRequirementSummary;
  runningLoadKw: number;
  requiredBackupEnergyKwh: number;
  safetyMarginPercent: number;
  safetyMarginEnergyKwh: number;
  batteryTargetKwh: number;
  /** @deprecated Use batteryTargetKwh. */
  saferBatteryTargetKwh: number;
  batteryTiers: Partial<Record<CommercialBatteryTier, CommercialBatteryBank>>;
  recommendedBatteryBank: CommercialBatteryBank | null;
  systemTargets: CommercialSystemTargets;
  panelConfiguration: SolarPanelConfiguration | null;
  isPreliminary: true;
  disclaimer: string;
  requiresExpertReview: boolean;
  expertReviewReasons: string[];
};

export interface SystemRecommendationStrategy {
  recommend(input: CommercialRecommendationInput): RecommendationResult;
}

const round = (value: number, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const finitePositive = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeUsableFactor = (value: unknown, fallback: number) => {
  const parsed = finitePositive(value);
  return parsed != null && parsed <= 1 ? parsed : fallback;
};

const productIsCatalogAvailable = (product: Product) =>
  product.isActive !== false &&
  product.isVisible !== false &&
  !isOutOfStock(product);

const productIsPackageComponentAvailable = (product: Product) =>
  productIsCatalogAvailable(product) && product.packageEligible !== false;

export const calculateBackupRequirement = (
  appliances: Appliance[],
  safetyMarginPercent = 0,
) => calculateBackupRequirementSummary(appliances, safetyMarginPercent);

export const normalizeBatteryProduct = (
  product: Product,
  settings: CommercialRecommendationSettings,
) => {
  if (!isBatteryCatalogProduct(product)) return null;
  const unitCapacityKwh = getBatteryCapacityKwh(product);
  if (unitCapacityKwh <= 0) return null;
  const voltageClass = product.voltageClass;
  if (voltageClass !== 'LV' && voltageClass !== 'HV') return null;
  const configuredUsableFactor = product.usableFactorOverride ??
    (finitePositive(product.usableCapacityKwh) != null
      ? Number(product.usableCapacityKwh) / unitCapacityKwh
      : null);
  const applicableUsableFactor = normalizeUsableFactor(
    configuredUsableFactor,
    settings.batteryUsableFactor,
  );
  const supportsParallel = product.parallelSupported === true;
  const configuredParallelMaximum = finitePositive(
    product.maxParallelModules ?? product.maxParallelUnits,
  );
  const configuredCommercialMaximum = finitePositive(
    product.commercialMaxParallelModules ??
    product.specifications?.commercial_max_parallel_modules ??
    product.specifications?.commercialMaximumParallelModules,
  );
  const maximumParallelQuantity = resolveAllowedBatteryQuantity({
    unitCapacityKwh,
    parallelSupported: supportsParallel,
    technicalMaximumParallelModules: configuredParallelMaximum,
    commercialMaximumParallelModules: configuredCommercialMaximum,
  });
  return { unitCapacityKwh, voltageClass, applicableUsableFactor, supportsParallel, maximumParallelQuantity };
};

export const assessBatteryProduct = (
  product: Product,
  settings: CommercialRecommendationSettings,
): BatteryProductAssessment => {
  const exclusionReasons: string[] = [];
  const limitations: string[] = [];
  if (product.isActive === false) exclusionReasons.push('inactive');
  if (product.isVisible === false) exclusionReasons.push('unpublished');
  if (isOutOfStock(product)) exclusionReasons.push('out_of_stock');

  const normalized = normalizeBatteryProduct(product, settings);
  const normalizedCapacityKwh = getBatteryCapacityKwh(product) || null;
  if (!normalizedCapacityKwh) {
    exclusionReasons.push(product.batteryCapacityIssue
      ? `invalid_capacity: ${product.batteryCapacityIssue}`
      : 'invalid_capacity');
  }
  if (product.voltageClass !== 'LV' && product.voltageClass !== 'HV') {
    exclusionReasons.push('missing_voltage_class');
  }
  if (
    product.parallelSupported === true &&
    finitePositive(product.maxParallelModules ?? product.maxParallelUnits) == null
  ) {
    limitations.push('parallel_limit_missing: capped_at_1');
  }
  if (
    normalized &&
    isFiveKwhCommercialClass(normalized.unitCapacityKwh) &&
    Number(product.maxParallelModules ?? product.maxParallelUnits) > normalized.maximumParallelQuantity
  ) {
    limitations.push(`five_kwh_commercial_limit: capped_at_${normalized.maximumParallelQuantity}`);
  }

  return {
    productId: product.id,
    name: product.name,
    brand: getProductBrandName(product),
    active: product.isActive !== false,
    published: product.isVisible !== false,
    stockStatus: product.stockStatus ?? null,
    normalizedCapacityKwh,
    voltageClass: product.voltageClass,
    supportsParallel: normalized?.supportsParallel ?? product.parallelSupported === true,
    maximumParallelQuantity: normalized?.maximumParallelQuantity ?? 1,
    eligible: exclusionReasons.length === 0 && normalized != null,
    exclusionReasons,
    limitations,
  };
};

export const calculateBatteryCoverage = ({
  product,
  quantity,
  requiredBackupEnergyKwh,
  settings,
}: {
  product: Product;
  quantity: number;
  requiredBackupEnergyKwh: number;
  settings: CommercialRecommendationSettings;
}): CommercialBatteryBank | null => {
  const normalized = normalizeBatteryProduct(product, settings);
  if (!normalized || quantity < 1 || quantity > normalized.maximumParallelQuantity) return null;
  if (quantity > 1 && !normalized.supportsParallel) return null;
  const batteryBankCapacityKwh = normalized.unitCapacityKwh * quantity;
  const batteryUsableEnergyKwh = batteryBankCapacityKwh * normalized.applicableUsableFactor;
  const coveragePercent = requiredBackupEnergyKwh > 0
    ? (batteryUsableEnergyKwh / requiredBackupEnergyKwh) * 100
    : 100;
  const shortfallKwh = Math.max(requiredBackupEnergyKwh - batteryUsableEnergyKwh, 0);
  const headroomKwh = Math.max(batteryUsableEnergyKwh - requiredBackupEnergyKwh, 0);
  return {
    id: `${product.id}-x${quantity}`,
    product,
    batteryProductId: product.id,
    brand: getProductBrandName(product),
    model: product.model || product.name,
    voltageClass: normalized.voltageClass,
    quantity,
    unitCapacityKwh: normalized.unitCapacityKwh,
    batteryBankCapacityKwh: round(batteryBankCapacityKwh, 3),
    applicableUsableFactor: normalized.applicableUsableFactor,
    batteryUsableEnergyKwh: round(batteryUsableEnergyKwh, 3),
    requiredBackupEnergyKwh: round(requiredBackupEnergyKwh, 3),
    coveragePercent: round(coveragePercent, 1),
    shortfallKwh: round(shortfallKwh, 3),
    headroomKwh: round(headroomKwh, 3),
    totalPrice: product.price == null ? null : round(product.price * quantity),
    coversRequirement: shortfallKwh <= 0.0001,
  };
};

export const generateBatteryCombinations = (
  products: Product[],
  requiredBackupEnergyKwh: number,
  settings: CommercialRecommendationSettings,
) => products
  .filter((product) => productIsCatalogAvailable(product) && isBatteryCatalogProduct(product))
  .flatMap((product) => {
    const normalized = normalizeBatteryProduct(product, settings);
    if (!normalized) return [];

    // A single battery is never a parallel bank. Generate it first even when
    // the product does not support parallel operation or is capped at one.
    const singleUnitCandidate = calculateBatteryCoverage({
      product,
      quantity: 1,
      requiredBackupEnergyKwh,
      settings,
    });
    const parallelCandidates = normalized.supportsParallel
      ? Array.from(
        { length: Math.max(0, normalized.maximumParallelQuantity - 1) },
        (_, index) => calculateBatteryCoverage({
          product,
          quantity: index + 2,
          requiredBackupEnergyKwh,
          settings,
        })
      )
      : [];

    return [singleUnitCandidate, ...parallelCandidates]
      .filter((candidate): candidate is CommercialBatteryBank => Boolean(candidate));
  })
  .sort((left, right) =>
    left.quantity - right.quantity ||
    left.batteryBankCapacityKwh - right.batteryBankCapacityKwh ||
    Number(left.product.stockStatus === 'on_request') - Number(right.product.stockStatus === 'on_request') ||
    (left.totalPrice ?? Number.MAX_SAFE_INTEGER) - (right.totalPrice ?? Number.MAX_SAFE_INTEGER) ||
    left.id.localeCompare(right.id)
  );

const candidatePrice = (candidate: CommercialBatteryBank) => candidate.totalPrice ?? Number.MAX_SAFE_INTEGER;
const availabilityPriority = (candidate: CommercialBatteryBank) =>
  candidate.product.stockStatus === 'on_request' ? 1 : 0;
const packagePriority = (candidate: CommercialBatteryBank) =>
  Number(candidate.product.priority ?? candidate.product.brandPriority ?? 0) || 0;
const stableCandidateIdTieBreak = (left: CommercialBatteryBank, right: CommercialBatteryBank) =>
  left.batteryProductId.localeCompare(right.batteryProductId) ||
  left.id.localeCompare(right.id);

const normalizedShortfallTolerance = (settings: CommercialRecommendationSettings) => {
  const configured = Number(settings.acceptableBatteryShortfallPercent);
  return Number.isFinite(configured)
    ? Math.min(100, Math.max(0, configured))
    : DEFAULT_ACCEPTABLE_BATTERY_SHORTFALL_PERCENT;
};

export const rankBatteryTierCandidates = (
  candidates: CommercialBatteryBank[],
  requiredBackupEnergyKwh: number,
  batteryTargetKwh: number,
  settings: CommercialRecommendationSettings,
): BatteryTierCandidatePools => {
  const recommendedShortlist = createRecommendedCapacityShortlist(
    candidates,
    (candidate) => candidate.batteryBankCapacityKwh,
    batteryTargetKwh,
  );
  const recommended = [...recommendedShortlist.practicalShortlist]
    .sort((left, right) =>
      left.quantity - right.quantity ||
      (left.batteryBankCapacityKwh - batteryTargetKwh) - (right.batteryBankCapacityKwh - batteryTargetKwh) ||
      candidatePrice(left) - candidatePrice(right) ||
      availabilityPriority(left) - availabilityPriority(right) ||
      packagePriority(right) - packagePriority(left) ||
      stableCandidateIdTieBreak(left, right)
    );
  const acceptableShortfallPercent = normalizedShortfallTolerance(settings);
  const loadManaged = [...candidates]
    .filter((candidate) =>
      candidate.batteryBankCapacityKwh >= requiredBackupEnergyKwh &&
      candidate.batteryBankCapacityKwh < batteryTargetKwh &&
      batteryTargetKwh > 0 &&
      ((batteryTargetKwh - candidate.batteryBankCapacityKwh) / batteryTargetKwh) * 100 <= acceptableShortfallPercent
    )
    .sort((left, right) =>
      left.quantity - right.quantity ||
      (batteryTargetKwh - left.batteryBankCapacityKwh) - (batteryTargetKwh - right.batteryBankCapacityKwh) ||
      candidatePrice(left) - candidatePrice(right) ||
      stableCandidateIdTieBreak(left, right)
    );
  const recommendedCapacityKwh = recommended[0]?.batteryBankCapacityKwh;
  const extended = recommendedCapacityKwh == null
    ? []
    : [...candidates]
    .filter((candidate) => candidate.batteryBankCapacityKwh > recommendedCapacityKwh)
    .sort((left, right) =>
      left.quantity - right.quantity ||
      (left.batteryBankCapacityKwh - recommendedCapacityKwh) - (right.batteryBankCapacityKwh - recommendedCapacityKwh) ||
      candidatePrice(left) - candidatePrice(right) ||
      stableCandidateIdTieBreak(left, right)
    );
  return { loadManaged, recommended, extended };
};

const selectRankedBatteryTiers = (
  ranked: BatteryTierCandidatePools,
): Partial<Record<CommercialBatteryTier, CommercialBatteryBank>> => {
  const loadManaged = ranked.loadManaged[0];
  const recommended = ranked.recommended[0];
  const extended = ranked.extended[0];
  return {
    ...(loadManaged ? { loadManaged: { ...loadManaged, tier: 'loadManaged' as const, coversRequirement: false, statusLabel: 'Close to your requirement — minor load management may be required' } } : {}),
    ...(recommended ? { recommended: { ...recommended, tier: 'recommended' as const, coversRequirement: true, statusLabel: 'Covers your requirement with safety margin' } } : {}),
    ...(extended ? { extended: { ...extended, tier: 'extended' as const, coversRequirement: true, statusLabel: 'Additional backup reserve' } } : {}),
  };
};

export const selectBatteryTiers = (
  candidates: CommercialBatteryBank[],
  requiredBackupEnergyKwh: number,
  batteryTargetKwh: number,
  settings: CommercialRecommendationSettings,
): Partial<Record<CommercialBatteryTier, CommercialBatteryBank>> =>
  selectRankedBatteryTiers(rankBatteryTierCandidates(
    candidates,
    requiredBackupEnergyKwh,
    batteryTargetKwh,
    settings,
  ));

const ruleMatches = (value: number, minimum: number, maximum: number | null) =>
  (minimum === 0 ? value >= minimum : value > minimum) && (maximum == null || value <= maximum);

export const findLoadSizingRule = (runningLoadKw: number, rules: LoadSizingRule[]) =>
  [...rules]
    .sort((left, right) => left.priority - right.priority || left.minRunningLoadKw - right.minRunningLoadKw)
    .find((rule) => ruleMatches(runningLoadKw, rule.minRunningLoadKw, rule.maxRunningLoadKw)) ?? null;

export const findBatteryUpliftRule = (batteryBankCapacityKwh: number, rules: BatteryUpliftRule[]) =>
  [...rules]
    .sort((left, right) => left.priority - right.priority || left.minBatteryBankKwh - right.minBatteryBankKwh)
    .find((rule) => ruleMatches(batteryBankCapacityKwh, rule.minBatteryBankKwh, rule.maxBatteryBankKwh)) ?? null;

export const calculateCommercialSystemTargets = ({
  runningLoadKw,
  batteryBankCapacityKwh,
  configuration,
}: {
  runningLoadKw: number;
  batteryBankCapacityKwh: number;
  configuration: CommercialRecommendationConfiguration;
}): CommercialSystemTargets => {
  const loadSizingRule = findLoadSizingRule(runningLoadKw, configuration.loadSizingRules);
  const batteryUpliftRule = findBatteryUpliftRule(batteryBankCapacityKwh, configuration.batteryUpliftRules);
  const expertReviewReasons: string[] = [];
  if (!loadSizingRule) expertReviewReasons.push('No configured load-sizing rule matches the running load.');
  else if (loadSizingRule.requiresExpertReview) expertReviewReasons.push(loadSizingRule.label);
  if (!batteryUpliftRule) expertReviewReasons.push('No configured battery-uplift rule matches the battery bank.');
  else if (batteryUpliftRule.requiresExpertReview) expertReviewReasons.push(batteryUpliftRule.label);
  if (batteryBankCapacityKwh > configuration.settings.expertReviewBatteryThresholdKwh) {
    expertReviewReasons.push(`Battery bank exceeds ${configuration.settings.expertReviewBatteryThresholdKwh} kWh.`);
  }
  const targetInverterKw = loadSizingRule?.baseInverterKw != null && batteryUpliftRule?.minimumInverterKw != null
    ? Math.max(loadSizingRule.baseInverterKw, batteryUpliftRule.minimumInverterKw)
    : null;
  const targetPvKwp = loadSizingRule?.basePvKwp != null && batteryUpliftRule?.minimumPvKwp != null
    ? Math.max(loadSizingRule.basePvKwp, batteryUpliftRule.minimumPvKwp)
    : null;
  return {
    loadSizingRule,
    batteryUpliftRule,
    targetInverterKw,
    targetPvKwp,
    requiresExpertReview: expertReviewReasons.length > 0 || targetInverterKw == null || targetPvKwp == null,
    expertReviewReasons,
  };
};

export const selectCompatibleInverter = ({
  products,
  targetInverterKw,
  targetPvKwp,
  phase,
  batteryBank,
  brandId,
}: {
  products: Product[];
  targetInverterKw: number;
  targetPvKwp: number;
  phase?: 'single' | 'three' | null;
  batteryBank: CommercialBatteryBank;
  brandId?: string;
}) => products
  .filter((product) => productIsPackageComponentAvailable(product) && isInverterProduct(product))
  .filter((product) => !brandId || product.brandId === brandId)
  .filter((product) => !phase || product.phase === phase)
  .filter((product) => product.voltageClass === batteryBank.voltageClass)
  .filter((product) => getProductKw(product) >= targetInverterKw)
  .filter((product) => product.maximumRecommendedPvKwp == null || product.maximumRecommendedPvKwp >= targetPvKwp)
  .filter((product) => {
    const allowedBatteryBrands = product.compatibleBatteryBrandIds ?? [];
    if (allowedBatteryBrands.length > 0) return allowedBatteryBrands.includes(batteryBank.product.brandId ?? '');
    const inverterGroups = new Set(product.compatibilityGroups ?? []);
    return (batteryBank.product.compatibilityGroups ?? []).some((group) => inverterGroups.has(group)) ||
      (product.sameBrandCompatibilityEnabled !== false && product.brandId === batteryBank.product.brandId);
  })
  .sort((left, right) =>
    getProductKw(left) - getProductKw(right) ||
    (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER) ||
    left.id.localeCompare(right.id)
  )[0] ?? null;

export const selectSolarPanelConfiguration = ({
  products,
  targetPvKwp,
  selectedPanelWattage,
}: {
  products: Product[];
  targetPvKwp: number;
  selectedPanelWattage?: number | null;
}): SolarPanelConfiguration | null => {
  const candidates = products
  .filter((product) => productIsPackageComponentAvailable(product) && isPanelProduct(product))
    .map((product) => {
      const panelWattage = parsePanelWattage(product);
      if (panelWattage <= 0) return null;
      const panelCount = Math.ceil((targetPvKwp * 1000) / panelWattage);
      const actualPvKwp = (panelCount * panelWattage) / 1000;
      const unitPrice = getPanelUnitPrice(product);
      return {
        product,
        panelProductId: product.id,
        panelWattage,
        panelCount,
        targetPvKwp,
        actualPvKwp: round(actualPvKwp, 3),
        panelCost: unitPrice == null ? null : round(unitPrice * panelCount),
        selected: selectedPanelWattage === panelWattage,
        oversize: actualPvKwp - targetPvKwp,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((left, right) =>
      Number(right.selected) - Number(left.selected) ||
      left.oversize - right.oversize ||
      (left.panelCost ?? Number.MAX_SAFE_INTEGER) - (right.panelCost ?? Number.MAX_SAFE_INTEGER) ||
      left.product.id.localeCompare(right.product.id)
    );
  if (!candidates[0]) return null;
  const { selected: _selected, oversize: _oversize, ...result } = candidates[0];
  return result;
};

let lastBatteryDiagnosticFingerprint = '';

const candidateDiagnostic = (
  candidate: CommercialBatteryBank,
  comparisonKwh: number,
) => {
  const shortfallKwh = Math.max(comparisonKwh - candidate.batteryBankCapacityKwh, 0);
  return {
    productId: candidate.batteryProductId,
    name: candidate.product.name,
    bank: `${candidate.quantity} x ${candidate.unitCapacityKwh}`,
    quantity: candidate.quantity,
    unitCapacityKwh: candidate.unitCapacityKwh,
    totalCapacityKwh: candidate.batteryBankCapacityKwh,
    comparisonGapKwh: round(Math.abs(candidate.batteryBankCapacityKwh - comparisonKwh), 3),
    shortfallKwh: round(shortfallKwh, 3),
    shortfallPercent: comparisonKwh > 0 ? round((shortfallKwh / comparisonKwh) * 100, 2) : 0,
    excessCapacityKwh: round(Math.max(candidate.batteryBankCapacityKwh - comparisonKwh, 0), 3),
    totalPrice: candidate.totalPrice,
    availability: candidate.product.stockStatus ?? null,
  };
};

const logBatteryRecommendationDiagnostics = ({
  products,
  requiredBackupEnergyKwh,
  safetyMarginPercent,
  safetyMarginEnergyKwh,
  batteryTargetKwh,
  settings,
  candidates,
  ranked,
  selected,
}: {
  products: Product[];
  requiredBackupEnergyKwh: number;
  safetyMarginPercent: number;
  safetyMarginEnergyKwh: number;
  batteryTargetKwh: number;
  settings: CommercialRecommendationSettings;
  candidates: CommercialBatteryBank[];
  ranked: BatteryTierCandidatePools;
  selected: Partial<Record<CommercialBatteryTier, CommercialBatteryBank>>;
}) => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const batteryProducts = products.filter(isBatteryCatalogProduct);
  const assessments = batteryProducts.map((product) => assessBatteryProduct(product, settings));
  const fingerprint = JSON.stringify({
    requiredBackupEnergyKwh,
    safetyMarginPercent,
    batteryTargetKwh,
    products: assessments.map((assessment) => [
      assessment.productId,
      assessment.normalizedCapacityKwh,
      assessment.supportsParallel,
      assessment.maximumParallelQuantity,
      assessment.eligible,
    ]),
  });
  if (fingerprint === lastBatteryDiagnosticFingerprint) return;
  lastBatteryDiagnosticFingerprint = fingerprint;

  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Targets`, {
    requiredBackupEnergyKwh,
    safetyMarginPercent,
    safetyMarginEnergyKwh,
    batteryTargetKwh,
    acceptableBatteryShortfallPercent: normalizedShortfallTolerance(settings),
  });
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Fetched battery products`, assessments.map((assessment) => ({
    productId: assessment.productId,
    name: assessment.name,
    brand: assessment.brand,
    active: assessment.active,
    published: assessment.published,
    stockStatus: assessment.stockStatus,
  })));
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Excluded products`, assessments
    .filter((assessment) => !assessment.eligible)
    .map((assessment) => ({
      productId: assessment.productId,
      name: assessment.name,
      reasons: assessment.exclusionReasons,
    })));
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Eligible products`, assessments
    .filter((assessment) => assessment.eligible)
    .map((assessment) => ({
      productId: assessment.productId,
      name: assessment.name,
      capacityKwh: assessment.normalizedCapacityKwh,
      voltageClass: assessment.voltageClass,
      supportsParallel: assessment.supportsParallel,
      maximumParallelQuantity: assessment.maximumParallelQuantity,
      limitations: assessment.limitations,
    })));
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Generated combinations`, candidates.map((candidate) =>
    candidateDiagnostic(candidate, requiredBackupEnergyKwh)));
  const recommendedShortlist = createRecommendedCapacityShortlist(
    candidates,
    (candidate) => candidate.batteryBankCapacityKwh,
    batteryTargetKwh,
  );
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Recommended capacity shortlist`, {
    recommendedCapacityWindowPercent: DEFAULT_RECOMMENDED_CAPACITY_WINDOW_PERCENT,
    minimumQualifyingCapacityKwh: recommendedShortlist.minimumQualifyingCapacityKwh,
    shortlistMaximumCapacityKwh: recommendedShortlist.shortlistMaximumCapacityKwh,
    qualifyingCandidates: recommendedShortlist.qualifyingCandidates.map((candidate) =>
      candidateDiagnostic(candidate, batteryTargetKwh)),
  });
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Load-Managed candidates`, ranked.loadManaged.map((candidate) =>
    candidateDiagnostic(candidate, batteryTargetKwh)));
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Recommended candidates`, ranked.recommended.map((candidate) =>
    candidateDiagnostic(candidate, batteryTargetKwh)));
  const recommendedCapacityKwh = ranked.recommended[0]?.batteryBankCapacityKwh ?? batteryTargetKwh;
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Extended Backup candidates`, ranked.extended.map((candidate) =>
    candidateDiagnostic(candidate, recommendedCapacityKwh)));
  console.info(`[BatteryEngine:v${BATTERY_RECOMMENDATION_ENGINE_VERSION}] Selected tiers`, {
    loadManaged: selected.loadManaged ? candidateDiagnostic(selected.loadManaged, batteryTargetKwh) : null,
    recommended: selected.recommended ? candidateDiagnostic(selected.recommended, batteryTargetKwh) : null,
    extended: selected.extended ? candidateDiagnostic(selected.extended, selected.recommended?.batteryBankCapacityKwh ?? batteryTargetKwh) : null,
    recommendedReason: selected.recommended
      ? `within the ${DEFAULT_RECOMMENDED_CAPACITY_WINDOW_PERCENT}% practical-capacity shortlist, quantity ${selected.recommended.quantity} is the first recommended sort key`
      : 'No candidate meets the safety-margin target.',
  });
};

export class CommercialRuleRecommendationStrategy implements SystemRecommendationStrategy {
  recommend(input: CommercialRecommendationInput): RecommendationResult {
    const configuration = input.configuration ?? DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION;
    const configuredSafetyMarginPercent = Number(configuration.settings.batterySafetyMarginPercent);
    const safetyMarginPercent = Number.isFinite(configuredSafetyMarginPercent)
      ? Math.min(100, Math.max(0, configuredSafetyMarginPercent))
      : DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION.settings.batterySafetyMarginPercent;
    const backupRequirement = calculateBackupRequirement(input.appliances, safetyMarginPercent);
    const requiredBackupEnergyKwh = backupRequirement.baseRequiredEnergyKwh;
    const safetyMarginEnergyKwh = backupRequirement.safetyMarginEnergyKwh;
    // Keep this value unrounded for candidate eligibility and tier selection.
    const batteryTargetKwh = backupRequirement.totalRequiredEnergyKwh;
    const candidates = generateBatteryCombinations(input.products, requiredBackupEnergyKwh, configuration.settings);
    const rankedBatteryCandidates = rankBatteryTierCandidates(
      candidates,
      requiredBackupEnergyKwh,
      batteryTargetKwh,
      configuration.settings,
    );
    const batteryTiers = selectRankedBatteryTiers(rankedBatteryCandidates);
    logBatteryRecommendationDiagnostics({
      products: input.products,
      requiredBackupEnergyKwh,
      safetyMarginPercent,
      safetyMarginEnergyKwh,
      batteryTargetKwh,
      settings: configuration.settings,
      candidates,
      ranked: rankedBatteryCandidates,
      selected: batteryTiers,
    });
    const recommendedBatteryBank = batteryTiers.recommended ?? null;
    const missingRecommendedReason = requiredBackupEnergyKwh > 0 && !recommendedBatteryBank
      ? ['No valid battery combination covers the selected backup requirement.']
      : [];
    const systemTargets = recommendedBatteryBank
      ? calculateCommercialSystemTargets({
          runningLoadKw: backupRequirement.runningLoadKw,
          batteryBankCapacityKwh: recommendedBatteryBank.batteryBankCapacityKwh,
          configuration,
        })
      : {
          loadSizingRule: findLoadSizingRule(backupRequirement.runningLoadKw, configuration.loadSizingRules),
          batteryUpliftRule: null,
          targetInverterKw: null,
          targetPvKwp: null,
          requiresExpertReview: true,
          expertReviewReasons: missingRecommendedReason,
        };
    const panelConfiguration = systemTargets.targetPvKwp != null
      ? selectSolarPanelConfiguration({
          products: input.products,
          targetPvKwp: systemTargets.targetPvKwp,
          selectedPanelWattage: input.selectedPanelWattage,
        })
      : null;
    const expertReviewReasons = [
      ...missingRecommendedReason,
      ...systemTargets.expertReviewReasons,
      ...(systemTargets.targetPvKwp != null && !panelConfiguration ? ['No eligible solar-panel product has valid wattage information.'] : []),
    ];
    return {
      strategy: 'commercial-rules-v1',
      backupRequirement,
      runningLoadKw: backupRequirement.runningLoadKw,
      requiredBackupEnergyKwh: round(requiredBackupEnergyKwh, 3),
      safetyMarginPercent,
      safetyMarginEnergyKwh: round(safetyMarginEnergyKwh, 3),
      batteryTargetKwh: round(batteryTargetKwh, 3),
      saferBatteryTargetKwh: round(batteryTargetKwh, 3),
      batteryTiers,
      recommendedBatteryBank,
      systemTargets,
      panelConfiguration,
      isPreliminary: true,
      disclaimer: configuration.settings.preliminaryRecommendationDisclaimer,
      requiresExpertReview: expertReviewReasons.length > 0 || systemTargets.requiresExpertReview,
      expertReviewReasons: [...new Set(expertReviewReasons)],
    };
  }
}

export const commercialRuleRecommendationStrategy = new CommercialRuleRecommendationStrategy();
