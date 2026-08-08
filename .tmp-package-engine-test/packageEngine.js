"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateBatteryCompatibility = exports.normalizePackageText = void 0;
exports.generateCatalogPackageDiagnostics = generateCatalogPackageDiagnostics;
exports.generateCatalogPackages = generateCatalogPackages;
const round = (value, precision = 2) => {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};
const DEFAULT_MINIMUM_BASIC_SIZING_PERCENTAGE = 90;
const normalizePackageText = (value = '') => value
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
exports.normalizePackageText = normalizePackageText;
const normalizeGroup = (value) => value.trim().toUpperCase();
const groupsFor = (product) => (product.compatibilityGroups ?? [])
    .map(normalizeGroup)
    .filter(Boolean);
const sameBrand = (left, right) => {
    if (left.brandId && right.brandId && left.brandId === right.brandId)
        return true;
    const leftNames = [left.brandName, ...(left.brandAliases ?? [])].map(exports.normalizePackageText).filter(Boolean);
    const rightNames = [right.brandName, ...(right.brandAliases ?? [])].map(exports.normalizePackageText).filter(Boolean);
    return leftNames.some((name) => rightNames.includes(name));
};
const findException = (inverter, battery, exceptions) => exceptions.find((rule) => rule.active !== false &&
    ((rule.sourceProductId === inverter.id && rule.targetProductId === battery.id) ||
        (rule.sourceBrandId === inverter.brandId && rule.targetBrandId === battery.brandId)));
const evaluateBatteryCompatibility = (inverter, battery, exceptions = []) => {
    const exception = findException(inverter, battery, exceptions);
    if (exception?.status === 'incompatible') {
        return { compatible: false, preferred: false, reason: 'Explicitly marked incompatible.' };
    }
    const inverterVoltage = inverter.voltageClass;
    const batteryVoltage = battery.voltageClass;
    if (!inverterVoltage || !batteryVoltage || inverterVoltage === 'NONE' || batteryVoltage === 'NONE') {
        return { compatible: false, preferred: false, reason: 'Battery voltage class is not configured.' };
    }
    if (inverterVoltage !== batteryVoltage) {
        return { compatible: false, preferred: false, reason: 'Battery and inverter voltage classes do not match.' };
    }
    const inverterGroups = groupsFor(inverter);
    const batteryGroups = groupsFor(battery);
    const sharedGroup = inverterGroups.find((group) => batteryGroups.includes(group));
    const isSameBrand = sameBrand(inverter, battery);
    const sameBrandDefault = isSameBrand &&
        inverter.sameBrandCompatibilityEnabled !== false &&
        battery.sameBrandCompatibilityEnabled !== false;
    const explicitlyCompatible = exception?.status === 'compatible' || exception?.status === 'preferred';
    if (!sharedGroup && !sameBrandDefault && !explicitlyCompatible) {
        return { compatible: false, preferred: false, reason: 'No shared compatibility family.' };
    }
    return {
        compatible: true,
        preferred: exception?.status === 'preferred',
        group: sharedGroup,
        reason: exception?.status === 'preferred'
            ? 'Preferred product compatibility.'
            : sharedGroup
                ? `Shared ${sharedGroup} compatibility family.`
                : explicitlyCompatible
                    ? 'Explicitly marked compatible.'
                    : 'Same-brand voltage-matched compatibility.'
    };
};
exports.evaluateBatteryCompatibility = evaluateBatteryCompatibility;
const isLive = (product) => product.active !== false &&
    product.packageEligible !== false &&
    product.brandPackageGenerationEnabled !== false;
const productPrice = (product, quantity) => product.price == null ? null : product.price * quantity;
const createInverterConfigurations = (products) => products.flatMap((product) => {
    const capacity = product.capacityKw ?? 0;
    if (capacity <= 0)
        return [];
    const configurations = [{ product, quantity: 1, totalCapacityKw: capacity }];
    if (!product.parallelSupported)
        return configurations;
    const maximum = Math.max(1, Math.floor(product.maxParallelUnits ?? 1));
    for (let quantity = 2; quantity <= maximum; quantity += 1) {
        configurations.push({ product, quantity, totalCapacityKw: round(capacity * quantity) });
    }
    return configurations;
});
const createBatteryConfigurations = (inverter, products, exceptions) => products.flatMap((product) => {
    const compatibility = (0, exports.evaluateBatteryCompatibility)(inverter, product, exceptions);
    if (!compatibility.compatible)
        return [];
    const unitCapacity = product.usableCapacityKwh ?? product.capacityKwh ?? 0;
    if (unitCapacity <= 0)
        return [];
    const maximum = Math.max(1, Math.floor(product.maxParallelModules ?? 1));
    return Array.from({ length: maximum }, (_, index) => {
        const quantity = index + 1;
        return {
            product,
            quantity,
            totalCapacityKwh: round(unitCapacity * quantity),
            compatibilityGroup: compatibility.group,
            preferred: compatibility.preferred
        };
    });
});
const sortByCapacity = (items) => [...items].sort((left, right) => (left.totalCapacityKw ?? left.totalCapacityKwh ?? 0) - (right.totalCapacityKw ?? right.totalCapacityKwh ?? 0) ||
    (right.product.priority ?? 0) - (left.product.priority ?? 0) ||
    (left.quantity ?? 1) - (right.quantity ?? 1) ||
    (left.product.price ?? Number.MAX_SAFE_INTEGER) - (right.product.price ?? Number.MAX_SAFE_INTEGER));
