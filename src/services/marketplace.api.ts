import { marketplaceCategories } from '@/constants/products';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MarketplaceBrand, Product, ProductCategory } from '@/types/product.types';
import { formatCapacityKw, parseCapacityKw, parseCapacityWatt } from '@/utils/capacity';
import { normalizeBatteryCapacity } from '@/utils/batteryCapacity';
import { normalizePublicStorageUrl } from '@/utils/storage';
import { normalizeCategoryText, normalizeProductCategory } from '@/utils/productCategory';
import { isCatalogProductVisible, isPackageGenerationProduct } from '@/utils/productEligibility';
import {
  brandIdentitiesMatch,
  getBrandIdentityKeys,
  normalizeBrandKey,
  versionBrandLogoUrl,
  type BrandIdentity
} from '@/utils/brandLogo';

type BackendCategory = string;

type BackendBrand = {
  id: string;
  name: string | null;
  category: BackendCategory | null;
  slug?: string | null;
  canonical_slug?: string | null;
  aliases?: string[] | null;
  logo_url: string | null;
  updated_at?: string | null;
};

type BackendProduct = {
  id: string;
  brand_id?: string | null;
  product_family_id?: string | null;
  category: BackendCategory | null;
  sub_category?: string | null;
  name: string;
  model: string | null;
  capacity_value?: number | null;
  capacity_unit?: string | null;
  capacity_watt?: number | null;
  capacity_kw?: number | null;
  battery_capacity_kwh?: number | null;
  capacity_kwh?: number | null;
  capacity_wh?: number | null;
  usable_capacity_kwh?: number | null;
  usable_factor_override?: number | null;
  panel_wattage?: number | null;
  phase?: 'single' | 'three' | null;
  voltage_class?: 'LV' | 'HV' | 'NONE' | null;
  voltage_type?: string | null;
  battery_voltage_type?: string | null;
  compatibility_groups?: string[] | null;
  parallel_supported?: boolean;
  max_parallel_units?: number | null;
  same_model_parallel_only?: boolean;
  max_parallel_modules?: number | null;
  commercial_max_parallel_modules?: number | null;
  maximum_recommended_pv_kwp?: number | null;
  compatible_inverter_brand_ids?: string[] | null;
  compatible_battery_brand_ids?: string[] | null;
  panel_width_mm?: number | null;
  panel_height_mm?: number | null;
  commercial_spec_status?: 'ready' | 'needs_review' | 'invalid' | null;
  same_brand_compatibility_enabled?: boolean;
  package_eligible?: boolean | null;
  priority?: number | null;
  is_active?: boolean | null;
  price: number | null;
  price_unit?: 'per_watt' | 'total_price' | null;
  rate_per_watt?: number | null;
  stock_status?: string | null;
  is_visible?: boolean | null;
  warranty_years?: number | null;
  warranty?: string | null;
  image_url?: string | null;
  specifications?: Record<string, unknown> | null;
  is_featured?: boolean;
  description?: string | null;
  accessory_subcategory?: string | null;
  short_spec?: string | null;
  secondary_spec?: string | null;
  compare_at_price?: number | null;
  currency_code?: string | null;
  stock_quantity?: number | null;
  sku?: string | null;
  gallery_images?: string[] | null;
  usage_instructions?: string | null;
  package_contents?: string | null;
  badge?: 'best_seller' | 'best_value' | 'new' | null;
  updated_at?: string | null;
  brands: {
    id?: string | null;
    name: string;
    slug?: string | null;
    canonical_slug?: string | null;
    logo_url?: string | null;
    updated_at?: string | null;
    aliases?: string[] | null;
    priority?: number | null;
    package_generation_enabled?: boolean | null;
    package_image_url?: string | null;
    default_compatibility_group?: string | null;
  } | null;
};

// Wildcard columns keep the catalog query compatible before and after migration
// 009. Embedded brands are a left relation, so legacy products are not removed
// when optional package metadata is absent.
const productSelect = '*, brands:brands!products_brand_id_fkey(id, name, slug, canonical_slug, logo_url, package_image_url, updated_at, aliases, priority, package_generation_enabled, default_compatibility_group)';

