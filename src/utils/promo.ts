import type { PromoContext, PromoState } from '@/types/promo.types';
import type { RecommendedPackage } from '@/utils/packageBuilder';
import type { Product } from '@/types/product.types';

export const normalizePromoCode = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

export const sanitizePromoInput = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);

export const formatPkrCurrency = (value: number) =>
  `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)))}`;

export const promoContextSignature = (context: PromoContext) => JSON.stringify({
  packageId: context.packageId,
  panelProductId: context.panelProductId,
  panelQuantity: context.panelQuantity,
  inverterProductId: context.inverterProductId,
  inverterQuantity: context.inverterQuantity,
  batteryProductId: context.batteryProductId,
  batteryQuantity: context.batteryQuantity,
  priceBreakdown: context.priceBreakdown,
});

export const createInitialPromoState = (originalTotal = 0): PromoState => ({
  enteredCode: '',
  appliedCode: null,
  promoId: null,
  discountType: null,
  discountValue: null,
  appliesTo: null,
  eligibleAmount: 0,
  discountAmount: 0,
  originalTotal: Math.max(0, originalTotal),
  finalTotal: Math.max(0, originalTotal),
  appliedPackageId: null,
  appliedContextSignature: null,
  status: 'idle',
  message: null
});

const safeAmount = (value: number | null | undefined) => Math.max(0, Number(value) || 0);

export const buildPackagePromoContext = (
  selectedPackage: RecommendedPackage | null | undefined
): PromoContext | null => {
  if (!selectedPackage?.totalPrice || selectedPackage.totalPrice <= 0) return null;
  const brandIds = [
    selectedPackage.brandId,
    selectedPackage.panel.brandId,
    selectedPackage.inverter.product.brandId,
    selectedPackage.battery?.product.brandId
  ].filter((value): value is string => Boolean(value));
  const installationCharges = safeAmount(selectedPackage.priceBreakdown?.installationCharges);
  const knownComponentTotal = safeAmount(selectedPackage.panelsPrice) + safeAmount(selectedPackage.inverterPrice) +
    safeAmount(selectedPackage.batteryPrice) + installationCharges;
  const otherExistingCharges = selectedPackage.priceBreakdown
    ? safeAmount(selectedPackage.priceBreakdown.otherExistingCharges)
    : Math.max(0, selectedPackage.totalPrice - knownComponentTotal);

  return {
    originalTotal: selectedPackage.totalPrice,
    packageId: selectedPackage.id,
    packageName: selectedPackage.packageName,
    serviceType: 'solar_package',
    brandIds: Array.from(new Set(brandIds)),
    priceBreakdown: {
      panelPrice: safeAmount(selectedPackage.panelsPrice),
      inverterPrice: safeAmount(selectedPackage.inverterPrice),
      batteryPrice: safeAmount(selectedPackage.batteryPrice),
      installationCharges,
      otherExistingCharges,
      grossTotal: selectedPackage.totalPrice,
    },
    panelProductId: selectedPackage.panel.id,
    panelQuantity: selectedPackage.panelQuantity,
    inverterProductId: selectedPackage.inverter.product.id,
    inverterQuantity: selectedPackage.inverterQuantity,
    batteryProductId: selectedPackage.battery?.product.id ?? null,
    batteryQuantity: selectedPackage.batteryQuantity
  };
};

/** Promo context for a customer-built system (Add to My System flow), as
 * opposed to a pre-defined recommended package. Uses the same 'solar_package'
 * promo service type and a stable synthetic packageId since custom builds
 * don't have one. */
export const buildCustomSystemPromoContext = ({
  panel,
  inverter,
  battery,
  panelQuantity,
  inverterQuantity,
  batteryQuantity,
  pricing
}: {
  panel: Product;
  inverter: Product;
  battery: Product | null;
  panelQuantity: number;
  inverterQuantity: number;
  batteryQuantity: number;
  pricing: { panelsPrice: number; inverterPrice: number; batteryPrice: number; additionalCharges: number; total: number };
}): PromoContext | null => {
  if (!pricing.total || pricing.total <= 0) return null;
  const brandIds = [panel.brandId, inverter.brandId, battery?.brandId].filter((value): value is string => Boolean(value));

  return {
    originalTotal: pricing.total,
    packageId: 'custom-system',
    packageName: 'Custom Designed System',
    serviceType: 'solar_package',
    brandIds: Array.from(new Set(brandIds)),
    priceBreakdown: {
      panelPrice: safeAmount(pricing.panelsPrice),
      inverterPrice: safeAmount(pricing.inverterPrice),
      batteryPrice: safeAmount(pricing.batteryPrice),
      installationCharges: safeAmount(pricing.additionalCharges),
      otherExistingCharges: 0,
      grossTotal: pricing.total
    },
    panelProductId: panel.id,
    panelQuantity,
    inverterProductId: inverter.id,
    inverterQuantity,
    batteryProductId: battery?.id ?? null,
    batteryQuantity
  };
};
