import {
  SURVEY_MILESTONE_DEFINITIONS,
  SURVEY_MILESTONES,
  type SurveyJourneyLifecycle,
  type SurveyMilestone,
  type SurveyMilestoneState,
} from '@/types/survey.types';
import {
  resolveSolarJourneyLifecycle,
  resolveSolarJourneyMilestone,
} from '../../../backend-development/supabase/contracts/solarJourneyMilestones';

const milestoneTones: Record<SurveyMilestone, string> = {
  request_received: '#F5A623',
  survey_scheduled: '#2563EB',
  survey_completed: '#168A4A',
  quotation_shared: '#7C3AED',
  installation_completed: '#0F8B8D',
};

export const surveyMilestoneMeta: Record<SurveyMilestoneState, { title: string; detail: string; tone: string }> = {
  ...Object.fromEntries(SURVEY_MILESTONE_DEFINITIONS.map((item) => [
    item.key,
    { title: item.label, detail: item.customerDescription, tone: milestoneTones[item.key] },
  ])) as Record<SurveyMilestone, { title: string; detail: string; tone: string }>,
  cancelled: { title: 'Survey Booking Cancelled', detail: 'This survey request is no longer active.', tone: '#D14343' },
  on_hold: { title: 'Survey On Hold', detail: 'Your survey progress is temporarily paused.', tone: '#64748B' }
};

export const resolveSurveyMilestone = (currentMilestone?: string | null, legacyStatus?: string | null): SurveyMilestone =>
  resolveSolarJourneyMilestone(currentMilestone, legacyStatus);

export const resolveSurveyLifecycle = (
  journeyStatus?: SurveyJourneyLifecycle | null,
  currentMilestone?: string | null,
  legacyStatus?: string | null,
): SurveyJourneyLifecycle => resolveSolarJourneyLifecycle(journeyStatus, currentMilestone, legacyStatus);

export const surveyMilestoneIndex = (milestone: SurveyMilestone) => SURVEY_MILESTONES.indexOf(milestone);
