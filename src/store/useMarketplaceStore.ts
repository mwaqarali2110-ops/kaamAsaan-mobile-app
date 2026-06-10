import { create } from 'zustand';
import type { Product } from '@/types/product.types';

type MarketplaceState = {
  selectedProducts: Product[];
  compareIds: string[];
  toggleSelectedProduct: (product: Product) => void;
  toggleCompare: (id: string) => void;
  clear: () => void;
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  selectedProducts: [],
  compareIds: [],
  toggleSelectedProduct: (product) => set((state) => {
    const exists = state.selectedProducts.some((item) => item.id === product.id);
    return { selectedProducts: exists ? state.selectedProducts.filter((item) => item.id !== product.id) : [...state.selectedProducts, product] };
  }),
  toggleCompare: (id) => set((state) => {
    const exists = state.compareIds.includes(id);
    return { compareIds: exists ? state.compareIds.filter((item) => item !== id) : [...state.compareIds, id].slice(0, 2) };
  }),
  clear: () => set({ selectedProducts: [], compareIds: [] })
}));