const appendImageVersion = (url?: string | null, updatedAt?: string | null) => {
  if (!url) return null;
  if (!updatedAt) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('v', updatedAt);
    return parsed.toString();
  } catch {
    return url;
  }
};

export type PackageCompatibilityRule = {
  sourceProductId?: string;
  targetProductId?: string;
  sourceFamilyId?: string;
  targetFamilyId?: string;
  sourceBrandId?: string;
  targetBrandId?: string;
  voltageType?: 'LV' | 'HV' | 'NONE';
  status: 'preferred' | 'compatible' | 'incompatible';
  active?: boolean;
};

export type PackageGenerationStatus = {
  schemaMode: 'database-driven' | 'legacy-transition';
  configurationReady: boolean;
  diagnostic: string;
};

const backendCategories: Record<ProductCategory, BackendCategory[]> = {
  inverter: ['inverter', 'hybrid_inverter', 'hv_hybrid_inverter'],
  panel: ['solar_panel', 'solar_panels', 'panel', 'panels', 'pv_panel', 'pv_module', 'module', 'modules'],
  battery: ['battery', 'batteries', 'battery_storage', 'energy_storage', 'lithium_battery', 'lithium'],
  accessory: ['mounting_structure', 'accessory', 'accessories']
};

const normalizeLabel = normalizeCategoryText;

const mobileCategory = (product: Pick<BackendProduct, 'category' | 'sub_category' | 'name' | 'model'>): ProductCategory => {
  return normalizeProductCategory({
    category: product.category,
    subCategory: product.sub_category,
    name: product.name,
    model: product.model
  });
};

const capacityLabel = (product: BackendProduct) => {
  const category = mobileCategory(product);
  const source = [product.name, product.model].filter(Boolean).join(' ');
  const watt = product.capacity_watt ?? parseCapacityWatt(product.capacity_value, product.capacity_unit, source);
  const kw = category === 'battery' ? null : product.capacity_kw ?? parseCapacityKw(product.capacity_value, product.capacity_unit, source);
  const kwh = category === 'battery' ? normalizeBatteryCapacity(product).capacityKwh : null;

  if (category === 'panel' && watt) return `${Number(watt).toFixed(0)}W`;
  if (category === 'battery' && kwh) return `${Number(kwh).toFixed(1).replace('.0', '')} kWh`;
  if (category === 'inverter' && kw) return formatCapacityKw(kw);
  if (watt) return `${Number(watt).toFixed(0)}W`;
  return null;
};

const warrantyLabel = (years?: number | null) => years == null ? null : `${Number(years)} Years Warranty`;

const specificationValues = (specifications?: Record<string, unknown> | null) => Object.values(specifications ?? {})
  .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
  .map(String);