const minimumBasicRatio = (percentage) => {
    const parsed = Number(percentage);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return DEFAULT_MINIMUM_BASIC_SIZING_PERCENTAGE / 100;
    return parsed > 1 ? parsed / 100 : parsed;
};
const selectCapacityTiers = (items, required, minimumBasicPercentage) => {
    const capacity = (item) => item.totalCapacityKw ?? item.totalCapacityKwh ?? 0;
    const sorted = [...items].sort((left, right) => capacity(left) - capacity(right));
    const recommendedIndex = sorted.findIndex((item) => capacity(item) >= required);
    const recommended = recommendedIndex >= 0 ? sorted[recommendedIndex] : undefined;
    const minimumBasicCapacity = required * minimumBasicRatio(minimumBasicPercentage);
    const basic = [...sorted].reverse().find((item) => capacity(item) < required &&
        capacity(item) >= minimumBasicCapacity);
    const better = recommended
        ? sorted.find((item) => capacity(item) > capacity(recommended))
        : undefined;
    return { basic, recommended, better };
};
const selectPanel = (products, requiredSolarKw, selectedPanelWattage) => products
    .map((product) => {
    const panelWattage = product.panelWattage ?? 0;
    if (panelWattage <= 0)
        return null;
    const quantity = Math.max(1, Math.ceil((requiredSolarKw * 1000) / panelWattage));
    const totalCapacityKw = round((quantity * panelWattage) / 1000);
    const unitPrice = product.pricePerWatt != null
        ? product.pricePerWatt * panelWattage
        : product.price ?? null;
    return {
        product,
        quantity,
        panelWattage,
        totalCapacityKw,
        unitPrice,
        preferredWattage: selectedPanelWattage === panelWattage,
        oversize: totalCapacityKw - requiredSolarKw
    };
})
    .filter((item) => Boolean(item))
    .sort((left, right) => Number(right.preferredWattage) - Number(left.preferredWattage) ||
    Number(right.product.available !== false) - Number(left.product.available !== false) ||
    left.oversize - right.oversize ||
    (right.product.priority ?? 0) - (left.product.priority ?? 0) ||
    (left.unitPrice ?? Number.MAX_SAFE_INTEGER) - (right.unitPrice ?? Number.MAX_SAFE_INTEGER))[0];
