import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  PromoContext,
  PromoDiscountType,
  PromoTarget,
  PromoValidationResult,
  PromoValidationStatus,
} from '@/types/promo.types';
import { normalizePromoCode } from '@/utils/promo';

type PromoRpcResponse = {
  status?: PromoValidationStatus;
  message?: string;
  promo_id?: string;
  normalized_code?: string;
  applies_to?: PromoTarget;
  discount_type?: PromoDiscountType;
  discount_value?: number | string;
  eligible_amount?: number | string;
  discount_amount?: number | string;
  gross_total?: number | string;
  final_total?: number | string;
};

const invalidResult = (
  status: Exclude<PromoValidationStatus, 'valid'> | 'error',
  message: string,
  originalTotal: number
): PromoValidationResult => ({ valid: false, status, message, originalTotal, finalTotal: originalTotal });

const statusMessage: Record<Exclude<PromoValidationStatus, 'valid'>, string> = {
  invalid: 'Invalid promo code.',
  expired: 'This promo code has expired.',
  upcoming: 'This promo code is not active yet.',
  disabled: 'This promo code is currently unavailable.',
  not_applicable: 'This promo code is not applicable to the selected package.',
};

const packageContextForRpc = (context: PromoContext) => ({
  package_id: context.packageId,
  package_name: context.packageName,
  service_type: context.serviceType,
  brand_ids: context.brandIds,
  panel_product_id: context.panelProductId,
  panel_quantity: context.panelQuantity,
  inverter_product_id: context.inverterProductId,
  inverter_quantity: context.inverterQuantity,
  battery_product_id: context.batteryProductId,
  battery_quantity: context.batteryQuantity,
  panel_amount: context.priceBreakdown.panelPrice,
  inverter_amount: context.priceBreakdown.inverterPrice,
  battery_amount: context.priceBreakdown.batteryPrice,
  installation_amount: context.priceBreakdown.installationCharges,
  other_amount: context.priceBreakdown.otherExistingCharges,
  gross_total: context.priceBreakdown.grossTotal,
});

const normalizeRpcResult = (value: PromoRpcResponse | null, fallbackTotal: number): PromoValidationResult => {
  const originalTotal = Number(value?.gross_total ?? fallbackTotal) || fallbackTotal;
  const status = value?.status;
  if (!status || status !== 'valid') {
    const safeStatus: Exclude<PromoValidationStatus, 'valid'> = status || 'invalid';
    return invalidResult(safeStatus, value?.message || statusMessage[safeStatus], originalTotal);
  }
  if (!value.promo_id || !value.normalized_code || !value.applies_to || !value.discount_type) {
    return invalidResult('error', 'Promo validation returned an incomplete response. Please try again.', originalTotal);
  }
  return {
    valid: true,
    status: 'valid',
    message: value.message || 'Promo code applied.',
    promoId: value.promo_id,
    code: value.normalized_code,
    appliesTo: value.applies_to,
    discountType: value.discount_type,
    discountValue: Number(value.discount_value) || 0,
    eligibleAmount: Number(value.eligible_amount) || 0,
    discountAmount: Number(value.discount_amount) || 0,
    originalTotal,
    finalTotal: Number(value.final_total) || 0,
  };
};

export const promoApi = {
  validatePromoCode: async (enteredCode: string, context: PromoContext): Promise<PromoValidationResult> => {
    const code = normalizePromoCode(enteredCode);
    if (!code) return invalidResult('invalid', 'Enter a promo code.', context.originalTotal);
    if (!isSupabaseConfigured) {
      return invalidResult('error', 'Promo service is temporarily unavailable. Please try again later.', context.originalTotal);
    }

    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code,
      p_package_context: packageContextForRpc(context)
    });
    if (error) {
      if (__DEV__) console.error('Promo validation failed:', { code: error.code, message: error.message });
      return invalidResult('error', 'Promo service is temporarily unavailable. Please try again later.', context.originalTotal);
    }
    return normalizeRpcResult(data as PromoRpcResponse | null, context.originalTotal);
  },
  packageContextForRpc
};
