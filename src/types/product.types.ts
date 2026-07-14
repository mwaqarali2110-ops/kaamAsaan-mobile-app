export type ProductCategory = 'inverter' | 'panel' | 'battery' | 'accessory';

export type Product = {
  id: string;
  category: ProductCategory;
  rawCategory?: string | null;
  rawSubCategory?: string | null;
  brand: string;
  brandName?: string | null;
  manufacturer?: string | null;
  brands?: { name?: string | null } | null;
  name: string;
  model?: string;
  image?: string;
  warranty?: string;
  capacity?: string;
  capacityWatt?: number | null;
  capacity_watt?: number | null;
  capacityKw?: number | null;
  batteryCapacityKwh?: number | null;
  wattage?: number | string | null;
  power?: number | string | null;
  size?: number | string | null;
  priceUnit?: 'per_watt' | 'total_price' | null;
  ratePerWatt?: number | null;
  stockStatus?: string | null;
  isVisible?: boolean | null;
  subCategory?: string | null;
  specifications?: Record<string, unknown> | null;
  tag?: 'Recommended' | 'Best Value' | 'Premium' | 'Best Seller';
  price?: number | null;
  specs: string[];
};

export type MarketplaceBrand = {
  id: string;
  category: ProductCategory;
  name: string;
  logoUrl?: string;
};

export type MarketplaceCategory = {
  id: ProductCategory;
  title: string;
  subtitle: string;
};