const specificationNumber = (specifications: Record<string, unknown> | null | undefined, key: string) => {
  const value = specifications?.[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

// These legacy fallbacks only accept explicit technical text. They deliberately
// leave ambiguous products unclassified so an admin must review them.
const normalizeVoltageClass = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (normalized === 'lv' || normalized === 'low voltage' || normalized === 'lowvoltage') return 'LV' as const;
  if (normalized === 'hv' || normalized === 'high voltage' || normalized === 'highvoltage') return 'HV' as const;
  if (normalized === 'none' || normalized === 'no battery') return 'NONE' as const;
  return null;
};

const explicitVoltageClass = (product: BackendProduct) => {
  const configured = normalizeVoltageClass(product.voltage_class) ??
    normalizeVoltageClass(product.voltage_type) ??
    normalizeVoltageClass(product.battery_voltage_type) ??
    normalizeVoltageClass(product.specifications?.voltage_type) ??
    normalizeVoltageClass(product.specifications?.battery_voltage_type) ??
    normalizeVoltageClass(product.specifications?.battery_type) ??
    normalizeVoltageClass(product.specifications?.battery_architecture) ??
    normalizeVoltageClass(product.specifications?.voltage_architecture);
  if (configured) return configured;
  const text = [product.name, product.model].filter(Boolean).join(' ');
  if (/\b(?:high[\s-]*voltage|hv)\b/i.test(text)) return 'HV' as const;
  if (/\b(?:low[\s-]*voltage|lv)\b/i.test(text)) return 'LV' as const;
  return null;
};

const explicitPhase = (product: BackendProduct) => {
  const configured = product.specifications?.phase;
  if (typeof configured === 'string') {
    if (/^(?:three[_\s-]*phase|3[_\s-]*phase)$/i.test(configured)) return 'three' as const;
    if (/^(?:single[_\s-]*phase|1[_\s-]*phase)$/i.test(configured)) return 'single' as const;
  }
  const text = [product.name, product.model].filter(Boolean).join(' ');
  if (/\b(?:three[\s-]*phase|3[\s-]*(?:phase|p))\b/i.test(text)) return 'three' as const;
  if (/\b(?:single[\s-]*phase|1[\s-]*(?:phase|p))\b/i.test(text)) return 'single' as const;
  return null;
};

const mapProduct = (product: BackendProduct): Product => {
  const category = mobileCategory(product);
  const batteryCapacity = category === 'battery' ? normalizeBatteryCapacity(product) : null;
  const capacity = capacityLabel(product);
  const warranty = warrantyLabel(product.warranty_years);
  const specs = [capacity, ...specificationValues(product.specifications), warranty].filter((value): value is string => Boolean(value));
  const source = [product.name, product.model, capacity, ...specificationValues(product.specifications)].filter(Boolean).join(' ');
  const batteryCapacityKwh = batteryCapacity?.capacityKwh ?? null;

  if (__DEV__ && category === 'battery' && batteryCapacity?.status !== 'valid') {
    // Data-quality diagnostics are expected while catalog records are being
    // completed. console.warn triggers a customer-facing Expo LogBox overlay.
    console.info('Battery sizing diagnostic: product excluded until capacity metadata is configured', {
      productId: product.id,
      productName: product.name,
      capacityKwh: product.capacity_kwh,
      batteryCapacityKwh: product.battery_capacity_kwh,
      capacityValue: product.capacity_value,
      capacityUnit: product.capacity_unit,
      status: batteryCapacity?.status,
      issue: batteryCapacity?.issue,
    });
  }

  return {
    id: product.id,
    category,
    rawCategory: product.category,
    rawSubCategory: product.sub_category,
    brand: product.brands?.name ?? 'KaamAsaan Verified',
    brandName: product.brands?.name ?? null,
    brandId: product.brands?.id ?? null,
    brandSlug: product.brands?.slug ?? null,
    brandAliases: product.brands?.aliases ?? [],
    brandPriority: product.brands?.priority ?? 0,
    brandPackageGenerationEnabled: product.brands?.package_generation_enabled ?? null,
    brandPackageImageUrl: appendImageVersion(
      normalizePublicStorageUrl('package-images', product.brands?.package_image_url) || product.brands?.package_image_url || null,
      product.brands?.updated_at
    ),
    brandLogo: versionBrandLogoUrl(
      normalizePublicStorageUrl('brand-logos', product.brands?.logo_url) || product.brands?.logo_url || null,
      product.brands?.updated_at
    ) ?? null,
    productFamilyId: product.product_family_id ?? null,
    brandDefaultCompatibilityGroup: product.brands?.default_compatibility_group ?? null,
    brands: product.brands,
    name: product.name,
    model: product.model ?? undefined,
    image: normalizePublicStorageUrl('product-images', product.image_url),
    warranty: product.warranty ?? warranty ?? undefined,
    capacity: capacity ?? undefined,
    capacityWatt: product.panel_wattage ?? product.capacity_watt ?? parseCapacityWatt(product.capacity_value, product.capacity_unit, source),
    capacity_watt: product.capacity_watt,
    capacityKw: category === 'battery' ? null : product.capacity_kw ?? parseCapacityKw(product.capacity_value, product.capacity_unit, source),
    batteryCapacityKwh,
    usableCapacityKwh: product.usable_capacity_kwh,
    usableFactorOverride: product.usable_factor_override,
    capacityValue: product.capacity_value,
    capacityUnit: product.capacity_unit,
    capacityWh: product.capacity_wh,
    batteryCapacityStatus: batteryCapacity?.status,
    batteryCapacityIssue: batteryCapacity?.issue,
    panelWattage: product.panel_wattage,
    phase: product.phase ?? explicitPhase(product),
    voltageClass: explicitVoltageClass(product),
    compatibilityGroups: product.compatibility_groups ?? [],
    parallelSupported: product.parallel_supported ?? false,
    maxParallelUnits: product.max_parallel_units,
    sameModelParallelOnly: product.same_model_parallel_only ?? true,
    maxParallelModules: product.max_parallel_modules,
    commercialMaxParallelModules: product.commercial_max_parallel_modules,
    maximumRecommendedPvKwp: product.maximum_recommended_pv_kwp,
    compatibleInverterBrandIds: product.compatible_inverter_brand_ids ?? [],
    compatibleBatteryBrandIds: product.compatible_battery_brand_ids ?? [],
    panelWidthMm: product.panel_width_mm,
    panelHeightMm: product.panel_height_mm,
    commercialSpecStatus: product.commercial_spec_status,
    sameBrandCompatibilityEnabled: product.same_brand_compatibility_enabled ?? true,
    packageEligible: product.package_eligible,
    priority: product.priority ?? 0,
    isActive: product.is_active,
    priceUnit: product.price_unit ?? (category === 'panel' ? 'per_watt' : 'total_price'),
    ratePerWatt: product.rate_per_watt ?? specificationNumber(product.specifications, 'rate_per_watt'),
    stockStatus: product.stock_status,
    isVisible: product.is_visible,
    subCategory: product.sub_category,
    specifications: product.specifications,
    tag: product.is_featured ? 'Recommended' : undefined,
    price: product.price,
    description: product.description,
    accessorySubcategory: product.accessory_subcategory ?? product.sub_category,
    shortSpec: product.short_spec,
    secondarySpec: product.secondary_spec,
    compareAtPrice: product.compare_at_price,
    currencyCode: product.currency_code ?? 'PKR',
    stockQuantity: product.stock_quantity,
    sku: product.sku,
    galleryImages: (Array.isArray(product.gallery_images) ? product.gallery_images : [])
      .filter((value): value is string => typeof value === 'string')
      .map((value) => normalizePublicStorageUrl('product-images', value))
      .filter((value): value is string => Boolean(value)),
    usageInstructions: product.usage_instructions,
    packageContents: product.package_contents,
    badge: product.badge,
    isFeatured: product.is_featured ?? false,
    updatedAt: product.updated_at,
    specs
  };
};

const requireSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
};

