import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  ArrowRight,
  Bell,
  Calculator,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Home as HomeIcon,
  MapPin,
  Menu,
  Ruler,
  Settings,
  ShoppingBag,
  Sun,
  TrendingUp,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import { useActiveSurveyJourney } from '@/hooks/useSurveyJourney';
import { formatSurveyReference, SurveyJourneyBooking } from '@/services/journey.api';
import { useAuthStore } from '@/store/useAuthStore';

/* ─── Assets ─── */
const logo = require('../../../assets/home/kaamasaan-cart.png');
const heroHouse = require('../../../assets/home/hero-house.png');
const maintenanceImage = require('../../../assets/home/solar-care.png');
const inverterImage = require('../../../assets/home/inverter.jpg');
const solarPanelImage = require('../../../assets/home/solar-panels.jpg');
const batteryImage = require('../../../assets/home/pylontech.jpg');
const accessoriesImage = require('../../../assets/home/mughal-steel.jpg');
const installationImage = require('../../../assets/home/installation.png');
const afterSalesImage = require('../../../assets/home/after-sales.png');
const greenMeterImage = require('../../../assets/home/green-meter.jpg');

/* ─── Data (matches web MobileHomeExperience.jsx) ─── */
const BRAND_LOGOS = [
  { label: 'FOX ESS', image: require('../../../assets/home/brand-fox-ess.png') },
  { label: 'Solis', image: require('../../../assets/home/brand-solis.png') },
  { label: 'Dyness', image: require('../../../assets/home/brand-dyness.png') },
  { label: 'Jinko', image: require('../../../assets/home/brand-jinko.png') },
  { label: 'Longi', image: require('../../../assets/home/brand-longi.png') },
  { label: 'GoodWe' },
  { label: 'PylonTech' },
  { label: 'Sungrow' },
  { label: 'JA Solar' },
  { label: 'Canadian Solar' },
];

const QUICK_ACTIONS = [
  { id: 'roof-space', label: 'Roof Space', Icon: Ruler },
  { id: 'roi', label: 'ROI Calculator', Icon: TrendingUp },
  { id: 'solar-size', label: 'Calculate Solar Size', Icon: Calculator },
  { id: 'inverter-size', label: 'Calculate Inverter Size', Icon: Settings },
  { id: 'battery-size', label: 'Calculate Battery Size', Icon: Calculator },
];

const MARKETPLACE_CATEGORIES = [
  { id: 'inverters', label: 'Inverter', subtitle: 'Pick the inverter that fits your budget', image: inverterImage },
  { id: 'panels', label: 'Solar Panel', subtitle: 'From monocrystalline to bifacial', image: solarPanelImage },
  { id: 'batteries', label: 'Batteries', subtitle: 'Backup power when the grid goes out', image: batteryImage },
  { id: 'accessories', label: 'Solar Accessories', subtitle: 'Structure and accessories', image: accessoriesImage },
];

const SERVICES = [
  { id: 'care', label: 'Solar Care', subtitle: 'Maintenance & repairs', image: maintenanceImage },
  { id: 'install', label: 'Installation', subtitle: 'Expert setup, no guesswork', image: installationImage },
  { id: 'aftersale', label: 'After-Sales Services', subtitle: 'Here when things need fixing', image: afterSalesImage },
  { id: 'billing', label: 'Net Billing', subtitle: 'Sell surplus power to the grid', image: greenMeterImage },
];

const WHY_ITEMS = ['Accurate system sizing', 'Transparent pricing', 'Real expert support'];
const CTA_CURRENT_DURATION = 2800;
const CTA_BORDER_PERIMETER = 358;
const AnimatedRect = Reanimated.createAnimatedComponent(Rect);

/* ─── Helpers ─── */
const navigateToCategory = (navigation: any, id: string) => {
  const map: Record<string, string> = { panels: 'panel', batteries: 'battery', accessories: 'accessory' };
  navigation.navigate('MarketplaceFlow', { category: map[id] || 'inverter' });
};

