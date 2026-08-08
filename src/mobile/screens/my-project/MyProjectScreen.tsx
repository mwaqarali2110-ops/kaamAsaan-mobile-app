import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardCheck, Home, PanelsTopLeft, ShoppingBag, Sun, X } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { useActiveSurveyJourney, useLatestSurveyJourney } from '@/hooks/useSurveyJourney';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import { MySolarJourneyScreen } from '@/mobile/screens/survey/MySolarJourneyScreen';
import { PremiumCareProgressScreen } from '@/mobile/screens/services/PremiumCareProgressScreen';
import { useMaintenanceLifecycle } from '@/hooks/useMaintenanceLifecycle';
import { getPrimaryActiveProject } from '@/utils/activeProject';

const myProjectImage = require('../../../../my project.png');

const EmptyProjectScreen = ({ navigation }: any) => (
  <Screen includeBottomInset={false}>
    <Header title="My Project" subtitle="Start your solar journey" />
    <View style={styles.emptyHero}>
      <View style={styles.illustrationWrap}>
        <Image source={myProjectImage} style={styles.projectImage} resizeMode="contain" />
      </View>

      <View style={styles.emptyCopy}>
        <Text style={styles.emptyEyebrow}>My Project</Text>
        <Text style={styles.emptyTitle}>Ready to Start Your Solar Journey?</Text>
        <Text style={styles.emptySubtitle}>
          Design your solar system and book a survey to get started.
        </Text>
      </View>

      <View style={styles.emptyActions}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('DesignFlow')}>
          <PanelsTopLeft color="#10213A" size={18} strokeWidth={2.4} />
          <Text style={styles.primaryButtonText}>Design My System</Text>
          <ArrowRight color="#10213A" size={16} strokeWidth={2.5} />
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Marketplace')}>
          <ShoppingBag color="#E8A000" size={18} strokeWidth={2.4} />
          <Text style={styles.secondaryButtonText}>Explore Marketplace</Text>
        </Pressable>
      </View>
    </View>
  </Screen>
);

const CancelledSurveyMotivationCard = ({ navigation, onDismiss }: { navigation: any; onDismiss: () => void }) => (
  <View style={styles.motivationCard}>
    <Pressable
      style={styles.motivationClose}
      onPress={onDismiss}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Dismiss cancelled survey message"
    >
      <X color="#6B7280" size={17} strokeWidth={2.5} />
    </Pressable>
    <View style={styles.motivationIconWrap}>
      <View style={styles.motivationSun}>
        <Sun color="#B07800" size={18} strokeWidth={2.4} />
      </View>
      <Home color="#10213A" size={24} strokeWidth={2.3} />
    </View>
    <Text style={styles.motivationTitle}>Ready to Continue Your Solar Journey?</Text>
    <Text style={styles.motivationMessage}>
      Your survey booking was cancelled, but you can start again anytime. Book a new survey and let KaamAsaan help you plan the right solar solution for your home.
    </Text>
    <Pressable style={styles.motivationCta} onPress={() => navigation.navigate('BookSurvey')} accessibilityRole="button">
      <ClipboardCheck color="#10213A" size={17} strokeWidth={2.4} />
      <Text style={styles.motivationCtaText}>Book Survey</Text>
      <ArrowRight color="#10213A" size={15} strokeWidth={2.6} />
    </Pressable>
  </View>
);

