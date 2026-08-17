import {
  ArrowRight,
  Calculator,
  Check,
  ChevronRight,
  ClipboardCheck,
  EvCharger,
  Home as HomeIcon,
  Ruler,
  Settings,
  TrendingUp,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Reanimated, {
  cancelAnimation,
  interpolate,
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useActiveSurveyJourney } from "@/hooks/useSurveyJourney";
import {
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotifications,
} from "@/hooks/useNotifications";
import {
  activeSurveyBookingStatuses,
  formatSurveyReference,
  SurveyJourneyBooking,
} from "@/services/journey.api";
import {
  openSupportWhatsApp,
  type CustomerNotification,
} from "@/services/notifications.api";
import { useAuthStore } from "@/store/useAuthStore";
import { useSystemStore } from "@/store/useSystemStore";
import { TopNotificationBanner } from "@/components/notifications/TopNotificationBanner";
import { AppTopBar } from "@/components/ui/AppTopBar";
import { PremiumShimmerSweep } from "@/components/ui/PremiumShimmerSweep";
import { performNotificationAction } from "@/utils/notificationActions";

/* ─── Assets ─── */
const heroHouse = require("../../../assets/home/transparent-solar-house-hero-section.png");
const maintenanceImage = require("../../../assets/home/solar-care.png");
const cleaningImage = require("../../../assets/home/solar-panel-cleaning.png");
const inverterImage = require("../../../assets/home/inverter.jpg");
const solarPanelImage = require("../../../assets/home/solar-panels.jpg");
const batteryImage = require("../../../assets/home/pylontech.jpg");
const accessoriesImage = require("../../../assets/home/mughal-steel.jpg");
const installationImage = require("../../../assets/home/installation.png");
const electricalWorkImage = require("../../../assets/home/electrical-work-card.png");
const greenMeterImage = require("../../../assets/home/green-meter.jpg");

/* ─── Data (matches web MobileHomeExperience.jsx) ─── */
const BRAND_LOGOS = [
  {
    label: "FOX ESS",
    image: require("../../../assets/home/brand-fox-ess.png"),
  },
  { label: "Solis", image: require("../../../assets/home/brand-solis.png") },
  { label: "Dyness", image: require("../../../assets/home/brand-dyness.png") },
  { label: "Jinko", image: require("../../../assets/home/brand-jinko.png") },
  { label: "Longi", image: require("../../../assets/home/brand-longi.png") },
  { label: "GoodWe" },
  { label: "PylonTech" },
  { label: "Sungrow" },
  { label: "JA Solar" },
  { label: "Canadian Solar" },
];

const QUICK_ACTIONS = [
  { id: "roof-space", labelKey: "tools.roofSpace", Icon: Ruler },
  { id: "roi", labelKey: "tools.roi", Icon: TrendingUp },
  { id: "solar-size", labelKey: "tools.solarSize", Icon: Calculator },
  { id: "inverter-size", labelKey: "tools.loadCalculator", Icon: Settings },
  { id: "battery-size", labelKey: "tools.batterySize", Icon: Calculator },
];

const MARKETPLACE_CATEGORIES = [
  {
    id: "inverters",
    labelKey: "products.inverter",
    subtitleKey: "products.inverterSubtitle",
    image: inverterImage,
  },
  {
    id: "panels",
    labelKey: "products.panel",
    subtitleKey: "products.panelSubtitle",
    image: solarPanelImage,
  },
  {
    id: "batteries",
    labelKey: "products.batteries",
    subtitleKey: "products.batterySubtitle",
    image: batteryImage,
  },
  {
    id: "accessories",
    labelKey: "products.accessories",
    subtitleKey: "products.accessoriesSubtitle",
    image: accessoriesImage,
  },
  {
    id: "ev-chargers",
    labelKey: "products.evCharger",
    subtitleKey: "products.evChargerSubtitle",
    // No product photo asset yet — CategoryCard falls back to the EvCharger
    // icon on the same neutral tile background when `image` is omitted.
    image: undefined,
  },
];

const SERVICES = [
  {
    id: "aftersale",
    labelKey: "services.electricalWork",
    subtitleKey: "services.electricalWorkSubtitle",
    image: electricalWorkImage,
  },
  {
    id: "care",
    labelKey: "services.cleaning",
    subtitleKey: "services.cleaningSubtitle",
    image: cleaningImage,
  },
  {
    id: "install",
    labelKey: "services.installation",
    subtitleKey: "services.installationSubtitle",
    image: installationImage,
  },
  {
    id: "billing",
    labelKey: "services.netBilling",
    subtitleKey: "services.netBillingSubtitle",
    image: greenMeterImage,
  },
];

const WHY_ITEMS = ["home.whyAccurate", "home.whyPricing", "home.whySupport"];
const CTA_CURRENT_DURATION = 2800;
const CONTINUE_PLAN_DISMISS_KEY = "kaamasaan.home.continue-plan.dismissed";
const EXPERT_WHATSAPP_MESSAGE =
  "Assalam-o-Alaikum, I need expert guidance to choose the right solar system for my home through the KaamAsaan app.";

if (__DEV__) {
  console.log(
    "[ANDROID COMPONENT] HomeScreen shared file loaded: src/mobile/screens/home/HomeScreen.tsx",
  );
}

/* ─── Helpers ─── */
const navigateToCategory = (navigation: any, id: string) => {
  const map: Record<string, string> = {
    panels: "panel",
    batteries: "battery",
    accessories: "accessory",
    "ev-chargers": "ev_charger",
  };
  navigation.navigate("MarketplaceFlow", { category: map[id] || "inverter" });
};

/* ─── Sub-components ─── */

const ElectricHeroCta = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withDelay(
          CTA_CURRENT_DURATION - 340,
          withTiming(1, {
            duration: 150,
            easing: ReanimatedEasing.out(ReanimatedEasing.quad),
          }),
        ),
        withTiming(0, {
          duration: 190,
          easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
        }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const iconPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.22, 0.68]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.72, 1.32]) }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.14]) }],
  }));

  return (
    <Pressable
      style={s.heroCta}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.designSystem')}
    >
      <PremiumShimmerSweep showSparkle />

      <View style={s.heroCtaContent}>
        <Text style={s.heroCtaText}>{t("home.designSystem")}</Text>
        <View style={s.heroCtaIconWrap}>
          <Reanimated.View
            pointerEvents="none"
            style={[s.heroCtaIconHalo, iconPulseStyle]}
          />
          <Reanimated.View style={iconStyle}>
            <Zap color="#B07800" size={12} fill="#B07800" />
          </Reanimated.View>
        </View>
      </View>

    </Pressable>
  );
};