type PackageSchemaCapability = 'available' | 'unavailable';

let packageSchemaCapabilityPromise: Promise<PackageSchemaCapability> | null = null;
let hasLoggedLegacyAdapter = false;

const missingSchemaCodes = new Set(['42703', '42P01', 'PGRST204', 'PGRST205']);
const isMissingSchemaError = (error: unknown) => Boolean(
  error &&
  typeof error === 'object' &&
  missingSchemaCodes.has(String((error as { code?: string }).code ?? ''))
);

const inspectPackageGenerationSchema = async (): Promise<PackageSchemaCapability> => {
  const checks = await Promise.all([
    supabase.from('brands').select('package_generation_enabled, default_compatibility_group, package_image_url, priority').limit(1),
    supabase.from('products').select('package_eligible, compatibility_groups, voltage_class, capacity_kwh, panel_wattage, priority').limit(1),
    supabase.from('family_compatibility').select('id').limit(1),
    supabase.from('product_compatibility_exceptions').select('id').limit(1),
  ]);
  const errors = checks.map((result) => result.error).filter(Boolean);
  if (errors.length === 0) return 'available';
  if (errors.every(isMissingSchemaError)) return 'unavailable';

  // Permission, authentication, and network failures are not proof that the
  // schema is absent. Throw so React Query can retry and surface a load error.
  const firstError = errors[0] as { code?: string; message?: string };
  throw new Error(`Unable to verify package schema (${firstError.code ?? 'unknown'}): ${firstError.message ?? 'Supabase query failed.'}`);
};

const getPackageSchemaCapability = () => {
  if (!packageSchemaCapabilityPromise) {
    packageSchemaCapabilityPromise = inspectPackageGenerationSchema().catch((error) => {
      packageSchemaCapabilityPromise = null;
      throw error;
    });
  }
  return packageSchemaCapabilityPromise;
};

const hasPackageGenerationSchema = async () => (await getPackageSchemaCapability()) === 'available';

