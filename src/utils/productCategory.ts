import type { ProductCategory } from '../types/product.types';

export type ProductCategorySource = {
  category?: string | null;
  subCategory?: string | null;
  rawSubCategory?: string | null;
  name?: string | null;
  model?: string | null;
};

export const normalizeCategoryText = (value?: string | null) => (value ?? '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const normalizeProductCategory = (source: ProductCategorySource): ProductCategory => {
  const category = normalizeCategoryText(source.category);
  const detail = normalizeCategoryText([
    source.subCategory,
    source.rawSubCategory,
    source.name,
    source.model
  ].filter(Boolean).join(' '));
  const combined = `${category} ${detail}`.trim();

  if (
    category === 'battery' ||
    category === 'batteries' ||
    category === 'solar battery' ||
    category === 'lithium battery' ||
    category === 'battery storage' ||
    combined.includes('lithium battery') ||
    combined.includes('solar battery') ||
    combined.includes('battery storage') ||
    combined.includes('energy storage') ||
    combined.includes('batteries')
  ) return 'battery';

  if (
    category === 'inverter' ||
    category.includes('inverter') ||
    combined.includes('hybrid inverter') ||
    combined.includes('single phase inverter') ||
    combined.includes('three phase inverter')
  ) return 'inverter';

  if (
    category === 'panel' ||
    category === 'panels' ||
    category === 'solar panel' ||
    category === 'solar panels' ||
    category === 'pv panel' ||
    category === 'pv module' ||
    combined.includes('solar panel') ||
    combined.includes('pv panel') ||
    combined.includes('pv module')
  ) return 'panel';

  return 'accessory';
};

export const isNormalizedBatteryCategory = (source: ProductCategorySource) =>
  normalizeProductCategory(source) === 'battery';
