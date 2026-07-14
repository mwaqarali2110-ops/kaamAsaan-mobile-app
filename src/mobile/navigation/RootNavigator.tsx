import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, PanelsTopLeft, ShoppingBag, User, ClipboardList } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';
import { SplashScreen } from '@/mobile/screens/onboarding/SplashScreen';
import { OnboardingScreen } from '@/mobile/screens/onboarding/OnboardingScreen';
import { HomeScreen } from '@/mobile/screens/home/HomeScreen';
import { DesignSystemFlowScreen } from '@/mobile/screens/design-system/DesignSystemFlowScreen';
import { ExploreMarketplaceScreen } from '@/mobile/screens/marketplace/ExploreMarketplaceScreen';
import { MarketplaceFlowScreen } from '@/mobile/screens/marketplace/MarketplaceFlowScreen';
import { ProductDetailScreen } from '@/mobile/screens/marketplace/ProductDetailScreen';
import { MySystemScreen } from '@/mobile/screens/my-system/MySystemScreen';
import { SystemSummaryScreen } from '@/mobile/screens/my-system/SystemSummaryScreen';
import { MyProjectScreen } from '@/mobile/screens/my-project/MyProjectScreen';
import { ProfileScreen } from '@/mobile/screens/profile/ProfileScreen';
import { BookSurveyScreen } from '@/mobile/screens/survey/BookSurveyScreen';
import { SurveyConfirmationScreen } from '@/mobile/screens/survey/SurveyConfirmationScreen';
import { MySolarJourneyScreen } from '@/mobile/screens/survey/MySolarJourneyScreen';
import { ComplaintScreen } from '@/mobile/screens/support/ComplaintScreen';
import { HelpCenterScreen } from '@/mobile/screens/support/HelpCenterScreen';
import { HowItWorksScreen } from '@/mobile/screens/support/HowItWorksScreen';
import { PreventiveMaintenanceScreen } from '@/mobile/screens/services/PreventiveMaintenanceScreen';
import { ElectricalWorkBookingScreen, ElectricalWorkServicesScreen } from '@/mobile/screens/services/ElectricalWorkServicesScreen';
import { MaintenancePackagesScreen } from '@/mobile/screens/services/MaintenancePackagesScreen';
import { MaintenancePlanDetailsScreen } from '@/mobile/screens/services/MaintenancePlanDetailsScreen';
import { MaintenanceBookingScreen } from '@/mobile/screens/services/MaintenanceBookingScreen';
import { MaintenanceBookingConfirmationScreen } from '@/mobile/screens/services/MaintenanceBookingConfirmationScreen';
import { LiveTrackingScreen } from '@/mobile/screens/services/LiveTrackingScreen';
import { PostServiceHealthReportScreen } from '@/mobile/screens/services/PostServiceHealthReportScreen';
import { SolarCareMembershipScreen } from '@/mobile/screens/services/SolarCareMembershipScreen';
import { RoofSpaceToolScreen } from '@/mobile/screens/solar-tools/RoofSpaceToolScreen';
import { ROICalculatorScreen, ROIResultScreen } from '@/mobile/screens/solar-tools/ROICalculatorScreen';
import { SolarSizeToolScreen } from '@/mobile/screens/solar-tools/SolarSizeToolScreen';
import { RecommendedSolarSizeScreen } from '@/mobile/screens/solar-tools/RecommendedSolarSizeScreen';
import { BatterySizeToolScreen } from '@/mobile/screens/solar-tools/BatterySizeToolScreen';
import { BatteryRunningLoadScreen } from '@/mobile/screens/solar-tools/BatteryRunningLoadScreen';
import { BatteryRecommendedSizeScreen } from '@/mobile/screens/solar-tools/BatteryRecommendedSizeScreen';
import { NotificationsScreen } from '@/mobile/screens/notifications/NotificationsScreen';
import { LoginScreen } from '@/mobile/screens/auth/LoginScreen';
import { SignupScreen } from '@/mobile/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/mobile/screens/auth/ForgotPasswordScreen';
import { bindSupabaseAutoRefresh } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const AuthLoadingScreen = () => {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FBF8F1' }}>
      <ActivityIndicator color={colors.amber} size="large" />
      <Text style={{ color: colors.navy, fontSize: 13, fontWeight: '800' }}>{t('auth.checkingAccount')}</Text>
    </View>
  );
};