const logProductsResponse = (label: string, data: unknown, error: unknown) => {
  if (!__DEV__) return;
  const rows = Array.isArray(data) ? data as Array<{ category?: string | null }> : data ? [data as { category?: string | null }] : [];
  if (rows.length > 0) {
    console.info(`Catalog response (${label})`, {
      count: rows.length,
      rawCategories: [...new Set(rows.map((row) => row.category).filter(Boolean))]
    });
  }
  if (error && typeof error === 'object') {
    const supabaseError = error as { message?: string; details?: string; code?: string };
    console.warn(`Catalog query failed (${label})`, {
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details
    });
  }
};

const logBrandQueryResponse = (label: string, query: string, data: unknown, error: unknown) => {
  if (!__DEV__) return;
  const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [];
  const supabaseError = error && typeof error === 'object'
    ? error as { message?: string; code?: string; details?: string; hint?: string }
    : null;
  const payload = {
    query,
    rowCount: rows.length,
    returnedShape: rows[0] ? Object.keys(rows[0]) : [],
    error: supabaseError ? {
      message: supabaseError.message,
      code: supabaseError.code,
      details: supabaseError.details,
      hint: supabaseError.hint
    } : null
  };
  if (supabaseError) console.warn(`Marketplace brand query failed (${label})`, payload);
  else console.info(`Marketplace brand query succeeded (${label})`, payload);
};

const safeMapProducts = (data: BackendProduct[]) => data
  .map((product) => {
    try {
      return mapProduct(product);
    } catch (error) {
      console.error('Product mapping failed:', product.id, error);
      return null;
    }
  })
  .filter((product): product is Product => Boolean(product));

const applyResolvedBrandLogos = (
  products: Product[],
  brands: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    canonical_slug?: string | null;
    aliases?: string[] | null;
    logo_url?: string | null;
    updated_at?: string | null;
  }[]
) => {
  const logoByKey = new Map<string, string>();
  brands.forEach((brand) => {
    const logo = versionBrandLogoUrl(
      normalizePublicStorageUrl('brand-logos', brand.logo_url) || brand.logo_url || null,
      brand.updated_at
    ) ?? null;
    if (!logo) return;
    getBrandIdentityKeys(brand).forEach((key) => {
      if (!logoByKey.has(key)) logoByKey.set(key, logo);
    });
  });
  return products.map((product) => {
    const keys = [
      product.brandId,
      product.brandName,
      product.brand,
      product.brandSlug,
      ...(product.brandAliases ?? []),
      product.brands?.id,
      product.brands?.name,
      product.brands?.slug,
      product.brands?.canonical_slug,
      ...(product.brands?.aliases ?? []),
    ].map(normalizeBrandKey).filter(Boolean);
    const resolvedLogo = keys.map((key) => logoByKey.get(key)).find(Boolean);
    const directLogo = versionBrandLogoUrl(
      normalizePublicStorageUrl('brand-logos', product.brands?.logo_url) || product.brands?.logo_url || null,
      product.brands?.updated_at
    ) ?? null;
    const resolvedBrandLogoUrl = directLogo ?? resolvedLogo ?? null;
    return {
      ...product,
      brandLogo: product.brandLogo || resolvedBrandLogoUrl
    };
  });
};

const fetchProducts = async ({
  label,
  activeOnly = false,
  productId
}: {
  label: string;
  activeOnly?: boolean;
  productId?: string;
}) => {
  let query = supabase
    .from('products')
    .select(productSelect)
    .order('name');
  if (activeOnly) query = query.or('is_active.eq.true,is_active.is.null');
  if (productId) query = query.eq('id', productId);

  const primary = productId ? await query.maybeSingle() : await query;
  logProductsResponse(`${label} primary`, primary.data, primary.error);
  return primary;
};

