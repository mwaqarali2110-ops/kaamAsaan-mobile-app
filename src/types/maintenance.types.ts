export type MaintenancePlanId = 'essential' | 'standard' | 'premium';

export type MaintenanceServiceType = 'preventive_maintenance' | 'solar_care';

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
  referenceNumber: string;
  plan: MaintenancePlanSelection;
  status: 'received';
  createdAt: string;
};