const ProtectedBookSurveyScreen = (props: any) => {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (initialized && !session) props.navigation.replace('Login', { redirectTo: 'BookSurvey' });
  }, [initialized, props.navigation, session]);

  if (!initialized || !session) return <AuthLoadingScreen />;
  return <BookSurveyScreen {...props} />;
};

const ProtectedMainTabs = (props: any) => {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (initialized && !session) {
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    }
  }, [initialized, props.navigation, session]);

  if (!initialized || !session) return <AuthLoadingScreen />;
  return <MainTabs />;
};

const MainTabs = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 10;
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64 + safeBottom,
          paddingBottom: safeBottom,
          paddingTop: 5,
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          borderTopWidth: 1
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' }
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <Home color={color} size={19} /> }} />
      <Tabs.Screen name="Marketplace" component={ExploreMarketplaceScreen} options={{ title: t('tabs.marketplace'), tabBarIcon: ({ color }) => <ShoppingBag color={color} size={19} /> }} />
      <Tabs.Screen name="MySystem" component={MySystemScreen} options={{ title: t('tabs.mySystem'), tabBarIcon: ({ color }) => <PanelsTopLeft color={color} size={19} /> }} />
      <Tabs.Screen name="MyProject" component={MyProjectScreen} options={{ title: t('tabs.myProject'), tabBarIcon: ({ color }) => <ClipboardList color={color} size={19} /> }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <User color={color} size={19} /> }} />
    </Tabs.Navigator>
  );
};

export const RootNavigator = () => {
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const onSplashDone = useCallback(() => setSplashAnimationComplete(true), []);

  useEffect(() => {
    void initializeAuth();
    return bindSupabaseAutoRefresh();
  }, [initializeAuth]);

  if (!splashAnimationComplete || !hasHydrated || !initialized) {
    return <SplashScreen onDone={onSplashDone} />;
  }

  const initialRouteName: keyof RootStackParamList = session
    ? 'MainTabs'
    : hasSeenOnboarding
      ? 'Login'
      : 'Onboarding';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={ProtectedMainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="DesignFlow" component={DesignSystemFlowScreen} />
        <Stack.Screen name="MarketplaceFlow" component={MarketplaceFlowScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="SystemSummary" component={SystemSummaryScreen} />
        <Stack.Screen name="BookSurvey" component={ProtectedBookSurveyScreen} />
        <Stack.Screen name="SurveyConfirmation" component={SurveyConfirmationScreen} />
        <Stack.Screen name="MySolarJourney" component={MySolarJourneyScreen} />
        <Stack.Screen name="Complaint" component={ComplaintScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
        <Stack.Screen name="PreventiveMaintenance" component={PreventiveMaintenanceScreen} />
        <Stack.Screen name="ElectricalWorkServices" component={ElectricalWorkServicesScreen} />
        <Stack.Screen name="ElectricalWorkBooking" component={ElectricalWorkBookingScreen} />
        <Stack.Screen name="MaintenancePackages" component={MaintenancePackagesScreen} />
        <Stack.Screen name="MaintenancePlanDetails" component={MaintenancePlanDetailsScreen} />
        <Stack.Screen name="MaintenanceBooking" component={MaintenanceBookingScreen} />
        <Stack.Screen name="MaintenanceBookingConfirmation" component={MaintenanceBookingConfirmationScreen} />
        <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
        <Stack.Screen name="PostServiceHealthReport" component={PostServiceHealthReportScreen} />
        <Stack.Screen name="SolarCareMembership" component={SolarCareMembershipScreen} />
        <Stack.Screen name="RoofSpaceTool" component={RoofSpaceToolScreen} />
        <Stack.Screen name="ROICalculator" component={ROICalculatorScreen} />
        <Stack.Screen name="ROIResult" component={ROIResultScreen} />
        <Stack.Screen name="SolarSizeTool" component={SolarSizeToolScreen} />
        <Stack.Screen name="RecommendedSolarSize" component={RecommendedSolarSizeScreen} />
        <Stack.Screen name="BatterySizeTool" component={BatterySizeToolScreen} />
        <Stack.Screen name="BatteryRunningLoad" component={BatteryRunningLoadScreen} />
        <Stack.Screen name="BatteryRecommendedSize" component={BatteryRecommendedSizeScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