const reasonForTier = (tier) => {
    if (tier === 'basic')
        return 'Lower-cost nearest available configuration.';
    if (tier === 'better')
        return 'Additional capacity for backup or future expansion.';
    return 'Nearest configuration that meets the selected requirements.';
};
const buildCandidate = (tier, inverter, battery, panel, input) => {
    const limitations = [];
    if (inverter.totalCapacityKw < input.requiredInverterKw) {
        limitations.push(`Inverter capacity is ${round(input.requiredInverterKw - inverter.totalCapacityKw, 1)} kW below the selected requirement.`);
    }
    if (input.requiredBatteryKwh > 0 && battery && battery.totalCapacityKwh < input.requiredBatteryKwh) {
        limitations.push(`Battery capacity is ${round(input.requiredBatteryKwh - battery.totalCapacityKwh, 1)} kWh below the selected backup requirement.`);
    }
    if (inverter.quantity > 1) {
        limitations.push(`${inverter.quantity} matching inverter units are used in parallel.`);
    }
    const inverterTotal = productPrice(inverter.product, inverter.quantity);
    const batteryTotal = battery ? productPrice(battery.product, battery.quantity) : 0;
    const panelTotal = panel.unitPrice == null ? null : panel.unitPrice * panel.quantity;
    const totalPrice = inverterTotal == null || batteryTotal == null || panelTotal == null
        ? null
        : round(inverterTotal + batteryTotal + panelTotal);
    const inverterShortfall = Math.max(0, input.requiredInverterKw - inverter.totalCapacityKw);
    const batteryShortfall = Math.max(0, input.requiredBatteryKwh - (battery?.totalCapacityKwh ?? 0));
    const inverterOversize = Math.max(0, inverter.totalCapacityKw - input.requiredInverterKw);
    const batteryOversize = Math.max(0, (battery?.totalCapacityKwh ?? 0) - input.requiredBatteryKwh);
    const priority = (inverter.product.brandPriority ?? 0) +
        (inverter.product.priority ?? 0) +
        (battery?.product.priority ?? 0) +
        (panel.product.priority ?? 0);
    const score = round(inverterShortfall * 100 +
        batteryShortfall * 80 +
        inverterOversize * 3 +
        batteryOversize * 2 +
        panel.oversize +
        Math.max(0, inverter.quantity - 1) * 8 -
        priority * 0.5 -
        (battery?.preferred ? 10 : 0) +
        (totalPrice == null ? 2 : Math.min(totalPrice / 10000000, 5)), 3);
    return {
        id: [tier, inverter.product.brandId, inverter.product.id, `x${inverter.quantity}`, battery?.product.id ?? 'no-battery', `x${battery?.quantity ?? 0}`, panel.product.id].join('-'),
        packageType: tier,
        primaryBrandId: inverter.product.brandId,
        primaryBrand: inverter.product.brandName,
        packageImageUrl: inverter.product.brandPackageImageUrl,
        inverter: {
            productId: inverter.product.id,
            quantity: inverter.quantity,
            totalCapacityKw: inverter.totalCapacityKw
        },
        battery: battery ? {
            productId: battery.product.id,
            quantity: battery.quantity,
            totalCapacityKwh: battery.totalCapacityKwh
        } : undefined,
        panel: {
            productId: panel.product.id,
            quantity: panel.quantity,
            panelWattage: panel.panelWattage,
            totalCapacityKw: panel.totalCapacityKw
        },
        compatibilityGroup: battery?.compatibilityGroup,
        preferredCompatibility: Boolean(battery?.preferred),
        totalPrice,
        recommendationReason: reasonForTier(tier),
        limitations,
        score
    };
};
const describeConfiguration = (configuration, unit) => configuration
    ? `${configuration.product.brandName} ${configuration.product.model ?? configuration.product.name} (${'totalCapacityKw' in configuration ? configuration.totalCapacityKw : configuration.totalCapacityKwh} ${unit})`
    : undefined;
