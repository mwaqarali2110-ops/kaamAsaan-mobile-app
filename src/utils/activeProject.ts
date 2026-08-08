import { isActiveMaintenanceStatus, isActiveSolarSurveyStatus } from './projectStatus';

export { isActiveMaintenanceStatus, isActiveSolarSurveyStatus } from './projectStatus';

export type SolarProjectRecord = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
};

export type MaintenanceProjectRecord = {
  id: string;
  userId?: string;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

const timestamp = (updatedAt?: string | null, createdAt?: string | null) => {
  const value = Date.parse(updatedAt || createdAt || '');
  return Number.isFinite(value) ? value : 0;
};

const belongsToCurrentUser = (recordUserId: string | null | undefined, userId?: string) => (
  Boolean(userId && recordUserId === userId)
);

export type PrimaryActiveProject<S extends SolarProjectRecord, M extends MaintenanceProjectRecord> =
  | { type: 'solar_survey'; project: S }
  | { type: 'premium_care'; project: M }
  | null;

export const findLatestActiveSolarProject = <S extends SolarProjectRecord>(
  projects: S[],
  userId?: string
) => projects
  .filter((project) => belongsToCurrentUser(project.user_id, userId) && isActiveSolarSurveyStatus(project.status))
  .sort((left, right) => timestamp(right.updated_at, right.created_at) - timestamp(left.updated_at, left.created_at))[0] ?? null;

export const findLatestActiveMaintenanceRequest = <M extends MaintenanceProjectRecord>(
  requests: M[],
  userId?: string
) => requests
  .filter((request) => belongsToCurrentUser(request.userId, userId) && isActiveMaintenanceStatus(request.status))
  .sort((left, right) => timestamp(right.updatedAt, right.createdAt) - timestamp(left.updatedAt, left.createdAt))[0] ?? null;

export const getPrimaryActiveProject = <S extends SolarProjectRecord, M extends MaintenanceProjectRecord>({
  solarProjects,
  maintenanceRequests,
  userId
}: {
  solarProjects: S[];
  maintenanceRequests: M[];
  userId?: string;
}): PrimaryActiveProject<S, M> => {
  const activeSolarProject = findLatestActiveSolarProject(solarProjects, userId);
  if (activeSolarProject) return { type: 'solar_survey', project: activeSolarProject };

  const activeMaintenanceRequest = findLatestActiveMaintenanceRequest(maintenanceRequests, userId);
  if (activeMaintenanceRequest) return { type: 'premium_care', project: activeMaintenanceRequest };

  return null;
};