export const MyProjectScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.session?.user.id);
  const isFocused = useIsFocused();
  const activeJourney = useActiveSurveyJourney(userId);
  const latestJourney = useLatestSurveyJourney(userId);
  const appHasHydrated = useAppStore((state) => state.hasHydrated);
  const dismissedCancelledSurveyIds = useAppStore((state) => state.dismissedCancelledSurveyIds);
  const dismissCancelledSurveyPrompt = useAppStore((state) => state.dismissCancelledSurveyPrompt);
  const maintenanceHasHydrated = useMaintenanceBookingStore((state) => state.hydrated);
  const hydrateMaintenanceBookings = useMaintenanceBookingStore((state) => state.hydrate);
  // This hook only discovers which project should be shown. The rendered progress
  // screen owns the plan and visit realtime channels, avoiding duplicate topics.
  const activeMaintenancePlan = useMaintenanceLifecycle({ activeUserId: userId }, { realtime: false });

  useEffect(() => {
    if (!isFocused || !userId) return;
    void activeJourney.refetch();
    void latestJourney.refetch();
  }, [activeJourney.refetch, isFocused, latestJourney.refetch, userId]);

  useEffect(() => {
    if (isFocused) void hydrateMaintenanceBookings(true);
  }, [hydrateMaintenanceBookings, isFocused]);

  const primaryProject = useMemo(() => getPrimaryActiveProject({
    solarProjects: activeJourney.data ? [activeJourney.data] : [],
    maintenanceRequests: [],
    userId
  }), [activeJourney.data, userId]);
  const shouldShowCancelledMotivation = !primaryProject && !activeMaintenancePlan.data
    && appHasHydrated
    && latestJourney.data?.status === 'cancelled'
    && !dismissedCancelledSurveyIds.includes(latestJourney.data.id);

  const dismissMotivation = () => {
    const cancelledSurveyId = latestJourney.data?.id;
    if (cancelledSurveyId) dismissCancelledSurveyPrompt(cancelledSurveyId);
  };

  if (activeJourney.isLoading || latestJourney.isLoading || activeMaintenancePlan.isLoading || !appHasHydrated || !maintenanceHasHydrated) {
    return (
      <Screen scroll={false} includeBottomInset={false} className="flex-1 items-center justify-center">
        <ActivityIndicator color="#F5A623" size="large" />
        <Text style={styles.loadingText}>{t('project.loading')}</Text>
      </Screen>
    );
  }

  if (primaryProject?.type === 'solar_survey') {
    return (
      <MySolarJourneyScreen
        navigation={navigation}
        route={{ params: { bookingId: primaryProject.project.id, fromTab: true } }}
      />
    );
  }

  if (activeMaintenancePlan.data) {
    const maintenanceRequest = activeMaintenancePlan.data.request;
    return (
      <PremiumCareProgressScreen
        navigation={navigation}
        identity={{ planId: activeMaintenancePlan.data.plan.id, requestId: maintenanceRequest?.id }}
      />
    );
  }

  if (shouldShowCancelledMotivation) {
    return (
      <Screen includeBottomInset={false}>
        <Header title={t('project.title')} subtitle="Start your solar journey" />
        <CancelledSurveyMotivationCard navigation={navigation} onDismiss={dismissMotivation} />
      </Screen>
    );
  }

  return <EmptyProjectScreen navigation={navigation} />;
};

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 12,
    color: '#526174',
    fontSize: 13,
    fontWeight: '700'
  },
  emptyHero: {
    minHeight: 620,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  illustrationWrap: {
    width: '100%',
    aspectRatio: 1402 / 1122,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  projectImage: {
    width: '100%',
    height: '100%'
  },
  emptyCopy: {
    marginTop: 22,
    alignItems: 'center',
    paddingHorizontal: 10
  },
  emptyEyebrow: {
    color: '#B07800',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  emptyTitle: {
    color: '#071B33',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center'
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10
  },
  emptyActions: {
    width: '100%',
    gap: 10,
    marginTop: 24
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F7B500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    shadowColor: '#B07800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 3
  },
  primaryButtonText: {
    color: '#10213A',
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: '#10213A',
    fontSize: 14,
    fontWeight: '900'
  },
  emptyActionWrap: {
    marginTop: 16
  },
  motivationCard: {
    position: 'relative',
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#7A4E00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  motivationClose: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3EB'
  },
  motivationIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFF3CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  motivationSun: {
    position: 'absolute',
    right: -3,
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0D69A'
  },
  motivationTitle: {
    paddingRight: 34,
    color: '#10213A',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900'
  },
  motivationMessage: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '700'
  },
  motivationCta: {
    alignSelf: 'flex-start',
    marginTop: 14,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#F7B500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 15
  },
  motivationCtaText: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  emptyFallback: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    padding: 14
  },
  emptyFallbackText: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '700'
  },
  maintenanceCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    padding: 14,
    flexDirection: 'row',
    gap: 12
  },
  maintenanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#FFF0C6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  maintenanceCopy: {
    flex: 1
  },
  maintenanceTitle: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900'
  },
  maintenanceMeta: {
    marginTop: 3,
    color: '#526174',
    fontSize: 11,
    fontWeight: '800'
  },
  maintenanceStatus: {
    marginTop: 8,
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700'
  },
  bookButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F7B500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18
  },
  bookButtonText: {
    color: '#10213A',
    fontSize: 14,
    fontWeight: '900'
  }
});
