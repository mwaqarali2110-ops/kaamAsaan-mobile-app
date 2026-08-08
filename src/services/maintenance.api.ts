import { supabase } from '@/lib/supabase';
import type {
  MaintenanceBooking,
  MaintenanceBookingInput,
  MaintenanceFeedback,
  MaintenanceFeedbackInput,
  MaintenanceLifecycle,
  MaintenancePlan,
  MaintenancePlanSelection,
  MaintenanceRequestStatus,
  MaintenanceStatusHistory,
  MaintenanceVisit
} from '@/types/maintenance.types';

type MaintenanceRequestRow = {
  id: string;
  user_id: string;
  reference_number: string;
  plan_id: MaintenancePlanSelection['planId'];
  plan_title: string;
  plan_price: number;
  frequency: string;
  service_type: MaintenancePlanSelection['serviceType'];
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  preferred_date: string;
  preferred_time_slot: string;
  notes: string | null;
  status: MaintenanceRequestStatus;
  cancellation_reason: string | null;
  cancellation_note: string | null;
  cancelled_at: string | null;
  cancelled_by: 'customer' | 'admin' | 'representative' | null;
  created_at: string;
  updated_at: string;
  maintenance_plan_id: string | null;
};

const missingMaintenanceSchemaCodes = new Set(['42P01', 'PGRST202', 'PGRST204', 'PGRST205']);

export const isMaintenanceSchemaUnavailable = (error: unknown) => Boolean(
  error && typeof error === 'object' && missingMaintenanceSchemaCodes.has(String((error as { code?: string }).code ?? ''))
);

const mapMaintenanceRequest = (row: MaintenanceRequestRow): MaintenanceBooking => ({
  id: row.id,
  userId: row.user_id,
  referenceNumber: row.reference_number,
  plan: {
    planId: row.plan_id,
    title: row.plan_title,
    price: Number(row.plan_price),
    frequency: row.frequency,
    serviceType: row.service_type
  },
  customerName: row.customer_name,
  phone: row.phone,
  address: row.address,
  city: row.city,
  preferredDate: row.preferred_date,
  preferredTimeSlot: row.preferred_time_slot,
  notes: row.notes ?? '',
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  backendSynced: true,
  cancellationReason: row.cancellation_reason,
  cancellationNote: row.cancellation_note,
  cancelledAt: row.cancelled_at,
  cancelledBy: row.cancelled_by,
  maintenancePlanId: row.maintenance_plan_id
});

const mapPlan = (row: any): MaintenancePlan => ({
  id: row.id, userId: row.user_id, maintenanceRequestId: row.maintenance_request_id,
  reference: row.reference, planType: row.plan_type, price: Number(row.price),
  startDate: row.start_date, endDate: row.end_date, totalVisits: row.total_visits,
  visitIntervalMonths: row.visit_interval_months, currentVisitNumber: row.current_visit_number,
  status: row.status, assignedTeamName: row.assigned_team_name,
  assignedTeamPhone: row.assigned_team_phone, createdAt: row.created_at, updatedAt: row.updated_at
});

const mapVisit = (row: any): MaintenanceVisit => ({
  id: row.id, planId: row.plan_id, visitNumber: row.visit_number, targetDate: row.target_date,
  windowStart: row.window_start, windowEnd: row.window_end, scheduledDate: row.scheduled_date,
  scheduledTimeSlot: row.scheduled_time_slot, status: row.status,
  assignedTeamName: row.assigned_team_name, assignedTeamPhone: row.assigned_team_phone,
  completedAt: row.completed_at, completionNotes: row.completion_notes,
  workPerformed: row.work_performed, reportUrl: row.report_url,
  createdAt: row.created_at, updatedAt: row.updated_at
});

const mapHistory = (row: any): MaintenanceStatusHistory => ({
  id: row.id, planId: row.plan_id, visitId: row.visit_id, previousStatus: row.previous_status,
  newStatus: row.new_status, changedByRole: row.changed_by_role, notes: row.notes, createdAt: row.created_at
});

const mapFeedback = (row: any): MaintenanceFeedback => ({
  id: row.id, planId: row.plan_id, visitId: row.visit_id, overallRating: row.overall_rating,
  serviceQualityRating: row.service_quality_rating, professionalismRating: row.professionalism_rating,
  punctualityRating: row.punctuality_rating, comments: row.comments,
  needsFollowUp: row.needs_follow_up, createdAt: row.created_at
});

export const cancellableMaintenanceStatuses = new Set<MaintenanceRequestStatus>([
  'received',
  'pending',
  'submitted',
  'pending_confirmation',
  'scheduled'
]);

export const canCancelMaintenanceRequest = (status?: MaintenanceRequestStatus | null) => (
  Boolean(status && cancellableMaintenanceStatuses.has(status))
);

