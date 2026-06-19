import type { MaintenancePlanId, MaintenancePlanSelection } from '@/types/maintenance.types';

export const maintenancePlans: Record<MaintenancePlanId, MaintenancePlanSelection> = {
  essential: {
    planId: 'essential',
    title: 'Essential Care',
    price: 15000,
    frequency: '4 Visits / Year',
    serviceType: 'preventive_maintenance'
  },
  standard: {
    planId: 'standard',
    title: 'Standard',
    price: 7999,
    frequency: '2 Visits / Year',
    serviceType: 'preventive_maintenance'
  },
  premium: {
    planId: 'premium',
    title: 'Premium Care',
    price: 20000,
    frequency: '4 Visits / Year',
    serviceType: 'preventive_maintenance'
  }
};

export const getMaintenancePlan = (planId: MaintenancePlanId) => maintenancePlans[planId];

export const maintenancePlanList = Object.values(maintenancePlans);

export const formatMaintenancePrice = (price: number) => `PKR ${price.toLocaleString('en-US')}`;
