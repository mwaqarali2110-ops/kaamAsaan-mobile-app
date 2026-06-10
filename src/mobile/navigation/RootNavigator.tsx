import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, PanelsTopLeft, ShoppingBag, User, ClipboardList } from 'lucide-react-native';
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
import { PreventiveMaintenanceScreen } from '@/mobile/screens/services/PreventiveMaintenanceScreen';
import { MaintenancePackagesScreen } from '@/mobile/screens/services/MaintenancePackagesScreen';
import { LiveTrackingScreen } from '@/mobile/screens/services/LiveTrackingScreen';
import { PostServiceHealthReportScreen } from '@/mobile/screens/services/PostServiceHealthReportScreen';
import { SolarCareMembershipScreen } from '@/mobile/screens/services/SolarCareMembershipScreen';
import { RoofSpaceToolScreen } from '@/mobile/screens/solar-tools/RoofSpaceToolScreen';
import { ROICalculatorScreen, ROIResultScreen } from '@/mobile/screens/solar-tools/ROICalculatorScreen';
import { SolarSizeToolScreen } from '@/mobile/screens/solar-tools/SolarSizeToolScreen';
import { RecommendedSolarSizeScreen } from '@/mobile/screens/solar-tools/RecommendedSolarSizeScreen';
import { BatterySizeToolScreen } from '@/mobile/screens/solar-tools/BatterySizeToolScreen';
import { LoginScreen } from '@/mobile/screens/auth/LoginScreen';
import { SignupScreen } from '@/mobile/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/mobile/screens/auth/ForgotPasswordScreen';
import { bindSupabaseAutoRefresh } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const AuthLoadingScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FBF8F1' }}>
    <ActivityIndicator color={colors.amber} size="large" />
    <Text style={{ color: colors.navy, fontSize: 13, fontWeight: '800' }}>Checking your account...</Text>
  </View>
);

const ProtectedBookSurveyScreen = (props: any) => {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (initialized && !session) props.navigation.replace('Login', { redirectTo: 'BookSurvey' });
  }, [initialized, props.navigation, session]);

  if (!initialized || !session) return <AuthLoadingScreen />;
  return <BookSurveyScreen {...props} />;
};

const MainTabs = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.amber,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: {
        height: 60,
        paddingBottom: 6,
        paddingTop: 5,
        backgroundColor: colors.card,
        borderTopColor: colors.line,
        borderTopWidth: 1
      },
      tabBarItemStyle: { paddingVertical: 2 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '800' }
    }}
  >
    <Tabs.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Home color={color} size={19} /> }} />
    <Tabs.Screen name="Marketplace" component={ExploreMarketplaceScreen} options={{ tabBarIcon: ({ color }) => <ShoppingBag color={color} size={19} /> }} />
    <Tabs.Screen name="MySystem" component={MySystemScreen} options={{ title: 'My System', tabBarIcon: ({ color }) => <PanelsTopLeft color={color} size={19} /> }} />
    <Tabs.Screen name="MyProject" component={MyProjectScreen} options={{ title: 'My Project', tabBarIcon: ({ color }) => <ClipboardList color={color} size={19} /> }} />
    <Tabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <User color={color} size={19} /> }} />
  </Tabs.Navigator>
);

export const RootNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const onSplashDone = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    void initializeAuth();
    return bindSupabaseAutoRefresh();
  }, [initializeAuth]);

  if (showSplash) return <SplashScreen onDone={onSplashDone} />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? <Stack.Screen name="Onboarding" component={OnboardingScreen} /> : null}
        <Stack.Screen name="MainTabs" component={MainTabs} />
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
        <Stack.Screen name="PreventiveMaintenance" component={PreventiveMaintenanceScreen} />
        <Stack.Screen name="MaintenancePackages" component={MaintenancePackagesScreen} />
        <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
        <Stack.Screen name="PostServiceHealthReport" component={PostServiceHealthReportScreen} />
        <Stack.Screen name="SolarCareMembership" component={SolarCareMembershipScreen} />
        <Stack.Screen name="RoofSpaceTool" component={RoofSpaceToolScreen} />
        <Stack.Screen name="ROICalculator" component={ROICalculatorScreen} />
        <Stack.Screen name="ROIResult" component={ROIResultScreen} />
        <Stack.Screen name="SolarSizeTool" component={SolarSizeToolScreen} />
        <Stack.Screen name="RecommendedSolarSize" component={RecommendedSolarSizeScreen} />
        <Stack.Screen name="BatterySizeTool" component={BatterySizeToolScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
