import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/marketplace.api';
import type { ProductCategory } from '@/types/product.types';
import { BATTERY_RECOMMENDATION_ENGINE_VERSION } from '@/utils/commercialRecommendation';

export const useProductCategories = () => useQuery({
  queryKey: ['marketplace-categories'],
  queryFn: marketplaceApi.getCategories
});

export const useProducts = (category?: ProductCategory) => useQuery({
  queryKey: ['products', category],
  queryFn: () => marketplaceApi.getProducts(category),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true
});

export const usePackageInventory = () => useQuery({
  queryKey: ['package-inventory'],
  queryFn: marketplaceApi.getPackageInventory,
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true
});

export const useBatterySizingCatalog = () => useQuery({
  queryKey: ['battery-sizing-catalog', BATTERY_RECOMMENDATION_ENGINE_VERSION],
  queryFn: () => marketplaceApi.getProducts(),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});

export const usePackageCompatibility = () => useQuery({
  queryKey: ['package-compatibility'],
  queryFn: marketplaceApi.getPackageCompatibility,
  staleTime: 5 * 60 * 1000
});

export const useServicePricing = () => useQuery({
  queryKey: ['service-pricing-settings'],
  queryFn: marketplaceApi.fetchServicePricing,
  staleTime: 5 * 60 * 1000
});

export const usePackageGenerationStatus = () => useQuery({
  queryKey: ['package-generation-status'],
  queryFn: marketplaceApi.getPackageGenerationStatus,
  staleTime: 5 * 60 * 1000
});

export const useBrands = (category: ProductCategory) => useQuery({
  queryKey: ['brands', category, 'logo-v3'],
  queryFn: () => marketplaceApi.getBrands(category),
  retry: 2,
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  refetchOnReconnect: true
});

export const useCompatibleBatteryBrands = (inverterBrand?: string) => useQuery({
  queryKey: ['compatible-battery-brands', inverterBrand],
  queryFn: () => marketplaceApi.getCompatibleBatteryBrands(inverterBrand),
  enabled: Boolean(inverterBrand)
});

export const useCompatibleInverterBrands = (batteryBrand?: string) => useQuery({
  queryKey: ['compatible-inverter-brands', batteryBrand],
  queryFn: () => marketplaceApi.getCompatibleInverterBrands(batteryBrand),
  enabled: Boolean(batteryBrand)
});

export const useProduct = (id: string) => useQuery({
  queryKey: ['product', id],
  queryFn: () => marketplaceApi.getProduct(id)
});
