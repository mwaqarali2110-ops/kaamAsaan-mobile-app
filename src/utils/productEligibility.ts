export type ProductEligibilityState = {
  isActive?: boolean | null;
  isVisible?: boolean | null;
  packageEligible?: boolean | null;
  brandPackageGenerationEnabled?: boolean | null;
};

// Legacy null flags remain catalog-readable. Explicit false always wins.
export const isCatalogProductVisible = (product: ProductEligibilityState) =>
  product.isActive !== false && product.isVisible !== false;

// Final package generation is intentionally strict and requires migration 009
// metadata to be explicitly enabled.
export const isPackageGenerationProduct = (product: ProductEligibilityState) =>
  product.isActive === true &&
  product.packageEligible === true &&
  product.brandPackageGenerationEnabled === true;
