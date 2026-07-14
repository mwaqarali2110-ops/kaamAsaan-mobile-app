import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Headphones,
  Home,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react-native';
import { getMaintenancePlan } from '@/data/maintenancePlans';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveSurveyJourney } from '@/hooks/useSurveyJourney';

const includedServices = [
  'Quarterly panel cleaning',
  'DC earthing water filling',
  'MC4 connectors tightening',
  'Nut bolts tightening',
  'Production monitoring',
  'Diagnostic visit if required',
  'Warranty claim support',
  'Maintenance report'
];

const trustItems = [
  { label: 'Trained technicians', Icon: UserCheck },
  { label: '1000+ customers', Icon: Users },
  { label: 'Reliable support', Icon: Headphones }
];

const checklistCardDuration = 500;
const checklistRowDelay = 70;
const checklistRowDuration = 290;
const checklistBorderRadius = 22;
const checklistCurrentDuration = 3200;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const AnimatedChecklistRow = React.memo(
  ({ service, index, isLast }: { service: string; index: number; isLast: boolean }) => {
    const rowProgress = useSharedValue(0);
    const iconProgress = useSharedValue(0);
    const delay = checklistCardDuration + 90 + index * checklistRowDelay;

    useEffect(() => {
      rowProgress.value = withDelay(
        delay,
        withTiming(1, {
          duration: checklistRowDuration,
          easing: Easing.out(Easing.cubic)
        })
      );
      iconProgress.value = withDelay(
        delay + 30,
        withTiming(1, {
          duration: 260,
          easing: Easing.out(Easing.cubic)
        })
      );
    }, [delay, iconProgress, rowProgress]);

    const rowAnimatedStyle = useAnimatedStyle(() => ({
      opacity: rowProgress.value,
      transform: [{ translateY: (1 - rowProgress.value) * 8 }]
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      opacity: iconProgress.value,
      transform: [{ scale: 0.85 + iconProgress.value * 0.15 }]
    }));

    return (
      <Animated.View style={[styles.serviceRow, isLast && styles.serviceRowLast, rowAnimatedStyle]}>
        <Animated.View style={iconAnimatedStyle}>
          <CheckCircle2 size={18} color="#F5A400" strokeWidth={2.4} />
        </Animated.View>
        <Text style={styles.serviceText}>{service}</Text>
      </Animated.View>
    );
  }
);

