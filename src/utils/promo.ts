import type { PromoContext, PromoState } from '@/types/promo.types';
import type { RecommendedPackage } from '@/utils/packageBuilder';

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
