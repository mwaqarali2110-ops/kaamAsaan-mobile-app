"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPackageEngineTests = runPackageEngineTests;
const packageEngine_1 = require("./packageEngine");
const product = (id, category, brandName, values = {}) => ({
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
const assert = (condition, message) => {
    if (!condition)
        throw new Error(message);
};
const generate = (products, requiredInverterKw = 8, requiredBatteryKwh = 10) => (0, packageEngine_1.generateCatalogPackages)({
    requiredSolarKw: 9,
    requiredInverterKw,
    requiredBatteryKwh,
    phase: 'single',
    products: [panel, ...products],
});
const sameBrandPair = (brand, voltage = 'HV') => [
    product(`${brand}-inv`, 'inverter', brand, { capacityKw: 10, phase: 'single', voltageClass: voltage, compatibilityGroups: [`${brand}-${voltage}`] }),
    product(`${brand}-bat`, 'battery', brand, { capacityKwh: 10, voltageClass: voltage, compatibilityGroups: [`${brand}-${voltage}`] }),
];
function runPackageEngineTests() {
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
    const completeFallback = (0, packageEngine_1.generateCatalogPackages)({
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
    const legacyBrandRule = (0, packageEngine_1.generateCatalogPackages)({
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
    assert(multipleBrands.some((pkg) => pkg.primaryBrand === 'Alpha') &&
        multipleBrands.some((pkg) => pkg.primaryBrand === 'Beta'), 'A valid brand was suppressed after another package was generated.');
    // 16. A 9 kW requirement uses nearest higher 10 kW, not the lower 8 kW, for Recommended.
    const nineKwSizing = generate([
        ...[8, 10, 12].map((capacity) => product(`nine-inverter-${capacity}`, 'inverter', 'Nine KW', { capacityKw: capacity, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['NINE-LV'] })),
        product('nine-battery', 'battery', 'Nine KW', { capacityKwh: 5, voltageClass: 'LV', compatibilityGroups: ['NINE-LV'] }),
    ], 9, 5);
    assert(nineKwSizing.find((pkg) => pkg.primaryBrand === 'Nine KW')?.inverter.totalCapacityKw === 10, '9 kW requirement did not select the nearest higher 10 kW inverter.');
    // 17. Battery tiers are size-driven: 5 kWh is Recommended when 5, 10 and 12 exist.
    const fiveKwhBattery = generate([
        product('battery-tier-inv', 'inverter', 'Battery Tier', { capacityKw: 10, phase: 'single', voltageClass: 'LV', compatibilityGroups: ['BATTERY-TIER-LV'] }),
        ...[5, 10, 12].map((capacity) => product(`battery-tier-${capacity}`, 'battery', 'Battery Tier', { capacityKwh: capacity, voltageClass: 'LV', compatibilityGroups: ['BATTERY-TIER-LV'] })),
    ], 9, 5);
    const batteryTierPackage = fiveKwhBattery.find((pkg) => pkg.primaryBrand === 'Battery Tier');
    assert(batteryTierPackage?.packageType === 'recommended' && batteryTierPackage.battery?.totalCapacityKwh === 5, '5 kWh battery was not selected as Recommended for a 5 kWh requirement.');
    return 17;
}
runPackageEngineTests();
console.log('Package engine: 17 scenarios passed.');
