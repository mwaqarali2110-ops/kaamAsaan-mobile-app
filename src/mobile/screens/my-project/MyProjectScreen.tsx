import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardCheck, Home, PanelsTopLeft, ShoppingBag, ShieldCheck, Sun, X } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { useActiveSurveyJourney, useLatestSurveyJourney } from '@/hooks/useSurveyJourney';
import { useAuthStore } from '@/store/useAuthStore';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import { MySolarJourneyScreen } from '@/mobile/screens/survey/MySolarJourneyScreen';

const EmptyProjectScreen = ({ navigation }: any) => (
  <Screen>
    <View style={styles.emptyHero}>
      <View style={styles.illustrationWrap}>
        <View style={styles.sunGlow} />
        <Image source={require('../../../assets/home/hero-house.png')} style={styles.houseImage} />
      </View>

      <View style={styles.emptyCopy}>
        <Text style={styles.emptyEyebrow}>My Project</Text>
        <Text style={styles.emptyTitle}>No Active Project Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start by designing your solar system. Once your survey is booked, your project progress will appear here automatically.
        </Text>
      </View>

      <View style={styles.emptyActions}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('DesignFlow')}>
          <PanelsTopLeft color="#10213A" size={18} strokeWidth={2.4} />
          <Text style={styles.primaryButtonText}>Design My System</Text>
          <ArrowRight color="#10213A" size={17} strokeWidth={2.5} />
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
    <Pressable style={styles.motivationClose} onPress={onDismiss} hitSlop={12} accessibilityLabel="Close survey reminder">
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
  const latestMaintenanceBooking = useMaintenanceBookingStore((state) => state.latestBooking);
  const hydrateMaintenanceBookings = useMaintenanceBookingStore((state) => state.hydrate);
  const [motivationDismissed, setMotivationDismissed] = useState(false);

  useEffect(() => {
    if (!isFocused || !userId) return;
    void activeJourney.refetch();
    void latestJourney.refetch();
  }, [activeJourney.refetch, isFocused, latestJourney.refetch, userId]);

  useEffect(() => {
    if (isFocused) void hydrateMaintenanceBookings();
  }, [hydrateMaintenanceBookings, isFocused]);

  const hasActiveSolarProject = Boolean(activeJourney.data);
  const shouldShowCancelledMotivation = !hasActiveSolarProject
    && latestJourney.data?.status === 'cancelled'
    && !motivationDismissed;
  const subtitle = latestMaintenanceBooking ? 'Your active service request' : 'No active solar project';

  const dismissMotivation = () => {
    setMotivationDismissed(true);
    navigation.navigate('Home');
  };

  if (activeJourney.isLoading || latestJourney.isLoading) {
    return (
      <Screen scroll={false} className="flex-1 items-center justify-center">
        <ActivityIndicator color="#F5A623" size="large" />
        <Text style={styles.loadingText}>{t('project.loading')}</Text>
      </Screen>
    );
  }

  if (hasActiveSolarProject && activeJourney.data) {
    return (
      <MySolarJourneyScreen
        navigation={navigation}
        route={{ params: { bookingId: activeJourney.data.id, fromTab: true } }}
      />
    );
  }

  if (latestMaintenanceBooking || shouldShowCancelledMotivation) {
    return (
      <Screen>
        <Header title={t('project.title')} subtitle={subtitle} />
        {shouldShowCancelledMotivation ? (
          <CancelledSurveyMotivationCard navigation={navigation} onDismiss={dismissMotivation} />
        ) : null}
        {latestMaintenanceBooking ? (
          <>
            <View style={styles.maintenanceCard}>
              <View style={styles.maintenanceIcon}>
                <ShieldCheck color="#E8A000" size={22} strokeWidth={2.4} />
              </View>
              <View style={styles.maintenanceCopy}>
                <Text style={styles.maintenanceTitle}>{latestMaintenanceBooking.plan.title} Maintenance</Text>
                <Text style={styles.maintenanceMeta}>{latestMaintenanceBooking.referenceNumber}</Text>
                <Text style={styles.maintenanceStatus}>Request received. Our team will contact you shortly.</Text>
              </View>
            </View>
            <View style={styles.emptyActionWrap}>
              <Pressable
                style={styles.bookButton}
                onPress={() => navigation.navigate('MaintenanceBookingConfirmation', { booking: latestMaintenanceBooking })}
              >
                <ClipboardCheck color="#10213A" size={18} strokeWidth={2.4} />
                <Text style={styles.bookButtonText}>View Request</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyFallback}>
            <Text style={styles.emptyFallbackText}>No active solar project is currently in progress.</Text>
          </View>
        )}
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
    height: 210,
    borderRadius: 24,
    backgroundColor: '#FFF8EA',
    borderWidth: 1,
    borderColor: '#EFE3D3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  sunGlow: {
    position: 'absolute',
    top: 26,
    right: 36,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFF0BF'
  },
  houseImage: {
    width: '92%',
    height: 185,
    resizeMode: 'contain'
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
    fontSize: 25,
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
