import { marketplaceCategories } from '@/constants/products';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MarketplaceBrand, Product, ProductCategory } from '@/types/product.types';
import { formatCapacityKw, parseCapacityKw, parseCapacityKwh, parseCapacityWatt } from '@/utils/capacity';
import { normalizePublicStorageUrl } from '@/utils/storage';

type BackendCategory = string;

type BackendBrand = {
  id: string;
  name: string;
  category: BackendCategory;
  logo_url: string | null;
};

type BackendProduct = {
  id: string;
  category: BackendCategory;
  sub_category?: string | null;
  name: string;
  model: string | null;
  capacity_value?: number | null;
  capacity_unit?: string | null;
  capacity_watt: number | null;
  capacity_kw: number | null;
  battery_capacity_kwh: number | null;
  price: number | null;
  price_unit?: 'per_watt' | 'total_price' | null;
  rate_per_watt?: number | null;
  stock_status: string | null;
  is_visible?: boolean | null;
  warranty_years: number | null;
  warranty?: string | null;
  image_url: string | null;
  specifications: Record<string, unknown> | null;
  is_featured: boolean;
  brands: { name: string } | null;
};

const productSelect = 'id, category, name, model, capacity_watt, capacity_kw, battery_capacity_kwh, price, stock_status, warranty_years, image_url, specifications, is_featured, brands:brands!products_brand_id_fkey(name)';

const backendCategories: Record<ProductCategory, BackendCategory[]> = {
  inverter: ['inverter', 'hybrid_inverter', 'hv_hybrid_inverter'],
  panel: ['solar_panel', 'panel', 'solar_panels'],
  battery: ['battery', 'lithium_battery', 'lithium'],
  accessory: ['mounting_structure', 'accessory', 'accessories']
};

