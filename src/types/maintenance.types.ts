export type MaintenancePlanId = 'essential' | 'standard' | 'premium';

export type MaintenanceServiceType = 'preventive_maintenance' | 'solar_care';

export type MaintenanceRequestStatus =
  | 'received'
  | 'pending'
  | 'submitted'
  | 'pending_confirmation'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'technician_arrived'
  | 'completed'
  | 'closed'
  | 'cancelled';

export type MaintenancePlanStatus =
  | 'request_received'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'closed';

export type MaintenanceVisitStatus =
  | 'upcoming'
  | 'confirmation_pending'
  | 'customer_contacted'
  | 'team_assigned'
  | 'scheduled'
  | 'dispatched'
  | 'in_progress'
  | 'completed'
  | 'feedback_pending'
  | 'feedback_received'
  | 'cancelled'
  | 'rescheduled';

export type MaintenanceCancellationReason =
  | 'Schedule not suitable'
  | 'Booked by mistake'
  | 'No longer required'
  | 'Price concern'
  | 'Other';

export type MaintenancePlanSelection = {
  planId: MaintenancePlanId;
  title: string;
  price: number;
  frequency: string;
  serviceType: MaintenanceServiceType;
};

export type MaintenanceBookingInput = {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
};

export type MaintenanceBooking = MaintenanceBookingInput & {
  id: string;
  userId?: string;
  referenceNumber: string;
  plan: MaintenancePlanSelection;
  status: MaintenanceRequestStatus;
  createdAt: string;
  updatedAt?: string;
  backendSynced?: boolean;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancellationNote?: string | null;
  cancelledBy?: 'customer' | 'admin' | 'representative' | null;
  maintenancePlanId?: string | null;
};

export type MaintenancePlan = {
  id: string;
  userId: string;
  maintenanceRequestId: string;
  reference: string;
  planType: string;
  price: number;
  startDate: string;
  endDate: string;
  totalVisits: number;
  visitIntervalMonths: number;
  currentVisitNumber: number;
  status: MaintenancePlanStatus;
  assignedTeamName: string | null;
  assignedTeamPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceVisit = {
  id: string;
  planId: string;
  visitNumber: number;
  targetDate: string;
  windowStart: string;
  windowEnd: string;
  scheduledDate: string | null;
  scheduledTimeSlot: string | null;
  status: MaintenanceVisitStatus;
  assignedTeamName: string | null;
  assignedTeamPhone: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  workPerformed: string | null;
  reportUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceStatusHistory = {
  id: string;
  planId: string;
  visitId: string | null;
  previousStatus: string | null;
  newStatus: string;
  changedByRole: string;
  notes: string | null;
  createdAt: string;
};

export type MaintenanceFeedback = {
  id: string;
  planId: string;
  visitId: string;
  overallRating: number;
  serviceQualityRating: number | null;
  professionalismRating: number | null;
  punctualityRating: number | null;
  comments: string | null;
  needsFollowUp: boolean;
  createdAt: string;
};

export type MaintenanceLifecycle = {
  plan: MaintenancePlan;
  request: MaintenanceBooking | null;
  visits: MaintenanceVisit[];
  history: MaintenanceStatusHistory[];
  feedback: MaintenanceFeedback[];
};

export type MaintenanceFeedbackInput = {
  visitId: string;
  overallRating: number;
  serviceQualityRating?: number;
  professionalismRating?: number;
  punctualityRating?: number;
  comments?: string;
  needsFollowUp?: boolean;
};
