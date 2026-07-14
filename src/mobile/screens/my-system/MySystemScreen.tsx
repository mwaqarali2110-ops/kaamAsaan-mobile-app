import React, { Component, type ReactNode, useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, BatteryCharging, CalendarDays, ChartNoAxesCombined, Home, PanelsTopLeft, ShieldCheck, Sun, Zap } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { Header } from '@/components/ui/Header';
import { useMySystemStatus } from '@/hooks/useMySystemStatus';
import { formatSurveyReference } from '@/services/journey.api';
import { useSystemStore, type DesignSystemStep } from '@/store/useSystemStore';
import { colors } from '@/constants/colors';
import { calculateLoadKw, calculatePanelCount } from '@/utils/calculations';

const emptyStateVideo = require('../../../../My system screen video.mp4');

type ExpoVideoModule = {
  VideoView: any;
  useVideoPlayer: (source: any, setup?: (player: any) => void) => any;
};

let expoVideoModule: ExpoVideoModule | null = null;

try {
  expoVideoModule = require('expo-video') as ExpoVideoModule;
} catch {
  expoVideoModule = null;
}

const stepProgress: Record<DesignSystemStep, number> = {
  appliances: 13,
  solar: 25,
  roof: 38,
  backupNeed: 50,
  backupAppliances: 63,
  backupPlan: 75,
  recommended: 88,
  packages: 96,
};

const stepLabel: Record<DesignSystemStep, string> = {
  appliances: 'Appliances selected',
  solar: 'Solar recommendation',
  roof: 'Roof space estimate',
  backupNeed: 'Backup decision',
  backupAppliances: 'Backup appliances',
  backupPlan: 'Battery backup plan',
  recommended: 'Recommended system',
  packages: 'Package selection',
};

export const MySystemScreen = ({ navigation }: any) => {
  const status = useMySystemStatus();
  const insets = useSafeAreaInsets();

  if (status.isLoadingSurvey) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.amber} size="large" />
          <Text style={styles.loadingText}>Checking your system...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status.mode === 'confirmedSurvey' && status.activeSurvey) {
    return <ConfirmedSurveySystem navigation={navigation} bottomPadding={insets.bottom} booking={status.activeSurvey} />;
  }

  if (status.mode === 'activeDesign') {
    return <ActiveDesignSystem navigation={navigation} bottomPadding={insets.bottom} />;
  }

  return <MySystemEmptyScreen navigation={navigation} bottomPadding={insets.bottom} />;
};

