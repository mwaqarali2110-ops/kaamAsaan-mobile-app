import type { Product } from '@/types/product.types';
import { extractPanelWattage, getProductBrandName, normalizeBrandName } from '@/utils/packageBuilder';

const preferredPanelBrandOrder = ['ja', 'astro', 'canadian', 'jinko'];

const panelBrandRank = (brand?: string | null) => {
  const normalized = normalizeBrandName(brand);
  const rank = preferredPanelBrandOrder.indexOf(normalized);
  return rank === -1 ? preferredPanelBrandOrder.length : rank;
};

export const selectDefaultPanelProduct = (panelProducts: Product[], requestedPanelWattage: number) => [...panelProducts]
  .filter((product) => extractPanelWattage(product) > 0)
  .sort((left, right) => {
    const leftWattage = extractPanelWattage(left);
    const rightWattage = extractPanelWattage(right);
    return panelBrandRank(getProductBrandName(left)) - panelBrandRank(getProductBrandName(right)) ||
      Math.abs(leftWattage - requestedPanelWattage) - Math.abs(rightWattage - requestedPanelWattage) ||
      rightWattage - leftWattage ||
      left.name.localeCompare(right.name);
  })[0] ?? null;

export const panelOptionLabel = (product: Product) => `${getProductBrandName(product)} ${extractPanelWattage(product)}W`;