const SectionHeader = ({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) => (
  <View style={s.sectionHead}>
    <Text style={s.sectionTitle}>{title}</Text>
    {action ? (
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={s.viewAll}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);

const ExpertBenefitRow = ({ label }: { label: string }) => (
  <View style={s.benefitRow}>
    <View style={s.checkContainer}>
      <Check color="#B07800" size={14} strokeWidth={3} />
    </View>
    <Text style={s.benefitText}>{label}</Text>
  </View>
);

const CategoryCard = ({
  item,
  onPress,
}: {
  item: (typeof MARKETPLACE_CATEGORIES)[0] | (typeof SERVICES)[0];
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Pressable style={s.catCard} onPress={onPress}>
      <View style={s.catImgWrap}>
        {item.image ? (
          <>
            <Image source={item.image} style={s.catImg} resizeMode="cover" />
            <View style={s.catImgShade} />
          </>
        ) : (
          <View style={s.catImgIconFallback}>
            <EvCharger color="#B07800" size={32} strokeWidth={1.8} />
          </View>
        )}
      </View>
      <View style={s.catFoot}>
        <View style={s.catCopy}>
          <Text style={s.catLabel} numberOfLines={1}>
            {t(item.labelKey)}
          </Text>
          <Text style={s.catMeta} numberOfLines={1}>
            {t(item.subtitleKey)}
          </Text>
        </View>
        <View style={s.catArrow}>
          <ChevronRight color="#B07800" size={16} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
};

/* ─── Continue Plan Bar ─── */
const BrandLogoCard = ({ brand }: { brand: (typeof BRAND_LOGOS)[0] }) => (
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

type ContinuePlanProgress = {
  completionPercent: number;
  systemKw: number;
  monthlySavings: number;
};

const ContinuePlanBar = ({
  navigation,
  progress,
  onDismiss,
  bottomOffset,
}: {
  navigation: any;
  progress: ContinuePlanProgress;
  onDismiss: () => void;
  bottomOffset: number;
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const dismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        s.planBar,
        {
          bottom: bottomOffset,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={s.planCopy}>
        <Text style={s.planEyebrow}>
          {t("home.continuePlan", { percent: progress.completionPercent })}
        </Text>
        <Text style={s.planSummary} numberOfLines={1}>
          {t("home.systemSavings", {
            kw: progress.systemKw,
            amount: progress.monthlySavings.toLocaleString(),
          })}
        </Text>
        <View style={s.planProgress}>
          <View
            style={[
              s.planProgressFill,
              { width: `${progress.completionPercent}%` },
            ]}
          />
        </View>
      </View>
      <Pressable
        style={s.planCta}
        onPress={() => navigation.navigate("DesignFlow")}
      >
        <Text style={s.planCtaText}>{t("common.continue")}</Text>
        <ArrowRight color="#3f2a00" size={14} strokeWidth={2.5} />
      </Pressable>
      <Pressable style={s.planDismiss} onPress={dismiss} hitSlop={8}>
        <X color="#6B7280" size={12} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
};

const journeyStatusCopy = {
  pending: {
    subtitleKey: "home.surveyPending",
    labelKey: "home.pendingConfirmation",
    progress: 12,
    tone: "#F5A623",
  },
  confirmed: {
    subtitleKey: "home.surveyConfirmedShort",
    labelKey: "home.confirmed",
    progress: 24,
    tone: "#2563EB",
  },
  assigned: {
    subtitleKey: "home.surveyConfirmedShort",
    labelKey: "home.confirmed",
    progress: 28,
    tone: "#2563EB",
  },
  scheduled: {
    subtitleKey: "home.surveyScheduled",
    labelKey: "home.surveyScheduledLabel",
    progress: 36,
    tone: "#2563EB",
  },
  survey_in_progress: {
    subtitleKey: "home.surveyScheduled",
    labelKey: "home.surveyScheduledLabel",
    progress: 44,
    tone: "#0F8B8D",
  },
  survey_completed: {
    subtitleKey: "home.surveyCompleted",
    labelKey: "home.surveyCompletedLabel",
    progress: 50,
    tone: "#168A4A",
  },
  design_in_progress: {
    subtitleKey: "home.proposalPreparing",
    labelKey: "home.proposalPreparation",
    progress: 62,
    tone: "#E87916",
  },
  quotation_ready: {
    subtitleKey: "home.quotationShared",
    labelKey: "home.quotationSharedLabel",
    progress: 74,
    tone: "#7C3AED",
  },
  installation_scheduled: {
    subtitleKey: "home.installationPlanning",
    labelKey: "home.installationPlanningLabel",
    progress: 82,
    tone: "#0F8B8D",
  },
  installation_in_progress: {
    subtitleKey: "home.installationPlanning",
    labelKey: "home.installationPlanningLabel",
    progress: 88,
    tone: "#0F8B8D",
  },
} as const;

const ActiveJourneyBar = ({
  booking,
  navigation,
  bottomOffset,
}: {
  booking: SurveyJourneyBooking;
  navigation: any;
  bottomOffset: number;
}) => {
  const { t } = useTranslation();
  const entrance = useRef(new Animated.Value(0)).current;
  const status =
    journeyStatusCopy[booking.status as keyof typeof journeyStatusCopy] ??
    journeyStatusCopy.pending;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  return (
    <Animated.View
      style={[
        s.journeyBar,
        {
          bottom: bottomOffset,
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={s.journeyIcon}>
        <ClipboardCheck color="#128A3E" size={20} strokeWidth={2.3} />
      </View>
      <View style={s.journeyCopy}>
        <Text style={s.journeyTitle}>{t("survey.mySolarJourney")}</Text>
        <Text style={s.journeySubtitle}>{t(status.subtitleKey)}</Text>
        <View style={s.journeyMeta}>
          <Text style={s.journeyReference}>
            {formatSurveyReference(booking)}
          </Text>
          <View style={s.journeyMetaDot} />
          <Text style={[s.journeyStatus, { color: status.tone }]}>
            {t(status.labelKey)}
          </Text>
        </View>
        <View style={s.journeyProgress}>
          <View
            style={[
              s.journeyProgressFill,
              { width: `${status.progress}%`, backgroundColor: status.tone },
            ]}
          />
        </View>
      </View>
      <Pressable
        style={s.journeyCta}
        onPress={() => navigation.navigate("MyProject")}
      >
        <Text style={s.journeyCtaText}>{t("home.viewProgress")}</Text>
        <ArrowRight color="#493000" size={12} strokeWidth={2.7} />
      </Pressable>
    </Animated.View>
  );
};

/* ─── Main HomeScreen ─── */
export const HomeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.session?.user.id);
  const journeyQuery = useActiveSurveyJourney(userId);
  const refetchJourney = journeyQuery.refetch;
  const notificationsQuery = useNotifications(userId);
  const markNotificationRead = useMarkNotificationRead(userId);
  useNotificationRealtime(userId);
  const [continuePlanDismissed, setContinuePlanDismissed] = useState(false);
  const [expertOpinionPressed, setExpertOpinionPressed] = useState(false);
  const appliances = useSystemStore((state) => state.appliances);
  const backupAppliances = useSystemStore((state) => state.backupAppliances);
  const recommendedSolarKw = useSystemStore(
    (state) => state.recommendedSolarKw,
  );
  const selectedBatteryKwh = useSystemStore(
    (state) => state.selectedBatteryKwh,
  );
  const selectedPanelBrand = useSystemStore(
    (state) => state.selectedPanelBrand,
  );
  const backupDecision = useSystemStore((state) => state.backupDecision);
  const selectedPanels = useSystemStore((state) => state.selectedPanels);
  const selectedInverter = useSystemStore((state) => state.selectedInverter);
  const selectedBattery = useSystemStore((state) => state.selectedBattery);

  useEffect(() => {
    if (__DEV__ && notificationsQuery.error) {
      console.warn('Notifications could not be refreshed.', notificationsQuery.error);
    }
  }, [notificationsQuery.error]);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) void refetchJourney();
    }, [refetchJourney, userId]),
  );

  useEffect(() => {
    void AsyncStorage.getItem(CONTINUE_PLAN_DISMISS_KEY).then((value) => {
      setContinuePlanDismissed(value === "true");
    });
  }, []);

  const activeJourney =
    journeyQuery.data &&
    activeSurveyBookingStatuses.includes(journeyQuery.data.status)
      ? journeyQuery.data
      : null;
  const shouldShowJourneyCard = Boolean(activeJourney);
  const designProgress = useMemo(() => {
    const hasLoad = appliances.some((item) => item.quantity > 0);
    const hasBackupLoad = backupAppliances.some((item) => item.quantity > 0);
    const hasPanelChoice = Boolean(selectedPanelBrand || selectedPanels);
    const hasInverterChoice = Boolean(selectedInverter);
    const hasBackupChoice = Boolean(
      backupDecision === "no" || selectedBattery || selectedBatteryKwh > 0,
    );
    const started =
      hasLoad ||
      hasBackupLoad ||
      hasPanelChoice ||
      hasInverterChoice ||
      hasBackupChoice ||
      backupDecision !== null;
    const completedSteps = [
      hasLoad,
      hasPanelChoice,
      hasInverterChoice,
      backupDecision !== null,
      hasBackupChoice,
    ].filter(Boolean).length;
    const completionPercent = started
      ? Math.max(20, Math.min(95, Math.round((completedSteps / 5) * 100)))
      : 0;
    const completed = hasPanelChoice && hasInverterChoice && hasBackupChoice;

    return {
      started,
      completed,
      completionPercent,
      systemKw: recommendedSolarKw,
      monthlySavings: Math.round(recommendedSolarKw * 4836),
    };
  }, [
    appliances,
    backupAppliances,
    backupDecision,
    recommendedSolarKw,
    selectedBattery,
    selectedBatteryKwh,
    selectedInverter,
    selectedPanelBrand,
    selectedPanels,
  ]);
  const showContinuePlan =
    !activeJourney &&
    designProgress.started &&
    !designProgress.completed &&
    !continuePlanDismissed;
  const floatingBottom = Math.max(10, insets.bottom + 10);
  const scrollBottomPadding =
    (shouldShowJourneyCard ? 154 : showContinuePlan ? 126 : 34) + insets.bottom;

  const dismissContinuePlan = () => {
    setContinuePlanDismissed(true);
    void AsyncStorage.setItem(CONTINUE_PLAN_DISMISS_KEY, "true");
  };

  const openNotification = async (notification: CustomerNotification) => {
    if (!notification.isRead)
      await markNotificationRead.mutateAsync(notification.id);
    await performNotificationAction(notification, navigation);
  };

  const handleExpertOpinion = () => {
    void openSupportWhatsApp(EXPERT_WHATSAPP_MESSAGE);
  };

  return (
    <View style={s.shell}>
      <SafeAreaView style={s.shell} edges={["top"]}>
        <AppTopBar navigation={navigation} activeRoute="Home" />

        {/* ══ Scrollable Content ══ */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollInner,
            { paddingBottom: scrollBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1 ── Hero */}
          <View style={s.hero}>
            <View style={s.heroContent}>
              <View style={s.heroBullet}>
                <View style={s.bulletBadge}>
                  <Zap color="#B07800" size={12} fill="#B07800" />
                </View>
                <Text style={s.bulletText}>{t("home.estimateLoad")}</Text>
              </View>
              <View style={s.heroBullet}>
                <View style={[s.bulletBadge, s.bulletBadgeGreen]}>
                  <HomeIcon color="#128A3E" size={12} strokeWidth={2.4} />
                </View>
                <Text style={s.bulletText}>{t("home.designSystem")}</Text>
              </View>
              <ElectricHeroCta
                onPress={() => navigation.navigate("DesignFlow")}
              />
            </View>
            <Image
              source={heroHouse}
              style={s.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* 2 ── Trusted Brands */}
          <BrandMarquee />

          {/* 3 ── Smart Tools */}
          <SectionHeader title={t("home.smartTools")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.qaTrack}
          >
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                style={s.qaCard}
                onPress={() =>
                  navigation.navigate(
                    a.id === "roof-space"
                      ? "RoofSpaceTool"
                      : a.id === "roi"
                        ? "ROICalculator"
                        : a.id === "solar-size"
                          ? "SolarSizeTool"
                          : a.id === "battery-size"
                            ? "BatterySizeTool"
                            : "DesignFlow",
                  )
                }
              >
                <View style={s.qaIcon}>
                  <a.Icon color="#B07800" size={20} strokeWidth={1.9} />
                </View>
                <Text style={s.qaLabel} numberOfLines={2}>
                  {t(a.labelKey)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* 4 ── Preventive Maintenance */}
          <Pressable
            style={s.maintCard}
            onPress={() => navigation.navigate("PreventiveMaintenance")}
          >
            <ImageBackground
              source={maintenanceImage}
              style={s.maintBg}
              imageStyle={s.maintBgImg}
              resizeMode="cover"
            >
              <View style={s.maintOverlay} />
              <View style={s.maintContent}>
                <Text style={s.maintBadge}>
                  {t("services.solarCare").toUpperCase()}
                </Text>
                <Text style={s.maintTitle}>
                  {t("services.preventiveMaintenance")}
                </Text>
                <View style={s.maintCta}>
                  <Text style={s.maintCtaText}>
                    {t("tools.checkSolarHealth")}
                  </Text>
                  <ChevronRight color="#201503" size={12} strokeWidth={2.8} />
                </View>
              </View>
            </ImageBackground>
          </Pressable>

          {/* 5 ── Explore Products */}
          <SectionHeader
            title={t("home.exploreProducts")}
            action={t("common.viewAll")}
            onPress={() => navigation.navigate("Marketplace")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catTrack}
          >
            {MARKETPLACE_CATEGORIES.map((item) => (
              <CategoryCard
                key={item.id}
                item={item}
                onPress={() => navigateToCategory(navigation, item.id)}
              />
            ))}
          </ScrollView>

          {/* 6 ── Services */}
          <SectionHeader
            title={t("home.services")}
            action={t("common.viewAll")}
            onPress={() => navigation.navigate("BookSurvey")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catTrack}
          >
            {SERVICES.map((item) => (
              <CategoryCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate(
                    item.id === "aftersale"
                      ? "ElectricalWorkServices"
                      : item.id === "care"
                        ? "CleaningServiceEstimator"
                        : item.id === "install"
                          ? "InstallationService"
                          : "BookSurvey",
                  )
                }
              />
            ))}
          </ScrollView>

          {/* 7 ── Expert consultation */}
          <View style={s.expertCardWrap}>
            <View style={s.expertCard}>
              <Text style={s.expertTitle}>{t("home.whyTitle")}</Text>
              <Text style={s.expertDescription}>{t("home.whyCopy")}</Text>

              <View style={s.benefitsContainer}>
                {WHY_ITEMS.map((item) => (
                  <ExpertBenefitRow key={item} label={t(item)} />
                ))}
              </View>

              <Pressable
                onPress={handleExpertOpinion}
                onPressIn={() => setExpertOpinionPressed(true)}
                onPressOut={() => setExpertOpinionPressed(false)}
                style={[
                  s.expertOpinionButton,
                  expertOpinionPressed && s.expertOpinionButtonPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={s.expertOpinionButtonText}>
                  Get Expert Opinion
                </Text>
                <ArrowRight size={18} color="#10233F" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* ══ Continue Plan Floating Bar ══ */}
        {shouldShowJourneyCard && activeJourney ? (
          <ActiveJourneyBar
            booking={activeJourney}
            navigation={navigation}
            bottomOffset={floatingBottom}
          />
        ) : showContinuePlan ? (
          <ContinuePlanBar
            navigation={navigation}
            progress={designProgress}
            onDismiss={dismissContinuePlan}
            bottomOffset={floatingBottom}
          />
        ) : null}
      </SafeAreaView>
      <TopNotificationBanner
        userId={userId}
        notifications={notificationsQuery.data ?? []}
        notificationsReady={
          !notificationsQuery.isLoading && !notificationsQuery.isError
        }
        onPress={(notification) => void openNotification(notification)}
        topOffset={insets.top + 8}
      />
    </View>
  );
};

/* ─── Styles ─── */
const s = StyleSheet.create({
  /* Shell */
  shell: { flex: 1, backgroundColor: "#F4F2EE" },

  /* Scroll */
  scroll: { flex: 1 },
  scrollInner: { paddingTop: 0, paddingBottom: 210, gap: 9 },
  scrollInnerWithJourney: { paddingBottom: 242 },

  /* Hero */
  hero: {
    width: "100%",
    height: 168,
    overflow: "hidden",
    backgroundColor: "#F4F2EE",
    borderRadius: 0,
    position: "relative",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroImage: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: "84%",
    height: "145%",
    zIndex: 1,
    transform: [{ translateX: -10 }],
    filter: "brightness(1.05) contrast(1.02)",
  },
  heroContent: {
    width: "46%",
    height: "100%",
    justifyContent: "center",
    gap: 7,
    zIndex: 2,
  },
  heroBullet: { flexDirection: "row", alignItems: "center", gap: 6 },
  bulletBadge: {
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247,181,0,0.18)",
  },
  bulletBadgeGreen: { backgroundColor: "rgba(18,138,62,0.13)" },
  bulletText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },
  heroCta: {
    alignSelf: "flex-start",
    width: 135,
    height: 38,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F7B500",
    shadowColor: "#F7B500",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  heroCtaContent: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroCtaIconWrap: {
    width: 15,
    height: 15,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCtaIconHalo: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#FFE58A",
  },
  heroCtaText: { color: "#111111", fontSize: 11, fontWeight: "900" },
  /* Brands */
  brandTrack: { gap: 9, paddingHorizontal: 14, paddingVertical: 4 },
  brandPill: {
    minWidth: 84,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.09)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  brandImg: { height: 17, width: 76, opacity: 0.88 },
  brandText: { color: "#475467", fontSize: 11, fontWeight: "600" },

  /* Section Header */
  sectionHead: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 18,
    letterSpacing: -0.16,
  },
  viewAll: { color: "#C07800", fontSize: 13, fontWeight: "600" },

  /* Quick Actions / Smart Tools */
  qaTrack: { gap: 10, paddingTop: 2, paddingBottom: 4, paddingHorizontal: 14 },
  qaCard: {
    width: 92,
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  qaIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,166,35,0.12)",
  },
  qaLabel: {
    width: "100%",
    textAlign: "center",
    color: "#111827",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },

  /* Maintenance */
  maintCard: {
    height: 116,
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,214,122,0.28)",
    shadowColor: "#1E160A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 38,
    elevation: 5,
  },
  maintBg: { flex: 1, padding: 14, justifyContent: "center" },
  maintBgImg: { borderRadius: 20 },
  maintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(18,15,10,0.40)",
  },
  maintContent: { width: 226, gap: 6 },
  maintBadge: {
    alignSelf: "flex-start",
    minHeight: 19,
    paddingHorizontal: 8,
    paddingTop: 3,
    paddingBottom: 2,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,234,177,0.36)",
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "rgba(255,245,214,0.96)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  maintTitle: {
    width: 140,
    color: "#FFFAF0",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 20,
    letterSpacing: -0.7,
  },
  maintCta: {
    alignSelf: "flex-start",
    minHeight: 29,
    paddingLeft: 13,
    paddingRight: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "#F7B500",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  maintCtaText: { color: "#201503", fontSize: 10, fontWeight: "800" },

  /* Category Cards (Products + Services) */
  catTrack: { gap: 10, paddingBottom: 16, paddingHorizontal: 14 },
  catCard: {
    width: 135,
    height: 148,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  catImgWrap: { height: 88, overflow: "hidden", backgroundColor: "#EEECEA" },
  catImg: { width: "100%", height: "100%" },
  catImgIconFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  catImgShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  catFoot: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  catCopy: { flex: 1, gap: 2 },
  catLabel: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },
  catMeta: { color: "#6B7280", fontSize: 10, lineHeight: 13 },
  catArrow: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,166,35,0.13)",
  },

  /* Expert consultation */
  expertCardWrap: {
    marginHorizontal: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  expertCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8D9B6",
    padding: 16,
    elevation: 2,
  },
  expertTitle: {
    color: "#10233F",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
  },
  expertDescription: {
    color: "#687386",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 6,
  },
  benefitsContainer: {
    marginTop: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    marginBottom: 6,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF5CF",
    borderWidth: 1,
    borderColor: "#E7C548",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  benefitText: {
    marginLeft: 10,
    color: "#10233F",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    flexShrink: 1,
  },
  expertOpinionButton: {
    width: "100%",
    minHeight: 46,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: "#F7B801",
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  expertOpinionButtonText: {
    color: "#10233F",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    marginRight: 8,
    textAlign: "center",
  },
  expertOpinionButtonPressed: {
    opacity: 0.85,
  },

  /* Continue Plan Bar */
  planBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    minHeight: 58,
    padding: 9,
    paddingLeft: 12,
    borderRadius: 24,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "rgba(192,120,0,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#1C1810",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 50,
  },
  planCopy: { flex: 1, minWidth: 0, gap: 4 },
  planEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8a6400",
    lineHeight: 15,
  },
  planSummary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 16,
  },
  planProgress: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.08)",
    overflow: "hidden",
  },
  planProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F5A623",
  },
  planCta: {
    minWidth: 102,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F5C542",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#F5A623",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 3,
  },
  planCtaText: { color: "#3f2a00", fontSize: 13, fontWeight: "700" },
  planDismiss: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -2,
  },

  /* Active Solar Journey */
  journeyBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(22,138,74,0.18)",
    backgroundColor: "#FFFDF8",
    padding: 10,
    shadowColor: "#172031",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 9,
    zIndex: 60,
  },
  journeyIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
  },
  journeyCopy: { flex: 1, minWidth: 0 },
  journeyTitle: { color: "#10213A", fontSize: 14, fontWeight: "900" },
  journeySubtitle: {
    marginTop: 2,
    color: "#526174",
    fontSize: 11,
    fontWeight: "700",
  },
  journeyMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  journeyReference: { color: "#128A3E", fontSize: 10, fontWeight: "900" },
  journeyMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#C4A86A",
  },
  journeyStatus: { color: "#8A6400", fontSize: 10, fontWeight: "800" },
  journeyProgress: {
    height: 3,
    marginTop: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#ECE7DD",
  },
  journeyProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F5A623",
  },
  journeyCta: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 13,
    backgroundColor: "#F7B500",
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  journeyCtaText: { color: "#493000", fontSize: 10, fontWeight: "900" },
});
