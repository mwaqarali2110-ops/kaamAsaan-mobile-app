import type { ProductCategory } from './product.types';
import type { MaintenanceBooking, MaintenancePlanSelection } from './maintenance.types';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Login: { redirectTo?: 'BookSurvey'; message?: string } | undefined;
  Signup: { redirectTo?: 'BookSurvey' } | undefined;
  ForgotPassword: undefined;
  DesignFlow: { screen?: string } | undefined;
  MarketplaceFlow: { category?: ProductCategory } | undefined;
  ProductDetail: { productId: string };
  SystemSummary: undefined;
  BookSurvey: undefined;
  SurveyConfirmation: { bookingId?: string };
  MySolarJourney: { bookingId: string };
  PreventiveMaintenance: undefined;
  MaintenancePackages: { plan?: MaintenancePlanSelection } | undefined;
  MaintenancePlanDetails: { plan: MaintenancePlanSelection };
  MaintenanceBooking: { plan: MaintenancePlanSelection };
  MaintenanceBookingConfirmation: { booking: MaintenanceBooking };
  LiveTracking: undefined;
  PostServiceHealthReport: undefined;
  SolarCareMembership: undefined;
  RoofSpaceTool: undefined;
  ROICalculator: undefined;
  ROIResult: { systemSize: number; batterySize: number; totalCost: number };
  SolarSizeTool: undefined;
  RecommendedSolarSize: { loadKw: number; systemKw: number };
  BatterySizeTool: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  MySystem: undefined;
  MyProject: undefined;
  Profile: undefined;
};