const HeroImageFade = () => (
  <Svg pointerEvents="none" style={s.heroImageFade} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
    <Defs>
      <SvgLinearGradient id="hero-left-fade" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#FFF7E8" stopOpacity="0.88" />
        <Stop offset="0.24" stopColor="#FFF7E8" stopOpacity="0.58" />
        <Stop offset="0.52" stopColor="#FFF7E8" stopOpacity="0.22" />
        <Stop offset="0.82" stopColor="#FFF7E8" stopOpacity="0.04" />
        <Stop offset="1" stopColor="#FFF7E8" stopOpacity="0" />
      </SvgLinearGradient>
      <SvgLinearGradient id="hero-bottom-fade" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF7E8" stopOpacity="0" />
        <Stop offset="0.72" stopColor="#FFF7E8" stopOpacity="0.05" />
        <Stop offset="1" stopColor="#FFF7E8" stopOpacity="0.42" />
      </SvgLinearGradient>
    </Defs>
    <Rect x="0" y="0" width="50" height="100" fill="url(#hero-left-fade)" />
    <Rect x="0" y="70" width="100" height="30" fill="url(#hero-bottom-fade)" />
  </Svg>
);

/* ─── Sub-components ─── */

const ElectricHeroCta = ({ onPress }: { onPress: () => void }) => {
  const orbit = useSharedValue(0);
  const transfer = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    orbit.value = withRepeat(
      withTiming(1, { duration: CTA_CURRENT_DURATION, easing: ReanimatedEasing.linear }),
      -1,
      false
    );
    transfer.value = withRepeat(
      withSequence(
        withDelay(CTA_CURRENT_DURATION - 460, withTiming(1, { duration: 190, easing: ReanimatedEasing.out(ReanimatedEasing.quad) })),
        withTiming(0, { duration: 270, easing: ReanimatedEasing.in(ReanimatedEasing.quad) })
      ),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withDelay(CTA_CURRENT_DURATION - 340, withTiming(1, { duration: 150, easing: ReanimatedEasing.out(ReanimatedEasing.quad) })),
        withTiming(0, { duration: 190, easing: ReanimatedEasing.inOut(ReanimatedEasing.quad) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(orbit);
      cancelAnimation(transfer);
      cancelAnimation(pulse);
    };
  }, [orbit, pulse, transfer]);

  const borderCurrentProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(orbit.value, [0, 1], [0, -CTA_BORDER_PERIMETER]),
  }));
  const transferStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transfer.value, [0, 0.2, 1], [0, 0.9, 0]),
    transform: [{ translateX: interpolate(transfer.value, [0, 1], [-5, 4]) }],
  }));
  const iconPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.22, 0.68]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.72, 1.32]) }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.14]) }],
  }));

  return (
    <Pressable style={s.heroCta} onPress={onPress}>
      <Svg pointerEvents="none" style={s.heroCtaCurrent} width="100%" height="100%" viewBox="0 0 135 38">
        <Rect x="1.5" y="1.5" width="132" height="35" rx="12.5" fill="none" stroke="rgba(255,240,169,0.42)" strokeWidth="1" />
        <AnimatedRect
          animatedProps={borderCurrentProps}
          x="2"
          y="2"
          width="131"
          height="34"
          rx="12"
          fill="none"
          stroke="rgba(255,247,196,0.96)"
          strokeWidth="2.6"
          strokeDasharray={`32 ${CTA_BORDER_PERIMETER - 32}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={s.heroCtaContent}>
        <Text style={s.heroCtaText}>Design your system</Text>
        <View style={s.heroCtaIconWrap}>
          <Reanimated.View pointerEvents="none" style={[s.heroCtaTransfer, transferStyle]} />
          <Reanimated.View pointerEvents="none" style={[s.heroCtaIconHalo, iconPulseStyle]} />
          <Reanimated.View style={iconStyle}>
            <Zap color="#B07800" size={13} fill="#B07800" />
          </Reanimated.View>
        </View>
      </View>
    </Pressable>
  );
};

const SectionHeader = ({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) => (
  <View style={s.sectionHead}>
    <Text style={s.sectionTitle}>{title}</Text>
    {action ? (
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={s.viewAll}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);

const CategoryCard = ({ item, onPress }: { item: typeof MARKETPLACE_CATEGORIES[0]; onPress: () => void }) => (
  <Pressable style={s.catCard} onPress={onPress}>
    <View style={s.catImgWrap}>
      <Image source={item.image} style={s.catImg} resizeMode="cover" />
      <View style={s.catImgShade} />
    </View>
    <View style={s.catFoot}>
      <View style={s.catCopy}>
        <Text style={s.catLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={s.catMeta} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <View style={s.catArrow}>
        <ChevronRight color="#B07800" size={15} strokeWidth={2.4} />
      </View>
    </View>
  </Pressable>
);

/* ─── Continue Plan Bar ─── */
const BrandLogoCard = ({ brand }: { brand: typeof BRAND_LOGOS[0] }) => (
  <View style={s.brandPill}>
    {brand.image ? (
      <Image source={brand.image} style={s.brandImg} resizeMode="contain" />
    ) : (
      <Text style={s.brandText}>{brand.label}</Text>
    )}
  </View>
);

const BrandMarquee = () => {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const loopWidth = BRAND_LOGOS.length * 92;
  const marqueeItems = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      const nextOffset = offsetRef.current + 0.9;
      offsetRef.current = nextOffset >= loopWidth * 2 ? loopWidth : nextOffset;
      scrollRef.current?.scrollTo({ x: offsetRef.current, animated: false });
    }, 16);

    return () => clearInterval(timer);
  }, [loopWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.brandTrack}
      scrollEventThrottle={16}
      onScroll={(event) => {
        offsetRef.current = event.nativeEvent.contentOffset.x;
        if (offsetRef.current >= loopWidth * 2) {
          offsetRef.current = loopWidth;
          scrollRef.current?.scrollTo({ x: loopWidth, animated: false });
        } else if (offsetRef.current <= 2) {
          offsetRef.current = loopWidth;
          scrollRef.current?.scrollTo({ x: loopWidth, animated: false });
        }
      }}
      onScrollBeginDrag={() => {
        pausedRef.current = true;
      }}
      onScrollEndDrag={() => {
        pausedRef.current = false;
      }}
      onMomentumScrollEnd={() => {
        pausedRef.current = false;
      }}
    >
      {marqueeItems.map((brand, index) => (
        <BrandLogoCard key={`${brand.label}-${index}`} brand={brand} />
      ))}
    </ScrollView>
  );
};

const ContinuePlanBar = ({ navigation }: { navigation: any }) => {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Demo progress data (matches web app pattern)
  const progress = { started: true, completionPercent: 33, systemKw: 3, monthlySavings: 14508 };

  const dismiss = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[s.planBar, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
      <View style={s.planCopy}>
        <Text style={s.planEyebrow}>Continue your plan • {progress.completionPercent}% complete</Text>
        <Text style={s.planSummary} numberOfLines={1}>{progress.systemKw} kW system • Save Rs. {progress.monthlySavings.toLocaleString()}/month</Text>
        <View style={s.planProgress}>
          <View style={[s.planProgressFill, { width: `${progress.completionPercent}%` }]} />
        </View>
      </View>
      <Pressable style={s.planCta} onPress={() => navigation.navigate('DesignFlow')}>
        <Text style={s.planCtaText}>Continue</Text>
        <ArrowRight color="#3f2a00" size={14} strokeWidth={2.5} />
      </Pressable>
      <Pressable style={s.planDismiss} onPress={dismiss} hitSlop={8}>
        <X color="#6B7280" size={13} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
};

const journeyStatusCopy = {
  pending: { subtitle: 'Survey request received', label: 'Pending confirmation', progress: 12, tone: '#F5A623' },
  confirmed: { subtitle: 'Representative call confirmed', label: 'Confirmed', progress: 24, tone: '#2563EB' },
  survey_scheduled: { subtitle: 'Site survey scheduled', label: 'Survey scheduled', progress: 36, tone: '#2563EB' },
  survey_completed: { subtitle: 'Site survey completed', label: 'Survey completed', progress: 50, tone: '#168A4A' },
  proposal_preparation: { subtitle: 'Proposal is being prepared', label: 'Proposal preparation', progress: 62, tone: '#E87916' },
  quotation_shared: { subtitle: 'Quotation shared for review', label: 'Quotation shared', progress: 74, tone: '#7C3AED' },
  installation_planning: { subtitle: 'Installation plan in progress', label: 'Installation planning', progress: 88, tone: '#0F8B8D' }
} as const;

const ActiveJourneyBar = ({ booking, navigation }: { booking: SurveyJourneyBooking; navigation: any }) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const status = journeyStatusCopy[booking.status as keyof typeof journeyStatusCopy] ?? journeyStatusCopy.pending;

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [entrance]);

  return (
    <Animated.View style={[s.journeyBar, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <View style={s.journeyIcon}>
        <ClipboardCheck color="#128A3E" size={21} strokeWidth={2.3} />
      </View>
      <View style={s.journeyCopy}>
        <Text style={s.journeyTitle}>My Solar Journey</Text>
        <Text style={s.journeySubtitle}>{status.subtitle}</Text>
        <View style={s.journeyMeta}>
          <Text style={s.journeyReference}>{formatSurveyReference(booking)}</Text>
          <View style={s.journeyMetaDot} />
          <Text style={[s.journeyStatus, { color: status.tone }]}>{status.label}</Text>
        </View>
        <View style={s.journeyProgress}>
          <View style={[s.journeyProgressFill, { width: `${status.progress}%`, backgroundColor: status.tone }]} />
        </View>
      </View>
      <Pressable style={s.journeyCta} onPress={() => navigation.navigate('MySolarJourney', { bookingId: booking.id })}>
        <Text style={s.journeyCtaText}>View Progress</Text>
        <ArrowRight color="#493000" size={13} strokeWidth={2.7} />
      </Pressable>
    </Animated.View>
  );
};

/* ─── Main HomeScreen ─── */
export const HomeScreen = ({ navigation }: any) => {
  const userId = useAuthStore((state) => state.session?.user.id);
  const isFocused = useIsFocused();
  const journeyQuery = useActiveSurveyJourney(userId);

  useEffect(() => {
    if (isFocused && userId) void journeyQuery.refetch();
  }, [isFocused, journeyQuery.refetch, userId]);

  const activeJourney = journeyQuery.data;

  return (
  <SafeAreaView style={s.shell} edges={['top']}>
    {/* ══ Header ══ */}
    <View style={s.header}>
      <View style={s.headerBar}>
        <Pressable style={s.iconBtn} accessibilityLabel="Open menu" hitSlop={8}>
          <Menu color="#111827" size={22} strokeWidth={2} />
        </Pressable>
        <View style={s.logoWrap}>
          <View style={s.logoIconCrop}>
            <Image source={logo} style={s.logoImg} resizeMode="contain" />
          </View>
          <Text style={s.logoText}>
            <Text style={s.logoTextKaam}>Kaam</Text>
            <Text style={s.logoTextAsaan}>Asaan</Text>
          </Text>
        </View>
        <Pressable style={[s.iconBtn, { position: 'relative' as const }]} accessibilityLabel="Notifications" hitSlop={8}>
          <Bell color="#111827" size={20} strokeWidth={2} />
          <View style={s.notifDot} />
        </Pressable>
      </View>
      <Pressable style={s.locationRow} hitSlop={4}>
        <MapPin color="#111827" size={14} strokeWidth={2.2} />
        <Text style={s.locationText}>Lahore, Pakistan</Text>
        <ChevronDown color="#6B7280" size={14} strokeWidth={2.2} />
      </Pressable>
    </View>

    {/* ══ Scrollable Content ══ */}
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollInner, activeJourney && s.scrollInnerWithJourney]} showsVerticalScrollIndicator={false}>

      {/* 1 ── Hero */}
      <View style={s.hero}>
        <View style={s.heroContent}>
          <View style={s.heroBullet}>
            <View style={s.bulletBadge}>
              <Zap color="#B07800" size={11} fill="#B07800" />
            </View>
            <Text style={s.bulletText}>Estimate your load</Text>
          </View>
          <View style={s.heroBullet}>
            <View style={[s.bulletBadge, s.bulletBadgeGreen]}>
              <HomeIcon color="#128A3E" size={11} strokeWidth={2.4} />
            </View>
            <Text style={s.bulletText}>Design your system</Text>
          </View>
          <ElectricHeroCta onPress={() => navigation.navigate('DesignFlow')} />
        </View>
        <Image source={heroHouse} style={s.heroImage} resizeMode="cover" />
        <HeroImageFade />
      </View>

      {/* 2 ── Trusted Brands */}
      <BrandMarquee />

      {/* 3 ── Smart Tools */}
      <SectionHeader title="Smart Tools" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.qaTrack}>
        {QUICK_ACTIONS.map((a) => (
          <Pressable
            key={a.id}
            style={s.qaCard}
            onPress={() => navigation.navigate(a.id === 'roof-space' ? 'RoofSpaceTool' : a.id === 'roi' ? 'ROICalculator' : a.id === 'solar-size' ? 'SolarSizeTool' : a.id === 'battery-size' ? 'BatterySizeTool' : 'DesignFlow')}
          >
            <View style={s.qaIcon}>
              <a.Icon color="#B07800" size={19} strokeWidth={1.9} />
            </View>
            <Text style={s.qaLabel} numberOfLines={2}>{a.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 4 ── Preventive Maintenance */}
      <Pressable style={s.maintCard} onPress={() => navigation.navigate('PreventiveMaintenance')}>
        <ImageBackground source={maintenanceImage} style={s.maintBg} imageStyle={s.maintBgImg} resizeMode="cover">
          <View style={s.maintOverlay} />
          <View style={s.maintContent}>
            <Text style={s.maintBadge}>SOLAR CARE</Text>
            <Text style={s.maintTitle}>{'Preventive\nMaintenance'}</Text>
            <View style={s.maintCta}>
              <Text style={s.maintCtaText}>Check Solar Health</Text>
              <ChevronRight color="#201503" size={11} strokeWidth={2.8} />
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      {/* 5 ── Explore Products */}
      <SectionHeader title="Explore Products" action="View all" onPress={() => navigation.navigate('Marketplace')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catTrack}>
        {MARKETPLACE_CATEGORIES.map((item) => (
          <CategoryCard key={item.id} item={item} onPress={() => navigateToCategory(navigation, item.id)} />
        ))}
      </ScrollView>

      {/* 6 ── Services */}
      <SectionHeader title="Services" action="View all" onPress={() => navigation.navigate('BookSurvey')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catTrack}>
        {SERVICES.map((item) => (
          <CategoryCard key={item.id} item={item} onPress={() => navigation.navigate('BookSurvey')} />
        ))}
      </ScrollView>

      {/* 7 ── Why KaamAsaan */}
      <View style={s.whyCard}>
        <Text style={s.whyTitle}>Not sure what's right for your home?</Text>
        <Text style={s.whyCopy}>Get a personalized solar recommendation from our expert.</Text>
        <View style={s.whyList}>
          {WHY_ITEMS.map((item) => (
            <View key={item} style={s.whyItem}>
              <View style={s.whyCheck}>
                <Text style={s.whyCheckMark}>✓</Text>
              </View>
              <Text style={s.whyItemText}>{item}</Text>
            </View>
          ))}
        </View>
        <Pressable style={s.whyBtn} onPress={() => navigation.navigate('DesignFlow')}>
          <Text style={s.whyBtnText}>Get Expert Opinion →</Text>
        </Pressable>
      </View>
    </ScrollView>

    {/* ══ Continue Plan Floating Bar ══ */}
    {activeJourney ? <ActiveJourneyBar booking={activeJourney} navigation={navigation} /> : <ContinuePlanBar navigation={navigation} />}
  </SafeAreaView>
  );
};

/* ─── Styles ─── */
const s = StyleSheet.create({
  /* Shell */
  shell: { flex: 1, backgroundColor: '#F4F2EE' },

  /* Header */
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    zIndex: 10,
  },
  headerBar: {
    minHeight: 30,
    marginBottom: 6,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  notifDot: {
    position: 'absolute',
    right: 5,
    top: 4,
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoWrap: {
    position: 'absolute',
    left: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    transform: [{ translateX: -67 }, { translateY: -1 }],
  },
  logoIconCrop: { width: 20, height: 20, overflow: 'hidden' },
  logoImg: { position: 'absolute', left: -6, top: -9, width: 33, height: 36, opacity: 0.94 },
  logoText: { fontSize: 19, fontWeight: '900', lineHeight: 20, letterSpacing: -0.4 },
  logoTextKaam: { color: '#111827' },
  logoTextAsaan: { color: '#B07800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 18 },
  locationText: { color: '#111827', fontSize: 13, fontWeight: '600' },

  /* Scroll */
  scroll: { flex: 1 },
  scrollInner: { paddingTop: 0, paddingBottom: 210, gap: 9 },
  scrollInnerWithJourney: { paddingBottom: 242 },

  /* Hero */
  hero: {
    width: '100%',
    height: 168,
    overflow: 'hidden',
    backgroundColor: '#FFF7E8',
    borderRadius: 0,
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroImage: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: '84%',
    height: '145%',
    zIndex: 1,
    transform: [{ translateX: -10 }],
    filter: 'brightness(1.05) contrast(1.02)',
  },
  heroImageFade: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: '84%',
    height: '145%',
    overflow: 'hidden',
    zIndex: 1
  },
  heroContent: {
    width: '46%',
    height: '100%',
    justifyContent: 'center',
    gap: 7,
    zIndex: 2,
  },
  heroBullet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bulletBadge: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,181,0,0.18)',
  },
  bulletBadgeGreen: { backgroundColor: 'rgba(18,138,62,0.13)' },
  bulletText: { color: '#111111', fontSize: 10, fontWeight: '800', lineHeight: 13 },
  heroCta: {
    alignSelf: 'flex-start',
    width: 135,
    height: 38,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F7B500',
    shadowColor: '#F7B500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  heroCtaCurrent: { ...StyleSheet.absoluteFill, zIndex: 1 },
  heroCtaContent: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroCtaIconWrap: {
    width: 15,
    height: 15,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCtaTransfer: {
    position: 'absolute',
    left: -9,
    top: 6,
    width: 11,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#FFF4B8',
    shadowColor: '#FFF4B8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.72,
    shadowRadius: 5,
    elevation: 2,
  },
  heroCtaIconHalo: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFE58A',
  },
  heroCtaText: { color: '#111111', fontSize: 11, fontWeight: '900' },
  /* Brands */
  brandTrack: { gap: 9, paddingHorizontal: 14, paddingVertical: 4 },
  brandPill: {
    minWidth: 84,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  brandImg: { height: 17, width: 76, opacity: 0.88 },
  brandText: { color: '#475467', fontSize: 11, fontWeight: '600' },

  /* Section Header */
  sectionHead: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#111827', fontSize: 15, fontWeight: '600', lineHeight: 18, letterSpacing: -0.16 },
  viewAll: { color: '#C07800', fontSize: 13, fontWeight: '600' },

  /* Quick Actions / Smart Tools */
  qaTrack: { gap: 10, paddingTop: 2, paddingBottom: 4, paddingHorizontal: 14 },
  qaCard: {
    width: 92,
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  qaIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,166,35,0.12)',
  },
  qaLabel: { width: '100%', textAlign: 'center', color: '#111827', fontSize: 10, fontWeight: '700', lineHeight: 12 },

  /* Maintenance */
  maintCard: {
    height: 116,
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,214,122,0.28)',
    shadowColor: '#1E160A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 38,
    elevation: 5,
  },
  maintBg: { flex: 1, padding: 14, justifyContent: 'center' },
  maintBgImg: { borderRadius: 20 },
  maintOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(18,15,10,0.40)' },
  maintContent: { width: 226, gap: 6 },
  maintBadge: {
    alignSelf: 'flex-start',
    minHeight: 19,
    paddingHorizontal: 8,
    paddingTop: 3,
    paddingBottom: 2,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,234,177,0.36)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: 'rgba(255,245,214,0.96)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  maintTitle: { width: 140, color: '#FFFAF0', fontSize: 19, fontWeight: '900', lineHeight: 20, letterSpacing: -0.7 },
  maintCta: {
    alignSelf: 'flex-start',
    minHeight: 29,
    paddingLeft: 13,
    paddingRight: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: '#F7B500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  maintCtaText: { color: '#201503', fontSize: 10, fontWeight: '800' },

  /* Category Cards (Products + Services) */
  catTrack: { gap: 10, paddingBottom: 16, paddingHorizontal: 14 },
  catCard: {
    width: 135,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  catImgWrap: { height: 88, overflow: 'hidden', backgroundColor: '#EEECEA' },
  catImg: { width: '100%', height: '100%' },
  catImgShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.05)' },
  catFoot: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  catCopy: { flex: 1, gap: 2 },
  catLabel: { color: '#111827', fontSize: 12, fontWeight: '700', lineHeight: 15 },
  catMeta: { color: '#6B7280', fontSize: 10, lineHeight: 13 },
  catArrow: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,166,35,0.13)',
  },

  /* Why KaamAsaan */
  whyCard: {
    marginHorizontal: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(247,181,0,0.16)',
    backgroundColor: '#FFFFFF',
    gap: 8,
    shadowColor: '#78520A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 2,
  },
  whyTitle: { color: '#111827', fontSize: 15, fontWeight: '800', lineHeight: 19 },
  whyCopy: { color: '#6B7280', fontSize: 12, lineHeight: 16 },
  whyList: { gap: 6 },
  whyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whyCheck: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,181,0,0.16)',
  },
  whyCheckMark: { color: '#B77900', fontSize: 12, fontWeight: '900' },
  whyItemText: { color: '#111827', fontSize: 11.5, fontWeight: '700' },
  whyBtn: {
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F7B500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F7B500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 3,
  },
  whyBtnText: { color: '#17212F', fontSize: 12, fontWeight: '700' },

  /* Continue Plan Bar */
  planBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    minHeight: 58,
    padding: 9,
    paddingLeft: 12,
    borderRadius: 24,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(192,120,0,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1C1810',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 50,
  },
  planCopy: { flex: 1, minWidth: 0, gap: 4 },
  planEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a6400',
    lineHeight: 15,
  },
  planSummary: { fontSize: 12.5, fontWeight: '600', color: '#111827', lineHeight: 16 },
  planProgress: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.08)',
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F5A623',
  },
  planCta: {
    minWidth: 102,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F5C542',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 3,
  },
  planCtaText: { color: '#3f2a00', fontSize: 13, fontWeight: '700' },
  planDismiss: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
  },

  /* Active Solar Journey */
  journeyBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22,138,74,0.18)',
    backgroundColor: '#FFFDF8',
    padding: 10,
    shadowColor: '#172031',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 9,
    zIndex: 60,
  },
  journeyIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#ECFDF3',
  },
  journeyCopy: { flex: 1, minWidth: 0 },
  journeyTitle: { color: '#10213A', fontSize: 13.5, fontWeight: '900' },
  journeySubtitle: { marginTop: 2, color: '#526174', fontSize: 11, fontWeight: '700' },
  journeyMeta: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  journeyReference: { color: '#128A3E', fontSize: 9.5, fontWeight: '900' },
  journeyMetaDot: { width: 3, height: 3, borderRadius: 999, backgroundColor: '#C4A86A' },
  journeyStatus: { color: '#8A6400', fontSize: 9.5, fontWeight: '800' },
  journeyProgress: { height: 3, marginTop: 6, overflow: 'hidden', borderRadius: 999, backgroundColor: '#ECE7DD' },
  journeyProgressFill: { height: '100%', borderRadius: 999, backgroundColor: '#F5A623' },
  journeyCta: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 13,
    backgroundColor: '#F7B500',
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  journeyCtaText: { color: '#493000', fontSize: 9.5, fontWeight: '900' },
});
