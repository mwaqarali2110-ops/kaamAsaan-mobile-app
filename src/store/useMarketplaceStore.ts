import { create } from 'zustand';
import type { Product } from '@/types/product.types';

type MarketplaceState = {
  selectedProducts: Product[];
  compareIds: string[];
  cartItems: { product: Product; quantity: number; variant?: string; unitPrice: number }[];
  toggleSelectedProduct: (product: Product) => void;
  toggleCompare: (id: string) => void;
  addToCart: (product: Product, variant?: string) => void;
  setCartQuantity: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  selectedProducts: [],
  compareIds: [],
  cartItems: [],
  toggleSelectedProduct: (product) => set((state) => {
    const exists = state.selectedProducts.some((item) => item.id === product.id);
    return { selectedProducts: exists ? state.selectedProducts.filter((item) => item.id !== product.id) : [...state.selectedProducts, product] };
  }),
  toggleCompare: (id) => set((state) => {
    const exists = state.compareIds.includes(id);
    return { compareIds: exists ? state.compareIds.filter((item) => item !== id) : [...state.compareIds, id].slice(0, 2) };
  }),
  addToCart: (product, variant) => set((state) => {
    const index = state.cartItems.findIndex((item) => item.product.id === product.id && item.variant === variant);
    if (index < 0) return { cartItems: [...state.cartItems, { product, variant, quantity: 1, unitPrice: Number(product.price ?? 0) }] };
    return { cartItems: state.cartItems.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + 1, unitPrice: Number(product.price ?? item.unitPrice) } : item) };
  }),
  setCartQuantity: (productId, quantity, variant) => set((state) => ({
    cartItems: quantity <= 0
      ? state.cartItems.filter((item) => !(item.product.id === productId && item.variant === variant))
      : state.cartItems.map((item) => item.product.id === productId && item.variant === variant ? { ...item, quantity } : item)
  })),
  clear: () => set({ selectedProducts: [], compareIds: [], cartItems: [] })
}));