export const maintenanceApi = {
  getRequests: async (): Promise<MaintenanceBooking[] | null> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) return [];
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      if (isMaintenanceSchemaUnavailable(error)) return null;
      throw error;
    }
    return ((data ?? []) as MaintenanceRequestRow[]).map(mapMaintenanceRequest);
  },

  createRequest: async ({
    input,
    plan,
    referenceNumber,
    idempotencyKey
  }: {
    input: MaintenanceBookingInput;
    plan: MaintenancePlanSelection;
    referenceNumber: string;
    idempotencyKey?: string;
  }): Promise<MaintenanceBooking> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Please sign in before booking maintenance.');

    if (plan.planId === 'premium') {
      const { data, error } = await supabase.rpc('create_premium_care_plan', {
        p_idempotency_key: idempotencyKey ?? referenceNumber,
        p_plan_title: plan.title,
        p_plan_price: plan.price,
        p_frequency: plan.frequency,
        p_service_type: plan.serviceType,
        p_customer_name: input.customerName,
        p_phone: input.phone,
        p_address: input.address,
        p_city: input.city,
        p_preferred_date: input.preferredDate,
        p_preferred_time_slot: input.preferredTimeSlot,
        p_notes: input.notes || null
      });
      if (error) {
        throw error;
      }
      const payload = data as any;
      return mapMaintenanceRequest({ ...payload.request, maintenance_plan_id: payload.plan?.id ?? null } as MaintenanceRequestRow);
    }

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        user_id: authData.user.id,
        reference_number: referenceNumber,
        plan_id: plan.planId,
        plan_title: plan.title,
        plan_price: plan.price,
        frequency: plan.frequency,
        service_type: plan.serviceType,
        customer_name: input.customerName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        preferred_date: input.preferredDate,
        preferred_time_slot: input.preferredTimeSlot,
        notes: input.notes || null,
        status: 'received'
      })
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    return mapMaintenanceRequest(data as MaintenanceRequestRow);
  },

  getLifecycle: async ({ planId, requestId, visitId }: { planId?: string | null; requestId?: string | null; visitId?: string | null }): Promise<MaintenanceLifecycle | null> => {
    let resolvedPlanId = planId;
    if (!resolvedPlanId && visitId) {
      const { data: visit, error } = await supabase.from('maintenance_visits').select('plan_id').eq('id', visitId).maybeSingle();
      if (error) throw error;
      resolvedPlanId = visit?.plan_id ?? null;
    }
    let planQuery = supabase.from('maintenance_plans').select('*');
    if (resolvedPlanId) planQuery = planQuery.eq('id', resolvedPlanId);
    else if (requestId) planQuery = planQuery.eq('maintenance_request_id', requestId);
    else planQuery = planQuery.not('status', 'in', '(cancelled,completed,expired,closed)').order('updated_at', { ascending: false }).limit(1);
    const { data: planRow, error: planError } = await planQuery.maybeSingle();
    if (planError) {
      if (isMaintenanceSchemaUnavailable(planError)) return null;
      throw planError;
    }
    if (!planRow) return null;
    const plan = mapPlan(planRow);
    const [requestResult, visitsResult, historyResult, feedbackResult] = await Promise.all([
      supabase.from('maintenance_requests').select('*').eq('id', plan.maintenanceRequestId).maybeSingle(),
      supabase.from('maintenance_visits').select('*').eq('plan_id', plan.id).order('visit_number'),
      supabase.from('maintenance_status_history').select('*').eq('plan_id', plan.id).order('created_at'),
      supabase.from('maintenance_feedback').select('*').eq('plan_id', plan.id).order('created_at')
    ]);
    const error = requestResult.error ?? visitsResult.error ?? historyResult.error ?? feedbackResult.error;
    if (error) throw error;
    return {
      plan,
      request: requestResult.data ? mapMaintenanceRequest(requestResult.data as MaintenanceRequestRow) : null,
      visits: (visitsResult.data ?? []).map(mapVisit),
      history: (historyResult.data ?? []).map(mapHistory),
      feedback: (feedbackResult.data ?? []).map(mapFeedback)
    };
  },

  submitFeedback: async (input: MaintenanceFeedbackInput) => {
    const { data, error } = await supabase.rpc('submit_maintenance_feedback', {
      p_visit_id: input.visitId,
      p_overall_rating: input.overallRating,
      p_service_quality_rating: input.serviceQualityRating ?? null,
      p_professionalism_rating: input.professionalismRating ?? null,
      p_punctuality_rating: input.punctualityRating ?? null,
      p_comments: input.comments?.trim() || null,
      p_needs_follow_up: input.needsFollowUp ?? false
    });
    if (error) throw error;
    return data;
  },

  cancelRequest: async ({
    requestId,
    reason,
    note
  }: {
    requestId: string;
    reason?: string;
    note?: string;
  }): Promise<MaintenanceBooking> => {
    const { data, error } = await supabase.rpc('cancel_maintenance_request', {
      p_request_id: requestId,
      p_cancellation_reason: reason?.trim() || null,
      p_cancellation_note: note?.trim() || null
    });
    if (error) throw error;
    if (!data) throw new Error('Maintenance request was not found.');
    return mapMaintenanceRequest(data as MaintenanceRequestRow);
  }
};