const MySystemEmptyScreen = ({ navigation, bottomPadding }: { navigation: any; bottomPadding: number }) => {
  return (
    <View style={styles.emptyRoot}>
      <VideoErrorBoundary fallback={<FallbackEmptyBackground />}>
        <OptionalVideoBackground fallback={<FallbackEmptyBackground />} />
      </VideoErrorBoundary>
      <View style={styles.emptyVideoOverlay} />
      <SafeAreaView style={[styles.emptySafeArea, { paddingBottom: 24 + bottomPadding }]}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <PanelsTopLeft color={colors.amber} size={30} strokeWidth={2.4} />
          </View>
          <Text style={styles.emptyTitle}>No system yet</Text>
          <Text style={styles.emptySubtitle}>Design your solar system and track your complete journey here.</Text>
          <Pressable
            accessibilityLabel="Design your System"
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(16,36,60,0.12)' }}
            onPress={() => navigation.navigate('DesignFlow', { screen: 'appliances' })}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Sun color={colors.navy} size={20} strokeWidth={2.4} />
            <Text style={styles.primaryButtonText}>Design your System!</Text>
            <ArrowRight color={colors.navy} size={20} strokeWidth={2.6} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const OptionalVideoBackground = ({ fallback }: { fallback: ReactNode }) => {
  if (!expoVideoModule?.VideoView || !expoVideoModule?.useVideoPlayer) return <>{fallback}</>;

  const { VideoView, useVideoPlayer } = expoVideoModule;
  const player = useVideoPlayer(emptyStateVideo, (videoPlayer: any) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.emptyVideo}
    />
  );
};

class VideoErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const FallbackEmptyBackground = () => (
  <View style={styles.fallbackBackground}>
    <View style={styles.fallbackGlowTop} />
    <View style={styles.fallbackGlowBottom} />
    <View style={styles.fallbackSolarLineOne} />
    <View style={styles.fallbackSolarLineTwo} />
  </View>
);

const ActiveDesignSystem = ({ navigation, bottomPadding }: { navigation: any; bottomPadding: number }) => {
  const appliances = useSystemStore((state) => state.appliances);
  const panelWattage = useSystemStore((state) => state.panelWattage);
  const recommendedSolarKw = useSystemStore((state) => state.recommendedSolarKw);
  const backupKwh = useSystemStore((state) => state.selectedBatteryKwh);
  const lastDesignStep = useSystemStore((state) => state.lastDesignStep);
  const navigatingRef = useRef(false);
  const progress = stepProgress[lastDesignStep] ?? 13;
  const loadKw = useMemo(() => calculateLoadKw(appliances), [appliances]);
  const panelCount = useMemo(
    () => calculatePanelCount(recommendedSolarKw, panelWattage),
    [panelWattage, recommendedSolarKw]
  );
  const handleContinueDesigning = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    navigation.navigate('DesignFlow', { screen: lastDesignStep });
    setTimeout(() => {
      navigatingRef.current = false;
    }, 800);
  }, [lastDesignStep, navigation]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 104 + bottomPadding }]}>
        <Header title="My System" subtitle="Continue your solar design" />
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Sun color={colors.amber} size={30} strokeWidth={2.5} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>System design in progress</Text>
            <Text style={styles.heroSubtitle}>{stepLabel[lastDesignStep]} is your latest saved step.</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Design Progress</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard Icon={Sun} label="Solar Size" value={`${recommendedSolarKw || 0} kW`} />
          <MetricCard Icon={Zap} label="Running Load" value={`${loadKw.toFixed(1)} kW`} />
          <MetricCard Icon={PanelsTopLeft} label="Panels" value={`${panelCount || 0}`} />
          <MetricCard Icon={BatteryCharging} label="Battery" value={backupKwh ? `${backupKwh} kWh` : 'Not selected'} />
        </View>

        <Pressable style={styles.continueButton} onPress={handleContinueDesigning}>
          <View style={styles.continueButtonLeft}>
            <View style={styles.continueIconCircle}>
              <Zap size={20} color="#0B1F33" />
            </View>
            <Text style={styles.continueButtonText}>Continue Designing</Text>
          </View>

          <ArrowRight size={24} color="#0B1F33" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const ConfirmedSurveySystem = ({ navigation, bottomPadding, booking }: { navigation: any; bottomPadding: number; booking: any }) => {
  const panelWattage = useSystemStore((state) => state.panelWattage);
  const recommendedSolarKw = useSystemStore((state) => state.recommendedSolarKw);
  const panelCount = useMemo(
    () => calculatePanelCount(recommendedSolarKw, panelWattage),
    [panelWattage, recommendedSolarKw]
  );
  const reference = formatSurveyReference(booking);
  const statusLabel = String(booking.status || 'pending').replace(/_/g, ' ');

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.confirmedContent, { paddingBottom: 104 + bottomPadding }]}>
        <View style={styles.confirmedCard}>
          <View style={styles.confirmedIcon}>
            <ShieldCheck color={colors.green} size={34} strokeWidth={2.4} />
          </View>
          <Text style={styles.confirmedTitle}>Your system is being handled</Text>
          <Text style={styles.confirmedSubtitle}>KaamAsaan has received your survey request and your project status is active.</Text>
          <View style={styles.referencePill}>
            <Text style={styles.referenceLabel}>Reference</Text>
            <Text style={styles.referenceValue}>{reference}</Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <DetailRow Icon={CalendarDays} label="Survey Status" value={statusLabel} />
          <DetailRow Icon={Home} label="City" value={booking.city || 'To be confirmed'} />
          <DetailRow Icon={Sun} label="System Size" value={`${recommendedSolarKw || 0} kW`} />
          <DetailRow Icon={PanelsTopLeft} label="Panels" value={`${panelCount || 0} panels`} last />
        </View>

        <View style={styles.trackProgressShadow}>
          <Pressable
            accessibilityLabel="Track Progress"
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            onPress={() => navigation.navigate('MySolarJourney', { bookingId: booking.id })}
            style={({ pressed }) => [styles.trackProgressButton, pressed && styles.trackProgressButtonPressed]}
          >
            <Svg height="64" preserveAspectRatio="none" style={styles.trackProgressGradient} viewBox="0 0 340 64" width="100%">
              <Defs>
                <SvgLinearGradient id="track-progress-gold" x1="0" x2="1" y1="0" y2="1">
                  <Stop offset="0" stopColor="#F5B400" />
                  <Stop offset="1" stopColor="#D99A00" />
                </SvgLinearGradient>
              </Defs>
              <Rect fill="url(#track-progress-gold)" height="64" width="340" x="0" y="0" />
            </Svg>

            <View style={styles.trackProgressContent}>
              <ChartNoAxesCombined color="#FFFFFF" size={32} strokeWidth={2.5} />
              <Text style={styles.trackProgressText}>Track Progress</Text>
              <ArrowRight color="#FFFFFF" size={34} strokeWidth={2.6} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MetricCard = ({ Icon, label, value }: { Icon: any; label: string; value: string }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricIcon}>
      <Icon color={colors.amber} size={22} strokeWidth={2.4} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const DetailRow = ({ Icon, label, value, last }: { Icon: any; label: string; value: string; last?: boolean }) => (
  <View style={[styles.detailRow, last && styles.detailRowLast]}>
    <View style={styles.detailIcon}>
      <Icon color={colors.amber} size={20} strokeWidth={2.3} />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF8F1',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  confirmedContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyRoot: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  emptyVideo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFF7E6',
  },
  fallbackGlowTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(245, 158, 11, 0.20)',
  },
  fallbackGlowBottom: {
    position: 'absolute',
    left: -140,
    bottom: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
  },
  fallbackSolarLineOne: {
    position: 'absolute',
    left: -40,
    right: 40,
    bottom: 108,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    transform: [{ rotate: '-9deg' }],
  },
  fallbackSolarLineTwo: {
    position: 'absolute',
    left: 28,
    right: -80,
    bottom: 72,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    transform: [{ rotate: '-9deg' }],
  },
  emptyVideoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  emptySafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  emptyCard: {
    width: '88%',
    maxWidth: 380,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    padding: 24,
    shadowColor: '#071D35',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 7,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF4CC',
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    borderRadius: 14,
    backgroundColor: colors.amber,
    paddingHorizontal: 18,
    overflow: 'hidden',
    width: '100%',
  },
  fullButton: {
    marginTop: 18,
    width: '100%',
  },
  trackProgressShadow: {
    marginTop: 16,
    borderRadius: 18,
    shadowColor: '#A66E00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 7,
  },
  trackProgressButton: {
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F5B400',
  },
  trackProgressButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  trackProgressGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  trackProgressContent: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  trackProgressText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
  },
  continueButton: {
    marginHorizontal: 24,
    marginTop: 22,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  continueIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B1F33',
  },
  heroCard: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF4CC',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6,
  },
  progressCard: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  progressValue: {
    color: colors.amber,
    fontSize: 16,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 99,
    backgroundColor: '#F1E7D6',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.amber,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  metricCard: {
    width: '48%',
    minHeight: 112,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  metricIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#FFF4CC',
    marginBottom: 10,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  metricValue: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  confirmedCard: {
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  confirmedIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#EAF8EE',
    marginBottom: 13,
  },
  confirmedTitle: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  confirmedSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  referencePill: {
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFF7E6',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  referenceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  referenceValue: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  detailCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  detailRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFF4CC',
  },
  detailLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailValue: {
    maxWidth: '48%',
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'capitalize',
    textAlign: 'right',
  },
});
