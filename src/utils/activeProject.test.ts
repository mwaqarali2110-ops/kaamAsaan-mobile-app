import { getPrimaryActiveProject, type MaintenanceProjectRecord, type SolarProjectRecord } from './activeProject';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const userId = 'customer-1';
const solar = (status: string, id = `solar-${status}`): SolarProjectRecord => ({
  id,
  user_id: userId,
  status,
  created_at: '2026-07-26T10:00:00.000Z'
});
const maintenance = (status: string, id = `maintenance-${status}`, createdAt = '2026-07-26T11:00:00.000Z'): MaintenanceProjectRecord => ({
  id,
  userId,
  status,
  createdAt
});
const select = (solarProjects: SolarProjectRecord[], maintenanceRequests: MaintenanceProjectRecord[]) => (
  getPrimaryActiveProject({ solarProjects, maintenanceRequests, userId })
);

export const runActiveProjectRegressionTests = () => {
  assert(select([], []) === null, 'A: empty state was not selected.');
  assert(select([], [maintenance('received')])?.type === 'premium_care', 'B: active Premium Care was not selected.');
  assert(select([solar('scheduled')], [])?.type === 'solar_survey', 'C: active solar survey was not selected.');
  assert(select([solar('cancelled')], [maintenance('received')])?.type === 'premium_care', 'D: cancelled survey competed with active Premium Care.');
  assert(select([solar('design_in_progress')], [maintenance('completed')])?.type === 'solar_survey', 'E: completed Premium Care competed with active solar.');
  assert(select([solar('installation_in_progress')], [maintenance('in_progress')])?.type === 'solar_survey', 'F: solar did not win the both-active priority.');
  const latest = select([], [
    maintenance('received', 'older', '2026-07-25T10:00:00.000Z'),
    maintenance('scheduled', 'newer', '2026-07-26T10:00:00.000Z'),
    maintenance('cancelled', 'newest-inactive', '2026-07-27T10:00:00.000Z')
  ]);
  assert(latest?.type === 'premium_care' && latest.project.id === 'newer', 'Latest active maintenance request was not selected.');
  assert(select([], [maintenance('received', 'other-user')].map((item) => ({ ...item, userId: 'customer-2' }))) === null, 'Another customer request was selected.');
  return 8;
};

runActiveProjectRegressionTests();
console.log('Active project regression: 8 scenarios passed.');
