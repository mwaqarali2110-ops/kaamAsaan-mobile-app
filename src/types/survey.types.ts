import {
  CLEANING_JOURNEY_MILESTONES,
  CLEANING_JOURNEY_MILESTONE_KEYS,
  INSTALLATION_JOURNEY_MILESTONES,
  INSTALLATION_JOURNEY_MILESTONE_KEYS,
  PRODUCT_ORDER_JOURNEY_MILESTONES,
  PRODUCT_ORDER_JOURNEY_MILESTONE_KEYS,
  type SolarJourneyKind,
  type SolarJourneyLifecycle,
  type SolarJourneyMilestone,
} from '@/contracts/solarJourneyMilestones';

// Installation/solar-survey journey remains the default export name for backwards
// compatibility with existing imports — cleaning and product-order journeys are
// separate lists (see src/contracts/solarJourneyMilestones.ts).
export const SURVEY_MILESTONE_DEFINITIONS = INSTALLATION_JOURNEY_MILESTONES;
export const SURVEY_MILESTONES = INSTALLATION_JOURNEY_MILESTONE_KEYS;
export {
  CLEANING_JOURNEY_MILESTONES,
  CLEANING_JOURNEY_MILESTONE_KEYS,
  PRODUCT_ORDER_JOURNEY_MILESTONES,
  PRODUCT_ORDER_JOURNEY_MILESTONE_KEYS,
};
export type SurveyMilestone = SolarJourneyMilestone;
export type SurveyJourneyKind = SolarJourneyKind;
export type SurveyJourneyLifecycle = SolarJourneyLifecycle;
export type SurveyMilestoneState = SurveyMilestone | Exclude<SurveyJourneyLifecycle, 'active'>;

export type SelectedPackageSnapshot = {
  packageId: string | null;
  packageName: string;
  packageBrand: string;
  isCustomized: boolean;
  systemSizeKw: number;
  panel: {
    productId: string | null;
    brand: string;
    model: string;
    wattage: number;
    quantity: number;
    totalCapacityKw: number;
  } | null;
  inverter: {
    productId: string | null;
    brand: string;
    model: string;
    capacityKw: number;
    quantity: number;
  } | null;
  battery: {
    productId: string | null;
    brand: string;
    model: string;
    unitCapacityKwh: number;
    quantity: number;
    totalCapacityKwh: number;
  } | null;
  grossTotal: number;
  discountAmount: number;
  finalTotal: number;
  promoCode?: string | null;
};
