import { useQuery } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/marketplace.api';
import type { ProductCategory } from '@/types/product.types';

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

export const useBrands = (category: ProductCategory) => useQuery({
  queryKey: ['brands', category],
  queryFn: () => marketplaceApi.getBrands(category),
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true
});

export const useCompatibleBatteryBrands = (inverterBrand?: string) => useQuery({
  queryKey: ['compatible-battery-brands', inverterBrand],
  queryFn: () => marketplaceApi.getCompatibleBatteryBrands(inverterBrand),
  enabled: Boolean(inverterBrand)
});

export const useProduct = (id: string) => useQuery({
  queryKey: ['product', id],
  queryFn: () => marketplaceApi.getProduct(id)
});
