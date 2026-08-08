const canonicalBrandAliases: Record<string, string> = {
  fox: 'fox',
  foxess: 'fox',
  goodwe: 'goodwe',
  solis: 'solis',
  dyness: 'dyness',
  soluna: 'soluna',
  pylontech: 'pylontech'
};

export const normalizePackageBrand = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (normalized.includes('goodwe')) return 'goodwe';
  if (normalized.startsWith('fox')) return 'fox';
  if (normalized.includes('solis')) return 'solis';
  if (normalized.includes('pylontech')) return 'pylontech';
  if (normalized.includes('dyness')) return 'dyness';
  if (normalized.includes('soluna')) return 'soluna';
  return canonicalBrandAliases[normalized] ?? normalized;
};

export const PACKAGE_COMPATIBILITY = {
  fox: {
    inverterBrands: ['fox'],
    batteryBrands: ['fox']
  },
  goodwe: {
    inverterBrands: ['goodwe'],
    batteryBrands: ['goodwe', 'dyness', 'soluna']
  },
  solis: {
    inverterBrands: ['solis'],
    batteryBrands: ['soluna', 'dyness', 'pylontech']
  }
} as const;

export const getPackageCompatibility = (
  packageBrand?: string | null,
  currentBatteryBrand?: string | null
) => {
  const canonicalPackageBrand = normalizePackageBrand(packageBrand);
  const configured = PACKAGE_COMPATIBILITY[canonicalPackageBrand as keyof typeof PACKAGE_COMPATIBILITY];
  if (configured) return configured;

  const currentBattery = normalizePackageBrand(currentBatteryBrand);
  return {
    inverterBrands: canonicalPackageBrand ? [canonicalPackageBrand] : [],
    batteryBrands: [...new Set([canonicalPackageBrand, currentBattery].filter(Boolean))]
  };
};