const evaluateCatalogPackages = (input) => {
    const liveProducts = input.products.filter(isLive);
    const panels = liveProducts.filter((product) => product.category === 'panel');
    const inverters = liveProducts.filter((product) => product.category === 'inverter' &&
        (!input.phase || !product.phase || product.phase === input.phase));
    const batteries = liveProducts.filter((product) => product.category === 'battery');
    const panel = selectPanel(panels, input.requiredSolarKw, input.selectedPanelWattage);
    const eligiblePanels = panels
        .filter((product) => (product.panelWattage ?? 0) > 0)
        .map((product) => `${product.brandName} ${product.model ?? product.name} (${product.panelWattage} W)`);
    const diagnostics = [];
    if (!panel || inverters.length === 0) {
        return {
            packages: [],
            diagnostics: [{
                    templateName: 'Catalog',
                    live: liveProducts.length > 0,
                    requiredInverterKw: input.requiredInverterKw,
                    eligibleInverterProducts: inverters.map((product) => `${product.brandName} ${product.model ?? product.name} (${product.capacityKw} kW)`),
                    compatibleBatteryFamilies: [],
                    eligibleBatteryProducts: [],
                    eligiblePanels,
                    generated: false,
                    rejectionReason: !panel ? 'No eligible panel product found.' : 'No eligible inverter products found.'
                }]
        };
    }
    const configurations = createInverterConfigurations(inverters);
    const byBrand = new Map();
    configurations.forEach((configuration) => {
        const key = configuration.product.brandId || (0, exports.normalizePackageText)(configuration.product.brandName);
        byBrand.set(key, [...(byBrand.get(key) ?? []), configuration]);
    });
    const candidatesByBrand = new Map();
    byBrand.forEach((brandConfigurations, brandKey) => {
        const templateName = brandConfigurations[0]?.product.brandName ?? brandKey;
        // Size tiers must be selected from configurations that can form a complete
        // package. Otherwise a nearer but unconfigured inverter can mask a slightly
        // smaller valid inverter and incorrectly reduce the whole brand to zero.
        const completeConfigurations = input.requiredBatteryKwh > 0
            ? brandConfigurations.filter((configuration) => createBatteryConfigurations(configuration.product, batteries, input.compatibilityExceptions ?? []).length > 0)
            : brandConfigurations;
        const inverterTiers = selectCapacityTiers(sortByCapacity(completeConfigurations), input.requiredInverterKw, input.minimumBasicSizingPercentage);
        const result = {};
        const diagnostic = {
            templateName,
            live: brandConfigurations.some((configuration) => isLive(configuration.product)),
            requiredInverterKw: input.requiredInverterKw,
            eligibleInverterProducts: brandConfigurations.map((configuration) => `${configuration.product.brandName} ${configuration.product.model ?? configuration.product.name} (${configuration.totalCapacityKw} kW)`),
            compatibleBatteryFamilies: [],
            eligibleBatteryProducts: [],
            eligiblePanels,
            generated: false,
            rejectionReason: ''
        };
        if (completeConfigurations.length === 0) {
            diagnostic.rejectionReason = input.requiredBatteryKwh > 0
                ? 'No inverter in this brand has a compatible active battery product.'
                : 'No complete inverter configuration found.';
            diagnostics.push(diagnostic);
            candidatesByBrand.set(brandKey, result);
            return;
        }
        if (!inverterTiers.basic && !inverterTiers.recommended && !inverterTiers.better) {
            const highestCapacity = Math.max(...completeConfigurations.map((configuration) => configuration.totalCapacityKw));
            diagnostic.rejectionReason = `Highest valid inverter is ${highestCapacity} kW against a ${input.requiredInverterKw} kW requirement; Basic minimum is ${round(input.requiredInverterKw * minimumBasicRatio(input.minimumBasicSizingPercentage), 1)} kW.`;
            diagnostics.push(diagnostic);
            candidatesByBrand.set(brandKey, result);
            return;
        }
        ['basic', 'recommended', 'better'].forEach((tier) => {
            const inverter = tier === 'basic'
                ? inverterTiers.basic ?? inverterTiers.recommended
                : tier === 'better'
                    ? inverterTiers.better ?? inverterTiers.recommended
                    : inverterTiers.recommended;
            if (!inverter)
                return;
            let battery;
            let batteryTiers;
            if (input.requiredBatteryKwh > 0) {
                const batteryConfigurations = createBatteryConfigurations(inverter.product, batteries, input.compatibilityExceptions ?? []);
                batteryTiers = selectCapacityTiers(sortByCapacity(batteryConfigurations), input.requiredBatteryKwh);
                battery = tier === 'basic'
                    ? batteryTiers.basic ?? batteryTiers.recommended
                    : tier === 'better'
                        ? batteryTiers.better ?? batteryTiers.recommended
                        : batteryTiers.recommended;
                if (!battery)
                    return;
                diagnostic.compatibleBatteryFamilies = [...new Set(batteryConfigurations.map((configuration) => configuration.compatibilityGroup).filter((group) => Boolean(group)))];
                diagnostic.eligibleBatteryProducts = batteryConfigurations.map((configuration) => `${configuration.product.brandName} ${configuration.product.model ?? configuration.product.name} (${configuration.totalCapacityKwh} kWh)`);
            }
            if (tier === 'basic' &&
                inverter === inverterTiers.recommended &&
                (!batteryTiers || battery === batteryTiers.recommended))
                return;
            if (tier === 'better' &&
                inverter === inverterTiers.recommended &&
                (!batteryTiers || battery === batteryTiers.recommended))
                return;
            result[tier] = buildCandidate(tier, inverter, battery, panel, input);
        });
        const selected = result.recommended ?? result.basic ?? result.better;
        diagnostic.generated = Boolean(selected);
        diagnostic.selectedInverter = describeConfiguration(selected
            ? {
                product: completeConfigurations.find((configuration) => configuration.product.id === selected.inverter.productId)?.product ?? completeConfigurations[0].product,
                quantity: selected.inverter.quantity,
                totalCapacityKw: selected.inverter.totalCapacityKw
            }
            : undefined, 'kW');
        diagnostic.selectedBattery = selected?.battery
            ? diagnostic.eligibleBatteryProducts.find((label) => label.includes(`(${selected.battery?.totalCapacityKwh} kWh)`))
            : undefined;
        diagnostic.rejectionReason = selected
            ? `Generated ${selected.packageType} package.`
            : diagnostic.rejectionReason || 'No valid Basic, Recommended, or Better tier could be formed.';
        diagnostics.push(diagnostic);
        candidatesByBrand.set(brandKey, result);
    });
    // Explore Packages needs one independently sized package per eligible brand.
    // A valid Fox result must never suppress GoodWe, Solis, or any future brand.
    const packages = [...candidatesByBrand.values()]
        .map((tiers) => tiers.recommended ?? tiers.basic ?? tiers.better)
        .filter((item) => Boolean(item))
        .sort((left, right) => left.score - right.score || left.primaryBrand.localeCompare(right.primaryBrand));
    return { packages, diagnostics };
};
function generateCatalogPackageDiagnostics(input) {
    return evaluateCatalogPackages(input).diagnostics;
}
function generateCatalogPackages(input) {
    return evaluateCatalogPackages(input).packages;
}
