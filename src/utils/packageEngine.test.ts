import { generateCatalogPackages, type PackageEngineProduct } from './packageEngine';

const product = (
  id: string,
  category: PackageEngineProduct['category'],
  brandName: string,
  values: Partial<PackageEngineProduct> = {}
): PackageEngineProduct => ({
  id,
  category,
  brandId: values.brandId ?? brandName.toLowerCase().replace(/\W/g, ''),
  brandName,
  name: values.name ?? id,
  active: true,
  packageEligible: true,
  brandPackageGenerationEnabled: true,
  priority: 0,
  price: 100,
  available: true,
  ...values,
});

const panel = product('panel-585', 'panel', 'JA Solar', { panelWattage: 585, pricePerWatt: 25 });

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const generate = (products: PackageEngineProduct[], requiredInverterKw = 8, requiredBatteryKwh = 10) => generateCatalogPackages({
  requiredSolarKw: 9,
  requiredInverterKw,
  requiredBatteryKwh,
  phase: 'single',
  products: [panel, ...products],
});

const sameBrandPair = (brand: string, voltage: 'LV' | 'HV' = 'HV') => [
  product(`${brand}-inv`, 'inverter', brand, { capacityKw: 10, phase: 'single', voltageClass: voltage, compatibilityGroups: [`${brand}-${voltage}`] }),
  product(`${brand}-bat`, 'battery', brand, { capacityKwh: 10, voltageClass: voltage, compatibilityGroups: [`${brand}-${voltage}`] }),
];