const normalizeLabel = (value?: string | null) => (value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();

const mobileCategory = (product: Pick<BackendProduct, 'category' | 'sub_category' | 'name' | 'model'>): ProductCategory => {
  const source = normalizeLabel([product.category, product.sub_category, product.name, product.model].filter(Boolean).join(' '));
  if (source.includes('inverter') || source.includes('hybrid') || source.includes('single phase') || source.includes('three phase')) return 'inverter';
  if (source.includes('battery') || source.includes('lithium')) return 'battery';
  if (source.includes('panel') || source.includes('solar panel')) return 'panel';
  if (source.includes('mounting') || source.includes('accessory')) return 'accessory';
  return 'accessory';
};

const capacityLabel = (product: BackendProduct) => {
  const category = mobileCategory(product);
  const source = [product.name, product.model].filter(Boolean).join(' ');
  const watt = product.capacity_watt ?? parseCapacityWatt(product.capacity_value, product.capacity_unit, source);
  const kw = product.capacity_kw ?? parseCapacityKw(product.capacity_value, product.capacity_unit, source);
  const kwh = product.battery_capacity_kwh ?? parseCapacityKwh(product.capacity_value, product.capacity_unit, source);

  if (category === 'panel' && watt) return `${Number(watt).toFixed(0)}W`;
  if (category === 'battery' && kwh) return `${Number(kwh).toFixed(1).replace('.0', '')} kWh`;
  if (category === 'inverter' && kw) return formatCapacityKw(kw);
  if (watt) return `${Number(watt).toFixed(0)}W`;
  return null;
};

const warrantyLabel = (years: number | null) => years == null ? null : `${Number(years)} Years Warranty`;

const specificationValues = (specifications: Record<string, unknown> | null) => Object.values(specifications ?? {})
  .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
  .map(String);

const specificationNumber = (specifications: Record<string, unknown> | null, key: string) => {
  const value = specifications?.[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const mapProduct = (product: BackendProduct): Product => {
  const capacity = capacityLabel(product);
  const warranty = warrantyLabel(product.warranty_years);
  const specs = [capacity, ...specificationValues(product.specifications), warranty].filter((value): value is string => Boolean(value));
  const source = [product.name, product.model, capacity, ...specificationValues(product.specifications)].filter(Boolean).join(' ');

  return {
    id: product.id,
    category: mobileCategory(product),
    brand: product.brands?.name ?? 'KaamAsaan Verified',
    name: product.name,
    model: product.model ?? undefined,
    image: normalizePublicStorageUrl('product-images', product.image_url),
    warranty: product.warranty ?? warranty ?? undefined,
    capacity: capacity ?? undefined,
    capacityWatt: product.capacity_watt ?? parseCapacityWatt(product.capacity_value, product.capacity_unit, source),
    capacityKw: product.capacity_kw ?? parseCapacityKw(product.capacity_value, product.capacity_unit, source),
    batteryCapacityKwh: product.battery_capacity_kwh ?? parseCapacityKwh(product.capacity_value, product.capacity_unit, source),
    priceUnit: product.price_unit ?? (mobileCategory(product) === 'panel' ? 'per_watt' : 'total_price'),
    ratePerWatt: product.rate_per_watt ?? specificationNumber(product.specifications, 'rate_per_watt'),
    stockStatus: product.stock_status,
    isVisible: product.is_visible,
    subCategory: product.sub_category,
    tag: product.is_featured ? 'Recommended' : undefined,
    price: product.price,
    specs
  };
};

const requireSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
};

const logProductsResponse = (label: string, data: unknown, error: unknown) => {
  if (!__DEV__) return;
  console.log(`Supabase response (${label}):`, data);
  console.log(`Supabase error (${label}):`, error);
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

export const marketplaceApi = {
  getCategories: async () => marketplaceCategories,
  getProducts: async (category?: ProductCategory) => {
    requireSupabase();
    const { data, error } = await supabase
      .from('products')
      .select(productSelect)
      .eq('is_active', true)
      .order('name');
    logProductsResponse('products', data, error);

    if (error) throw error;

    const products = safeMapProducts((data as unknown as BackendProduct[]) ?? []).filter((product) => product.isVisible !== false);
    if (__DEV__) console.log('Total products fetched:', products.length);
    return category ? products.filter((product) => product.category === category) : products;
  },
  getProduct: async (id: string) => {
    requireSupabase();
    const { data, error } = await supabase
      .from('products')
      .select(productSelect)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();
    logProductsResponse('product', data, error);
    if (error) throw error;
    if (!data) return null;
    try {
      const product = mapProduct(data as unknown as BackendProduct);
      return product.isVisible === false ? null : product;
    } catch (mapError) {
      console.error('Product mapping failed:', data.id, mapError);
      throw mapError;
    }
  },
  getBrands: async (category: ProductCategory) => {
    requireSupabase();
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, category, logo_url')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data as BackendBrand[])
      .filter((brand) => backendCategories[category].includes(normalizeLabel(brand.category).replace(/\s+/g, '_')) || mobileCategory({ category: brand.category, sub_category: null, name: '', model: null }) === category)
      .map((brand): MarketplaceBrand => ({
      id: brand.id,
      category: mobileCategory({ category: brand.category, sub_category: null, name: '', model: null }),
      name: brand.name,
      logoUrl: normalizePublicStorageUrl('brand-logos', brand.logo_url)
    }));
  },
  getCompatibleBatteryBrands: async (inverterBrand?: string) => {
    if (!inverterBrand) return [];
    requireSupabase();
    const { data, error } = await supabase
      .from('product_compatibility')
      .select('inverter:brands!product_compatibility_inverter_brand_id_fkey(name), battery:brands!product_compatibility_compatible_battery_brand_id_fkey(name)')
      .eq('is_active', true);
    if (error) throw error;
    return (data as unknown as { inverter: { name: string } | null; battery: { name: string } | null }[])
      .filter((rule) => rule.inverter?.name === inverterBrand && rule.battery?.name)
      .map((rule) => rule.battery!.name);
  },
  submitProductOrder: async (product: Product) => ({ ok: true, productId: product.id })
};