export const PreventiveMaintenanceScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.session?.user.id);
  const setSelectedPlan = useMaintenanceBookingStore((state) => state.setSelectedPlan);
  const isNavigatingRef = useRef(false);
  const activeJourneyQuery = useActiveSurveyJourney(userId);
  const [showBlockedInfo, setShowBlockedInfo] = useState(Boolean(route.params?.showActiveInstallationBlocked));
  const [checklistSize, setChecklistSize] = useState({ width: 0, height: 0 });
  const checklistProgress = useSharedValue(0);
  const borderProgress = useSharedValue(0);
  const checklistPerimeter = checklistSize.width > 0 && checklistSize.height > 0 ? (checklistSize.width + checklistSize.height) * 2 : 1;
  const currentDash = Math.min(76, Math.max(52, checklistPerimeter * 0.12));

  useEffect(() => {
    checklistProgress.value = withTiming(1, {
      duration: checklistCardDuration,
      easing: Easing.out(Easing.cubic)
    });
  }, [checklistProgress]);

  useEffect(() => {
    borderProgress.value = withRepeat(
      withTiming(1, {
        duration: checklistCurrentDuration,
        easing: Easing.linear
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(borderProgress);
    };
  }, [borderProgress]);

  const checklistCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checklistProgress.value,
    transform: [{ translateY: (1 - checklistProgress.value) * 18 }]
  }));

  const currentBorderAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: -borderProgress.value * checklistPerimeter
  }));

  useEffect(() => {
    if (route.params?.showActiveInstallationBlocked) {
      setShowBlockedInfo(true);
    }
  }, [route.params?.showActiveInstallationBlocked]);

  const talkToRepresentative = () => {
    const message = encodeURIComponent('Hi KaamAsaan, I need help with my solar installation survey.');
    void Linking.openURL(`https://wa.me/?text=${message}`);
  };

  const bookPremium = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const activeJourney = activeJourneyQuery.data ?? (userId ? (await activeJourneyQuery.refetch()).data : null);
    if (activeJourney) {
      setShowBlockedInfo(true);
      isNavigatingRef.current = false;
      return;
    }

    const plan = getMaintenancePlan('premium');
    setSelectedPlan(plan);
    navigation.navigate('MaintenanceBooking', {
      plan,
      selectedPackage: 'premium',
      packageName: 'Premium Care',
      price: 20000
    });

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 650);
  };

  if (showBlockedInfo) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.infoShell}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={() => navigation.goBack()}
              hitSlop={12}
              accessibilityLabel="Back"
              accessibilityRole="button"
            >
              <ArrowLeft size={28} color="#0B1528" strokeWidth={2.5} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title}>Solar Care</Text>
              <Text style={styles.subtitle}>Annual maintenance</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <CalendarCheck size={30} color="#0F172A" strokeWidth={2.4} />
            </View>
            <Text style={styles.infoTitle}>Your solar installation survey is already booked</Text>
            <Text style={styles.infoText}>
              Our agent will contact you soon regarding the site survey for your solar system installation. Once your system is installed, you can activate KaamAsaan Solar Care for annual preventive maintenance.
            </Text>
            <Text style={styles.supportText}>For further help, please talk to our representative.</Text>

            <Pressable style={styles.infoPrimaryButton} onPress={() => navigation.navigate('MainTabs', { screen: 'MyProject' })} accessibilityRole="button">
              <ShieldCheck size={20} color="#0F172A" strokeWidth={2.4} />
              <Text style={styles.infoPrimaryText}>Track My Project</Text>
            </Pressable>
            <Pressable style={styles.infoSecondaryButton} onPress={talkToRepresentative} accessibilityRole="button">
              <MessageCircle size={20} color="#D99A00" strokeWidth={2.4} />
              <Text style={styles.infoSecondaryText}>Talk to Representative</Text>
            </Pressable>
            <Pressable style={styles.infoTertiaryButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} accessibilityRole="button">
              <Home size={18} color="#64748B" strokeWidth={2.4} />
              <Text style={styles.infoTertiaryText}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(120, insets.bottom + 120) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <ArrowLeft size={28} color="#0B1528" strokeWidth={2.5} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Solar Care</Text>
            <Text style={styles.subtitle}>Annual maintenance</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Svg style={styles.summaryGradient} pointerEvents="none">
            <Defs>
              <SvgLinearGradient id="premium-summary-gradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="0.52" stopColor="#FFF8E6" />
                <Stop offset="1" stopColor="#FFEFC2" />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#premium-summary-gradient)" />
          </Svg>
          <View style={styles.summaryTop}>
            <View style={styles.summaryIcon}>
              <ShieldCheck size={28} color="#0B1528" strokeWidth={2.3} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.planTitle}>Premium Care</Text>
              <Text style={styles.planSubtitle}>Complete solar protection</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>Rs 20,000</Text>
              <Text style={styles.priceMeta}>/ year</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <CalendarCheck size={14} color="#0B1528" strokeWidth={2.2} />
              <Text style={styles.chipText}>4 visits / year</Text>
            </View>
            <View style={styles.chip}>
              <TrendingUp size={14} color="#0B1528" strokeWidth={2.2} />
              <Text style={styles.chipText}>Monitoring</Text>
            </View>
            <View style={styles.chip}>
              <ShieldCheck size={14} color="#0B1528" strokeWidth={2.2} />
              <Text style={styles.chipText}>Warranty help</Text>
            </View>
          </View>
        </View>

        <View style={styles.urgencyCard}>
          <CircleAlert size={18} color="#B07800" strokeWidth={2.4} />
          <Text style={styles.urgencyText}>Prevent small issues before they become costly.</Text>
        </View>

        <Animated.View
          style={[styles.checklistCard, checklistCardAnimatedStyle]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            const nextWidth = Math.round(width);
            const nextHeight = Math.round(height);

            setChecklistSize((current) =>
              current.width === nextWidth && current.height === nextHeight
                ? current
                : { width: nextWidth, height: nextHeight }
            );
          }}
        >
          {checklistSize.width > 0 && checklistSize.height > 0 && (
            <Svg
              style={StyleSheet.absoluteFill}
              width={checklistSize.width}
              height={checklistSize.height}
              pointerEvents="none"
            >
              <Rect
                x={1}
                y={1}
                width={checklistSize.width - 2}
                height={checklistSize.height - 2}
                rx={checklistBorderRadius}
                ry={checklistBorderRadius}
                stroke="#F3E7C4"
                strokeWidth={1}
                fill="none"
              />
              <AnimatedRect
                animatedProps={currentBorderAnimatedProps}
                x={1}
                y={1}
                width={checklistSize.width - 2}
                height={checklistSize.height - 2}
                rx={checklistBorderRadius}
                ry={checklistBorderRadius}
                stroke="#FFC928"
                strokeWidth={5}
                strokeDasharray={`${currentDash} ${checklistPerimeter}`}
                strokeLinecap="round"
                fill="none"
                opacity={0.12}
              />
              <AnimatedRect
                animatedProps={currentBorderAnimatedProps}
                x={1}
                y={1}
                width={checklistSize.width - 2}
                height={checklistSize.height - 2}
                rx={checklistBorderRadius}
                ry={checklistBorderRadius}
                stroke="#F5B400"
                strokeWidth={2}
                strokeDasharray={`${currentDash} ${checklistPerimeter}`}
                strokeLinecap="round"
                fill="none"
                opacity={0.78}
              />
            </Svg>
          )}
          <Text style={styles.sectionTitle}>What's included</Text>
          <View style={styles.checklist}>
            {includedServices.map((service, index) => (
              <AnimatedChecklistRow
                key={service}
                service={service}
                index={index}
                isLast={index === includedServices.length - 1}
              />
            ))}
          </View>
        </Animated.View>

        <Pressable
          style={styles.primaryButton}
          onPress={bookPremium}
          accessibilityRole="button"
        >
          <CalendarCheck size={20} color="#0F172A" strokeWidth={2.3} />
          <Text style={styles.primaryButtonText}>Book Premium Care</Text>
          <ChevronRight size={20} color="#0F172A" strokeWidth={2.5} />
        </Pressable>

        <View style={styles.trustRow}>
          {trustItems.map(({ label, Icon }) => (
            <View key={label} style={styles.trustItem}>
              <Icon size={16} color="#F5A400" strokeWidth={2.3} />
              <Text style={styles.trustText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.promiseRow}>
          <Text style={styles.promiseText}>Reliable • Transparent • Hassle-free</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFCF5'
  },
  scroll: {
    flex: 1,
    width: '100%'
  },
  content: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 0
  },
  infoShell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    justifyContent: 'center'
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    flex: 1
  },
  title: {
    color: '#0B1528',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900'
  },
  subtitle: {
    color: '#5B677A',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500'
  },
  summaryCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFF8E6',
    padding: 18,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F3D27A',
    shadowColor: '#D99A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 14
  },
  summaryGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 24,
    overflow: 'hidden'
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryCopy: {
    flex: 1
  },
  planTitle: {
    color: '#0B1528',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900'
  },
  planSubtitle: {
    marginTop: 2,
    color: '#5B677A',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600'
  },
  priceBlock: {
    alignItems: 'flex-end'
  },
  price: {
    color: '#0B1528',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900'
  },
  priceMeta: {
    color: '#5B677A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16
  },
  chip: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: '#FFF4D8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10
  },
  chipText: {
    color: '#0B1528',
    fontSize: 13,
    fontWeight: '800'
  },
  urgencyCard: {
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#FFF6DF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3DCA8',
    marginTop: 14
  },
  urgencyText: {
    flex: 1,
    color: '#263247',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600'
  },
  checklistCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F3E7C4',
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
    marginTop: 14
  },
  sectionTitle: {
    color: '#0B1528',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 8
  },
  checklist: {
    width: '100%'
  },
  serviceRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DC'
  },
  serviceRowLast: {
    borderBottomWidth: 0
  },
  serviceText: {
    flex: 1,
    color: '#263247',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600'
  },
  primaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800'
  },
  trustRow: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0E8DC',
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  trustText: {
    flexShrink: 1,
    color: '#5B677A',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  promiseRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30
  },
  promiseText: {
    color: '#5B677A',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  infoCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E3CF',
    padding: 20,
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  infoIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  infoTitle: {
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900'
  },
  infoText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600'
  },
  supportText: {
    marginTop: 12,
    color: '#263247',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800'
  },
  infoPrimaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 17,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 20
  },
  infoPrimaryText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900'
  },
  infoSecondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 12
  },
  infoSecondaryText: {
    color: '#B07800',
    fontSize: 15,
    fontWeight: '900'
  },
  infoTertiaryButton: {
    height: 42,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 12
  },
  infoTertiaryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800'
  }
});