export function runPackageEngineTests() {
  // 1. Existing Fox inverter + Fox battery.
  assert(generate(sameBrandPair('Fox')).some((pkg) => pkg.primaryBrand === 'Fox'), 'Fox package was not generated.');

  // 2. Solis + Pylontech via a shared family.
  const solisPylontech = generate([
    product('solis-inv', 'inverter', 'Solis', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['SOLIS-LV'] }),
    product('pylon-bat', 'battery', 'Pylontech', { capacityKwh: 10, voltageClass: 'LV', compatibilityGroups: ['PYLONTECH-LV', 'SOLIS-LV'] }),
  ]);
  assert(solisPylontech.some((pkg) => pkg.battery?.productId === 'pylon-bat'), 'Shared-family cross-brand battery was rejected.');

  // 3-5. Existing same-brand families.
  for (const brand of ['GoodWe', 'KStar', 'ITEL']) {
    assert(generate(sameBrandPair(brand, brand === 'ITEL' ? 'LV' : 'HV')).some((pkg) => pkg.primaryBrand === brand), `${brand} package was not generated.`);
  }

  // 6. A completely new database brand needs no engine code branch.
  assert(generate(sameBrandPair('Nova Energy', 'LV')).some((pkg) => pkg.primaryBrand === 'Nova Energy'), 'New database brand did not generate a package.');

  // 7. 14.7 kWh must select 16 kWh as Recommended.
  const batterySizing = generate([
    product('size-inv', 'inverter', 'Sizing', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['SIZING-LV'] }),
    ...[10, 12, 14, 16].map((capacity) => product(`battery-${capacity}`, 'battery', 'Sizing', { capacityKwh: capacity, voltageClass: 'LV', compatibilityGroups: ['SIZING-LV'] })),
  ], 8, 14.7);
  assert(batterySizing.find((pkg) => pkg.packageType === 'recommended')?.battery?.totalCapacityKwh === 16, 'Recommended battery was not the nearest higher 16 kWh option.');

  // 8. 8.4 kW must select 10 kW as Recommended.
  const inverterSizing = generate([
    ...[6, 8, 10].map((capacity) => product(`inverter-${capacity}`, 'inverter', 'Inverter Sizing', { capacityKw: capacity, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['INV-LV'] })),
    product('inv-battery', 'battery', 'Inverter Sizing', { capacityKwh: 10, voltageClass: 'LV', compatibilityGroups: ['INV-LV'] }),
  ], 8.4, 10);
  assert(inverterSizing.find((pkg) => pkg.packageType === 'recommended')?.inverter.totalCapacityKw === 10, 'Recommended inverter was not the nearest higher 10 kW option.');

  // 9. Cross-brand products without a shared group must be rejected.
  assert(generate([
    product('cross-inv', 'inverter', 'Alpha', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['ALPHA-LV'] }),
    product('cross-bat', 'battery', 'Beta', { capacityKwh: 10, voltageClass: 'LV', compatibilityGroups: ['BETA-LV'] }),
  ]).length === 0, 'Cross-brand products without a shared family were accepted.');

  // 10. LV battery with HV inverter must be rejected even when a group is shared.
  assert(generate([
    product('hv-inv', 'inverter', 'Voltage', { capacityKw: 10, phase: 'single', voltageClass: 'HV', compatibilityGroups: ['SHARED'] }),
    product('lv-bat', 'battery', 'Voltage', { capacityKwh: 10, voltageClass: 'LV', compatibilityGroups: ['SHARED'] }),
  ]).length === 0, 'LV/HV mismatch was accepted.');

  // 11. 18 kW can use 2 x 10 kW only when parallel is supported.
  const parallel = generate([
    product('parallel-inv', 'inverter', 'Parallel', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['PARALLEL-LV'], parallelSupported: true, maxParallelUnits: 3 }),
    product('parallel-bat', 'battery', 'Parallel', { capacityKwh: 10, voltageClass: 'LV', compatibilityGroups: ['PARALLEL-LV'] }),
  ], 18, 10);
  const parallelRecommended = parallel.find((pkg) => pkg.packageType === 'recommended');
  assert(parallelRecommended?.inverter.quantity === 2 && parallelRecommended.inverter.totalCapacityKw === 20, 'Valid 2 x 10 kW parallel option was not generated.');

  // 12. Inactive and package-ineligible products must never be selected.
  const flags = generate([
    product('inactive-inv', 'inverter', 'Flags', { capacityKw: 8, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['FLAGS-LV'], active: false }),
    product('ineligible-inv', 'inverter', 'Flags', { capacityKw: 9, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['FLAGS-LV'], packageEligible: false }),
    product('live-inv', 'inverter', 'Flags', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['FLAGS-LV'] }),
    product('flags-bat', 'battery', 'Flags', { capacityKwh: 10, voltageClass: 'LV', compatibilityGroups: ['FLAGS-LV'] }),
  ]);
  assert(flags.every((pkg) => pkg.inverter.productId === 'live-inv'), 'Inactive or package-ineligible inverter appeared in a package.');

  // 13. A severely undersized complete inverter must not pass as Basic.
  const completeFallback = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 9,
    requiredBatteryKwh: 14.7,
    products: [
      panel,
      product('configured-4-6', 'inverter', 'Fallback', { capacityKw: 4.6, voltageClass: 'HV', compatibilityGroups: ['FALLBACK-HV'] }),
      product('unconfigured-8', 'inverter', 'Fallback', { capacityKw: 8 }),
      product('fallback-battery', 'battery', 'Fallback Battery', { brandId: 'fallback-battery-brand', capacityKwh: 12, voltageClass: 'HV', compatibilityGroups: ['FALLBACK-HV'] }),
    ],
  });
  assert(completeFallback.every((pkg) => pkg.inverter.productId !== 'configured-4-6'), 'Severely undersized 4.6 kW inverter was accepted for a 9 kW requirement.');

  // 14. Legacy database brand compatibility is accepted only after voltage matches.
  const legacyBrandRule = generateCatalogPackages({
    requiredSolarKw: 5,
    requiredInverterKw: 5,
    requiredBatteryKwh: 5,
    products: [
      panel,
      product('legacy-inverter', 'inverter', 'Legacy Inverter', { brandId: 'legacy-inverter-brand', capacityKw: 6, voltageClass: 'LV' }),
      product('legacy-battery', 'battery', 'Legacy Battery', { brandId: 'legacy-battery-brand', capacityKwh: 5, voltageClass: 'LV' }),
    ],
    compatibilityExceptions: [{ sourceBrandId: 'legacy-inverter-brand', targetBrandId: 'legacy-battery-brand', status: 'compatible' }],
  });
  assert(legacyBrandRule.length > 0, 'Confirmed legacy brand compatibility was not honored.');

  // 15. Every valid brand is returned; selecting one brand cannot stop the rest.
  const multipleBrands = generate([
    ...sameBrandPair('Alpha', 'LV'),
    ...sameBrandPair('Beta', 'LV'),
  ]);
  assert(
    multipleBrands.some((pkg) => pkg.primaryBrand === 'Alpha') &&
    multipleBrands.some((pkg) => pkg.primaryBrand === 'Beta'),
    'A valid brand was suppressed after another package was generated.'
  );

  // 16. Battery-only brands do not need package-generation enablement.
  const crossBrandBatteryOnly = generate([
    product('battery-only-inverter', 'inverter', 'Battery Host', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['BATTERY-HOST-LV'] }),
    product('battery-only-product', 'battery', 'Battery Catalog Brand', { capacityKwh: 5, voltageClass: 'LV', compatibilityGroups: ['BATTERY-HOST-LV'], brandPackageGenerationEnabled: false }),
  ], 5, 5);
  assert(crossBrandBatteryOnly.length > 0, 'A compatible battery-only brand was incorrectly excluded from package generation.');

  // 17. A 9 kW requirement uses nearest higher 10 kW, not the lower 8 kW, for Recommended.
  const nineKwSizing = generate([
    ...[8, 10, 12].map((capacity) => product(`nine-inverter-${capacity}`, 'inverter', 'Nine KW', { capacityKw: capacity, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['NINE-LV'] })),
    product('nine-battery', 'battery', 'Nine KW', { capacityKwh: 5, voltageClass: 'LV', compatibilityGroups: ['NINE-LV'] }),
  ], 9, 5);
  assert(nineKwSizing.find((pkg) => pkg.primaryBrand === 'Nine KW')?.inverter.totalCapacityKw === 10, '9 kW requirement did not select the nearest higher 10 kW inverter.');

  // 18. Battery tiers are size-driven: 5 kWh is Recommended when 5, 10 and 12 exist.
  const fiveKwhBattery = generate([
    product('battery-tier-inv', 'inverter', 'Battery Tier', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['BATTERY-TIER-LV'] }),
    ...[5, 10, 12].map((capacity) => product(`battery-tier-${capacity}`, 'battery', 'Battery Tier', { capacityKwh: capacity, voltageClass: 'LV', compatibilityGroups: ['BATTERY-TIER-LV'] })),
  ], 9, 5);
  const batteryTierPackage = fiveKwhBattery.find((pkg) => pkg.primaryBrand === 'Battery Tier');
  assert(batteryTierPackage?.packageType === 'recommended' && batteryTierPackage.battery?.totalCapacityKwh === 5, '5 kWh battery was not selected as Recommended for a 5 kWh requirement.');

  // 19. Package battery selection uses the complete compatible catalog, caps the
  // 5 kWh class at four modules, and prefers fewer physical units.
  const packageTierInventory = [
    product('package-tier-inverter', 'inverter', 'Package Battery Tier', {
      capacityKw: 10,
      phase: 'single',
      voltageClass: 'LV',
      compatibilityGroups: ['PACKAGE-BATTERY-LV'],
    }),
    product('package-battery-5', 'battery', 'Package Battery Tier', {
      capacityKwh: 5,
      voltageClass: 'LV',
      compatibilityGroups: ['PACKAGE-BATTERY-LV'],
      parallelSupported: true,
      maxParallelModules: 30,
      priority: 100,
    }),
    product('package-battery-10', 'battery', 'Package Battery Tier', {
      capacityKwh: 10,
      voltageClass: 'LV',
      compatibilityGroups: ['PACKAGE-BATTERY-LV'],
      parallelSupported: true,
      maxParallelModules: 3,
    }),
    product('package-battery-12', 'battery', 'Package Battery Tier', {
      capacityKwh: 12,
      voltageClass: 'LV',
      compatibilityGroups: ['PACKAGE-BATTERY-LV'],
      parallelSupported: true,
      maxParallelModules: 3,
    }),
    product('package-battery-14', 'battery', 'Package Battery Tier', {
      capacityKwh: 14,
      voltageClass: 'LV',
      compatibilityGroups: ['PACKAGE-BATTERY-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
    }),
    product('package-battery-16', 'battery', 'Package Battery Tier', {
      capacityKwh: 16,
      voltageClass: 'LV',
      compatibilityGroups: ['PACKAGE-BATTERY-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
    }),
  ];
  const packageForTarget = (targetKwh: number) => generate(packageTierInventory, 8, targetKwh)
    .find((pkg) => pkg.primaryBrand === 'Package Battery Tier');
  const target28865 = packageForTarget(28.865);
  assert(
    target28865?.battery?.productId === 'package-battery-16' &&
    target28865.battery.quantity === 2 &&
    target28865.battery.totalCapacityKwh === 32,
    '28.865 kWh package target did not select 2 x 16 kWh instead of a many-module 5 kWh bank.'
  );

  const practicalCapacityPackage = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 16.675,
    phase: 'single',
    products: [panel, ...packageTierInventory],
  })[0];
  assert(
    practicalCapacityPackage?.battery?.productId === 'package-battery-10' &&
    practicalCapacityPackage.battery.quantity === 2 &&
    practicalCapacityPackage.battery.totalCapacityKwh === 20,
    'A 16.675 kWh package target did not preserve the practical 2 x 10 kWh bank over 2 x 12 kWh.'
  );

  const practicalFiveKwhFallbackPackage = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 16.675,
    phase: 'single',
    products: [
      panel,
      packageTierInventory[0],
      packageTierInventory[1],
      packageTierInventory[3],
    ],
  })[0];
  assert(
    practicalFiveKwhFallbackPackage?.battery?.productId === 'package-battery-5' &&
    practicalFiveKwhFallbackPackage.battery.quantity === 4 &&
    practicalFiveKwhFallbackPackage.battery.totalCapacityKwh === 20,
    'A package without a 10 kWh equivalent did not use the valid 4 x 5 kWh bank.'
  );

  const onlyTwentyFourKwhPackage = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 16.675,
    phase: 'single',
    products: [
      panel,
      packageTierInventory[0],
      packageTierInventory[3],
    ],
  })[0];
  assert(
    onlyTwentyFourKwhPackage?.battery?.productId === 'package-battery-12' &&
    onlyTwentyFourKwhPackage.battery.quantity === 2 &&
    onlyTwentyFourKwhPackage.battery.totalCapacityKwh === 24,
    'A 24 kWh battery was not selected when it was the only qualifying compatible package option.'
  );

  // 20. Recommended Packages preserves the selected Step 6 total as its target.
  const selectedTierExpectations = [
    { target: 28, productId: 'package-battery-14', quantity: 2 },
    { target: 32, productId: 'package-battery-16', quantity: 2 },
    { target: 36, productId: 'package-battery-12', quantity: 3 },
  ];
  selectedTierExpectations.forEach(({ target, productId, quantity }) => {
    const pkg = packageForTarget(target);
    assert(
      pkg?.battery?.productId === productId &&
      pkg.battery.quantity === quantity &&
      pkg.battery.totalCapacityKwh === target,
      `Selected ${target} kWh tier was not preserved by package generation.`
    );
  });

  // 21. A slightly lower compatible equivalent is accepted only within the
  // centralized shortfall tolerance.
  const fourteenOnly = [
    product('tolerance-inverter', 'inverter', 'Tolerance', {
      capacityKw: 10,
      phase: 'single',
      voltageClass: 'LV',
      compatibilityGroups: ['TOLERANCE-LV'],
    }),
    product('tolerance-14', 'battery', 'Tolerance', {
      capacityKwh: 14,
      voltageClass: 'LV',
      compatibilityGroups: ['TOLERANCE-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
    }),
  ];
  const toleratedPackage = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 28.865,
    acceptableBatteryShortfallPercent: 5,
    selectedBatteryTier: 'loadManaged',
    phase: 'single',
    products: [panel, ...fourteenOnly],
  })[0];
  assert(
    toleratedPackage?.battery?.quantity === 2 && toleratedPackage.battery.totalCapacityKwh === 28,
    '2 x 14 kWh was not accepted within the 5% package shortfall tolerance.'
  );
  assert(generate(fourteenOnly, 8, 30).length === 0, 'A 6.67% undersized battery package bypassed the 5% tolerance.');
  const recommendedTierCannotFallBack = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 28.865,
    acceptableBatteryShortfallPercent: 5,
    selectedBatteryTier: 'recommended',
    phase: 'single',
    products: [panel, ...fourteenOnly],
  });
  assert(recommendedTierCannotFallBack.length === 0, 'A Recommended package fell below its selected battery target.');
  const strictTolerancePackage = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 28.865,
    acceptableBatteryShortfallPercent: 2,
    selectedBatteryTier: 'loadManaged',
    phase: 'single',
    products: [panel, ...fourteenOnly],
  });
  assert(strictTolerancePackage.length === 0, 'The configured package shortfall tolerance was ignored.');

  // 22. Load-Managed compares tolerated-below and covering equivalents in one
  // pool, so minimum unit count wins across both sides of the target.
  const competingLoadManagedPackage = generateCatalogPackages({
    requiredSolarKw: 9,
    requiredInverterKw: 8,
    requiredBatteryKwh: 28,
    acceptableBatteryShortfallPercent: 5,
    selectedBatteryTier: 'loadManaged',
    phase: 'single',
    products: [
      panel,
      product('competing-load-managed-inverter', 'inverter', 'Competing Load Managed', {
        capacityKw: 10,
        phase: 'single',
        voltageClass: 'LV',
        compatibilityGroups: ['COMPETING-LOAD-MANAGED-LV'],
      }),
      product('competing-load-managed-13-5', 'battery', 'Competing Load Managed', {
        capacityKwh: 13.5,
        voltageClass: 'LV',
        compatibilityGroups: ['COMPETING-LOAD-MANAGED-LV'],
        parallelSupported: true,
        maxParallelModules: 2,
      }),
      product('competing-covering-10', 'battery', 'Competing Load Managed', {
        capacityKwh: 10,
        voltageClass: 'LV',
        compatibilityGroups: ['COMPETING-LOAD-MANAGED-LV'],
        parallelSupported: true,
        maxParallelModules: 3,
      }),
    ],
  })[0];
  assert(
    competingLoadManagedPackage?.battery?.productId === 'competing-load-managed-13-5' &&
    competingLoadManagedPackage.battery.quantity === 2 &&
    competingLoadManagedPackage.battery.totalCapacityKwh === 27,
    'Load-Managed package preferred 3 x 10 kWh over the valid 2 x 13.5 kWh equivalent.'
  );

  // 23. Quantity is the first Recommended tie-break, ahead of product priority.
  const quantityFirstPackage = generate([
    product('quantity-first-inverter', 'inverter', 'Quantity First', {
      capacityKw: 10,
      phase: 'single',
      voltageClass: 'LV',
      compatibilityGroups: ['QUANTITY-FIRST-LV'],
    }),
    product('quantity-first-5', 'battery', 'Quantity First', {
      capacityKwh: 5,
      voltageClass: 'LV',
      compatibilityGroups: ['QUANTITY-FIRST-LV'],
      parallelSupported: true,
      maxParallelModules: 30,
      priority: 1000,
    }),
    product('quantity-first-10', 'battery', 'Quantity First', {
      capacityKwh: 10,
      voltageClass: 'LV',
      compatibilityGroups: ['QUANTITY-FIRST-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
    }),
  ], 8, 20)[0];
  assert(
    quantityFirstPackage?.battery?.productId === 'quantity-first-10' && quantityFirstPackage.battery.quantity === 2,
    '2 x 10 kWh was not preferred over 4 x 5 kWh for the 20 kWh package target.'
  );

  // 24. Commercial, technical, and non-parallel limits all constrain package banks.
  const fiveKwhOnly = (id: string, parallelSupported: boolean, maxParallelModules: number) => [
    product(`${id}-inverter`, 'inverter', id, {
      capacityKw: 10,
      phase: 'single',
      voltageClass: 'LV',
      compatibilityGroups: [`${id}-LV`],
    }),
    product(`${id}-battery`, 'battery', id, {
      capacityKwh: 5,
      voltageClass: 'LV',
      compatibilityGroups: [`${id}-LV`],
      parallelSupported,
      maxParallelModules,
    }),
  ];
  assert(generate(fiveKwhOnly('Commercial Cap', true, 30), 8, 30).length === 0, '6 x 5 kWh was generated despite the four-module commercial cap.');
  assert(generate(fiveKwhOnly('Technical Cap', true, 3), 8, 20).length === 0, 'Battery quantity exceeded the lower technical maximum.');
  assert(generate(fiveKwhOnly('No Parallel', false, 30), 8, 10).length === 0, 'A non-parallel battery generated a multi-unit package bank.');

  // 25. Quantity ranking never bypasses configured inverter/battery compatibility.
  const compatibilitySelection = generate([
    product('compatibility-inverter', 'inverter', 'Compatibility Selection', {
      capacityKw: 10,
      phase: 'single',
      voltageClass: 'LV',
      compatibilityGroups: ['COMPATIBLE-LV'],
    }),
    product('compatible-14', 'battery', 'Compatibility Selection', {
      capacityKwh: 14,
      voltageClass: 'LV',
      compatibilityGroups: ['COMPATIBLE-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
    }),
    product('incompatible-16', 'battery', 'Compatibility Selection', {
      capacityKwh: 16,
      voltageClass: 'LV',
      compatibilityGroups: ['UNRELATED-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
    }),
  ], 8, 28)[0];
  assert(compatibilitySelection?.battery?.productId === 'compatible-14', 'An incompatible battery entered the package candidate pool.');

  // 26. Equal-price Recommended candidates prefer ready stock, and out-of-stock
  // products are excluded before ranking.
  const availabilitySelection = generate([
    product('availability-inverter', 'inverter', 'Availability Selection', {
      capacityKw: 10,
      phase: 'single',
      voltageClass: 'LV',
      compatibilityGroups: ['AVAILABILITY-LV'],
    }),
    product('a-on-request-16', 'battery', 'Availability Selection', {
      capacityKwh: 16,
      voltageClass: 'LV',
      compatibilityGroups: ['AVAILABILITY-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
      stockStatus: 'on_request',
    }),
    product('z-ready-16', 'battery', 'Availability Selection', {
      capacityKwh: 16,
      voltageClass: 'LV',
      compatibilityGroups: ['AVAILABILITY-LV'],
      parallelSupported: true,
      maxParallelModules: 2,
      stockStatus: 'ready_stock',
    }),
    product('out-of-stock-32', 'battery', 'Availability Selection', {
      capacityKwh: 32,
      voltageClass: 'LV',
      compatibilityGroups: ['AVAILABILITY-LV'],
      available: false,
    }),
  ], 8, 32)[0];
  assert(
    availabilitySelection?.battery?.productId === 'z-ready-16' && availabilitySelection.battery.quantity === 2,
    'Recommended package did not prefer ready stock or allowed an out-of-stock battery.'
  );

  return 29;
}

runPackageEngineTests();
console.log('Package engine: 29 scenarios passed.');
