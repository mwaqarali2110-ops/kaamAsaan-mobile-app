import {
  CLEANING_JOURNEY_MILESTONES,
  CLEANING_JOURNEY_MILESTONE_KEYS,
  SURVEY_MILESTONE_DEFINITIONS,
  SURVEY_MILESTONES,
  type SurveyJourneyKind,
  type SurveyJourneyLifecycle,
  type SurveyMilestone,
  type SurveyMilestoneState,
} from '@/types/survey.types';
import {
  getSolarJourneyStepState,
  journeyKindForServiceType,
  resolveSolarJourneyLifecycle,
  resolveSolarJourneyMilestone,
} from '@/contracts/solarJourneyMilestones';

const installationTones: Record<string, string> = {
  request_received: '#F5A623',
  survey_scheduled: '#2563EB',
  quotation_shared: '#7C3AED',
  installation_date: '#C2410C',
  installation_completed: '#0F8B8D',
  feedback: '#15803D',
};

const cleaningTones: Record<string, string> = {
  request_received: '#F5A623',
  service_confirmed: '#2563EB',
  cleaning_datetime: '#7C3AED',
  service_completed: '#0F8B8D',
  feedback: '#15803D',
};

const buildMeta = (
  definitions: { key: string; label: string; customerDescription: string }[],
  tones: Record<string, string>,
) =>
  Object.fromEntries(
    definitions.map((item) => [item.key, { title: item.label, detail: item.customerDescription, tone: tones[item.key] }]),
  ) as Record<string, { title: string; detail: string; tone: string }>;

export const surveyMilestoneMeta: Record<SurveyMilestoneState, { title: string; detail: string; tone: string }> = {
  ...buildMeta(SURVEY_MILESTONE_DEFINITIONS, installationTones),
  ...buildMeta(CLEANING_JOURNEY_MILESTONES, cleaningTones),
  cancelled: { title: 'Booking Cancelled', detail: 'This request is no longer active.', tone: '#D14343' },
  on_hold: { title: 'On Hold', detail: 'Your progress is temporarily paused.', tone: '#64748B' },
} as Record<SurveyMilestoneState, { title: string; detail: string; tone: string }>;

export const surveyJourneyKindForServiceType = (serviceType?: string | null): SurveyJourneyKind =>
  journeyKindForServiceType(serviceType);

export const surveyJourneyMilestoneKeys = (kind: SurveyJourneyKind): string[] =>
  kind === 'cleaning' ? CLEANING_JOURNEY_MILESTONE_KEYS : SURVEY_MILESTONES;

export const surveyJourneyMilestoneDefinitions = (kind: SurveyJourneyKind) =>
  kind === 'cleaning' ? CLEANING_JOURNEY_MILESTONES : SURVEY_MILESTONE_DEFINITIONS;

export const resolveSurveyMilestone = (
  kind: SurveyJourneyKind,
  currentMilestone?: string | null,
  legacyStatus?: string | null,
): SurveyMilestone => resolveSolarJourneyMilestone(kind, currentMilestone, legacyStatus);

export const resolveSurveyLifecycle = (
  journeyStatus?: SurveyJourneyLifecycle | null,
  currentMilestone?: string | null,
  legacyStatus?: string | null,
): SurveyJourneyLifecycle => resolveSolarJourneyLifecycle(journeyStatus, currentMilestone, legacyStatus);

export const surveyMilestoneStepState = (
  kind: SurveyJourneyKind,
  milestone: string,
  lifecycle: SurveyJourneyLifecycle,
  index: number,
) => getSolarJourneyStepState(surveyJourneyMilestoneKeys(kind), milestone, lifecycle, index);

export const surveyMilestoneIndex = (kind: SurveyJourneyKind, milestone: string) =>
  surveyJourneyMilestoneKeys(kind).indexOf(milestone);
