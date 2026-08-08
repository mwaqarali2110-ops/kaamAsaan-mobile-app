import type { Product } from '@/types/product.types';
import {
  DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
  calculateCommercialSystemTargets,
  assessBatteryProduct,
  commercialRuleRecommendationStrategy,
  generateBatteryCombinations,
  rankBatteryTierCandidates,
  selectBatteryTiers,
} from './commercialRecommendation';
import {
  createRecommendedCapacityShortlist,
  DEFAULT_RECOMMENDED_CAPACITY_WINDOW_PERCENT,
  isFiveKwhCommercialClass,
  resolveAllowedBatteryQuantity,
} from './batteryCommercialRules';

const settings = DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION.settings;

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
  }
};

const assertClose = (actual: number, expected: number, label: string, tolerance = 0.0001) => {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
};

const assertPair = (actual: unknown[], expected: unknown[], label: string) => {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${label}: expected ${expected.join(', ')}, received ${actual.join(', ')}`);
  }
};

type BatteryFixtureOptions = {
  id?: string;
  maxParallelModules?: number;
  maxParallelUnits?: number;
  parallelSupported?: boolean;
  packageEligible?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  voltageClass?: Product['voltageClass'];
  price?: number;
  stockStatus?: Product['stockStatus'];
  commercialMaximumParallelModules?: number;
};

const product = (capacityKwh: number, options: BatteryFixtureOptions = {}): Product => {
  const id = options.id ?? `battery-${capacityKwh}`;
  const maximum = options.maxParallelModules ?? 1;
  return {
    id,
    category: 'battery',
    brand: 'Test Energy',
    brandId: 'test-energy',
    name: `${capacityKwh} kWh Battery`,
    model: `B${capacityKwh}`,
    batteryCapacityKwh: capacityKwh,
    capacityValue: capacityKwh,
    capacityUnit: 'kWh',
    voltageClass: options.voltageClass ?? 'LV',
    compatibilityGroups: ['TEST-LV'],
    parallelSupported: options.parallelSupported ?? maximum > 1,
    maxParallelModules: maximum,
    maxParallelUnits: options.maxParallelUnits,
    commercialMaxParallelModules: options.commercialMaximumParallelModules,
    packageEligible: options.packageEligible ?? true,
    isActive: options.isActive ?? true,
    isVisible: options.isVisible ?? true,
    stockStatus: options.stockStatus ?? 'ready_stock',
    price: options.price ?? capacityKwh * 10_000,
    specs: [],
  };
};

const panel: Product = {
  id: 'panel-625',
  category: 'panel',
  brand: 'Test Solar',
  brandId: 'test-solar',
  name: '625 W Panel',
  panelWattage: 625,
  packageEligible: true,
  isActive: true,
  isVisible: true,
  stockStatus: 'ready_stock',
  price: 20_000,
  specs: [],
};

const exactProducts = [
  product(5, { id: 'battery-5', maxParallelModules: 6, price: 55_000 }),
  product(12, { id: 'battery-12', maxParallelModules: 3, price: 120_000 }),
  product(14, { id: 'battery-14', maxParallelModules: 2, price: 150_000 }),
  product(16, { id: 'battery-16', maxParallelModules: 2, price: 180_000 }),
];

// Exact acceptance fixture: 25.1 kWh raw + 15% = 28.865 kWh target.
const rawRequiredKwh = 25.1;
const safetyMarginPercent = 15;
const safetyTargetKwh = rawRequiredKwh + (rawRequiredKwh * safetyMarginPercent) / 100;
const exactCandidates = generateBatteryCombinations(exactProducts, rawRequiredKwh, settings);
const exactTiers = selectBatteryTiers(exactCandidates, rawRequiredKwh, safetyTargetKwh, settings);
const exactRanked = rankBatteryTierCandidates(exactCandidates, rawRequiredKwh, safetyTargetKwh, settings);

assertPair(
  [12, 14, 16].map((capacity) => exactCandidates.some((candidate) => candidate.unitCapacityKwh === capacity)),
  [true, true, true],
  '12, 14, and 16 kWh products all enter the candidate pool',
);
assertPair(
  [exactRanked.recommended[0]?.quantity, exactRanked.recommended[0]?.unitCapacityKwh],
  [2, 16],
  '2 x 16 is the best recommended candidate',
);
assertEqual(
  exactCandidates.some((candidate) => candidate.quantity > 4 && candidate.unitCapacityKwh === 5),
  false,
  '5 kWh-class candidates never exceed four units',
);

assertClose(safetyTargetKwh, 28.865, 'Exact unrounded safety target');
assertPair(
  [exactTiers.loadManaged?.quantity, exactTiers.loadManaged?.unitCapacityKwh, exactTiers.loadManaged?.batteryBankCapacityKwh],
  [2, 14, 28],
  'Load-Managed is 2 x 14 kWh',
);
assertPair(
  [exactTiers.recommended?.quantity, exactTiers.recommended?.unitCapacityKwh, exactTiers.recommended?.batteryBankCapacityKwh],
  [2, 16, 32],
  'Recommended is 2 x 16 kWh',
);
assertPair(
  [exactTiers.extended?.quantity, exactTiers.extended?.unitCapacityKwh, exactTiers.extended?.batteryBankCapacityKwh],
  [3, 12, 36],
  'Extended Backup is 3 x 12 kWh',
);
assertEqual(
  exactTiers.loadManaged?.statusLabel,
  'Close to your requirement — minor load management may be required',
  'Load-Managed status',
);
assertEqual(
  exactTiers.recommended?.statusLabel,
  'Covers your requirement with safety margin',
  'Recommended status',
);
assertEqual(exactTiers.extended?.statusLabel, 'Additional backup reserve', 'Extended status');
assertEqual(exactTiers.loadManaged?.totalPrice, 300_000, 'Load-Managed total price');
assertEqual(exactTiers.recommended?.totalPrice, 360_000, 'Recommended total price');
assertEqual(exactTiers.extended?.totalPrice, 360_000, 'Extended total price');

const exactRecommendation = commercialRuleRecommendationStrategy.recommend({
  appliances: [{ id: 'acceptance-load', name: 'Acceptance load', watts: 2510, quantity: 1, hours: 10 }],
  products: [...exactProducts, panel],
  configuration: DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
});
assertClose(exactRecommendation.requiredBackupEnergyKwh, 25.1, 'Acceptance raw energy');
assertEqual(exactRecommendation.safetyMarginPercent, 15, 'Acceptance margin percent');
assertClose(exactRecommendation.safetyMarginEnergyKwh, 3.765, 'Acceptance margin energy');
assertClose(exactRecommendation.batteryTargetKwh, 28.865, 'Acceptance unrounded target');
assertPair(
  [exactRecommendation.batteryTiers.loadManaged?.quantity, exactRecommendation.batteryTiers.loadManaged?.unitCapacityKwh],
  [2, 14],
  'Acceptance Load-Managed bank',
);
assertPair(
  [exactRecommendation.recommendedBatteryBank?.quantity, exactRecommendation.recommendedBatteryBank?.unitCapacityKwh],
  [2, 16],
  'Acceptance Recommended bank',
);
assertPair(
  [exactRecommendation.batteryTiers.extended?.quantity, exactRecommendation.batteryTiers.extended?.unitCapacityKwh],
  [3, 12],
  'Acceptance Extended bank',
);

// Quantity is the first recommendation sort key only after the practical
// capacity shortlist has excluded unnecessarily oversized banks.
const quantityFirstProducts = [
  product(5, { id: 'quantity-5', maxParallelModules: 6 }),
  product(10, { id: 'quantity-10', maxParallelModules: 3 }),
  product(12, { id: 'quantity-12', maxParallelModules: 3 }),
  product(14, { id: 'quantity-14', maxParallelModules: 2 }),
  product(16, { id: 'quantity-16', maxParallelModules: 2 }),
];
const recommendedForTarget = (targetKwh: number) => {
  const candidates = generateBatteryCombinations(quantityFirstProducts, targetKwh, settings);
  return selectBatteryTiers(candidates, targetKwh, targetKwh, settings).recommended;
};

assertPair(
  [recommendedForTarget(29)?.quantity, recommendedForTarget(29)?.unitCapacityKwh],
  [2, 16],
  '29 kWh target prefers 2 x 16 over 6 x 5',
);
assertPair(
  [recommendedForTarget(27)?.quantity, recommendedForTarget(27)?.unitCapacityKwh],
  [2, 14],
  '27 kWh target prefers 2 x 14',
);
assertPair(
  [recommendedForTarget(30)?.quantity, recommendedForTarget(30)?.unitCapacityKwh],
  [2, 16],
  '30 kWh target prefers 2 x 16',
);

assertPair(
  [recommendedForTarget(20)?.quantity, recommendedForTarget(20)?.unitCapacityKwh],
  [2, 10],
  '20 kWh target prefers 2 x 10 over exact 4 x 5',
);
assertPair(
  [recommendedForTarget(24)?.quantity, recommendedForTarget(24)?.unitCapacityKwh],
  [2, 12],
  '24 kWh target prefers 2 x 12',
);

const practicalCapacityProducts = [
  product(5, { id: 'practical-5', maxParallelModules: 6 }),
  product(10, { id: 'practical-10', maxParallelModules: 2 }),
  product(12, { id: 'practical-12', maxParallelModules: 2 }),
];
const practicalTargetKwh = 14.5 * 1.15;
const practicalCandidates = generateBatteryCombinations(practicalCapacityProducts, 14.5, settings);
const practicalShortlist = createRecommendedCapacityShortlist(
  practicalCandidates,
  (candidate) => candidate.batteryBankCapacityKwh,
  practicalTargetKwh,
);
const practicalRecommendation = selectBatteryTiers(
  practicalCandidates,
  14.5,
  practicalTargetKwh,
  settings,
).recommended;
assertClose(practicalTargetKwh, 16.675, '16.675 kWh target stays unrounded');
assertEqual(DEFAULT_RECOMMENDED_CAPACITY_WINDOW_PERCENT, 10, 'Recommended capacity window is centralized at 10 percent');
assertClose(practicalShortlist.minimumQualifyingCapacityKwh ?? 0, 20, 'Minimum qualifying capacity is 20 kWh');
assertClose(practicalShortlist.shortlistMaximumCapacityKwh ?? 0, 22, 'Practical shortlist maximum is 22 kWh');
assertPair(
  practicalShortlist.practicalShortlist.map((candidate) => candidate.batteryBankCapacityKwh),
  [20, 20],
  '24 kWh is excluded from the 20 kWh practical capacity shortlist',
);
assertPair(
  [practicalRecommendation?.quantity, practicalRecommendation?.unitCapacityKwh, practicalRecommendation?.batteryBankCapacityKwh],
  [2, 10, 20],
  '16.675 kWh target prefers 2 x 10 kWh over 4 x 5 kWh and 2 x 12 kWh',
);

const fiveKwhPracticalFallback = selectBatteryTiers(
  generateBatteryCombinations([
    product(5, { id: 'practical-fallback-5', maxParallelModules: 6 }),
    product(12, { id: 'practical-fallback-12', maxParallelModules: 2 }),
  ], 14.5, settings),
  14.5,
  practicalTargetKwh,
  settings,
).recommended;
assertPair(
  [fiveKwhPracticalFallback?.quantity, fiveKwhPracticalFallback?.unitCapacityKwh, fiveKwhPracticalFallback?.batteryBankCapacityKwh],
  [4, 5, 20],
  '4 x 5 kWh remains the practical fallback when no 10 kWh product exists',
);

const onlyTwentyFourKwh = selectBatteryTiers(
  generateBatteryCombinations([product(12, { id: 'only-24', maxParallelModules: 2 })], 14.5, settings),
  14.5,
  practicalTargetKwh,
  settings,
).recommended;
assertPair(
  [onlyTwentyFourKwh?.quantity, onlyTwentyFourKwh?.unitCapacityKwh, onlyTwentyFourKwh?.batteryBankCapacityKwh],
  [2, 12, 24],
  '24 kWh may be selected when it is the only valid qualifying candidate',
);

const onlyFiveKwh = generateBatteryCombinations([
  product(5, { id: 'only-5', maxParallelModules: 6 }),
], 25.1, settings);
assertPair(
  onlyFiveKwh.map((candidate) => candidate.quantity),
  [1, 2, 3, 4],
  'A 5 kWh-only catalog is commercially capped at four units',
);
assertEqual(
  selectBatteryTiers(onlyFiveKwh, 25.1, 28.865, settings).recommended,
  undefined,
  'A target above 20 kWh has no fabricated 5 kWh-only recommendation',
);

assertPair(
  [4.8, 5, 5.2, 4.79, 5.21].map(isFiveKwhCommercialClass),
  [true, true, true, false, false],
  'The 5 kWh commercial class uses inclusive 4.8 to 5.2 kWh boundaries',
);
assertEqual(
  resolveAllowedBatteryQuantity({
    unitCapacityKwh: 5,
    parallelSupported: true,
    technicalMaximumParallelModules: 8,
  }),
  4,
  '5 kWh class applies the four-unit commercial maximum',
);
assertEqual(
  resolveAllowedBatteryQuantity({
    unitCapacityKwh: 5,
    parallelSupported: true,
    technicalMaximumParallelModules: 3,
    commercialMaximumParallelModules: 4,
  }),
  3,
  'Commercial maximum never exceeds the technical maximum',
);
assertEqual(
  resolveAllowedBatteryQuantity({
    unitCapacityKwh: 5,
    parallelSupported: true,
    technicalMaximumParallelModules: 8,
    commercialMaximumParallelModules: 2,
  }),
  2,
  'A product-specific commercial maximum can lower the 5 kWh class limit',
);
assertPair(
  generateBatteryCombinations([
    product(5, {
      id: 'commercial-override-five',
      maxParallelModules: 8,
      commercialMaximumParallelModules: 2,
    }),
  ], 10, settings).map((candidate) => candidate.quantity),
  [1, 2],
  'Product commercial maximum metadata is applied during combination generation',
);
assertEqual(
  resolveAllowedBatteryQuantity({
    unitCapacityKwh: 5.21,
    parallelSupported: true,
    technicalMaximumParallelModules: 6,
  }),
  6,
  'A product outside the 5 kWh class keeps its technical maximum',
);
assertEqual(
  resolveAllowedBatteryQuantity({
    unitCapacityKwh: 12,
    parallelSupported: false,
    technicalMaximumParallelModules: 6,
  }),
  1,
  'A non-parallel product always remains a single-unit bank',
);

const exactToleranceCandidate = selectBatteryTiers(
  generateBatteryCombinations([product(14, { id: 'tolerance-14', maxParallelModules: 2 })], rawRequiredKwh, settings),
  rawRequiredKwh,
  safetyTargetKwh,
  settings,
).loadManaged;
assertPair(
  [exactToleranceCandidate?.quantity, exactToleranceCandidate?.batteryBankCapacityKwh],
  [2, 28],
  'A 3 percent target shortfall is accepted under the configured 5 percent tolerance',
);
const strictToleranceSettings = { ...settings, acceptableBatteryShortfallPercent: 2 };
assertEqual(
  selectBatteryTiers(
    generateBatteryCombinations([product(14, { id: 'strict-tolerance-14', maxParallelModules: 2 })], rawRequiredKwh, strictToleranceSettings),
    rawRequiredKwh,
    safetyTargetKwh,
    strictToleranceSettings,
  ).loadManaged,
  undefined,
  'The same 28 kWh bank is rejected when the configured tolerance is 2 percent',
);
const fivePercentBoundary = selectBatteryTiers(
  generateBatteryCombinations([product(9.5, { id: 'five-percent-boundary' })], 9, settings),
  9,
  10,
  settings,
).loadManaged;
assertEqual(fivePercentBoundary?.batteryBankCapacityKwh, 9.5, 'Exactly 5 percent below target is accepted');
assertEqual(
  selectBatteryTiers(
    generateBatteryCombinations([product(9.49, { id: 'outside-five-percent' })], 9, settings),
    9,
    10,
    settings,
  ).loadManaged,
  undefined,
  'A target shortfall above 5 percent is rejected',
);

const genericPackageIndependent = generateBatteryCombinations([
  product(16, { id: 'generic-package-independent', maxParallelModules: 2, packageEligible: false }),
], 25.1, settings);
assertEqual(genericPackageIndependent.length, 2, 'Generic sizing does not apply package eligibility');

const availabilityProducts = [
  product(10, { id: 'inactive-battery', isActive: false }),
  product(12, { id: 'unpublished-battery', isVisible: false }),
  product(14, { id: 'out-of-stock-battery', stockStatus: 'out_of_stock' }),
  product(16, { id: 'on-request-battery', stockStatus: 'on_request' }),
];
assertPair(
  generateBatteryCombinations(availabilityProducts, 10, settings)
    .map((candidate) => candidate.batteryProductId),
  ['on-request-battery'],
  'Inactive, unpublished, and out-of-stock products are excluded while on-request remains eligible',
);

const maxUnitsFallbackProduct = product(12, {
  id: 'max-units-fallback',
  parallelSupported: true,
  maxParallelModules: 1,
  maxParallelUnits: 3,
});
maxUnitsFallbackProduct.maxParallelModules = null;
assertPair(
  generateBatteryCombinations([maxUnitsFallbackProduct], 25.1, settings).map((candidate) => candidate.quantity),
  [1, 2, 3],
  'Mapped maxParallelUnits is honored when maxParallelModules is absent',
);

const missingVoltageProduct = product(14, { id: 'missing-voltage' });
missingVoltageProduct.voltageClass = null;
const missingVoltageAssessment = assessBatteryProduct(missingVoltageProduct, settings);
assertEqual(missingVoltageAssessment.eligible, false, 'Missing voltage excludes a battery product');
assertEqual(
  missingVoltageAssessment.exclusionReasons.includes('missing_voltage_class'),
  true,
  'Missing voltage exclusion is diagnosed',
);

const missingParallelLimit = product(12, {
  id: 'missing-parallel-limit',
  parallelSupported: true,
});
missingParallelLimit.maxParallelModules = null;
missingParallelLimit.maxParallelUnits = null;
const missingParallelLimitAssessment = assessBatteryProduct(missingParallelLimit, settings);
assertEqual(
  missingParallelLimitAssessment.limitations.includes('parallel_limit_missing: capped_at_1'),
  true,
  'Explicit parallel support without a maximum is diagnosed',
);
assertPair(
  generateBatteryCombinations([missingParallelLimit], 20, settings).map((candidate) => candidate.quantity),
  [1],
  'Missing parallel maximum is safely capped at one unit',
);

const equalCapacityCandidates = generateBatteryCombinations([
  product(16, { id: 'price-first', maxParallelModules: 2, price: 150_000, stockStatus: 'on_request' }),
  product(16, { id: 'available-second', maxParallelModules: 2, price: 160_000, stockStatus: 'ready_stock' }),
], 25.1, settings);
assertEqual(
  selectBatteryTiers(equalCapacityCandidates, 25.1, 28.865, settings).recommended?.batteryProductId,
  'price-first',
  'Price is evaluated before availability after quantity and excess tie',
);

const equalPriceCandidates = generateBatteryCombinations([
  product(16, { id: 'on-request', maxParallelModules: 2, price: 160_000, stockStatus: 'on_request' }),
  product(16, { id: 'ready-stock', maxParallelModules: 2, price: 160_000, stockStatus: 'ready_stock' }),
], 25.1, settings);
assertEqual(
  selectBatteryTiers(equalPriceCandidates, 25.1, 28.865, settings).recommended?.batteryProductId,
  'ready-stock',
  'Ready stock wins after price tie',
);

// A positive max quantity alone must never imply parallel support.
const nonParallel = generateBatteryCombinations([
  product(10, {
    id: 'non-parallel-10',
    parallelSupported: false,
    maxParallelModules: 4,
  }),
], 20, settings);
assertEqual(nonParallel.length, 1, 'Non-parallel product produces one candidate');
assertEqual(nonParallel[0]?.quantity, 1, 'Non-parallel product is capped at one unit');

// A single battery must remain eligible even when it cannot be paralleled.
// This guards the customer flow where a 5.635 kWh target should select one
// valid 6 kWh unit instead of oversizing to a 10 kWh bank.
const smallTargetRequiredKwh = 4.9;
const smallTargetKwh = smallTargetRequiredKwh * 1.15;
const nonParallelSixKwh = generateBatteryCombinations([
  product(6, {
    id: 'single-six-kwh',
    parallelSupported: false,
    maxParallelModules: 1,
  }),
  product(5, { id: 'five-kwh-fallback', maxParallelModules: 4 }),
  product(10, { id: 'ten-kwh-fallback', maxParallelModules: 2 }),
], smallTargetRequiredKwh, settings);
assertPair(
  nonParallelSixKwh
    .filter((candidate) => candidate.batteryProductId === 'single-six-kwh')
    .map((candidate) => candidate.quantity),
  [1],
  'A non-parallel 6 kWh battery still creates its quantity-one candidate',
);
assertPair(
  [
    selectBatteryTiers(
      nonParallelSixKwh,
      smallTargetRequiredKwh,
      smallTargetKwh,
      settings,
    ).recommended?.quantity,
    selectBatteryTiers(
      nonParallelSixKwh,
      smallTargetRequiredKwh,
      smallTargetKwh,
      settings,
    ).recommended?.batteryBankCapacityKwh,
  ],
  [1, 6],
  'A 5.635 kWh target selects the valid 6 kWh candidate before 10 kWh banks',
);

const noSixKwhCandidate = selectBatteryTiers(
  generateBatteryCombinations([
    product(5, { id: 'no-six-five', maxParallelModules: 4 }),
    product(10, { id: 'no-six-ten', maxParallelModules: 2 }),
  ], smallTargetRequiredKwh, settings),
  smallTargetRequiredKwh,
  smallTargetKwh,
  settings,
).recommended;
assertPair(
  [noSixKwhCandidate?.quantity, noSixKwhCandidate?.batteryBankCapacityKwh],
  [1, 10],
  'No 6 kWh product falls back to the next valid practical battery bank',
);

const maxTwo = generateBatteryCombinations([
  product(10, {
    id: 'parallel-max-two',
    parallelSupported: true,
    maxParallelModules: 2,
  }),
], 30, settings);
assertPair(maxTwo.map((candidate) => candidate.quantity), [1, 2], 'Maximum parallel quantity is honored');
assertEqual(
  maxTwo.every((candidate) => candidate.batteryProductId === 'parallel-max-two'),
  true,
  'A battery bank never mixes product models',
);

// The customer safety margin is configurable and is applied to unrounded raw energy.
const configuredMargin = 10;
const configuredRecommendation = commercialRuleRecommendationStrategy.recommend({
  appliances: [{ id: 'exact-load', name: 'Exact load', watts: 2510, quantity: 1, hours: 10 }],
  products: [...exactProducts, panel],
  configuration: {
    ...DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
    settings: {
      ...settings,
      batterySafetyMarginPercent: configuredMargin,
    },
  },
});
assertClose(configuredRecommendation.requiredBackupEnergyKwh, 25.1, 'Configured margin raw energy');
assertEqual(configuredRecommendation.safetyMarginPercent, configuredMargin, 'Configured margin percent');
assertClose(configuredRecommendation.safetyMarginEnergyKwh, 2.51, 'Configured margin energy');
assertClose(configuredRecommendation.batteryTargetKwh, 27.61, 'Configured margin target');

const targets = (runningLoadKw: number, bankKwh: number) => calculateCommercialSystemTargets({
  runningLoadKw,
  batteryBankCapacityKwh: bankKwh,
  configuration: DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
});
assertPair([targets(5, 12).targetInverterKw, targets(5, 12).targetPvKwp], [6, 8], 'Load target E');
assertPair([targets(5, 24).targetInverterKw, targets(5, 24).targetPvKwp], [8, 10], 'Load target F');
assertPair([targets(8, 32).targetInverterKw, targets(8, 32).targetPvKwp], [12, 15], 'Load target G');

const expertReview = commercialRuleRecommendationStrategy.recommend({
  appliances: [{ id: 'load', name: 'Load', watts: 1000, quantity: 1, hours: 1 }],
  products: [panel],
  configuration: DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
});
assertEqual(expertReview.requiresExpertReview, true, 'Missing battery requires expert review');
assertEqual(expertReview.recommendedBatteryBank, null, 'No battery is fabricated');

console.log('Commercial recommendation customer-flow scenarios passed.');
