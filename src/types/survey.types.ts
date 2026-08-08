import {
  SOLAR_JOURNEY_MILESTONES,
  SOLAR_JOURNEY_MILESTONE_KEYS,
  type SolarJourneyLifecycle,
  type SolarJourneyMilestone,
} from '../../../backend-development/supabase/contracts/solarJourneyMilestones';

export const SURVEY_MILESTONE_DEFINITIONS = SOLAR_JOURNEY_MILESTONES;
export type SurveyMilestone = SolarJourneyMilestone;
export const SURVEY_MILESTONES = SOLAR_JOURNEY_MILESTONE_KEYS;
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