export const marketplaceApi = {
  getCategories: async () => marketplaceCategories,
  getProducts: async (category?: ProductCategory) => {
    requireSupabase();
    const { data, error } = await fetchProducts({ label: 'products', activeOnly: true });

    if (error) throw error;

    const products = safeMapProducts((data as unknown as BackendProduct[]) ?? []).filter(isCatalogProductVisible);
    const filtered = category ? products.filter((product) => product.category === category) : products;
    if (__DEV__) console.info('Catalog mapping summary', {
      mappedProducts: products.length,
      requestedCategory: category ?? 'all',
      matchingProducts: filtered.length,
      batteryProducts: products.filter((product) => product.category === 'battery').length
    });
    return filtered;
  },
  getProduct: async (id: string) => {
    requireSupabase();
    const { data, error } = await fetchProducts({ label: 'product', activeOnly: true, productId: id });
    if (error) throw error;
    if (!data) return null;
    try {
      const product = mapProduct(data as unknown as BackendProduct);
      return product.isVisible === false ? null : product;
    } catch (mapError) {
      console.error('Product mapping failed:', (data as { id?: string }).id, mapError);
      throw mapError;
    }
  },
  getPackageInventory: async () => {
    requireSupabase();
    const { data, error } = await fetchProducts({ label: 'package inventory' });
    if (error) throw error;
    let products = safeMapProducts((data as unknown as BackendProduct[]) ?? []);
    if (await hasPackageGenerationSchema()) {
      const [{ data: templates, error: templatesError }, { data: families, error: familiesError }, { data: packageBrands, error: brandsError }] = await Promise.all([
        supabase.from('package_templates').select('primary_inverter_family_id, package_image_url, updated_at, status, is_active').eq('status', 'live').eq('is_active', true),
        supabase.from('product_families').select('id, brand_id'),
        supabase.from('brands').select('id, name, slug, canonical_slug, aliases, logo_url, updated_at')
      ]);
      if (templatesError) throw templatesError;
      if (familiesError) throw familiesError;
      if (brandsError) throw brandsError;
      const brandsForLookup = (packageBrands ?? []) as {
        id?: string | null;
        name?: string | null;
        slug?: string | null;
        canonical_slug?: string | null;
        aliases?: string[] | null;
        logo_url?: string | null;
      }[];
      const brandById = new Map(brandsForLookup.map((brand) => [brand.id, brand]));
      const brandByFamily = new Map((families ?? []).map((family: { id: string; brand_id: string }) => [family.id, family.brand_id]));
      const imageByBrand = new Map<string, { image: string; updatedAt: number }>();
      const imageByBrandKey = new Map<string, { image: string; updatedAt: number }>();
      for (const template of (templates ?? []) as { primary_inverter_family_id: string; package_image_url?: string | null; updated_at?: string | null }[]) {
        const brandId = brandByFamily.get(template.primary_inverter_family_id);
        const image = appendImageVersion(
          normalizePublicStorageUrl('package-images', template.package_image_url) || template.package_image_url,
          template.updated_at
        );
        const updatedAt = template.updated_at ? Date.parse(template.updated_at) || 0 : 0;
        if (brandId && image) {
          const current = imageByBrand.get(brandId);
          if (!current || updatedAt >= current.updatedAt) imageByBrand.set(brandId, { image, updatedAt });
          getBrandIdentityKeys(brandById.get(brandId)).forEach((key) => {
            const currentByKey = imageByBrandKey.get(key);
            if (!currentByKey || updatedAt >= currentByKey.updatedAt) imageByBrandKey.set(key, { image, updatedAt });
          });
        }
      }
      products = applyResolvedBrandLogos(products, brandsForLookup).map((product) => {
        const keys = [
          product.brandId,
          product.brandName,
          product.brand,
          product.brandSlug,
          ...(product.brandAliases ?? []),
          product.brands?.id,
          product.brands?.name,
          product.brands?.slug,
          product.brands?.canonical_slug,
          ...(product.brands?.aliases ?? []),
        ].map(normalizeBrandKey).filter(Boolean);
        const resolvedPackageImage = imageByBrand.get(product.brandId ?? '')?.image ?? keys.map((key) => imageByBrandKey.get(key)?.image).find(Boolean);
        return {
          ...product,
          brandPackageImageUrl: resolvedPackageImage ?? product.brandPackageImageUrl
        };
      });
      if (__DEV__) {
        console.debug('Package logo inventory mapping', products
          .filter((product) => product.category === 'inverter')
          .map((product) => ({
            brandId: product.brandId,
            brandName: product.brandName,
            logo_url: product.brands?.logo_url,
            finalLogoUri: product.brandLogo
          })));
        console.debug('Package image inventory mapping', products
          .filter((product) => product.category === 'inverter')
          .map((product) => ({ brandId: product.brandId, brand: product.brandName, finalMobileImageUri: product.brandPackageImageUrl, inverterImageUrl: product.image })));
      }
      // Only inverter brands represent customer-facing package configurations.
      // Battery and panel brands may be cross-brand package components and must
      // remain available when their product is explicitly active and eligible.
      return products.filter((product) => product.category === 'inverter'
        ? isPackageGenerationProduct(product)
        : product.isActive === true && product.packageEligible === true);
    }

    // Migration 009 has not reached this project yet. Preserve existing active
    // catalog rows during rollout, while the engine still rejects missing
    // voltage/phase/compatibility metadata. No brand or bundle is hardcoded.
    const transitional = products
      .filter(isCatalogProductVisible)
      .map((product) => ({
        ...product,
        packageEligible: true,
        brandPackageGenerationEnabled: true,
      }));
    if (__DEV__ && !hasLoggedLegacyAdapter) {
      hasLoggedLegacyAdapter = true;
      console.info('Package generation is using the legacy transition adapter.', {
        activeCatalogProducts: transitional.length,
        inverters: transitional.filter((product) => product.category === 'inverter').length,
        batteries: transitional.filter((product) => product.category === 'battery').length,
        panels: transitional.filter((product) => product.category === 'panel').length,
        reason: 'Migration 009 package objects are absent; explicit technical metadata and existing compatibility rows remain mandatory.'
      });
    }
    return transitional;
  },
  getPackageCompatibility: async (): Promise<PackageCompatibilityRule[]> => {
    requireSupabase();
    if (!(await hasPackageGenerationSchema())) {
      const { data, error } = await supabase
        .from('product_compatibility')
        .select('inverter_brand_id, compatible_battery_brand_id, is_active')
        .eq('is_active', true);
      if (error) throw error;
      return (data ?? []).map((rule) => ({
        sourceBrandId: rule.inverter_brand_id,
        targetBrandId: rule.compatible_battery_brand_id,
        status: 'compatible' as const,
        active: rule.is_active,
      }));
    }
    const { data, error } = await supabase
      .from('family_compatibility')
      .select('inverter_family_id, battery_family_id, status, is_active')
      .eq('is_active', true);
    if (error) {
      throw error;
    }
    const familyIds = [...new Set((data ?? []).flatMap((rule) => [rule.inverter_family_id, rule.battery_family_id]).filter(Boolean))];
    const familiesResult = familyIds.length > 0
      ? await supabase.from('product_families').select('id, brand_id, voltage_type').in('id', familyIds)
      : { data: [], error: null };
    if (familiesResult.error) throw familiesResult.error;
    const familyById = new Map((familiesResult.data ?? []).map((family) => [family.id, family]));
    const familyRules = (data as unknown as {
      inverter_family_id: string;
      battery_family_id: string;
      status: PackageCompatibilityRule['status'];
      is_active: boolean;
    }[]).map((rule) => {
      const batteryFamily = familyById.get(rule.battery_family_id);
      return {
        sourceFamilyId: rule.inverter_family_id,
        targetFamilyId: rule.battery_family_id,
        targetBrandId: batteryFamily?.brand_id,
        voltageType: batteryFamily?.voltage_type as PackageCompatibilityRule['voltageType'],
        status: rule.status,
        active: rule.is_active
      };
    });
    const exceptionResult = await supabase
      .from('product_compatibility_exceptions')
      .select('source_product_id, target_product_id, status, is_active')
      .eq('is_active', true);
    if (exceptionResult.error) throw exceptionResult.error;
    const productRules = (exceptionResult.data as unknown as {
      source_product_id: string;
      target_product_id: string;
      status: PackageCompatibilityRule['status'];
      is_active: boolean;
    }[]).map((rule) => ({
      sourceProductId: rule.source_product_id,
      targetProductId: rule.target_product_id,
      status: rule.status,
      active: rule.is_active
    }));
    return [...familyRules, ...productRules];
  },
  getPackageGenerationStatus: async (): Promise<PackageGenerationStatus> => {
    requireSupabase();
    const schemaAvailable = await hasPackageGenerationSchema();
    return schemaAvailable
      ? {
        schemaMode: 'database-driven',
        configurationReady: true,
        diagnostic: 'Database-driven package metadata is available.'
      }
      : {
        schemaMode: 'legacy-transition',
        configurationReady: false,
        diagnostic: 'Migration 009 is not applied; no live database-driven package configuration exists.'
      };
  },
  getBrands: async (category: ProductCategory) => {
    requireSupabase();
    const brandSelect = 'id, name, slug, canonical_slug, aliases, category, logo_url, updated_at';
    const productSelectForBrands = 'brand_id, category, name, model';
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select(brandSelect)
      .eq('is_active', true)
      .order('name');
    logBrandQueryResponse('brands', `brands.select(${brandSelect}).eq(is_active, true).order(name)`, brandData, brandError);
    if (brandError) throw brandError;

    // Product linkage enriches the category list with generic brand rows. It is
    // intentionally optional: a product-schema or permission issue must not
    // prevent category-specific brand records from rendering.
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(productSelectForBrands)
      .or('is_active.eq.true,is_active.is.null');
    logBrandQueryResponse(
      'brand product linkage',
      `products.select(${productSelectForBrands}).or(is_active.eq.true,is_active.is.null)`,
      productData,
      productError
    );

    const allBrands = ((brandData ?? []) as BackendBrand[]).filter((brand): brand is BackendBrand & { name: string } => (
      Boolean(brand?.id && String(brand.name ?? '').trim())
    ));
    const linkedBrandIds = new Set(
      ((productError ? [] : productData ?? []) as Pick<BackendProduct, 'brand_id' | 'category' | 'name' | 'model'>[])
        .filter((product) => mobileCategory(product) === category)
        .map((product) => product.brand_id)
        .filter((brandId): brandId is string => Boolean(brandId))
    );
    const categoryBrands = allBrands.filter((brand) => brand.category != null && (
        backendCategories[category].includes(normalizeLabel(brand.category).replace(/\s+/g, '_')) ||
        mobileCategory({ category: brand.category, sub_category: null, name: '', model: null }) === category
      ));
    const linkedBrands = allBrands.filter((brand) => linkedBrandIds.has(brand.id));
    const displayByName = new Map<string, BackendBrand & { name: string }>();
    [...categoryBrands, ...linkedBrands].forEach((brand) => {
      const key = normalizeBrandKey(brand.name);
      if (key && !displayByName.has(key)) displayByName.set(key, brand);
    });
    const logoDonors = allBrands
      .filter((brand) => Boolean(brand.logo_url))
      .sort((left, right) => {
        const rightTime = Date.parse(right.updated_at ?? '');
        const leftTime = Date.parse(left.updated_at ?? '');
        return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
      });

    return [...displayByName.values()]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((brand): MarketplaceBrand => {
        const logoDonor = brand.logo_url
          ? brand
          : logoDonors.find((candidate) => brandIdentitiesMatch(brand as BrandIdentity, candidate as BrandIdentity));
        const rawLogoUrl = normalizePublicStorageUrl('brand-logos', logoDonor?.logo_url) || logoDonor?.logo_url || null;
        return {
          id: brand.id,
          category,
          name: brand.name,
          slug: brand.slug,
          canonicalSlug: brand.canonical_slug,
          aliases: brand.aliases ?? [],
          logoUrl: versionBrandLogoUrl(rawLogoUrl, logoDonor?.updated_at),
          updatedAt: logoDonor?.updated_at ?? brand.updated_at
        };
      });
  },
  getCompatibleBatteryBrands: async (inverterBrand?: string) => {
    if (!inverterBrand) return [];
    requireSupabase();
    const { data, error } = await supabase
      .from('product_compatibility')
      .select('inverter:brands!product_compatibility_inverter_brand_id_fkey(name), battery:brands!product_compatibility_compatible_battery_brand_id_fkey(name)')
      .eq('is_active', true);
    if (error) throw error;
    const normalizedInverterBrand = normalizeLabel(inverterBrand);
    return (data as unknown as { inverter: { name: string } | null; battery: { name: string } | null }[])
      .filter((rule) => normalizeLabel(rule.inverter?.name) === normalizedInverterBrand && rule.battery?.name)
      .map((rule) => rule.battery!.name);
  },
  submitProductOrder: async (product: Product) => ({ ok: true, productId: product.id })
};
