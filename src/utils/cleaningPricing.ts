export type CleaningStructureType = 'standard' | 'elevated';

export type CleaningEstimateBreakdown = {
  baseCharge: number;
  sizeCharge: number;
  elevatedSurcharge: number;
  heightSurcharge: number;
  subtotal: number;
  total: number;
};

export type CleaningEstimate = {
  serviceType: 'cleaning';
  systemSizeKw: number;
  structureType: CleaningStructureType;
  frontHeightFt: number | null;
  backHeightFt: number | null;
  estimatedAmount: number;
  breakdown: CleaningEstimateBreakdown;
  pricingVersion: string;
};

// TODO: Move these values to admin-controlled service pricing once that backend configuration exists.
export const CLEANING_PRICING = {
  pricingVersion: 'cleaning-estimator-v1',
  maxSystemSizeKw: 200,
  baseVisitCharge: 2500,
  standardRatePerKw: 700,
  elevatedRatePerKw: 900,
  elevatedHeightRate: 45,
  minimumCharge: 5000,
  taxRate: 0
} as const;

export const formatPkrAmount = (value?: number | null) =>
  value == null || !Number.isFinite(value)
    ? 'PKR 0'
    : `PKR ${Math.round(value).toLocaleString('en-PK')}`;

export const calculateCleaningEstimate = ({
  systemSizeKw,
  structureType,
  frontHeightFt = null,
  backHeightFt = null
}: {
  systemSizeKw: number;
  structureType: CleaningStructureType;
  frontHeightFt?: number | null;
  backHeightFt?: number | null;
}): CleaningEstimate => {
  const normalizedSize = Math.max(0, Number(systemSizeKw) || 0);
  const isElevated = structureType === 'elevated';
  const baseCharge = CLEANING_PRICING.baseVisitCharge;
  const rate = isElevated ? CLEANING_PRICING.elevatedRatePerKw : CLEANING_PRICING.standardRatePerKw;
  const sizeCharge = normalizedSize * rate;
  const averageHeight = isElevated && frontHeightFt && backHeightFt ? (frontHeightFt + backHeightFt) / 2 : 0;
  const elevatedSurcharge = isElevated ? normalizedSize * 200 : 0;
  const heightSurcharge = isElevated ? normalizedSize * averageHeight * CLEANING_PRICING.elevatedHeightRate : 0;
  const subtotal = baseCharge + sizeCharge + elevatedSurcharge + heightSurcharge;
  const total = Math.max(CLEANING_PRICING.minimumCharge, subtotal * (1 + CLEANING_PRICING.taxRate));

  return {
    serviceType: 'cleaning',
    systemSizeKw: normalizedSize,
    structureType,
    frontHeightFt: isElevated ? frontHeightFt : null,
    backHeightFt: isElevated ? backHeightFt : null,
    estimatedAmount: Math.round(total),
    breakdown: {
      baseCharge,
      sizeCharge: Math.round(sizeCharge),
      elevatedSurcharge: Math.round(elevatedSurcharge),
      heightSurcharge: Math.round(heightSurcharge),
      subtotal: Math.round(subtotal),
      total: Math.round(total)
    },
    pricingVersion: CLEANING_PRICING.pricingVersion
  };
};
