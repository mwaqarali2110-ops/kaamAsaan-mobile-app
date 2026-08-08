import type { ProductCategory } from './product.types';
import type { MaintenanceBooking, MaintenancePlanSelection } from './maintenance.types';
import type { Appliance } from './system.types';
import type { BookingContext } from '@/store/useSystemStore';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Login: { redirectTo?: 'BookSurvey'; message?: string } | undefined;
  Signup: { redirectTo?: 'BookSurvey' } | undefined;
  ForgotPassword: undefined;
  DesignFlow: { screen?: string; packageNotice?: string } | undefined;
  MarketplaceFlow: { category?: ProductCategory } | undefined;
  ProductDetail: { productId: string };
  SystemSummary: {
    packageId?: string;
    selectedAppliances?: Appliance[];
    totalBackupWatts?: number;
    runningLoadKw?: number;
    backupHours?: number;
    rawEnergyKwh?: number;
    recommendedBatteryKwh?: number;
  } | undefined;
  BookSurvey: {
    packageId?: string;
    bookingContext?: BookingContext;
    source?: 'cleaning_estimator' | 'installation_service' | 'solar_package' | 'electrical_service' | 'general';
    selectedServiceType?: 'load_distribution' | 'single_phase_to_3_phase_wiring' | 'diagnostic_services';
    selectedServiceTitle?: string;
  } | undefined;
  SurveyConfirmation: { bookingId?: string };
  MySolarJourney: { bookingId: string };
  Complaint: undefined;
  HelpCenter: undefined;
  HowItWorks: undefined;
  PreventiveMaintenance: undefined;
  CleaningServiceEstimator: undefined;
  InstallationService: undefined;
  ElectricalWorkServices: undefined;
  ElectricalWorkBooking: {
    selectedService: 'load_distribution' | 'single_phase_to_3_phase_wiring' | 'diagnostic_services';
    serviceTitle: string;
    serviceDescription: string;
  };
  MaintenancePackages: { plan?: MaintenancePlanSelection } | undefined;
  MaintenancePlanDetails: { plan: MaintenancePlanSelection };
  MaintenanceBooking: {
    plan: MaintenancePlanSelection;
    renewalFromPlanId?: string;
    initialValues?: Pick<MaintenanceBooking, 'customerName' | 'phone' | 'address' | 'city'>;
  };
  MaintenanceBookingConfirmation: { booking: MaintenanceBooking };
  PremiumCareProgress: { planId?: string; requestId?: string; visitId?: string };
  LiveTracking: undefined;
  PostServiceHealthReport: undefined;
  SolarCareMembership: undefined;
  RoofSpaceTool: undefined;
  ROICalculator: undefined;
  ROIResult: { systemSize: number; batterySize: number; totalCost: number; estimatedMonthlySavings?: number };
  SolarSizeTool: undefined;
  RecommendedSolarSize: { loadKw: number; systemKw: number };
  BatterySizeTool: undefined;
  BatteryRunningLoad: {
    selectedAppliances: Appliance[];
    totalBackupWatts: number;
    backupHours: number;
  };
  BatteryRecommendedSize: {
    selectedAppliances: Appliance[];
    totalBackupWatts: number;
    backupHours: number;
  };
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  MySystem: undefined;
  MyProject: undefined;
  Profile: undefined;
};
