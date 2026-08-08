import type { ImageSourcePropType } from 'react-native';

export type BrandIdentity = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  canonicalSlug?: string | null;
  canonical_slug?: string | null;
  aliases?: string[] | null;
  logoUrl?: string | null;
  logo_url?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
};

const knownBrandLogos = {
  fox: require('../assets/home/brand-fox-ess.png'),
  foxess: require('../assets/home/brand-fox-ess.png'),
  solis: require('../assets/home/brand-solis.png'),
  longi: require('../assets/home/brand-longi.png'),
  jinko: require('../assets/home/brand-jinko.png'),
  jinkosolar: require('../assets/home/brand-jinko.png'),
  canadian: require('../assets/home/brand-canadian-solar.png'),
  canadiansolar: require('../assets/home/brand-canadian-solar.png'),
  dyness: require('../assets/home/brand-dyness.png'),
  soluna: require('../assets/home/brand-soluna.png'),
  pylontech: require('../assets/home/pylontech.jpg')
} as const satisfies Record<string, ImageSourcePropType>;

export const normalizeBrandKey = (value?: string | null) => (value ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '')
  .trim();

export const getBrandIdentityKeys = (brand?: BrandIdentity | null) => [
  brand?.id,
  brand?.name,
  brand?.slug,
  brand?.canonicalSlug,
  brand?.canonical_slug,
  ...(brand?.aliases ?? [])
].map(normalizeBrandKey).filter(Boolean);

export const brandIdentitiesMatch = (
  left?: BrandIdentity | string | null,
  right?: BrandIdentity | string | null
) => {
  const leftKeys = typeof left === 'string' ? [normalizeBrandKey(left)] : getBrandIdentityKeys(left);
  const rightKeys = typeof right === 'string' ? [normalizeBrandKey(right)] : getBrandIdentityKeys(right);
  return leftKeys.some((leftKey) => rightKeys.some((rightKey) =>
    leftKey === rightKey || (
      Math.min(leftKey.length, rightKey.length) >= 3 &&
      (leftKey.includes(rightKey) || rightKey.includes(leftKey))
    )
  ));
};

export const versionBrandLogoUrl = (url?: string | null, updatedAt?: string | null) => {
  if (!url) return undefined;
  if (!updatedAt) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('v', updatedAt);
    return parsed.toString();
  } catch {
    return url;
  }
};

export const getKnownBrandLogoSource = (brand?: BrandIdentity | string | null) => {
  const keys = typeof brand === 'string' ? [normalizeBrandKey(brand)] : getBrandIdentityKeys(brand);
  for (const key of keys) {
    const exact = knownBrandLogos[key as keyof typeof knownBrandLogos];
    if (exact) return exact;
    const partialKey = Object.keys(knownBrandLogos).find((candidate) =>
      key.includes(candidate) || candidate.includes(key)
    ) as keyof typeof knownBrandLogos | undefined;
    if (partialKey) return knownBrandLogos[partialKey];
  }
  return undefined;
};

export const getBrandInitials = (name?: string | null) => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0] ?? 'KA').slice(0, 2).toUpperCase();
};

export const resolveBrandLogo = ({
  brand,
  productLogoUrl
}: {
  brand: BrandIdentity;
  productLogoUrl?: string | null;
}) => {
  const logoUrl = brand.logoUrl ?? brand.logo_url ?? productLogoUrl ?? undefined;
  const updatedAt = brand.updatedAt ?? brand.updated_at ?? undefined;
  const key = normalizeBrandKey(brand.name) || normalizeBrandKey(brand.slug);
  return {
    key,
    remoteSource: logoUrl ? { uri: versionBrandLogoUrl(logoUrl, updatedAt)! } : undefined,
    localSource: getKnownBrandLogoSource(brand),
    fallbackLabel: key === 'goodwe' ? 'GOODWE' : getBrandInitials(brand.name)
  };
};
