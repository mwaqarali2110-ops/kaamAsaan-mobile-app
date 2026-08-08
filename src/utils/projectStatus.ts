export const activeSurveyStatusValues = [
  'survey_requested',
  'survey_booked',
  'survey_pending',
  'survey_confirmed',
  'site_visit_scheduled',
  'site_survey_scheduled',
  'pending',
  'confirmed',
  'assigned',
  'scheduled',
  'survey_scheduled',
  'survey_in_progress',
  'survey_completed',
  'design_in_progress',
  'proposal_preparation',
  'quotation_pending',
  'quotation_ready',
  'quotation_shared',
  'installation_scheduled',
  'installation_pending',
  'installation_planning',
  'installation_started',
  'installation_in_progress',
  'project_in_progress'
] as const;

export const activeMaintenanceStatusValues = [
  'received',
  'pending',
  'submitted',
  'pending_confirmation',
  'scheduled',
  'assigned',
  'in_progress',
  'technician_arrived',
  'assigned'
] as const;

const activeSurveyStatuses = new Set<string>(activeSurveyStatusValues);
const activeMaintenanceStatuses = new Set<string>(activeMaintenanceStatusValues);

export const isActiveSolarSurveyStatus = (status?: string | null) => Boolean(status && activeSurveyStatuses.has(status));
export const isActiveMaintenanceStatus = (status?: string | null) => Boolean(status && activeMaintenanceStatuses.has(status));
