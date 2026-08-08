export type PromoDiscountType = 'percentage' | 'fixed';
export type PromoTarget = 'installation' | 'panels' | 'inverter' | 'battery';
export type PromoValidationStatus =
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'upcoming'
  | 'disabled'
  | 'not_applicable';
export type PromoStatus = 'idle' | 'loading' | 'applied' | Exclude<PromoValidationStatus, 'valid'> | 'error';

export type PromoPriceBreakdown = {
  panelPrice: number;
  inverterPrice: number;
  batteryPrice: number;
  installationCharges: number;
  otherExistingCharges: number;
  grossTotal: number;
};

export type PromoContext = {
  originalTotal: number;
  packageId: string;
  packageName: string;
  serviceType: 'solar_package';
  brandIds: string[];
  priceBreakdown: PromoPriceBreakdown;
  panelProductId: string;
  panelQuantity: number;
  inverterProductId: string;
  inverterQuantity: number;
  batteryProductId: string | null;
  batteryQuantity: number;
};

export type PromoValidationResult =
  | {
      valid: true;
      status: 'valid';
      message: string;
      promoId: string;
      code: string;
      appliesTo: PromoTarget;
      discountType: PromoDiscountType;
      discountValue: number;
      eligibleAmount: number;
      discountAmount: number;
      originalTotal: number;
      finalTotal: number;
    }
  | {
      valid: false;
      status: Exclude<PromoValidationStatus, 'valid'> | 'error';
      message: string;
      originalTotal: number;
      finalTotal: number;
    };

export type PromoState = {
  enteredCode: string;
  appliedCode: string | null;
  promoId: string | null;
  discountType: PromoDiscountType | null;
  discountValue: number | null;
  appliesTo: PromoTarget | null;
  eligibleAmount: number;
  discountAmount: number;
  originalTotal: number;
  finalTotal: number;
  appliedPackageId: string | null;
  appliedContextSignature: string | null;
  status: PromoStatus;
  message: string | null;
};
