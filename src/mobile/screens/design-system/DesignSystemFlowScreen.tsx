import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, BackHandler, Easing, Image, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Activity, AirVent, BatteryCharging, Check, ChevronDown, ClipboardList, Grid3X3, Headphones, Refrigerator, ArrowLeft, ArrowRight, Fan, Lightbulb, MessageCircle, Minus, Pencil, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Sun, Users, X, Zap } from 'lucide-react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { InfoCard } from '@/components/cards/InfoCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { PanelLayoutVisualizer } from '@/components/solar-tools/PanelLayoutVisualizer';
import { useRecommendationConfiguration } from '@/hooks/useRecommendationConfiguration';
import { useBatterySizingCatalog, usePackageCompatibility, usePackageGenerationStatus, usePackageInventory, useProducts } from '@/hooks/useProducts';
import { designSystemSteps, useSystemStore } from '@/store/useSystemStore';
import {
  DEFAULT_BACKUP_HOURS,
  DEFAULT_BATTERY_SAFETY_MARGIN_PERCENT,
  calculateBackupRequirementSummary,
  calculateLoadKw,
  calculatePanelCount,
  calculatePanelLayout,
  type BackupRequirementSummary,
  type PanelOrientation
} from '@/utils/calculations';
import { formatKw, formatPkr } from '@/utils/formatters';
import type { Product } from '@/types/product.types';
import { panelOptionLabel, selectDefaultPanelProduct } from '@/utils/panelProducts';
import { extractPanelWattage, generateRecommendedPackages, getPackageGenerationDiagnostics, getPanelUnitPrice, getProductBrandName, getProductKwh, getProductKw, getProductWatt, isOutOfStock, isPanelProduct, type RecommendedPackage } from '@/utils/packageBuilder';
import {
  customizePackageBattery,
  customizePackageInverter,
  customizePackagePanel,
  getBatteryCustomizationOptions,
  getInverterCustomizationOptions,
  getPanelCustomizationOptions,
  type PackageEditorMode
} from '@/utils/packageCustomization';
import { getPackageImage } from '@/utils/packageImages';
import {
  getBatteryProductDisplayName,
  isBatteryCatalogProduct,
  type BatteryConfiguration
} from '@/utils/batteryRecommendation';
import {
  BATTERY_RECOMMENDATION_ENGINE_VERSION,
  commercialRuleRecommendationStrategy,
  DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
  EXPERT_REVIEW_MESSAGE,
  selectSolarPanelConfiguration,
  type CommercialBatteryBank,
} from '@/utils/commercialRecommendation';

const AnimatedG = Animated.createAnimatedComponent(G);
const SELECTED_PACKAGE_LIFT = -5;
const SELECTED_PACKAGE_GOLD = '#F5A400';
const steps = designSystemSteps;
type Step = typeof steps[number];

const applianceGroups = [
  { title: 'ESSENTIALS', ids: ['lights', 'fans', 'fridge', 'washingMachine'] },
  { title: 'AIR CONDITIONERS', ids: ['ac1TonInverter', 'ac15TonInverter', 'ac2TonInverter'] }
];

const applianceIconMap = {
  fans: Fan,
  fridge: Refrigerator,
  lights: Lightbulb,
  washingMachine: Grid3X3,
  ac1TonInverter: AirVent,
  ac15TonInverter: AirVent,
  ac2TonInverter: AirVent,
  tv: Grid3X3,
  router: Zap,
  laptop: Grid3X3,
  pump: Zap,
  iron: Zap,
  microwave: Grid3X3,
  cctv: Grid3X3,
  charger: BatteryCharging
};

const extraApplianceOptions = [
  { id: 'tv', name: 'TV', watts: 100 },
  { id: 'router', name: 'WiFi Router', watts: 20 },
  { id: 'laptop', name: 'Laptop', watts: 65 },
  { id: 'pump', name: 'Water Pump', watts: 750 },
  { id: 'iron', name: 'Iron', watts: 1000 },
  { id: 'microwave', name: 'Microwave', watts: 1200 },
  { id: 'cctv', name: 'CCTV Camera', watts: 15 },
  { id: 'charger', name: 'Mobile Charger', watts: 10 }
];

const getInverterSizeKw = (solarKw: number) => (solarKw > 0 ? Math.max(3, Math.ceil(solarKw)) : 0);

const batteryBackupHeroImage = require('../../../assets/design-system/battery-backup-screen.png');
const recommendedSystemImage = require('../../../assets/design-system/recommended-system.png');
export const DesignSystemFlowScreen = ({ navigation, route }: any) => {
  const initialStep = steps.includes(route?.params?.screen) ? route.params.screen : 'appliances';
  const [step, setStep] = useState<Step>(initialStep);
  const store = useSystemStore();
  const orientation = store.panelOrientation;
  const setOrientation = store.setPanelOrientation;
  const backupKwh = store.backupDecision === 'yes' ? store.selectedBatteryKwh : 0;

  const title = useMemo(() => ({
    appliances: 'Select Appliances',
    solar: 'Your Solar Recommendation',
    roof: 'Roof Space Estimate',
    backupNeed: 'Need Backup Battery',
    backupAppliances: 'Select Appliances',
    backupPlan: 'Battery Backup Plan',
    recommended: 'Recommended Solar System',
    packages: 'Packages'
  }[step]), [step]);

  const next = () => {
    if (step === 'appliances') {
      const selectedQuantity = store.appliances.reduce(
        (total: number, item: any) => total + Math.max(0, Number(item.quantity) || 0),
        0
      );
      if (selectedQuantity <= 0) return;
      store.calculateRecommendation();
      setStep('solar');
    } else if (step === 'solar') {
      store.setRecommendedSolarKw(Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3)))));
      setStep('roof');
    }
    else if (step === 'roof') setStep('backupNeed');
    else if (step === 'backupNeed') setStep(store.backupDecision === 'yes' ? 'backupAppliances' : 'recommended');
    else if (step === 'backupAppliances') {
      const selectedBackupQuantity = store.backupAppliances.reduce(
        (total: number, item: any) => total + Math.max(0, Number(item.quantity) || 0),
        0
      );
      if (selectedBackupQuantity <= 0) return;
      setStep('backupPlan');
    }
    else if (step === 'backupPlan') setStep('recommended');
    else if (step === 'recommended') setStep('packages');
    else if (store.selectedRecommendedPackageId) {
      navigation.navigate('SystemSummary', { packageId: store.selectedRecommendedPackageId });
    }
  };

  const goToPreviousStep = useCallback(() => {
    const stepIndex = steps.indexOf(step);
    if (stepIndex <= 0) {
      if (navigation.canGoBack?.()) navigation.goBack();
      else navigation.navigate('MainTabs', { screen: 'Home' });
      return true;
    }

    setStep(steps[stepIndex - 1]);
    return true;
  }, [navigation, step]);

  useEffect(() => {
    useSystemStore.getState().setDesignProgress(step);
  }, [step]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goToPreviousStep);
    return () => subscription.remove();
  }, [goToPreviousStep]);

  if (step === 'appliances') {
    return <ApplianceStepScreen store={store} onPrevious={goToPreviousStep} onContinue={next} />;
  }

  if (step === 'solar') {
    return (
      <SolarRecommendationStepScreen
        navigation={navigation}
        store={store}
        onPrevious={goToPreviousStep}
        onContinue={next}
      />
    );
  }

  if (step === 'roof') {
    return (
      <RoofSpaceStepScreen
        store={store}
        orientation={orientation}
        onOrientationChange={setOrientation}
        onPrevious={goToPreviousStep}
        onContinue={next}
      />
    );
  }

  if (step === 'backupNeed') {
    return (
      <BatteryChoiceStepScreen
        store={store}
        onPrevious={goToPreviousStep}
        onYes={() => setStep('backupAppliances')}
        onNo={() => setStep('recommended')}
      />
    );
  }

  if (step === 'backupAppliances') {
    return <BackupAppliancesStepScreen store={store} onPrevious={goToPreviousStep} onContinue={next} />;
  }

  if (step === 'backupPlan') {
    return <BackupPlanStepScreen navigation={navigation} store={store} onPrevious={goToPreviousStep} onContinue={next} />;
  }

  if (step === 'recommended') {
    return (
      <RecommendedSystemStepScreen
        solarKw={store.recommendedSolarKw}
        batteryKwh={backupKwh}
        onPrevious={goToPreviousStep}
        onContinue={() => setStep('packages')}
      />
    );
  }

  if (step === 'packages') {
    return (
      <RecommendedPackagesStepScreen
        store={store}
        selectedPackageId={store.selectedRecommendedPackageId}
        initialNotice={route?.params?.packageNotice}
        onBack={goToPreviousStep}
        onReviewSystem={next}
        onExpertOpinion={() => navigation.navigate('BookSurvey')}
      />
    );
  }

  return (
    <Screen>
      <Header title={title} subtitle="Design Your System" onBack={() => navigation.goBack()} />

      <View className="mt-6">
        <AppButton title={step === 'packages' ? 'System Summary' : 'Continue'} onPress={next} />
      </View>
    </Screen>
  );
};

const RecommendedPackagesStepScreen = ({
  store,
  selectedPackageId,
  initialNotice,
  onBack,
  onReviewSystem,
  onExpertOpinion
}: {
  store: any;
  selectedPackageId: string | null;
  initialNotice?: string;
  onBack: () => void;
  onReviewSystem: () => void;
  onExpertOpinion: () => void;
}) => {
  const [detailsPackage, setDetailsPackage] = useState<RecommendedPackage | null>(null);
  const [selectionMessage, setSelectionMessage] = useState(initialNotice ?? '');
  const scrollRef = useRef<ScrollView>(null);
  const cardLayoutsRef = useRef<Record<string, { y: number; height: number }>>({});
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const productsQuery = usePackageInventory();
  const compatibilityQuery = usePackageCompatibility();
  const packageStatusQuery = usePackageGenerationStatus();
  const recommendationConfigurationQuery = useRecommendationConfiguration();
  const allProducts = productsQuery.data ?? [];
  const selectedPackageState = store.selectedRecommendedPackage as RecommendedPackage | null;
  const backupAppliances = store.backupAppliances ?? [];
  const backupSummary = calculateBackupRequirementSummary(backupAppliances, 0);
  const runningLoadKw = backupSummary.runningLoadKw;
  const recommendationConfiguration = recommendationConfigurationQuery.data ?? DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION;
  const commercialRecommendation = useMemo(
    () => commercialRuleRecommendationStrategy.recommend({
      appliances: backupAppliances,
      products: allProducts,
      selectedPanelWattage: Number(store.panelWattage) || null,
      configuration: recommendationConfiguration,
    }),
    [allProducts, backupAppliances, recommendationConfiguration, store.panelWattage]
  );
  const selectedBatteryCapacityKwh = store.backupDecision === 'yes'
    ? Number(store.selectedBatteryConfiguration?.capacityKwh ?? commercialRecommendation.recommendedBatteryBank?.batteryBankCapacityKwh ?? 0)
    : 0;
  // Package PV/inverter sizing stays anchored to the engine's Recommended bank.
  // Changing to Load-Managed or Extended only changes the package battery target.
  const baselineSystemTargets = commercialRecommendation.systemTargets;
  const requiredSolarKw = baselineSystemTargets.targetPvKwp ?? Math.max(1, Number(store.recommendedSolarKw || 3));
  const requiredInverterKw = baselineSystemTargets.targetInverterKw ?? getInverterSizeKw(requiredSolarKw);
  const selectedBackupQuantity = backupAppliances.reduce(
    (total: number, appliance: any) => total + Math.max(0, Number(appliance.quantity) || 0),
    0
  );
  const backupHours = selectedBackupQuantity > 0
    ? backupAppliances.reduce(
      (total: number, appliance: any) => total + Math.max(0, Number(appliance.quantity) || 0) * Number(appliance.hours ?? DEFAULT_BACKUP_HOURS),
      0
    ) / selectedBackupQuantity
    : undefined;
  const requiredBatteryKwh = selectedBatteryCapacityKwh;
  const commercialExpertReview = commercialRecommendation.requiresExpertReview;
  const recommendedPackages = useMemo(
    () => commercialExpertReview ? [] : generateRecommendedPackages({
      requiredPanelKw: requiredSolarKw,
      requiredInverterKw,
      requiredBatteryKwh,
      requiredBackupEnergyKwh: backupSummary.baseRequiredEnergyKwh,
      batteryUsableFactor: recommendationConfiguration.settings.batteryUsableFactor,
      preliminaryDisclaimer: recommendationConfiguration.settings.preliminaryRecommendationDisclaimer,
      configuredInstallationCost: recommendationConfiguration.settings.configuredInstallationCost,
      configuredStructureCost: recommendationConfiguration.settings.configuredStructureCost,
      configuredAccessoriesCost: recommendationConfiguration.settings.configuredAccessoriesCost,
      acceptableBatteryShortfallPercent: recommendationConfiguration.settings.acceptableBatteryShortfallPercent,
      selectedBatteryTier: store.selectedBatteryConfiguration?.commercialTier,
      runningLoadKw,
      backupHours,
      products: allProducts,
      compatibilityRules: compatibilityQuery.data ?? [],
      selectedPanelWattage: Number(store.panelWattage) || undefined
    }),
    [allProducts, backupHours, backupSummary.baseRequiredEnergyKwh, commercialExpertReview, compatibilityQuery.data, recommendationConfiguration.settings, requiredBatteryKwh, requiredInverterKw, requiredSolarKw, runningLoadKw, store.panelWattage, store.selectedBatteryConfiguration?.commercialTier]
  );

  useEffect(() => {
    if (!__DEV__) return;
    if (productsQuery.isLoading || compatibilityQuery.isLoading) return;
    const packageInput = {
      requiredSolarKw,
      requiredInverterKw,
      requiredBatteryKwh,
      runningLoadKw,
      backupHours,
      phase: null
    };
    const diagnostics = getPackageGenerationDiagnostics({
      requiredPanelKw: requiredSolarKw,
      requiredInverterKw,
      requiredBatteryKwh,
      runningLoadKw,
      backupHours,
      acceptableBatteryShortfallPercent: recommendationConfiguration.settings.acceptableBatteryShortfallPercent,
      selectedBatteryTier: store.selectedBatteryConfiguration?.commercialTier,
      products: allProducts,
      compatibilityRules: compatibilityQuery.data ?? [],
      selectedPanelWattage: Number(store.panelWattage) || undefined
    });
    console.info('Explore Packages sizing input', packageInput);
    console.info('Explore Packages template diagnostics', diagnostics);
  }, [
    allProducts,
    backupHours,
    compatibilityQuery.data,
    compatibilityQuery.isLoading,
    productsQuery.isLoading,
    recommendationConfiguration.settings.acceptableBatteryShortfallPercent,
    requiredBatteryKwh,
    requiredInverterKw,
    requiredSolarKw,
    runningLoadKw,
    store.panelWattage,
    store.selectedBatteryConfiguration?.commercialTier
  ]);

  useEffect(() => {
    if (productsQuery.isLoading || productsQuery.isError || compatibilityQuery.isLoading || compatibilityQuery.isError) return;
    const previousSelectionIsInvalid = Boolean(
      selectedPackageId && !recommendedPackages.some((pkg) => pkg.id === selectedPackageId)
    );
    store.setRecommendedPackages(recommendedPackages);
    if (previousSelectionIsInvalid) {
      setSelectionMessage('This package is no longer available. Please select another package.');
    }
  }, [
    compatibilityQuery.isLoading,
    compatibilityQuery.isError,
    productsQuery.isLoading,
    productsQuery.isError,
    recommendedPackages,
    selectedPackageId,
    store.setRecommendedPackages
  ]);

  const scrollPackageIntoView = useCallback((packageId: string) => {
    const layout = cardLayoutsRef.current[packageId];
    const viewportHeight = viewportHeightRef.current;
    if (!layout || !viewportHeight) return;

    const currentY = scrollYRef.current;
    const comfortableTop = currentY + 18;
    const comfortableBottom = currentY + viewportHeight - (124 + safeBottom);
    const cardTop = layout.y;
    const cardBottom = layout.y + layout.height;

    if (cardTop >= comfortableTop && cardBottom <= comfortableBottom) return;

    const nextY = cardTop < comfortableTop
      ? Math.max(0, cardTop - 18)
      : Math.max(0, cardBottom - viewportHeight + 124 + safeBottom + 18);

    scrollRef.current?.scrollTo({ y: nextY, animated: true });
  }, [safeBottom]);

  const selectPackage = useCallback((pkg: RecommendedPackage, shouldScroll = true) => {
    store.setSelectedRecommendedPackage(pkg);
    setSelectionMessage('');
    AccessibilityInfo.announceForAccessibility?.(`${pkg.title}, selected`);
    if (shouldScroll) {
      requestAnimationFrame(() => scrollPackageIntoView(pkg.id));
    }
  }, [scrollPackageIntoView, store]);

  const reviewSystem = () => {
    if (!selectedPackageId) {
      setSelectionMessage('Please select a package to review your system.');
      return;
    }
    onReviewSystem();
  };

  return (
    <SafeAreaView style={packagesStyles.screen}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewportHeightRef.current = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        refreshControl={<RefreshControl refreshing={productsQuery.isRefetching} onRefresh={() => {
          void productsQuery.refetch();
          void compatibilityQuery.refetch();
        }} />}
        contentContainerStyle={[packagesStyles.content, { paddingBottom: 132 + safeBottom }]}
      >
        <View style={packagesStyles.packageTopChip}>
          <Star color="#D99A00" size={12} strokeWidth={2.5} />
          <Text style={packagesStyles.packageTopChipText}>Choose the package that fits you best</Text>
        </View>

        <Text style={packagesStyles.compactSectionTitle}>Recommended Packages</Text>
        {selectionMessage ? (
          <View style={packagesStyles.selectionMessage}>
            <Text style={packagesStyles.selectionMessageText}>{selectionMessage}</Text>
          </View>
        ) : null}

        {productsQuery.isLoading || recommendationConfigurationQuery.isLoading ? (
          <View style={packagesStyles.emptyPackageCard}><Text style={packagesStyles.emptyPackageTitle}>Loading live products...</Text></View>
        ) : productsQuery.isError || compatibilityQuery.isError || packageStatusQuery.isError ? (
          <View style={packagesStyles.emptyPackageCard}><Text style={packagesStyles.emptyPackageTitle}>We could not load packages. Please retry.</Text></View>
        ) : recommendedPackages.length === 0 ? (
          <View style={packagesStyles.emptyPackageCard}>
            <Text style={packagesStyles.emptyPackageHeading}>{commercialExpertReview ? EXPERT_REVIEW_MESSAGE : packageStatusQuery.data?.configurationReady === false ? 'Package setup is being updated' : 'No complete package available'}</Text>
            <Text style={packagesStyles.emptyPackageTitle}>{commercialExpertReview
              ? [...commercialRecommendation.expertReviewReasons, ...baselineSystemTargets.expertReviewReasons].filter(Boolean).join(' ') || 'A safe preliminary product combination could not be generated.'
              : packageStatusQuery.data?.configurationReady === false
              ? 'Our package configuration is being updated. Please retry shortly or request expert support.'
              : 'No valid combination matches your recommended system. You can request expert support and our team will suggest the closest available option.'}</Text>
            <Pressable style={packagesStyles.emptyPackageButton} onPress={onExpertOpinion}>
              <Headphones color="#10213A" size={16} strokeWidth={2.4} />
              <Text style={packagesStyles.emptyPackageButtonText}>Get Expert Recommendation</Text>
            </Pressable>
          </View>
        ) : (
          <View style={packagesStyles.cards}>
            {recommendedPackages.map((pkg, index) => {
              const displayPackage = selectedPackageState?.id === pkg.id ? selectedPackageState : pkg;
              const packageKey = [
                pkg.packageBrand,
                pkg.inverter.product.id,
                pkg.battery?.product.id,
                pkg.panel.id,
                pkg.batteryBrand,
                index
              ].filter(Boolean).join('-');

              return (
                <RecommendedPackageCard
                  key={packageKey}
                  pkg={displayPackage}
                  selected={selectedPackageId === pkg.id}
                  onSelect={() => selectPackage(displayPackage)}
                  onLayout={(event) => {
                    cardLayoutsRef.current[pkg.id] = {
                      y: event.nativeEvent.layout.y,
                      height: event.nativeEvent.layout.height
                    };
                  }}
                  onViewDetails={() => {
                    setDetailsPackage(pkg);
                  }}
                />
              );
            })}
          </View>
        )}

        {recommendedPackages.length > 0 ? <View style={packagesStyles.trustCard}>
          <View style={packagesStyles.trustIcon}>
            <ShieldCheck color="#009A61" size={22} strokeWidth={2.3} />
          </View>
          <View style={packagesStyles.trustCopy}>
            <Text style={packagesStyles.trustTitle}>Preliminary Compatible Configurations</Text>
            <Text style={packagesStyles.trustText}>{recommendationConfiguration.settings.preliminaryRecommendationDisclaimer}</Text>
          </View>
          <ChevronDown color="#007C52" size={20} strokeWidth={2.3} style={packagesStyles.trustArrow} />
        </View> : null}
      </ScrollView>

      <View style={[packagesStyles.footer, { paddingBottom: 8 + safeBottom }]}>
        <Pressable style={packagesStyles.reviewButton} onPress={reviewSystem}>
          <ShoppingCart color="#10213A" size={16} strokeWidth={2.4} />
          <Text style={packagesStyles.reviewText}>Review My System</Text>
        </Pressable>
        <Pressable style={packagesStyles.expertButton} onPress={onExpertOpinion}>
          <Headphones color="#10213A" size={16} strokeWidth={2.4} />
          <Text style={packagesStyles.expertText}>Get Expert Opinion</Text>
        </Pressable>
      </View>

      <PackageDetailsModal
        pkg={detailsPackage}
        currentPackage={detailsPackage && selectedPackageState?.id === detailsPackage.id ? selectedPackageState : null}
        products={allProducts}
        visible={Boolean(detailsPackage)}
        selected={Boolean(detailsPackage && selectedPackageId === detailsPackage.id)}
        onClose={() => setDetailsPackage(null)}
        onSelect={(customizedPackage) => {
          if (detailsPackage) {
            selectPackage(customizedPackage, false);
            setDetailsPackage(null);
          }
        }}
      />
    </SafeAreaView>
  );
};

const PackageMiniBadge = ({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'blue' | 'gray' | 'red' | 'green' }) => (
  <View style={[packagesStyles.miniBadge, tone === 'blue' && packagesStyles.miniBadgeBlue, tone === 'gray' && packagesStyles.miniBadgeGray, tone === 'red' && packagesStyles.miniBadgeRed, tone === 'green' && packagesStyles.miniBadgeGreen]}>
    <Text style={[packagesStyles.miniBadgeText, tone === 'blue' && packagesStyles.miniBadgeTextBlue, tone === 'gray' && packagesStyles.miniBadgeTextGray, tone === 'red' && packagesStyles.miniBadgeTextRed, tone === 'green' && packagesStyles.miniBadgeTextGreen]}>{label}</Text>
  </View>
);

const ProductLine = ({ label, product, size, onEdit }: { label: string; product: Product; size?: string; onEdit: () => void }) => (
  <View style={packagesStyles.productLine}>
    <View style={packagesStyles.productLineHeader}>
      <Text style={packagesStyles.productLineLabel}>{label}</Text>
      <Pressable style={packagesStyles.productEditButton} onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Edit ${label}`}>
        <Pencil color="#9A6B00" size={12} strokeWidth={2.4} />
        <Text style={packagesStyles.productEditText}>Edit</Text>
      </Pressable>
    </View>
    <Text style={packagesStyles.productLineName} numberOfLines={1}>
      {product.brand} {product.model || (isBatteryCatalogProduct(product) ? getBatteryProductDisplayName(product) : product.name)}
    </Text>
    <Text style={packagesStyles.productLineMeta}>{size ?? product.capacity ?? '-'} - {product.warranty || 'Warranty on request'}</Text>
    <PackageMiniBadge label={isOutOfStock(product) ? 'Out of Stock' : 'Available'} tone={isOutOfStock(product) ? 'red' : 'green'} />
  </View>
);

const PriceRow = ({ label, value, strong = false }: { label: string; value: number | null; strong?: boolean }) => (
  <View style={packagesStyles.breakdownRow}>
    <Text style={[packagesStyles.breakdownLabel, strong && packagesStyles.breakdownStrong]}>{label}</Text>
    <Text style={[packagesStyles.breakdownValue, strong && packagesStyles.breakdownStrong]}>{formatPkr(value)}</Text>
  </View>
);

const RecommendedPackageCard = ({
  pkg,
  selected,
  onSelect,
  onLayout,
  onViewDetails
}: {
  pkg: RecommendedPackage;
  selected: boolean;
  onSelect: () => void;
  onLayout: (event: any) => void;
  onViewDetails: () => void;
}) => {
  const selectedAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();
  const responsiveContentWidth = Math.min(Math.max(windowWidth - 48, 272), 530);
  const packageImageWidth = Math.min(Math.max(responsiveContentWidth * 0.36, 104), 190);
  const packageImageHeight = packageImageWidth * 0.64;
  const resolvedBrandLogoUrl = pkg.brandLogo ?? null;
  const packageBrandIdentity = {
    id: pkg.brandId,
    name: pkg.packageBrand,
    slug: pkg.inverter.product.brandSlug,
    aliases: pkg.inverter.product.brandAliases,
    logoUrl: resolvedBrandLogoUrl,
    updatedAt: pkg.inverter.product.brands?.updated_at
  };
  const visualSource = getPackageImage(pkg);
  const fallbackVisualSource = pkg.image ? { uri: pkg.image } : getPackageImage({ ...pkg, packageImageUrl: null, image: null });

  if (__DEV__) {
    console.debug('Recommended package brand logo', {
      packageId: pkg.id,
      packageBrandId: pkg.brandId,
      packageBrand: pkg.packageBrand,
      brand: pkg.brand,
      logo_url: pkg.brandLogo,
      finalLogoUri: resolvedBrandLogoUrl
    });
  }

  useEffect(() => {
    Animated.timing(selectedAnim, {
      toValue: selected ? 1 : 0,
      duration: selected ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [selected, selectedAnim]);

  const animatePress = (toValue: number) => {
    Animated.timing(pressAnim, {
      toValue,
      duration: toValue ? 90 : 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  };

  const animatedCardStyle = {
    transform: [
      {
        translateY: selectedAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SELECTED_PACKAGE_LIFT]
        })
      },
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.985]
        })
      }
    ]
  };

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        packagesStyles.compactPackageCardShell,
        selected && packagesStyles.compactPackageCardShellSelected,
        animatedCardStyle
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          packagesStyles.compactPackageCard,
          selected && packagesStyles.compactPackageCardSelectedFirst,
          selected && packagesStyles.compactPackageCardSelected,
          pressed && packagesStyles.compactPackageCardPressed
        ]}
        onPress={onSelect}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        accessibilityRole="button"
        accessibilityLabel={`${pkg.title} package${selected ? ', selected' : ''}`}
        accessibilityState={{ selected }}
      >
        {selected ? (
          <Animated.View
            style={[
              packagesStyles.selectedIndicator,
              {
                opacity: selectedAnim,
                transform: [{
                  scale: selectedAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1]
                  })
                }]
              }
            ]}
            accessibilityLabel={`${pkg.title} selected`}
          >
            <Check color="#FFFFFF" size={12} strokeWidth={3} />
            <Text style={packagesStyles.selectedIndicatorText}>Selected</Text>
          </Animated.View>
        ) : null}
        <View style={packagesStyles.compactPackageBody}>
          <View style={[packagesStyles.compactVisualWrap, { flexBasis: packageImageWidth, width: packageImageWidth, height: packageImageHeight }]}>
            <SafeImage source={visualSource} fallbackSource={fallbackVisualSource} style={packagesStyles.compactPackageImage} resizeMode="contain" />
          </View>
          <View style={packagesStyles.compactPackageInfo}>
            <View style={packagesStyles.compactBrandSlot}>
              <BrandLogo
                brand={packageBrandIdentity}
                style={packagesStyles.compactBrandLogo}
                fallbackTextStyle={packagesStyles.compactBrandText}
                onError={() => {
                  if (__DEV__) console.warn('Recommended package brand logo failed to load', { packageId: pkg.id, packageBrandId: pkg.brandId, packageBrand: pkg.packageBrand, finalLogoUri: resolvedBrandLogoUrl });
                }}
              />
            </View>
            <Text style={packagesStyles.compactPackageTitle} numberOfLines={2}>{pkg.title}</Text>
            <View style={packagesStyles.compactWarrantyRow}>
              <View style={packagesStyles.compactWarrantyChip}>
                <Text style={packagesStyles.compactWarrantyYears} numberOfLines={1}>{pkg.inverterWarranty}</Text>
                <Text style={packagesStyles.compactWarrantyLabel}>Inverter Warranty</Text>
              </View>
              <View style={packagesStyles.compactWarrantyChip}>
                <Text style={packagesStyles.compactWarrantyYears} numberOfLines={1}>{pkg.batteryWarranty ?? 'Not included'}</Text>
                <Text style={packagesStyles.compactWarrantyLabel}>Battery Warranty</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={packagesStyles.compactPriceRow}>
          <View style={packagesStyles.compactPriceInfo}>
            <Text style={packagesStyles.priceLabel}>Estimated Price</Text>
            <Text style={packagesStyles.priceValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{formatPkr(pkg.totalPrice)}</Text>
          </View>
          <Pressable
            style={packagesStyles.detailsButton}
            onPress={(event) => {
              event.stopPropagation();
              onViewDetails();
            }}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${pkg.title}`}
          >
            <Text style={packagesStyles.detailsText}>View Details</Text>
            <ArrowRight color="#10213A" size={16} strokeWidth={2.5} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const PackageDetailsModal = ({
  pkg,
  currentPackage,
  products,
  visible,
  selected,
  onClose,
  onSelect
}: {
  pkg: RecommendedPackage | null;
  currentPackage: RecommendedPackage | null;
  products: Product[];
  visible: boolean;
  selected: boolean;
  onClose: () => void;
  onSelect: (pkg: RecommendedPackage) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [workingPackage, setWorkingPackage] = useState<RecommendedPackage | null>(null);
  const [editorMode, setEditorMode] = useState<PackageEditorMode | null>(null);

  useEffect(() => {
    if (!visible || !pkg) return;
    setWorkingPackage(currentPackage?.id === pkg.id ? currentPackage : pkg);
    setEditorMode(null);
  }, [currentPackage, pkg, visible]);

  if (!pkg || !workingPackage) return null;
  const hasPendingChanges = packageSelectionSignature(workingPackage) !== packageSelectionSignature(currentPackage ?? pkg);
  const recommendedBatteryCapacity = workingPackage.recommendedBatteryCapacityKwh ?? pkg.totalBatteryKwh;
  const batteryBelowRecommendation = Boolean(workingPackage.battery && workingPackage.totalBatteryKwh < recommendedBatteryCapacity);

  const applyEditorChange = (product: Product, quantity: number) => {
    setWorkingPackage((current) => {
      if (!current || !editorMode) return current;
      if (editorMode === 'panel') return customizePackagePanel(current, product, quantity);
      if (editorMode === 'inverter') return customizePackageInverter(current, product);
      return customizePackageBattery(current, product, quantity);
    });
    setEditorMode(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={packagesStyles.modalOverlay}>
        <View style={[packagesStyles.detailsSheet, { paddingBottom: 22 + insets.bottom }]}>
          <View style={packagesStyles.detailsSheetHeader}>
            <View style={packagesStyles.detailsHeaderCopy}>
              <Text style={packagesStyles.detailsEyebrow}>{pkg.badge || 'Package Details'}</Text>
              <Text style={packagesStyles.detailsTitle}>{pkg.title}</Text>
            </View>
            <Pressable style={packagesStyles.resetPackageButton} onPress={() => setWorkingPackage(pkg)} accessibilityRole="button">
              <RotateCcw color="#9A6B00" size={12} strokeWidth={2.3} />
              <Text style={packagesStyles.resetPackageText}>Reset</Text>
            </Pressable>
            <Pressable style={packagesStyles.detailsClose} onPress={onClose}>
              <X color="#10213A" size={18} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView style={packagesStyles.detailsScroll} contentContainerStyle={packagesStyles.detailsScrollContent} showsVerticalScrollIndicator={false}>
            <View style={packagesStyles.componentGrid}>
              <ProductLine label="Panels" product={workingPackage.panel} size={`${workingPackage.panelQuantity} x ${getProductWatt(workingPackage.panel)}W (${workingPackage.totalSolarKw.toFixed(2)} kW total)`} onEdit={() => setEditorMode('panel')} />
              <ProductLine label="Inverter" product={workingPackage.inverter.product} size={workingPackage.inverterQuantity > 1 ? `${workingPackage.inverterQuantity} x ${formatKw(workingPackage.inverter.size / workingPackage.inverterQuantity)} (${formatKw(workingPackage.inverter.size)} total)` : formatKw(workingPackage.inverter.size)} onEdit={() => setEditorMode('inverter')} />
              {workingPackage.battery ? <ProductLine label="Battery" product={workingPackage.battery.product} size={workingPackage.batteryQuantity > 1 ? `${workingPackage.batteryQuantity} x ${workingPackage.totalBatteryKwh / workingPackage.batteryQuantity} kWh (${workingPackage.totalBatteryKwh} kWh total)` : `${workingPackage.totalBatteryKwh} kWh`} onEdit={() => setEditorMode('battery')} /> : null}
            </View>

            {batteryBelowRecommendation ? (
              <View style={packagesStyles.batteryCapacityWarning}>
                <Text style={packagesStyles.batteryCapacityWarningTitle}>Selected backup capacity is below the recommended size.</Text>
                <Text style={packagesStyles.batteryCapacityWarningMeta}>Recommended: {recommendedBatteryCapacity} kWh · Selected: {workingPackage.totalBatteryKwh} kWh</Text>
              </View>
            ) : null}

            <View style={packagesStyles.priceBreakdown}>
              <PriceRow label="Panels price" value={workingPackage.panelsPrice} />
              <PriceRow label="Inverter price" value={workingPackage.inverterPrice} />
              {workingPackage.battery ? <PriceRow label="Battery price" value={workingPackage.batteryPrice} /> : null}
              {workingPackage.additionalPackageCharges != null && workingPackage.additionalPackageCharges > 0 ? <PriceRow label="Installation, accessories & package charges" value={workingPackage.additionalPackageCharges} /> : null}
              <View style={packagesStyles.divider} />
              <PriceRow label="Total package price" value={workingPackage.totalPrice} strong />
            </View>
          </ScrollView>

          <Pressable
            style={[packagesStyles.selectButton, packagesStyles.detailsSelectButton, selected && !hasPendingChanges && packagesStyles.selectButtonSelected]}
            onPress={selected && !hasPendingChanges ? onClose : () => onSelect(workingPackage)}
          >
            <Text style={packagesStyles.selectButtonText}>{selected ? hasPendingChanges ? 'Update Package' : 'Selected' : 'Select Package'}</Text>
          </Pressable>
        </View>
      </View>
      <PackageComponentEditorModal
        mode={editorMode}
        pkg={workingPackage}
        products={products}
        visible={Boolean(editorMode)}
        onCancel={() => setEditorMode(null)}
        onApply={applyEditorChange}
      />
    </Modal>
  );
};

const packagesStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F3E8'
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 148
  },
  packageTopChip: {
    alignSelf: 'flex-start',
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245, 164, 0, 0.28)',
    backgroundColor: '#FFF8E2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    marginHorizontal: 0
  },
  packageTopChipText: {
    color: '#7A5600',
    fontSize: 10,
    fontWeight: '900'
  },
  compactSectionTitle: {
    color: '#10213A',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 9,
    marginHorizontal: 0
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  heroTitleCard: {
    flex: 1,
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3D28B',
    backgroundColor: '#FFF8E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  heroCopy: {
    flex: 1
  },
  heroTitle: {
    color: '#10213A',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900'
  },
  heroSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700'
  },
  tabs: {
    marginTop: 18,
    flexDirection: 'row',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.82)',
    overflow: 'hidden',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  tab: {
    flex: 1,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8
  },
  tabActive: {
    backgroundColor: '#FDB813'
  },
  tabText: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  tabActiveText: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 12
  },
  sectionTitle: {
    color: '#10213A',
    fontSize: 20,
    fontWeight: '900'
  },
  sectionSubtitle: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  cards: {
    gap: 14
  },
  compactPackageCardShell: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.075,
    shadowRadius: 12,
    elevation: 3
  },
  compactPackageCardShellSelected: {
    shadowColor: SELECTED_PACKAGE_GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6
  },
  compactPackageCard: {
    minHeight: 158,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DED0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  compactPackageCardSelectedFirst: {
    borderColor: SELECTED_PACKAGE_GOLD,
    borderWidth: 2
  },
  compactPackageCardSelected: {
    backgroundColor: '#FFFCF1'
  },
  compactPackageCardPressed: {
    backgroundColor: '#FFFFFF',
    opacity: 0.97
  },
  packageCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(232,217,190,0.9)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 3
  },
  packageCardSelected: {
    borderColor: '#F5A400',
    backgroundColor: '#FFFDF6'
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 13,
    paddingTop: 13
  },
  packageTitleWrap: {
    flex: 1,
    minWidth: 0
  },
  packageSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 5,
    maxWidth: 116
  },
  miniBadge: {
    borderRadius: 999,
    backgroundColor: '#FFF3C4',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  miniBadgeBlue: { backgroundColor: '#EAF2FF' },
  miniBadgeGray: { backgroundColor: '#F1F5F9' },
  miniBadgeRed: { backgroundColor: '#FEE2E2' },
  miniBadgeGreen: { backgroundColor: '#DCFCE7' },
  miniBadgeText: {
    color: '#7A5600',
    fontSize: 10,
    fontWeight: '900'
  },
  miniBadgeTextBlue: { color: '#1D4ED8' },
  miniBadgeTextGray: { color: '#64748B' },
  miniBadgeTextRed: { color: '#B91C1C' },
  miniBadgeTextGreen: { color: '#15803D' },
  warningText: {
    marginHorizontal: 13,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  componentGrid: {
    paddingHorizontal: 13,
    paddingTop: 12,
    gap: 8
  },
  productLine: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  productLineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  productEditButton: {
    height: 25,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1D58F',
    backgroundColor: '#FFF9E9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8
  },
  productEditText: {
    color: '#8A6100',
    fontSize: 10,
    fontWeight: '900'
  },
  productLineLabel: {
    color: '#C48A00',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  productLineName: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3
  },
  productLineMeta: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3
  },
  priceBreakdown: {
    marginTop: 12,
    paddingHorizontal: 13,
    paddingBottom: 11,
    gap: 7
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  breakdownLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800'
  },
  breakdownValue: {
    color: '#10213A',
    fontSize: 11,
    fontWeight: '900'
  },
  breakdownStrong: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900'
  },
  packageActions: {
    borderTopWidth: 1,
    borderTopColor: '#EEF0F2',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 9
  },
  selectButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectButtonDisabled: {
    backgroundColor: '#E2E8F0'
  },
  selectButtonSelected: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  detailsSelectButton: {
    flex: 0,
    marginTop: 4
  },
  selectButtonText: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  selectButtonTextDisabled: {
    color: '#64748B'
  },
  emptyPackageCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.88)',
    backgroundColor: '#FFFFFF',
    padding: 18
  },
  emptyPackageHeading: {
    color: '#10213A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 7
  },
  emptyPackageTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  emptyPackageButton: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16
  },
  emptyPackageButtonText: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  selectionMessage: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3D28B',
    backgroundColor: '#FFF8E2',
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  selectionMessageText: {
    color: '#8A5B00',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800'
  },
  selectedIndicator: {
    position: 'absolute',
    zIndex: 4,
    top: 7,
    right: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#B07800',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },
  compactPackageBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingTop: 11,
    paddingBottom: 9
  },
  compactVisualWrap: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF2',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F0DFC0',
    overflow: 'hidden'
  },
  compactPackageImage: {
    width: '97%',
    height: '97%'
  },
  compactPackageInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 11
  },
  compactBrandSlot: {
    height: 18,
    minWidth: 58,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 3
  },
  compactBrandText: {
    color: '#D99A00',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900'
  },
  compactBrandLogo: {
    width: 62,
    height: 18,
    alignSelf: 'flex-start'
  },
  compactPackageTitle: {
    color: '#10213A',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'left',
    alignSelf: 'stretch'
  },
  compactUnavailableText: {
    marginTop: 3,
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '800'
  },
  compactWarrantyRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 7,
    alignSelf: 'stretch'
  },
  compactWarrantyChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  compactWarrantyYears: {
    color: '#10213A',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900'
  },
  compactWarrantyLabel: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 11,
    fontWeight: '800'
  },
  compactPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEF0F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 10
  },
  compactPriceInfo: {
    flex: 1,
    minWidth: 0
  },
  packageBody: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 12
  },
  visualWrap: {
    width: 130,
    height: 104,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF8E8'
  },
  packageImage: {
    width: '100%',
    height: '100%'
  },
  packageInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center'
  },
  brandLogo: {
    width: 58,
    height: 24,
    marginBottom: 6
  },
  goodweLogo: {
    color: '#E11D2E',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  packageTitle: {
    color: '#10213A',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    marginBottom: 10
  },
  warrantyRow: {
    flexDirection: 'row',
    gap: 7
  },
  warrantyChip: {
    flex: 1,
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 7
  },
  warrantyYears: {
    color: '#10213A',
    fontSize: 11,
    fontWeight: '900'
  },
  warrantyLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F2',
    marginHorizontal: 13
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 13,
    gap: 12
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800'
  },
  priceValue: {
    color: '#0F172A',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    marginTop: 2
  },
  detailsButton: {
    flexShrink: 0,
    minWidth: 116,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14
  },
  detailsText: {
    color: '#10213A',
    fontSize: 14,
    fontWeight: '900'
  },
  trustCard: {
    minHeight: 64,
    marginHorizontal: 0,
    marginTop: 2,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10
  },
  trustIcon: {
    width: 32,
    height: 32,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  trustCopy: {
    flex: 1
  },
  trustTitle: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900'
  },
  trustText: {
    color: '#047857',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 2
  },
  trustArrow: {
    transform: [{ rotate: '-90deg' }]
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.92)',
    backgroundColor: 'rgba(248,243,232,0.98)'
  },
  reviewButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 3
  },
  reviewText: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  expertButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F5A400',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  expertText: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.28)'
  },
  detailsSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8F3E8',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    maxHeight: '82%'
  },
  detailsScroll: {
    flexShrink: 1
  },
  detailsScrollContent: {
    paddingBottom: 4
  },
  detailsSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 10
  },
  detailsHeaderCopy: {
    flex: 1
  },
  resetPackageButton: {
    height: 30,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#F1D58F',
    backgroundColor: '#FFF9E9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9
  },
  resetPackageText: {
    color: '#8A6100',
    fontSize: 10,
    fontWeight: '900'
  },
  detailsEyebrow: {
    color: '#B77900',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  detailsTitle: {
    marginTop: 3,
    color: '#10213A',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900'
  },
  detailsClose: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  batteryCapacityWarning: {
    marginHorizontal: 13,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1C75B',
    backgroundColor: '#FFF8DE',
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  batteryCapacityWarningTitle: {
    color: '#8A5600',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900'
  },
  batteryCapacityWarningMeta: {
    marginTop: 3,
    color: '#9A6B00',
    fontSize: 10,
    fontWeight: '800'
  },
  editorOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.42)'
  },
  editorSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8F3E8',
    paddingHorizontal: 15,
    paddingTop: 15
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 11
  },
  editorHeaderCopy: {
    flex: 1
  },
  editorEyebrow: {
    color: '#B77900',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  editorTitle: {
    marginTop: 2,
    color: '#10213A',
    fontSize: 18,
    fontWeight: '900'
  },
  editorList: {
    flexShrink: 1
  },
  editorListContent: {
    gap: 8,
    paddingBottom: 10
  },
  editorProductCard: {
    minHeight: 92,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E7E2DA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10
  },
  editorProductCardSelected: {
    borderColor: '#F5A400',
    backgroundColor: '#FFF9E9'
  },
  editorProductImageWrap: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#FFF8E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  editorProductImage: {
    width: '88%',
    height: '88%'
  },
  editorProductCopy: {
    flex: 1,
    minWidth: 0
  },
  editorProductName: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  editorProductMeta: {
    marginTop: 3,
    color: '#475569',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800'
  },
  editorProductWarranty: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700'
  },
  editorProductBottomRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  editorProductPrice: {
    color: '#10213A',
    fontSize: 11,
    fontWeight: '900'
  },
  editorAvailable: {
    color: '#0F8F54',
    fontSize: 10,
    fontWeight: '900'
  },
  editorRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editorRadioSelected: {
    borderColor: '#E7A200',
    backgroundColor: '#E7A200'
  },
  editorEmpty: {
    minHeight: 110,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E7E2DA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },
  editorEmptyText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center'
  },
  editorQuantityRow: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1D58F',
    backgroundColor: '#FFF9E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  editorQuantityLabel: {
    color: '#10213A',
    fontSize: 11,
    fontWeight: '900'
  },
  editorQuantityMeta: {
    marginTop: 3,
    color: '#8A6100',
    fontSize: 10,
    fontWeight: '800'
  },
  editorQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  editorQuantityButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editorQuantityButtonAdd: {
    borderColor: '#F5B400',
    backgroundColor: '#FFD65A'
  },
  editorQuantityButtonDisabled: {
    backgroundColor: '#F8FAFC'
  },
  editorQuantityValue: {
    minWidth: 20,
    color: '#10213A',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center'
  },
  editorActions: {
    flexDirection: 'row',
    gap: 9
  },
  editorCancelButton: {
    flex: 0.8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editorCancelText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900'
  },
  editorApplyButton: {
    flex: 1.2,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center'
  },
  editorApplyButtonDisabled: {
    backgroundColor: '#E2E8F0'
  },
  editorApplyText: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  }
});

const ApplianceStepScreen = ({ store, onPrevious, onContinue }: { store: any; onPrevious: () => void; onContinue: () => void }) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const [addOtherOpen, setAddOtherOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const selectedQuantity = store.appliances.reduce(
    (total: number, item: any) => total + Math.max(0, Number(item.quantity) || 0),
    0
  );
  const hasSelectedAppliance = selectedQuantity > 0;
  const defaultIds = new Set(applianceGroups.flatMap((group) => group.ids));
  const customAppliances = store.appliances.filter((item: any) => !defaultIds.has(item.id));
  const addAppliance = (item: { id: string; name: string; watts: number }) => {
    store.addAppliance({ ...item, quantity: 1, hours: 4 });
    setAddOtherOpen(false);
  };
  const handleContinue = () => {
    if (!hasSelectedAppliance) {
      setValidationError('Please select at least one appliance to calculate your load.');
      return;
    }
    setValidationError('');
    onContinue();
  };

  useEffect(() => {
    if (hasSelectedAppliance && validationError) setValidationError('');
  }, [hasSelectedAppliance, validationError]);

  return (
    <SafeAreaView style={applianceStyles.shell} edges={['top']}>
      <View style={applianceStyles.topbar}>
        <Pressable style={applianceStyles.topIconButton} onPress={onPrevious} accessibilityLabel="Back">
          <ArrowLeft color="#172031" size={16} strokeWidth={2.4} />
        </Pressable>
        <Text style={applianceStyles.topTitle}>Solar Size</Text>
        <View style={applianceStyles.topIconButton}>
          <Zap color="#F5B700" size={16} strokeWidth={2.3} />
        </View>
      </View>

      <ScrollView
        style={applianceStyles.scroll}
        contentContainerStyle={[applianceStyles.scrollContent, { paddingBottom: 178 + safeBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={applianceStyles.questionBlock}>
          <Text style={applianceStyles.question}>
            Which appliances{'\n'}do you use <Text style={applianceStyles.questionAccent}>during the day?</Text>
          </Text>
          <Text style={applianceStyles.questionSub}>Select the appliances that apply to you</Text>
        </View>

        {applianceGroups.map((group) => (
          <View key={group.title} style={applianceStyles.section}>
            <Text style={applianceStyles.sectionTitle}>{group.title}</Text>
            <View style={applianceStyles.sectionCard}>
              {group.ids.map((id, index) => {
                const item = store.appliances.find((appliance: any) => appliance.id === id);
                if (!item) return null;
                return (
                  <ApplianceCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    watts={item.watts}
                    quantity={item.quantity}
                    showDivider={index < group.ids.length - 1}
                    onChange={(quantity) => store.setApplianceQuantity(item.id, quantity)}
                  />
                );
              })}
            </View>
          </View>
        ))}

        {customAppliances.length > 0 ? (
          <View style={applianceStyles.section}>
            <Text style={applianceStyles.sectionTitle}>ADDED APPLIANCES</Text>
            <View style={applianceStyles.sectionCard}>
              {customAppliances.map((item: any, index: number) => (
                <ApplianceCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  watts={item.watts}
                  quantity={item.quantity}
                  showDivider={index < customAppliances.length - 1}
                  onChange={(quantity) => store.setApplianceQuantity(item.id, quantity)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Pressable style={applianceStyles.addOtherButton} onPress={() => setAddOtherOpen(true)}>
          <Text style={applianceStyles.addOtherText}><Text style={applianceStyles.addOtherPlus}>+ </Text>More appliances</Text>
        </Pressable>
      </ScrollView>

      <View style={[applianceStyles.bottomPanel, { paddingBottom: 8 + safeBottom }]}>
        {validationError ? <Text style={applianceStyles.validationText}>{validationError}</Text> : null}
        <Pressable
          style={[applianceStyles.primaryButton, !hasSelectedAppliance && applianceStyles.primaryButtonDisabled]}
          onPress={handleContinue}
        >
          <Text style={applianceStyles.primaryButtonText}>Calculate Load</Text>
        </Pressable>
      </View>
      <Modal visible={addOtherOpen} transparent animationType="slide" onRequestClose={() => setAddOtherOpen(false)}>
        <Pressable style={applianceStyles.modalBackdrop} onPress={() => setAddOtherOpen(false)}>
          <Pressable style={[applianceStyles.bottomSheet, { paddingBottom: 18 + safeBottom }]}>
            <View style={applianceStyles.sheetHandle} />
            <Text style={applianceStyles.sheetTitle}>Add Other Appliance</Text>
            <Text style={applianceStyles.sheetSubtitle}>Select an appliance to add it to your load list.</Text>
            <View style={applianceStyles.sheetList}>
              {extraApplianceOptions.map((item) => {
                const added = store.appliances.some((appliance: any) => appliance.id === item.id);
                return (
                  <View key={item.id} style={applianceStyles.sheetRow}>
                    <View>
                      <Text style={applianceStyles.sheetRowName}>{item.name}</Text>
                      <Text style={applianceStyles.sheetRowWatts}>{item.watts} W</Text>
                    </View>
                    <Pressable style={[applianceStyles.sheetAddButton, added && applianceStyles.sheetAddButtonAdded]} onPress={() => addAppliance(item)}>
                      <Text style={[applianceStyles.sheetAddText, added && applianceStyles.sheetAddTextAdded]}>{added ? 'Added' : 'Add'}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const ApplianceCard = ({
  id,
  name,
  watts,
  quantity,
  showDivider = false,
  onChange
}: {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  showDivider?: boolean;
  onChange: (quantity: number) => void;
}) => {
  const Icon = applianceIconMap[id as keyof typeof applianceIconMap] || Plus;
  const selected = quantity > 0;

  return (
    <View style={[applianceStyles.card, showDivider && applianceStyles.cardDivider, selected && applianceStyles.cardSelected]}>
      <View style={applianceStyles.cardIcon}>
        <Icon color="#B98900" size={14} strokeWidth={1.9} />
      </View>
      <View style={applianceStyles.cardCopy}>
        <Text style={applianceStyles.cardTitle} numberOfLines={1}>{name}</Text>
        <Text style={applianceStyles.cardWatts}>{watts} W each</Text>
      </View>
      <View style={applianceStyles.stepper}>
        <Pressable style={applianceStyles.stepperButton} onPress={() => onChange(Math.max(0, quantity - 1))}>
          <Text style={[applianceStyles.stepperButtonText, quantity <= 0 && applianceStyles.stepperButtonDisabled]}>-</Text>
        </Pressable>
        <Text style={applianceStyles.stepperValue}>{quantity}</Text>
        <Pressable style={[applianceStyles.stepperButton, applianceStyles.stepperPlusButton]} onPress={() => onChange(Math.min(20, quantity + 1))}>
          <Text style={applianceStyles.stepperButtonPlus}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

const islamabadSolarProductionCurves = {
  summer: {
    subtitle: 'Estimated June output for your solar system in Islamabad after typical losses.',
    points: [
      { time: '8 AM', multiplier: 0.30 },
      { time: '9 AM', multiplier: 0.50 },
      { time: '10 AM', multiplier: 0.65 },
      { time: '11 AM', multiplier: 0.80 },
      { time: '12 PM', multiplier: 0.90 },
      { time: '1 PM', multiplier: 0.90 },
      { time: '2 PM', multiplier: 0.80 },
      { time: '3 PM', multiplier: 0.66 },
      { time: '4 PM', multiplier: 0.48 },
      { time: '5 PM', multiplier: 0.28 }
    ]
  },
  winter: {
    subtitle: 'Estimated December output for your solar system in Islamabad after typical losses.',
    points: [
      { time: '8 AM', multiplier: 0.08 },
      { time: '9 AM', multiplier: 0.25 },
      { time: '10 AM', multiplier: 0.45 },
      { time: '11 AM', multiplier: 0.60 },
      { time: '12 PM', multiplier: 0.68 },
      { time: '1 PM', multiplier: 0.64 },
      { time: '2 PM', multiplier: 0.52 },
      { time: '3 PM', multiplier: 0.35 },
      { time: '4 PM', multiplier: 0.15 },
      { time: '5 PM', multiplier: 0.03 }
    ]
  }
} as const;

const SolarRecommendationStepScreen = ({ navigation, store, onPrevious, onContinue }: { navigation: any; store: any; onPrevious: () => void; onContinue: () => void }) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');
  const runningLoadKw = calculateLoadKw(store.appliances);
  const recommendedKw = Math.max(3, Math.ceil(runningLoadKw * 1.5));
  const systemKw = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || recommendedKw))));
  const inverterKw = Math.max(3, Math.ceil(systemKw));
  const batteryKwh = store.backupDecision === 'yes' ? store.selectedBatteryKwh : 0;
  const dailyUnits = systemKw * (season === 'summer' ? 6 : 3);
  const dayCoverage = runningLoadKw <= 0 ? 100 : Math.min(100, Math.round((systemKw / runningLoadKw) * 100));
  const unitsLabel = `~${Math.round(dailyUnits)} units/day`;
  const coverageLabel = `~${dayCoverage}% day coverage`;
  const adjustSolarSize = (delta: number) => {
    store.setRecommendedSolarKw(Math.min(20, Math.max(1, systemKw + delta)));
  };

  return (
    <SafeAreaView style={solarStyles.shell} edges={['top']}>
      <View style={solarStyles.appbar}>
        <Pressable style={solarStyles.backIcon} onPress={onPrevious} accessibilityLabel="Back">
          <ArrowLeft color="#172031" size={18} strokeWidth={2.1} />
        </Pressable>
        <Text style={solarStyles.stepText}>Step 2 of 8</Text>
      </View>

      <View style={solarStyles.progressRow} accessibilityLabel="Step progress">
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={index} style={[solarStyles.progressSegment, index < 2 && solarStyles.progressSegmentActive]} />
        ))}
      </View>

      <ScrollView style={solarStyles.scroll} contentContainerStyle={[solarStyles.scrollContent, { paddingBottom: 178 + safeBottom }]} showsVerticalScrollIndicator={false}>
        <View style={solarStyles.titleBlock}>
          <Text style={solarStyles.title}>Your Solar Recommendation ☀️</Text>
          <Text style={solarStyles.subtitle}>Ideal system size for your daytime usage</Text>
        </View>

        <View style={solarStyles.recommendCard}>
          <View style={solarStyles.sizeRow}>
            <Pressable
              style={[solarStyles.roundControl, systemKw <= 1 && solarStyles.roundControlDisabled]}
              onPress={() => adjustSolarSize(-1)}
              disabled={systemKw <= 1}
            >
              <Text style={solarStyles.roundControlText}>−</Text>
            </Pressable>
            <View style={solarStyles.sizeCenter}>
              <Text style={solarStyles.sizeText}>{systemKw}<Text style={solarStyles.sizeUnit}> kW</Text></Text>
              <Text style={solarStyles.sizeLabel}>Solar System</Text>
            </View>
            <Pressable
              style={[solarStyles.roundControl, systemKw >= 20 && solarStyles.roundControlDisabled]}
              onPress={() => adjustSolarSize(1)}
              disabled={systemKw >= 20}
            >
              <Text style={[solarStyles.roundControlText, solarStyles.roundControlPlus]}>+</Text>
            </Pressable>
          </View>
          <Text style={solarStyles.recommendedText}>Recommended: {systemKw} kW</Text>
          <Text style={solarStyles.adjustText}>Inverter size will be adjusted automatically.</Text>
        </View>

        <View style={solarStyles.insightRow}>
          {[unitsLabel, coverageLabel, 'Lower bill monthly'].map((label, index) => (
            <View key={label} style={solarStyles.insightCard}>
              <Text style={solarStyles.insightIcon}>{index === 0 ? '☀' : index === 1 ? '⚡' : '⌁'}</Text>
              <Text style={solarStyles.insightText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={solarStyles.chartCard}>
          <View style={solarStyles.chartHeader}>
            <View style={solarStyles.chartTitleWrap}>
              <Text style={solarStyles.chartTitle}>Estimated Solar Production</Text>
              <Text style={solarStyles.chartSubtitle}>{islamabadSolarProductionCurves[season].subtitle}</Text>
            </View>
            <View style={solarStyles.toggle}>
              <Pressable
                style={season === 'summer' && solarStyles.toggleActive}
                onPress={() => setSeason('summer')}
              >
                <Text style={season === 'summer' ? solarStyles.toggleActiveText : solarStyles.toggleInactiveText}>Summer</Text>
              </Pressable>
              <Pressable
                style={season === 'winter' && solarStyles.toggleActive}
                onPress={() => setSeason('winter')}
              >
                <Text style={season === 'winter' ? solarStyles.toggleActiveText : solarStyles.toggleInactiveText}>Winter</Text>
              </Pressable>
            </View>
          </View>

          <SolarProductionChart pvSizeKw={systemKw} runningLoadKw={runningLoadKw} season={season} />

          <Text style={solarStyles.chartNote}>
            Solar size is DC panel capacity. Chart shows estimated AC output after typical system losses in clear-sky conditions.
          </Text>
        </View>

        <Text style={solarStyles.runningLoad}>Running Load: <Text style={solarStyles.runningLoadStrong}>{runningLoadKw.toFixed(1)} kW</Text></Text>

        <Pressable style={solarStyles.recalculateButton} onPress={store.calculateRecommendation}>
          <RotateCcw color="#253247" size={16} strokeWidth={2.2} />
          <Text style={solarStyles.recalculateText}>Recalculate</Text>
        </Pressable>

      </ScrollView>

      <Pressable style={[solarStyles.chatButton, { bottom: 78 + safeBottom }]} accessibilityLabel="Help">
        <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.2} />
      </Pressable>

      <View style={[solarStyles.footer, { paddingBottom: 10 + safeBottom }]}>
        <Pressable style={solarStyles.secondaryButton} onPress={onPrevious}>
          <Text style={solarStyles.secondaryButtonText}>Previous Step</Text>
        </Pressable>
        <Pressable style={solarStyles.primaryButton} onPress={onContinue}>
          <Text style={solarStyles.primaryButtonText}>Continue</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

type ProductionChartPoint = {
  index: number;
  time: string;
  value: number;
  x: number;
  y: number;
};

type SelectedProductionPoint = ProductionChartPoint & {
  dataKey: string;
};

type ChartLabelBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const TOOLTIP_VISIBLE_DURATION = 5000;
const TOOLTIP_HIDDEN_DURATION = 3000;
const TOOLTIP_FADE_DURATION = 300;

const SolarProductionChart = ({ pvSizeKw, runningLoadKw, season }: { pvSizeKw: number; runningLoadKw: number; season: 'summer' | 'winter' }) => {
  const isScreenFocused = useIsFocused();
  const [selectedProductionPoint, setSelectedProductionPoint] = useState<SelectedProductionPoint | null>(null);
  const tooltipOpacity = useRef(new Animated.Value(1)).current;
  const tooltipTranslateY = useRef(new Animated.Value(0)).current;
  const tooltipCycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCycleToken = useRef(0);
  const chart = { left: 40, right: 322, top: 22, bottom: 142 };
  const svgWidth = 340;
  const svgHeight = 184;
  const [renderedChartWidth, setRenderedChartWidth] = useState(svgWidth);
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const dataKey = `${season}-${pvSizeKw}-${runningLoadKw}`;
  const selectedPoint = selectedProductionPoint?.dataKey === dataKey ? selectedProductionPoint : null;
  const productionCurve = islamabadSolarProductionCurves[season].points;
  const practicalAcLimitKw = pvSizeKw;
  const peakProductionKw = Math.max(...productionCurve.map((point) => Math.min(practicalAcLimitKw, pvSizeKw * point.multiplier)));
  const maxKw = Math.max(3, Math.ceil(Math.max(peakProductionKw, runningLoadKw) * 1.15));
  const valueToY = (value: number) => {
    const boundedValue = Math.min(maxKw, Math.max(0, value));
    return chart.bottom - (boundedValue / maxKw) * height;
  };
  const productionData = productionCurve.map((point, index) => {
    const value = Math.min(practicalAcLimitKw, pvSizeKw * point.multiplier);
    const x = chart.left + (index / (productionCurve.length - 1)) * width;
    const y = valueToY(value);
    return { index, time: point.time, value, x, y };
  });
  const peakPoint = productionData.reduce((peak, point) => (point.value > peak.value ? point : peak), productionData[0]);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const boxesOverlap = (left: ChartLabelBox, right: ChartLabelBox, padding = 4) => (
    left.x < right.x + right.width + padding &&
    left.x + left.width + padding > right.x &&
    left.y < right.y + right.height + padding &&
    left.y + left.height + padding > right.y
  );
  const smoothPath = productionData.slice(0, -1).reduce((path, point, index) => {
    const currentPoint = point;
    const nextPoint = productionData[index + 1];
    const previousPoint = productionData[Math.max(0, index - 1)];
    const followingPoint = productionData[Math.min(productionData.length - 1, index + 2)];
    const controlTension = 0.16;
    const minY = Math.min(currentPoint.y, nextPoint.y);
    const maxY = Math.max(currentPoint.y, nextPoint.y);
    const controlOneX = clamp(currentPoint.x + (nextPoint.x - previousPoint.x) * controlTension, currentPoint.x, nextPoint.x);
    const controlOneY = clamp(currentPoint.y + (nextPoint.y - previousPoint.y) * controlTension, minY, maxY);
    const controlTwoX = clamp(nextPoint.x - (followingPoint.x - currentPoint.x) * controlTension, currentPoint.x, nextPoint.x);
    const controlTwoY = clamp(nextPoint.y - (followingPoint.y - currentPoint.y) * controlTension, minY, maxY);

    return `${path} C ${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)}, ${nextPoint.x.toFixed(1)} ${nextPoint.y.toFixed(1)}`;
  }, `M ${productionData[0].x.toFixed(1)} ${productionData[0].y.toFixed(1)}`);
  const firstPoint = productionData[0];
  const lastPoint = productionData[productionData.length - 1];
  const areaPath = `${smoothPath} L ${lastPoint.x.toFixed(1)} ${chart.bottom} L ${firstPoint.x.toFixed(1)} ${chart.bottom} Z`;
  const runningLoadY = valueToY(runningLoadKw);
  const yAxisLabels = [0, maxKw * 0.25, maxKw * 0.5, maxKw * 0.75, maxKw];
  const formatAxisLabel = (value: number) => Number.isInteger(value) ? `${value}` : value.toFixed(1);
  const xAxisLabels = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM'];
  const selectedTooltipWidth = 78;
  const selectedTooltipHeight = 36;
  const selectedTooltipBox: ChartLabelBox | null = selectedPoint ? {
    x: clamp(selectedPoint.x - selectedTooltipWidth / 2, 6, svgWidth - selectedTooltipWidth - 6),
    y: Math.max(0, selectedPoint.y - selectedTooltipHeight - 10),
    width: selectedTooltipWidth,
    height: selectedTooltipHeight
  } : null;
  const runningLoadLabelWidth = 112;
  const runningLoadLabelHeight = 28;
  const primaryRunningLoadLabelY =
    runningLoadY < chart.top + runningLoadLabelHeight + 6
      ? runningLoadY + 7
      : Math.max(chart.top + 4, runningLoadY - runningLoadLabelHeight - 7);
  const alternateRunningLoadLabelY = primaryRunningLoadLabelY > runningLoadY
    ? clamp(runningLoadY - runningLoadLabelHeight - 7, chart.top + 4, chart.bottom - runningLoadLabelHeight - 2)
    : clamp(runningLoadY + 7, chart.top + 4, chart.bottom - runningLoadLabelHeight - 2);
  const runningLoadLabelCandidates: ChartLabelBox[] = [
    { x: chart.right - runningLoadLabelWidth - 6, y: primaryRunningLoadLabelY, width: runningLoadLabelWidth, height: runningLoadLabelHeight },
    { x: chart.left + 6, y: primaryRunningLoadLabelY, width: runningLoadLabelWidth, height: runningLoadLabelHeight },
    { x: chart.right - runningLoadLabelWidth - 6, y: alternateRunningLoadLabelY, width: runningLoadLabelWidth, height: runningLoadLabelHeight },
    { x: chart.left + 6, y: alternateRunningLoadLabelY, width: runningLoadLabelWidth, height: runningLoadLabelHeight }
  ];
  const blockingLabelBoxes = [selectedTooltipBox].filter((box): box is ChartLabelBox => Boolean(box));
  const runningLoadLabelBox = runningLoadLabelCandidates.find((candidate) => (
    blockingLabelBoxes.every((blockingBox) => !boxesOverlap(candidate, blockingBox))
  )) ?? runningLoadLabelCandidates[runningLoadLabelCandidates.length - 1];
  const runningLoadLabelX = runningLoadLabelBox.x;
  const runningLoadLabelY = runningLoadLabelBox.y;
  const runningLoadAnchorX = runningLoadLabelX > chart.left + width / 2
    ? runningLoadLabelX + runningLoadLabelWidth - 13
    : runningLoadLabelX + 13;
  const runningLoadAnchorY =
    runningLoadLabelY > runningLoadY
      ? runningLoadLabelY
      : runningLoadLabelY + runningLoadLabelHeight;

  const clearTooltipCycleTimer = useCallback(() => {
    if (tooltipCycleTimer.current) {
      clearTimeout(tooltipCycleTimer.current);
      tooltipCycleTimer.current = null;
    }
  }, []);

  const stopTooltipCycle = useCallback(() => {
    tooltipCycleToken.current += 1;
    clearTooltipCycleTimer();
    tooltipOpacity.stopAnimation();
    tooltipTranslateY.stopAnimation();
  }, [clearTooltipCycleTimer, tooltipOpacity, tooltipTranslateY]);

  const startTooltipCycle = useCallback(() => {
    stopTooltipCycle();
    const cycleToken = tooltipCycleToken.current;
    tooltipOpacity.setValue(1);
    tooltipTranslateY.setValue(0);

    const scheduleVisiblePhase = () => {
      if (cycleToken !== tooltipCycleToken.current) return;
      tooltipCycleTimer.current = setTimeout(() => {
        if (cycleToken !== tooltipCycleToken.current) return;
        Animated.parallel([
          Animated.timing(tooltipOpacity, {
            toValue: 0,
            duration: TOOLTIP_FADE_DURATION,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false
          }),
          Animated.timing(tooltipTranslateY, {
            toValue: 2,
            duration: TOOLTIP_FADE_DURATION,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false
          })
        ]).start(({ finished }) => {
          if (!finished || cycleToken !== tooltipCycleToken.current) return;
          tooltipCycleTimer.current = setTimeout(() => {
            if (cycleToken !== tooltipCycleToken.current) return;
            Animated.parallel([
              Animated.timing(tooltipOpacity, {
                toValue: 1,
                duration: TOOLTIP_FADE_DURATION,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false
              }),
              Animated.timing(tooltipTranslateY, {
                toValue: 0,
                duration: TOOLTIP_FADE_DURATION,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false
              })
            ]).start(({ finished: fadeInFinished }) => {
              if (fadeInFinished && cycleToken === tooltipCycleToken.current) {
                scheduleVisiblePhase();
              }
            });
          }, TOOLTIP_HIDDEN_DURATION);
        });
      }, TOOLTIP_VISIBLE_DURATION);
    };

    scheduleVisiblePhase();
  }, [stopTooltipCycle, tooltipOpacity, tooltipTranslateY]);

  useEffect(() => {
    setSelectedProductionPoint(null);
    if (isScreenFocused) {
      startTooltipCycle();
    } else {
      stopTooltipCycle();
      tooltipOpacity.setValue(0);
      tooltipTranslateY.setValue(0);
    }

    return stopTooltipCycle;
  }, [dataKey, isScreenFocused, startTooltipCycle, stopTooltipCycle, tooltipOpacity, tooltipTranslateY]);

  const selectProductionPoint = (point: ProductionChartPoint) => {
    setSelectedProductionPoint({ ...point, dataKey });
    if (isScreenFocused) startTooltipCycle();
  };

  const dismissProductionTooltip = () => {
    setSelectedProductionPoint(null);
  };
  const interactionScale = Math.min(renderedChartWidth / svgWidth, 1);
  const interactionOffsetX = (renderedChartWidth - svgWidth * interactionScale) / 2;
  const interactionOffsetY = (svgHeight - svgHeight * interactionScale) / 2;

  return (
    <View
      style={solarStyles.productionChartWrap}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        setRenderedChartWidth((currentWidth) => Math.abs(currentWidth - nextWidth) > 0.5 ? nextWidth : currentWidth);
      }}
    >
    <Svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      <Defs>
        <LinearGradient id="solarAreaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5B400" stopOpacity="0.2" />
          <Stop offset="0.52" stopColor="#FBD46A" stopOpacity="0.09" />
          <Stop offset="1" stopColor="#FFF6DB" stopOpacity="0.015" />
        </LinearGradient>
      </Defs>
      <Rect
        x="34"
        y="14"
        width="294"
        height="142"
        rx="16"
        fill="#FFFFFF"
        onPress={dismissProductionTooltip}
      />
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = chart.bottom - ratio * height;
        return (
          <Line
            key={ratio}
            x1={chart.left}
            y1={y}
            x2={chart.right}
            y2={y}
            stroke={ratio === 0 ? '#E8DFD2' : '#EEF2F6'}
            strokeWidth="1"
            strokeDasharray={ratio === 0 ? undefined : '3 6'}
          />
        );
      })}
      <SvgText x="14" y={chart.top - 6} fontSize="9.5" fontWeight="800" fill="#98A2B3">kW</SvgText>
      <Line x1={chart.left} y1={runningLoadY} x2={chart.right} y2={runningLoadY} stroke="#344054" strokeWidth="1.35" strokeDasharray="5 5" opacity="0.78" />
      <Path d={areaPath} fill="url(#solarAreaFill)" />
      <Path d={smoothPath} fill="none" stroke="#F8C85A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.08" />
      <Path d={smoothPath} fill="none" stroke="#F2A51A" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
      {yAxisLabels.map((label) => (
        <SvgText key={`axis-${label}`} x="5" y={valueToY(label) + 3} fontSize="9.5" fill="#98A2B3">{formatAxisLabel(label)}</SvgText>
      ))}
      {xAxisLabels.map((label) => {
        const point = productionData.find((item) => item.time === label);
        if (!point) return null;
        return <SvgText key={label} x={point.x} y="169" fontSize="9.5" fill="#98A2B3" textAnchor="middle">{label}</SvgText>;
      })}
      <AnimatedG opacity={tooltipOpacity} pointerEvents="none">
        <Line
          x1={runningLoadAnchorX}
          y1={runningLoadAnchorY}
          x2={runningLoadAnchorX}
          y2={runningLoadY}
          stroke="#475467"
          strokeWidth="1"
          opacity="0.38"
        />
        <Rect
          x={runningLoadLabelX + 1.5}
          y={runningLoadLabelY + 2}
          width={runningLoadLabelWidth}
          height={runningLoadLabelHeight}
          rx="10"
          fill="#101828"
          opacity="0.08"
        />
        <Rect
          x={runningLoadLabelX}
          y={runningLoadLabelY}
          width={runningLoadLabelWidth}
          height={runningLoadLabelHeight}
          rx="10"
          fill="#FFFDF7"
          stroke="#E6D9C8"
          strokeWidth="1"
        />
        <SvgText x={runningLoadLabelX + 10} y={runningLoadLabelY + 12} fontSize="8.3" fontWeight="800" fill="#667085">Running Load</SvgText>
        <SvgText x={runningLoadLabelX + 10} y={runningLoadLabelY + 24} fontSize="10.5" fontWeight="900" fill="#101828">{runningLoadKw.toFixed(1)} kW</SvgText>
      </AnimatedG>
      {productionData.map((point) => (
        <Circle
          key={`target-${point.time}`}
          cx={point.x}
          cy={point.y}
          r="16"
          fill="#F5A400"
          opacity={0.001}
          onPress={() => selectProductionPoint(point)}
        />
      ))}
      {productionData.map((point) => {
        const isSelected = selectedPoint?.index === point.index;
        const isPeak = point.index === peakPoint.index;
        return (
          <React.Fragment key={`point-${point.time}`}>
            {isSelected && (
              <Circle
                cx={point.x}
                cy={point.y}
                r="9"
                fill="#F5A400"
                fillOpacity="0.16"
                stroke="#F5A400"
                strokeWidth="1.3"
                strokeOpacity="0.52"
              />
            )}
            <Circle
              cx={point.x}
              cy={point.y}
              r={isSelected ? 5.4 : isPeak ? 4.6 : 3.4}
              fill="#F5A400"
              stroke="#FFFFFF"
              strokeWidth={isSelected ? 2.2 : 2}
              onPress={() => selectProductionPoint(point)}
            />
          </React.Fragment>
        );
      })}
    </Svg>
      {selectedPoint && selectedTooltipBox && (
        <Animated.View
          pointerEvents="none"
          style={[
            solarStyles.productionTooltip,
            {
              left: interactionOffsetX + selectedTooltipBox.x * interactionScale,
              top: interactionOffsetY + selectedTooltipBox.y * interactionScale,
              width: selectedTooltipBox.width * interactionScale,
              height: selectedTooltipBox.height * interactionScale,
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }]
            }
          ]}
        >
          <View
            style={[
              solarStyles.productionTooltipArrow,
              {
                left: clamp(
                  (selectedPoint.x - selectedTooltipBox.x) * interactionScale - 4,
                  8,
                  selectedTooltipBox.width * interactionScale - 16
                )
              }
            ]}
          />
          <Text style={solarStyles.productionTooltipTime}>{selectedPoint.time}</Text>
          <Text style={solarStyles.productionTooltipValue}>{selectedPoint.value.toFixed(1)} kW</Text>
        </Animated.View>
      )}
      {productionData.map((point) => (
        <Pressable
          key={`accessible-target-${point.time}`}
          style={[
            solarStyles.productionPointTouchTarget,
            {
              left: interactionOffsetX + point.x * interactionScale - 16,
              top: interactionOffsetY + point.y * interactionScale - 16
            }
          ]}
          onPress={() => selectProductionPoint(point)}
          accessibilityRole="button"
          accessibilityLabel={`Estimated production at ${point.time} is ${point.value.toFixed(1)} kilowatts`}
          accessibilityState={{ selected: selectedPoint?.index === point.index }}
        />
      ))}
    </View>
  );
};

const StepHeader = ({ step, active, onBack }: { step: string; active: number; onBack?: () => void }) => (
  <>
    <View style={flowStyles.appbar}>
      <Pressable style={flowStyles.backIcon} onPress={onBack} accessibilityLabel="Back">
        <ArrowLeft color="#172031" size={18} strokeWidth={2.1} />
      </Pressable>
      <Text style={flowStyles.stepText}>{step}</Text>
    </View>
    <View style={flowStyles.progressRow}>
      {Array.from({ length: 8 }).map((_, index) => (
        <View key={index} style={[flowStyles.progressSegment, index < active && flowStyles.progressSegmentActive]} />
      ))}
    </View>
  </>
);

const packageSelectionSignature = (pkg?: RecommendedPackage | null) => pkg ? [
  pkg.panel.id,
  pkg.panelQuantity,
  pkg.inverter.product.id,
  pkg.inverterQuantity,
  pkg.battery?.product.id ?? '',
  pkg.batteryQuantity
].join(':') : '';

const editorProductSize = (mode: PackageEditorMode, product: Product) => {
  if (mode === 'panel') return `${Math.round(getProductWatt(product))}W`;
  if (mode === 'inverter') return formatKw(getProductKw(product));
  return `${getProductKwh(product)} kWh`;
};

const editorProductPrice = (mode: PackageEditorMode, product: Product) =>
  mode === 'panel' ? getPanelUnitPrice(product) : product.price ?? null;

const QuantityStepper = ({ value, onChange }: { value: number; onChange: (quantity: number) => void }) => (
  <View style={packagesStyles.editorQuantityControl}>
    <Pressable
      style={[packagesStyles.editorQuantityButton, value <= 1 && packagesStyles.editorQuantityButtonDisabled]}
      disabled={value <= 1}
      onPress={() => onChange(Math.max(1, value - 1))}
      accessibilityRole="button"
      accessibilityLabel="Decrease quantity"
    >
      <Minus color={value <= 1 ? '#CBD5E1' : '#10213A'} size={16} strokeWidth={2.5} />
    </Pressable>
    <Text style={packagesStyles.editorQuantityValue}>{value}</Text>
    <Pressable
      style={[packagesStyles.editorQuantityButton, packagesStyles.editorQuantityButtonAdd]}
      onPress={() => onChange(value + 1)}
      accessibilityRole="button"
      accessibilityLabel="Increase quantity"
    >
      <Plus color="#10213A" size={16} strokeWidth={2.5} />
    </Pressable>
  </View>
);

const PackageComponentEditorModal = ({
  mode,
  pkg,
  products,
  visible,
  onCancel,
  onApply
}: {
  mode: PackageEditorMode | null;
  pkg: RecommendedPackage;
  products: Product[];
  visible: boolean;
  onCancel: () => void;
  onApply: (product: Product, quantity: number) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const options = useMemo(() => {
    if (mode === 'panel') return getPanelCustomizationOptions(products);
    if (mode === 'inverter') return getInverterCustomizationOptions(pkg, products);
    if (mode === 'battery') return getBatteryCustomizationOptions(pkg, products);
    return [];
  }, [mode, pkg, products]);

  useEffect(() => {
    if (!visible || !mode) return;
    const currentProduct = mode === 'panel' ? pkg.panel : mode === 'inverter' ? pkg.inverter.product : pkg.battery?.product;
    setSelectedProduct(options.find((product) => product.id === currentProduct?.id) ?? options[0] ?? null);
    setQuantity(mode === 'panel' ? Math.max(1, pkg.panelQuantity) : mode === 'battery' ? Math.max(1, pkg.batteryQuantity) : 1);
  }, [mode, options, pkg.battery?.product, pkg.batteryQuantity, pkg.inverter.product, pkg.panel, pkg.panelQuantity, visible]);

  if (!mode) return null;
  const isQuantityEditable = mode === 'panel' || mode === 'battery';
  const unitCapacity = selectedProduct
    ? mode === 'panel' ? getProductWatt(selectedProduct) / 1000 : mode === 'battery' ? getProductKwh(selectedProduct) : getProductKw(selectedProduct)
    : 0;
  const selectedTotal = unitCapacity * (isQuantityEditable ? quantity : 1);
  const title = mode === 'panel' ? 'Select Solar Panels' : mode === 'inverter' ? 'Select Inverter' : 'Select Battery';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={packagesStyles.editorOverlay}>
        <View style={[packagesStyles.editorSheet, { paddingBottom: 12 + (insets.bottom || 8) }]}>
          <View style={packagesStyles.editorHeader}>
            <View style={packagesStyles.editorHeaderCopy}>
              <Text style={packagesStyles.editorEyebrow}>Customize package</Text>
              <Text style={packagesStyles.editorTitle}>{title}</Text>
            </View>
            <Pressable style={packagesStyles.detailsClose} onPress={onCancel} accessibilityLabel="Close editor">
              <X color="#10213A" size={18} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView style={packagesStyles.editorList} contentContainerStyle={packagesStyles.editorListContent} showsVerticalScrollIndicator={false}>
            {options.length === 0 ? (
              <View style={packagesStyles.editorEmpty}>
                <Text style={packagesStyles.editorEmptyText}>No suitable products are currently available.</Text>
              </View>
            ) : options.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              const ProductIcon = mode === 'panel' ? Sun : mode === 'inverter' ? Zap : BatteryCharging;
              return (
                <Pressable
                  key={product.id}
                  style={[packagesStyles.editorProductCard, isSelected && packagesStyles.editorProductCardSelected]}
                  onPress={() => setSelectedProduct(product)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={packagesStyles.editorProductImageWrap}>
                    <SafeImage
                      source={product.image ? { uri: product.image } : undefined}
                      style={packagesStyles.editorProductImage}
                      resizeMode="contain"
                      fallback={<ProductIcon color="#B77900" size={28} strokeWidth={1.9} />}
                    />
                  </View>
                  <View style={packagesStyles.editorProductCopy}>
                    <Text style={packagesStyles.editorProductName} numberOfLines={1}>{getProductBrandName(product)} {product.model || product.name}</Text>
                    <Text style={packagesStyles.editorProductMeta} numberOfLines={2}>
                      {editorProductSize(mode, product)}
                      {mode === 'inverter' && product.phase ? ` · ${product.phase === 'three' ? 'Three phase' : 'Single phase'}` : ''}
                      {product.voltageClass && product.voltageClass !== 'NONE' ? ` · ${product.voltageClass}` : ''}
                    </Text>
                    <Text style={packagesStyles.editorProductWarranty}>{product.warranty || 'Warranty on request'}</Text>
                    <View style={packagesStyles.editorProductBottomRow}>
                      <Text style={packagesStyles.editorProductPrice}>{formatPkr(editorProductPrice(mode, product))}</Text>
                      <Text style={packagesStyles.editorAvailable}>Available</Text>
                    </View>
                  </View>
                  <View style={[packagesStyles.editorRadio, isSelected && packagesStyles.editorRadioSelected]}>
                    {isSelected ? <Check color="#FFFFFF" size={12} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedProduct && isQuantityEditable ? (
            <View style={packagesStyles.editorQuantityRow}>
              <View>
                <Text style={packagesStyles.editorQuantityLabel}>{mode === 'panel' ? 'Number of panels' : 'Battery quantity'}</Text>
                <Text style={packagesStyles.editorQuantityMeta}>
                  Total: {mode === 'panel' ? `${selectedTotal.toFixed(2)} kW` : `${selectedTotal} kWh`}
                </Text>
              </View>
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </View>
          ) : null}

          <View style={packagesStyles.editorActions}>
            <Pressable style={packagesStyles.editorCancelButton} onPress={onCancel}>
              <Text style={packagesStyles.editorCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[packagesStyles.editorApplyButton, !selectedProduct && packagesStyles.editorApplyButtonDisabled]}
              disabled={!selectedProduct}
              onPress={() => selectedProduct && onApply(selectedProduct, isQuantityEditable ? quantity : 1)}
            >
              <Text style={packagesStyles.editorApplyText}>Apply Change</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ChatButton = () => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;

  return (
    <Pressable style={[flowStyles.chatButton, { bottom: 78 + safeBottom }]} accessibilityLabel="Help">
      <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.2} />
    </Pressable>
  );
};

const RecommendedSystemStepScreen = ({
  solarKw,
  batteryKwh,
  onPrevious,
  onContinue
}: {
  solarKw: number;
  batteryKwh: number;
  onPrevious: () => void;
  onContinue: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const solarSize = Math.round(solarKw || 3);
  const inverterSize = getInverterSizeKw(solarSize);
  const batterySize = batteryKwh;

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 7 of 8" active={7} onBack={onPrevious} />
      <ScrollView style={flowStyles.scroll} contentContainerStyle={[recommendedStyles.content, { paddingBottom: 178 + safeBottom }]} showsVerticalScrollIndicator={false}>
        <View style={recommendedStyles.titleBlock}>
          <Text style={recommendedStyles.title}>Your Recommended Solar System is Ready <Text style={recommendedStyles.flash}>⚡</Text></Text>
          <Text style={recommendedStyles.subtitle}>Based on your selected appliances, load and usage</Text>
        </View>

        <View style={recommendedStyles.systemCard}>
          <View style={recommendedStyles.imagePane}>
            <Image source={recommendedSystemImage} style={recommendedStyles.systemImage} resizeMode="contain" />
          </View>
          <View style={recommendedStyles.specPane}>
            <View style={recommendedStyles.specRow}>
              <View style={recommendedStyles.specIcon}><Sun color="#F5A400" size={16} strokeWidth={2.4} /></View>
              <View>
                <Text style={recommendedStyles.specValue}>{solarSize} kW</Text>
                <Text style={recommendedStyles.specLabel}>Solar Panels</Text>
              </View>
            </View>
            <View style={recommendedStyles.specDivider} />
            <View style={recommendedStyles.specRow}>
              <View style={recommendedStyles.specIcon}><Zap color="#F5A400" size={16} strokeWidth={2.4} /></View>
              <View>
                <Text style={recommendedStyles.specValue}>{inverterSize} kW</Text>
                <Text style={recommendedStyles.specLabel}>Inverter</Text>
              </View>
            </View>
            <View style={recommendedStyles.specDivider} />
            <View style={recommendedStyles.specRow}>
              <View style={recommendedStyles.specIcon}><BatteryCharging color="#F5A400" size={16} strokeWidth={2.4} /></View>
              <View>
                <Text style={recommendedStyles.specValue}>{batterySize} kWh</Text>
                <Text style={recommendedStyles.specLabel}>Battery Bank</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={recommendedStyles.designedText}>Designed for your daily usage and reliable backup</Text>
        <Pressable style={recommendedStyles.exploreButton} onPress={onContinue}>
          <Text style={recommendedStyles.exploreText}>Explore Packages →</Text>
        </Pressable>
        <Text style={recommendedStyles.trustText}>ⓘ 100% Safe · Genuine Products · Expert Support</Text>
      </ScrollView>
      <ChatButton />
      <View style={[recommendedStyles.footer, { paddingBottom: 10 + safeBottom }]}>
        <Pressable style={recommendedStyles.secondaryButton} onPress={onPrevious}>
          <Text style={recommendedStyles.secondaryButtonText}>Previous Step</Text>
        </Pressable>
        <Pressable style={recommendedStyles.primaryButton} onPress={onContinue}>
          <Text style={recommendedStyles.primaryButtonText}>Next</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const RoofSpaceStepScreen = ({
  store,
  orientation,
  onOrientationChange,
  onPrevious,
  onContinue
}: {
  store: any;
  orientation: PanelOrientation;
  onOrientationChange: (orientation: PanelOrientation) => void;
  onPrevious: () => void;
  onContinue: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const selectedPVSizeKW = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3))));
  const requestedPanelWattage = Math.round(Number(store.panelWattage || 610));
  const panelProductsQuery = useProducts('panel');
  const allProducts = panelProductsQuery.data ?? [];
  const detectedPanelProducts = useMemo(() => allProducts.filter(isPanelProduct), [allProducts]);
  const panelProducts = useMemo(() => detectedPanelProducts.filter((product) => extractPanelWattage(product) > 0), [detectedPanelProducts]);
  const storedPanel = panelProducts.find((product) => product.id === store.selectedPanels?.id) ?? null;
  const defaultPanel = useMemo(
    () => selectDefaultPanelProduct(panelProducts, requestedPanelWattage),
    [panelProducts, requestedPanelWattage]
  );
  const selectedPanel = storedPanel ?? defaultPanel;
  const selectedPanelWattage = selectedPanel ? extractPanelWattage(selectedPanel) : 0;
  const panelCount = selectedPanelWattage > 0
    ? store.panelQuantityOverride ?? calculatePanelCount(selectedPVSizeKW, selectedPanelWattage)
    : 0;
  const layout = useMemo(
    () => calculatePanelLayout({ panelCount, orientation }),
    [orientation, panelCount]
  );
  const alternateLayout = useMemo(
    () => calculatePanelLayout({ panelCount, orientation: orientation === 'landscape' ? 'portrait' : 'landscape' }),
    [orientation, panelCount]
  );
  const roofAreaSqFt = selectedPanel ? layout.area : 0;
  const inverterSize = Math.max(3, Math.ceil(selectedPVSizeKW));
  const batterySize = store.backupDecision === 'yes' ? store.selectedBatteryKwh : 0;
  const panelEmptyMessage = panelProductsQuery.isLoading
    ? 'Loading solar panels...'
    : panelProductsQuery.isError
      ? 'Unable to load panel products. Please try again.'
      : detectedPanelProducts.length > 0
        ? 'Panel wattage not detected. Please add wattage/capacity for panel products in Admin Dashboard.'
        : 'No solar panel products found. Please add solar panels in Admin Dashboard.';

  useEffect(() => {
    if (!__DEV__) return;
    if (panelProductsQuery.isLoading) {
      console.log('Step 3 loading products...');
      return;
    }
    console.log('Step 3 products response:', allProducts);
    console.log('Step 3 products error:', panelProductsQuery.error ?? null);
    if (panelProductsQuery.error && typeof panelProductsQuery.error === 'object') {
      const supabaseError = panelProductsQuery.error as { message?: string; details?: string; code?: string };
      console.log('Step 3 Supabase error:', {
        message: supabaseError.message,
        details: supabaseError.details,
        code: supabaseError.code
      });
    }
    console.log('Step 3 product count:', allProducts?.length);
    console.log('Step 3 detected panel products:', detectedPanelProducts);
    console.log('Step 3 panel categories:', allProducts?.map((product) => product.category));
    console.log('Step 3 panel wattages:', detectedPanelProducts?.map((product) => ({
      name: product.name,
      brand: getProductBrandName(product),
      category: product.category,
      wattage: extractPanelWattage(product),
      specifications: product.specifications
    })));
  }, [allProducts, detectedPanelProducts, panelProductsQuery.error, panelProductsQuery.isLoading]);

  useEffect(() => {
    if (panelProductsQuery.isLoading || panelProductsQuery.isError || !selectedPanel || selectedPanelWattage <= 0) return;
    if (store.panelWattage !== selectedPanelWattage) store.setPanelWattage(selectedPanelWattage);
    if (store.selectedPanels?.id !== selectedPanel.id) store.setSelectedProduct(selectedPanel);
    if (store.selectedPanelBrand !== getProductBrandName(selectedPanel)) store.setSelectedPanelBrand(getProductBrandName(selectedPanel));
  }, [panelProductsQuery.isError, panelProductsQuery.isLoading, selectedPanel, selectedPanelWattage, store]);

  const handlePanelSelect = (panel: Product) => {
    const wattage = extractPanelWattage(panel);
    if (wattage <= 0) return;
    store.setPanelWattage(wattage);
    store.setSelectedPanelBrand(getProductBrandName(panel));
    store.setSelectedProduct(panel);
  };

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 3 of 8" active={3} onBack={onPrevious} />
      <ScrollView
        style={flowStyles.scroll}
        contentContainerStyle={[roofStyles.content, { paddingBottom: 178 + safeBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={panelProductsQuery.isRefetching} onRefresh={() => void panelProductsQuery.refetch()} />}
      >
        <PanelLayoutVisualizer
          selectedPanelProduct={selectedPanel}
          panelWattage={selectedPanelWattage}
          panelQuantity={panelCount}
          orientation={orientation}
          onOrientationChange={onOrientationChange}
          layout={layout}
          alternateLayout={alternateLayout}
          emptyMessage={panelEmptyMessage}
        />

        <View style={roofStyles.metricCard}>
          <Text style={roofStyles.metricLabel}>REQUIRED PANELS</Text>
          <Text style={roofStyles.metricValue}>{selectedPanel ? panelCount : 0}</Text>
          {selectedPanel ? (
            <Text style={roofStyles.selectedPanelText}>Selected Panel: {panelOptionLabel(selectedPanel)}</Text>
          ) : null}
          <View style={roofStyles.wattageSelector}>
            {panelProductsQuery.isLoading ? (
              [1, 2, 3].map((item) => (
                <View key={item} style={[roofStyles.wattagePill, roofStyles.wattagePillSkeleton]}>
                  <Text style={roofStyles.wattagePillText}>...</Text>
                </View>
              ))
            ) : panelProductsQuery.isError || panelProducts.length === 0 ? (
              <Text style={roofStyles.noWattageText}>{panelEmptyMessage}</Text>
            ) : panelProducts.map((panel) => {
              const selected = panel.id === selectedPanel?.id;
              return (
                <Pressable
                  key={panel.id}
                  style={[roofStyles.wattagePill, selected && roofStyles.wattagePillActive]}
                  onPress={() => handlePanelSelect(panel)}
                >
                  <Text style={[roofStyles.wattagePillText, selected && roofStyles.wattagePillTextActive]}>{panelOptionLabel(panel)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={roofStyles.heroCard}>
          <Text style={roofStyles.heroTitle}>Total Roof Space</Text>
          <Text style={roofStyles.heroValue}>{selectedPanel ? `~${roofAreaSqFt} sq ft` : '--'}</Text>
          <Text style={roofStyles.heroCopy}>AUTO-CALCULATED FOR YOUR {selectedPVSizeKW} KW{'\n'}RECOMMENDATION.</Text>
        </View>
      </ScrollView>
      <ChatButton />
      <View style={[roofStyles.footer, { paddingBottom: 10 + safeBottom }]}>
        <Pressable style={roofStyles.secondaryButton} onPress={onPrevious}>
          <Text style={roofStyles.secondaryButtonText}>Previous Step</Text>
        </Pressable>
        <Pressable style={roofStyles.primaryButton} onPress={onContinue}>
          <Text style={roofStyles.primaryButtonText}>Next</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const BatteryChoiceStepScreen = ({
  store,
  onPrevious,
  onYes,
  onNo
}: {
  store: any;
  onPrevious: () => void;
  onYes: () => void;
  onNo: () => void;
}) => {
  const selected = store.backupDecision || 'yes';
  const solarKw = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3))));
  const inverterKw = getInverterSizeKw(solarKw);
  const batteryKwh = store.backupDecision === 'yes' ? store.selectedBatteryKwh : 0;
  const handleYes = () => {
    store.setBackupDecision('yes');
    onYes();
  };
  const handleNo = () => {
    store.setBackupDecision('no');
    onNo();
  };

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 4 of 8" active={4} onBack={onPrevious} />
      <View style={batteryChoiceStyles.content}>
        <View style={batteryChoiceStyles.titleBlock}>
          <Text style={batteryChoiceStyles.title}>Do you want battery backup?</Text>
          <Text style={batteryChoiceStyles.subtitle}>Battery backup keeps your important appliances{'\n'}running during outages.</Text>
        </View>
        <View style={batteryChoiceStyles.heroImageCard}>
          <Image source={batteryBackupHeroImage} style={batteryChoiceStyles.heroImage} resizeMode="cover" />
        </View>
        <Pressable style={[batteryChoiceStyles.optionCard, selected !== 'no' && batteryChoiceStyles.optionSelected]} onPress={handleYes}>
          <View style={batteryChoiceStyles.checkIcon}><Check color="#FFFFFF" size={24} strokeWidth={2.8} /></View>
          <View style={batteryChoiceStyles.optionCopy}>
            <Text style={batteryChoiceStyles.optionTitle}>Yes, I want backup</Text>
            <Text style={batteryChoiceStyles.optionSub}>Let's calculate my battery size</Text>
          </View>
          <View style={batteryChoiceStyles.badge}><Text style={batteryChoiceStyles.badgeText}>RECOMMENDED</Text></View>
        </Pressable>
        <Pressable style={batteryChoiceStyles.optionCard} onPress={handleNo}>
          <View style={batteryChoiceStyles.xIcon}><X color="#FFFFFF" size={24} strokeWidth={2.8} /></View>
          <View style={batteryChoiceStyles.optionCopy}>
            <Text style={batteryChoiceStyles.optionTitle}>No, I don't need backup</Text>
            <Text style={batteryChoiceStyles.optionSub}>I'll continue without battery</Text>
          </View>
        </Pressable>
        <Text style={batteryChoiceStyles.laterText}>You can always add battery later.</Text>
      </View>
      <ChatButton />
    </SafeAreaView>
  );
};

type BackupRow = {
  id: string;
  name: string;
  watts: number;
  wattLabel: string;
  qty: number;
  hours: number;
  selected: boolean;
  icon: any;
};

const backupRows: BackupRow[] = [
  { id: 'ac1', name: 'AC 1 Ton (Inverter)', watts: 900, wattLabel: 'Running: 900 W', qty: 0, hours: DEFAULT_BACKUP_HOURS, selected: false, icon: AirVent },
  { id: 'ac15', name: 'AC 1.5 Ton (Inverter)', watts: 1200, wattLabel: 'Running: 1200 W', qty: 0, hours: DEFAULT_BACKUP_HOURS, selected: false, icon: AirVent },
  { id: 'ac2', name: 'AC 2 Ton (Inverter)', watts: 1800, wattLabel: 'Running: 1800 W', qty: 0, hours: DEFAULT_BACKUP_HOURS, selected: false, icon: AirVent },
  { id: 'fridge', name: 'Refrigerator', watts: 200, wattLabel: 'Running: 200 W', qty: 0, hours: DEFAULT_BACKUP_HOURS, selected: false, icon: Refrigerator },
  { id: 'fan', name: 'Fan', watts: 80, wattLabel: 'Running: 80 W', qty: 0, hours: DEFAULT_BACKUP_HOURS, selected: false, icon: Fan },
  { id: 'light', name: 'LED Light', watts: 20, wattLabel: 'Running: 20 W', qty: 0, hours: DEFAULT_BACKUP_HOURS, selected: false, icon: Lightbulb }
];

const extraBackupRows: BackupRow[] = [
  { id: 'tv', name: 'TV', watts: 100, wattLabel: 'Running: 100 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Grid3X3 },
  { id: 'router', name: 'WiFi Router', watts: 20, wattLabel: 'Running: 20 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Zap },
  { id: 'laptop', name: 'Laptop', watts: 65, wattLabel: 'Running: 65 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Grid3X3 },
  { id: 'pump', name: 'Water Pump', watts: 750, wattLabel: 'Running: 750 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Zap },
  { id: 'iron', name: 'Iron', watts: 1000, wattLabel: 'Running: 1000 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Zap },
  { id: 'microwave', name: 'Microwave', watts: 1200, wattLabel: 'Running: 1200 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Grid3X3 },
  { id: 'cctv', name: 'CCTV Camera', watts: 15, wattLabel: 'Running: 15 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Grid3X3 },
  { id: 'charger', name: 'Mobile Charger', watts: 10, wattLabel: 'Running: 10 W', qty: 1, hours: DEFAULT_BACKUP_HOURS, selected: true, icon: Zap }
];

const formatWh = (value: number) => Math.round(value).toLocaleString('en-US');
const formatKwh = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};
const formatDetailKwh = (valueKwh: number) => `${formatBatteryDeltaKwh(valueKwh)} kWh`;

const backupHourOptions = [1, 2, 3, 4, 5, 6, 8];
const formatBackupLoadKw = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};
const formatBatteryDeltaKwh = (value: number) => {
  const rounded = Math.max(0, Math.round(value * 10) / 10);
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};
const formatBatteryCapacityKwh = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

const BackupApplianceCard = ({
  id,
  name,
  watts,
  quantity,
  hours,
  showDivider = false,
  onChange,
  onOpenHours
}: {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  hours: number;
  showDivider?: boolean;
  onChange: (quantity: number) => void;
  onOpenHours: () => void;
}) => {
  const Icon = applianceIconMap[id as keyof typeof applianceIconMap] || Plus;
  const selected = quantity > 0;

  return (
    <View style={[applianceStyles.card, applianceStyles.backupCard, showDivider && applianceStyles.cardDivider, selected && applianceStyles.cardSelected]}>
      <View style={applianceStyles.cardIcon}>
        <Icon color="#B98900" size={14} strokeWidth={1.9} />
      </View>
      <View style={[applianceStyles.cardCopy, applianceStyles.backupCardCopy]}>
        <Text style={applianceStyles.cardTitle} numberOfLines={1}>{name}</Text>
        <Text style={applianceStyles.cardWatts}>{watts} W each</Text>
      </View>
      <View style={[applianceStyles.stepper, applianceStyles.backupStepper]}>
        <Pressable
          style={applianceStyles.stepperButton}
          onPress={() => onChange(Math.max(0, quantity - 1))}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${name} quantity`}
        >
          <Text style={[applianceStyles.stepperButtonText, quantity <= 0 && applianceStyles.stepperButtonDisabled]}>-</Text>
        </Pressable>
        <Text style={applianceStyles.stepperValue}>{quantity}</Text>
        <Pressable
          style={[applianceStyles.stepperButton, applianceStyles.stepperPlusButton]}
          onPress={() => onChange(Math.min(20, quantity + 1))}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${name} quantity`}
        >
          <Text style={applianceStyles.stepperButtonPlus}>+</Text>
        </Pressable>
      </View>
      <Pressable
        style={[applianceStyles.hoursPill, !selected && applianceStyles.hoursPillDisabled]}
        onPress={onOpenHours}
        disabled={!selected}
        accessibilityRole="button"
        accessibilityLabel={`Select backup hours for ${name}`}
        accessibilityState={{ disabled: !selected }}
      >
        <Text style={applianceStyles.hoursText}>{hours ?? DEFAULT_BACKUP_HOURS}h</Text>
        <ChevronDown color="#9A6E00" size={10} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
};

const LegacyBackupCalculationDetailsCard = ({
  appliances,
  expanded,
  onToggle
}: {
  appliances: any[];
  expanded: boolean;
  onToggle: () => void;
}) => {
  const selectedAppliances = appliances.filter((item) => item.quantity > 0);
  const totalWh = selectedAppliances.reduce((sum, item) => sum + (item.watts * item.quantity * (item.hours ?? DEFAULT_BACKUP_HOURS)), 0);
  const safetyMarginWh = (totalWh * DEFAULT_BATTERY_SAFETY_MARGIN_PERCENT) / 100;
  const requiredWh = totalWh + safetyMarginWh;

  return (
    <View style={[backupStyles.detailsCard, expanded && backupStyles.detailsCardOpen]}>
      <Pressable style={backupStyles.detailsHeader} onPress={onToggle}>
        <Text style={backupStyles.detailsTitle}>Calculation details</Text>
        <View style={backupStyles.detailsAction}>
          <Text style={backupStyles.detailsActionText}>{expanded ? 'Hide' : 'View'}</Text>
          <ChevronDown
            color="#C48A00"
            size={16}
            strokeWidth={2.5}
            style={expanded && backupStyles.chevronUp}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={backupStyles.detailsBody}>
          {selectedAppliances.length === 0 ? (
            <Text style={backupStyles.emptyDetails}>Select appliances to see backup calculation.</Text>
          ) : (
            <>
              {selectedAppliances.map((item, index) => {
                const Icon = applianceIconMap[item.id as keyof typeof applianceIconMap] || Plus;
                const itemHours = item.hours ?? DEFAULT_BACKUP_HOURS;
                const itemWh = item.watts * item.quantity * itemHours;
                return (
                  <View key={item.id}>
                    <View style={backupStyles.calcRow}>
                      <View style={backupStyles.calcIcon}>
                        <Icon color="#B98900" size={12} strokeWidth={2} />
                      </View>
                      <View style={backupStyles.calcCopy}>
                        <Text style={backupStyles.calcName} numberOfLines={1}>{item.name}</Text>
                        <Text style={backupStyles.calcFormula}>{item.watts} W × {item.quantity} × {itemHours} h</Text>
                      </View>
                      <Text style={backupStyles.calcValue}>{formatWh(itemWh)} Wh</Text>
                    </View>
                    {index < selectedAppliances.length - 1 ? <View style={backupStyles.calcDivider} /> : null}
                  </View>
                );
              })}

              <View style={backupStyles.calcDivider} />
              <CalculationTotal label="Total backup energy" valueWh={totalWh} />
              <CalculationTotal label="Safety margin" valueWh={safetyMarginWh} prefix="+ " />
              <View style={backupStyles.totalRow}>
                <Text style={[backupStyles.totalLabel, backupStyles.totalHighlight]}>Required battery capacity</Text>
                <View style={backupStyles.totalValues}>
                  <Text style={[backupStyles.totalWh, backupStyles.totalHighlight]}>{formatWh(requiredWh)} Wh</Text>
                  <Text style={[backupStyles.totalKwh, backupStyles.totalHighlight]}>= {formatDetailKwh(requiredWh)}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
};

const BackupCalculationDetailsCard = ({
  summary,
  recommendation,
  visible,
  onClose
}: {
  summary: BackupRequirementSummary;
  recommendation: ReturnType<typeof commercialRuleRecommendationStrategy.recommend>;
  visible: boolean;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={applianceStyles.modalBackdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close calculation details">
      <Pressable style={[applianceStyles.bottomSheet, { paddingBottom: 18 + insets.bottom }]}>
        <View style={applianceStyles.sheetHandle} />
        <Text style={backupStyles.detailsSheetTitle}>Battery Calculation Details</Text>

        <ScrollView
          style={backupStyles.detailsScroll}
          contentContainerStyle={backupStyles.detailsBody}
          showsVerticalScrollIndicator={false}
        >
          <View style={backupStyles.calcSection}>
            <Text style={backupStyles.calcSectionTitle}>Selected Appliance Energy</Text>
            <Text style={backupStyles.calcSectionFormula}>Appliance wattage x quantity x selected backup hours</Text>
            {summary.applianceBreakdown.length === 0 ? (
              <Text style={backupStyles.emptyDetails}>Select appliances to see backup calculation.</Text>
            ) : (
              summary.applianceBreakdown.map((item, index) => (
                <View key={item.id}>
                  <View style={backupStyles.calcRow}>
                    <View style={backupStyles.calcCopy}>
                      <Text style={backupStyles.calcName} numberOfLines={1}>{item.name}</Text>
                      <Text style={backupStyles.calcFormula}>
                        {item.watts} W x {item.quantity} x {item.hours} h = {formatBatteryDeltaKwh(item.energyKwh)} kWh
                      </Text>
                    </View>
                  </View>
                  {index < summary.applianceBreakdown.length - 1 ? <View style={backupStyles.calcDivider} /> : null}
                </View>
              ))
            )}
          </View>
          <CalculationTotal label="Total Required Backup Energy" value={`${formatBatteryDeltaKwh(recommendation.requiredBackupEnergyKwh)} kWh`} highlight />
          <CalculationTotal
            label="Safety Margin"
            value={`${formatBatteryDeltaKwh(recommendation.safetyMarginPercent)}% = ${formatBatteryDeltaKwh(recommendation.safetyMarginEnergyKwh)} kWh`}
          />
          <CalculationTotal
            label="Recommended Battery Size"
            value={recommendation.recommendedBatteryBank
              ? `${formatBatteryDeltaKwh(recommendation.recommendedBatteryBank.batteryBankCapacityKwh)} kWh`
              : 'Expert review'}
            highlight
          />
          <Text style={backupStyles.detailsSheetSubtitle}>
            Recommended battery size includes a safety margin for practical system performance.
          </Text>
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
  );
};

const BackupSummaryMetric = ({
  Icon,
  label,
  value
}: {
  Icon: any;
  label: string;
  value: string;
}) => (
  <View
    style={applianceStyles.backupSummaryMetric}
    accessible
    accessibilityLabel={`${label}: ${value}`}
  >
    <Icon color="#D69A00" size={16} strokeWidth={2.1} />
    <View style={applianceStyles.backupSummaryMetricCopy}>
      <Text style={applianceStyles.backupSummaryLabel}>{label}</Text>
      <Text style={applianceStyles.backupSummaryValue}>{value}</Text>
    </View>
  </View>
);

const CalculationDetailsAttentionRow = ({ onPress }: { onPress: () => void }) => {
  if (Platform.OS !== 'web') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="View battery calculation details"
        style={{
          width: '100%',
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 0,
          marginTop: 10,
          marginBottom: 12,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: '#E6C65E',
          backgroundColor: '#FFFDF8',
          overflow: 'hidden',
          elevation: 2,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' }}>
          <ClipboardList size={20} color="#667085" strokeWidth={2.15} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              marginLeft: 9,
              flexShrink: 1,
              color: '#0B1F3A',
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '700',
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            Calculation Details
          </Text>
        </View>
        <View style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              marginRight: 6,
              color: '#B88700',
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '700',
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            View
          </Text>
          <ArrowRight size={20} color="#B88700" strokeWidth={2.35} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View battery calculation details"
      style={({ pressed }) => ({
        width: '100%',
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        marginTop: 10,
        marginBottom: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E6C65E',
        backgroundColor: '#FFFDF8',
        opacity: pressed ? 0.86 : 1,
        overflow: 'hidden',
        elevation: 2,
      })}
    >
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <ClipboardList size={20} color="#667085" strokeWidth={2.15} />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            marginLeft: 9,
            flexShrink: 1,
            color: '#0B1F3A',
            fontSize: 14,
            lineHeight: 19,
            fontWeight: '700',
          }}
        >
          Calculation Details
        </Text>
      </View>
      <View
        style={{
          marginLeft: 12,
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            marginRight: 6,
            color: '#B88700',
            fontSize: 14,
            lineHeight: 19,
            fontWeight: '700',
          }}
        >
          View
        </Text>
        <ArrowRight size={20} color="#B88700" strokeWidth={2.35} />
      </View>
    </Pressable>
  );
};

const BackupAppliancesStepScreen = ({ store, onPrevious, onContinue }: { store: any; onPrevious: () => void; onContinue: () => void }) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const [addOtherOpen, setAddOtherOpen] = useState(false);
  const [hoursPickerId, setHoursPickerId] = useState<string | null>(null);
  const [calculationOpen, setCalculationOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const selectedBackupAppliances = store.backupAppliances.filter((item: any) => item.quantity > 0);
  const selectedBackupQuantity = selectedBackupAppliances.reduce(
    (total: number, item: any) => total + Math.max(0, Number(item.quantity) || 0),
    0
  );
  const hasSelectedBackupAppliance = selectedBackupQuantity > 0;
  const backupSummary = calculateBackupRequirementSummary(store.backupAppliances, 0);
  const sizingCatalogQuery = useBatterySizingCatalog();
  const recommendationConfigurationQuery = useRecommendationConfiguration();
  const calculationRecommendation = useMemo(
    () => commercialRuleRecommendationStrategy.recommend({
      appliances: store.backupAppliances,
      products: sizingCatalogQuery.data ?? [],
      selectedPanelWattage: Number(store.panelWattage) || null,
      configuration: recommendationConfigurationQuery.data ?? DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
    }),
    [sizingCatalogQuery.data, recommendationConfigurationQuery.data, store.backupAppliances, store.panelWattage]
  );
  const solarKw = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3))));
  const inverterKw = getInverterSizeKw(solarKw);
  const defaultIds = new Set(applianceGroups.flatMap((group) => group.ids));
  const customAppliances = store.backupAppliances.filter((item: any) => !defaultIds.has(item.id));
  const hoursPickerItem = hoursPickerId ? store.backupAppliances.find((item: any) => item.id === hoursPickerId) : null;
  const addAppliance = (item: { id: string; name: string; watts: number }) => {
    store.addBackupAppliance({ ...item, quantity: 1, hours: DEFAULT_BACKUP_HOURS });
    setAddOtherOpen(false);
  };
  const handleContinue = () => {
    if (!hasSelectedBackupAppliance) {
      setValidationError('Please select at least one appliance for backup.');
      return;
    }
    setValidationError('');
    store.setBackupRequirementSummary(backupSummary);
    onContinue();
  };

  useEffect(() => {
    if (hasSelectedBackupAppliance && validationError) setValidationError('');
  }, [hasSelectedBackupAppliance, validationError]);

  return (
    <SafeAreaView style={applianceStyles.shell} edges={['top']}>
      <View style={applianceStyles.topbar}>
        <Pressable style={applianceStyles.topIconButton} onPress={onPrevious} accessibilityLabel="Back">
          <ArrowLeft color="#172031" size={16} strokeWidth={2.4} />
        </Pressable>
        <Text style={applianceStyles.topTitle}>Battery Size</Text>
        <View style={applianceStyles.topIconButton}>
          <Zap color="#F5B700" size={16} strokeWidth={2.3} />
        </View>
      </View>

      <ScrollView
        style={applianceStyles.scroll}
        contentContainerStyle={[applianceStyles.scrollContent, { paddingBottom: 296 + safeBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={applianceStyles.questionBlock}>
          <Text style={applianceStyles.question}>Which appliances{'\n'}do you want <Text style={applianceStyles.questionAccent}>on backup?</Text></Text>
          <Text style={applianceStyles.questionSub}>Select appliances for battery backup</Text>
        </View>

        {applianceGroups.map((group) => (
          <View key={group.title} style={applianceStyles.section}>
            <Text style={applianceStyles.sectionTitle}>{group.title}</Text>
            <View style={applianceStyles.sectionCard}>
              {group.ids.map((id, index) => {
                const item = store.backupAppliances.find((appliance: any) => appliance.id === id);
                if (!item) return null;
                return (
                  <BackupApplianceCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    watts={item.watts}
                    quantity={item.quantity}
                    hours={item.hours ?? DEFAULT_BACKUP_HOURS}
                    showDivider={index < group.ids.length - 1}
                    onChange={(quantity) => store.setBackupApplianceQuantity(item.id, quantity)}
                    onOpenHours={() => setHoursPickerId(item.id)}
                  />
                );
              })}
            </View>
          </View>
        ))}

        {customAppliances.length > 0 ? (
          <View style={applianceStyles.section}>
            <Text style={applianceStyles.sectionTitle}>ADDED APPLIANCES</Text>
            <View style={applianceStyles.sectionCard}>
              {customAppliances.map((item: any, index: number) => (
                <BackupApplianceCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  watts={item.watts}
                  quantity={item.quantity}
                  hours={item.hours ?? DEFAULT_BACKUP_HOURS}
                  showDivider={index < customAppliances.length - 1}
                  onChange={(quantity) => store.setBackupApplianceQuantity(item.id, quantity)}
                  onOpenHours={() => setHoursPickerId(item.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Pressable style={applianceStyles.addOtherButton} onPress={() => setAddOtherOpen(true)}>
          <Text style={applianceStyles.addOtherText}><Text style={applianceStyles.addOtherPlus}>+ </Text>More appliances</Text>
        </Pressable>

      </ScrollView>

      <View style={[applianceStyles.bottomPanel, { paddingBottom: 8 + safeBottom }]}>
        <View style={applianceStyles.backupSummaryCard}>
          <View style={applianceStyles.backupSummaryHeader}>
            <View style={applianceStyles.backupSummaryTitleRow}>
              <View style={applianceStyles.backupSummaryIcon}>
                <Zap color="#10213A" size={14} strokeWidth={2.5} />
              </View>
              <Text numberOfLines={1} style={applianceStyles.backupSummaryTitle}>Your Backup Load Summary</Text>
            </View>
            <View style={applianceStyles.backupSummaryBadge}>
              <Text numberOfLines={1} style={applianceStyles.backupSummaryBadgeText}>Updated instantly</Text>
            </View>
          </View>
          <CalculationDetailsAttentionRow onPress={() => setCalculationOpen(true)} />
          <View style={applianceStyles.backupSummaryGrid}>
            <BackupSummaryMetric Icon={Activity} label="Running Load" value={`${formatBackupLoadKw(backupSummary.runningLoadKw)} kW`} />
            <BackupSummaryMetric Icon={Users} label="Appliances" value={`${backupSummary.selectedAppliancesCount} selected`} />
            <BackupSummaryMetric Icon={BatteryCharging} label="Required Backup Energy" value={`${formatBatteryDeltaKwh(calculationRecommendation.requiredBackupEnergyKwh)} kWh`} />
            <BackupSummaryMetric Icon={ShieldCheck} label="Safety Margin" value={`${formatBatteryDeltaKwh(calculationRecommendation.safetyMarginPercent)}%`} />
          </View>
          <Text style={applianceStyles.backupSummaryHelper}>Battery recommendation includes a safety margin for practical system performance.</Text>
        </View>
        <Text style={applianceStyles.backupSummaryHint}>Review your load summary before continuing.</Text>
        {validationError ? <Text style={applianceStyles.validationText}>{validationError}</Text> : null}
        <Pressable
          style={[applianceStyles.primaryButton, !hasSelectedBackupAppliance && applianceStyles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={!hasSelectedBackupAppliance}
          accessibilityRole="button"
          accessibilityLabel="Calculate Battery Size"
          accessibilityState={{ disabled: !hasSelectedBackupAppliance }}
        >
          <Text style={applianceStyles.primaryButtonText}>Calculate Battery Size</Text>
        </Pressable>
      </View>

      <BackupCalculationDetailsCard
        summary={backupSummary}
        recommendation={calculationRecommendation}
        visible={calculationOpen}
        onClose={() => setCalculationOpen(false)}
      />

      <Modal visible={addOtherOpen} transparent animationType="slide" onRequestClose={() => setAddOtherOpen(false)}>
        <Pressable style={applianceStyles.modalBackdrop} onPress={() => setAddOtherOpen(false)}>
          <Pressable style={[applianceStyles.bottomSheet, { paddingBottom: 18 + safeBottom }]}>
            <View style={applianceStyles.sheetHandle} />
            <Text style={applianceStyles.sheetTitle}>Add Other Appliance</Text>
            <Text style={applianceStyles.sheetSubtitle}>Select an appliance to add it to your backup list.</Text>
            <View style={applianceStyles.sheetList}>
              {extraApplianceOptions.map((item) => {
                const added = store.backupAppliances.some((appliance: any) => appliance.id === item.id);
                return (
                  <View key={item.id} style={applianceStyles.sheetRow}>
                    <View>
                      <Text style={applianceStyles.sheetRowName}>{item.name}</Text>
                      <Text style={applianceStyles.sheetRowWatts}>{item.watts} W</Text>
                    </View>
                    <Pressable style={[applianceStyles.sheetAddButton, added && applianceStyles.sheetAddButtonAdded]} onPress={() => addAppliance(item)}>
                      <Text style={[applianceStyles.sheetAddText, added && applianceStyles.sheetAddTextAdded]}>{added ? 'Added' : 'Add'}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={Boolean(hoursPickerItem)} transparent animationType="fade" onRequestClose={() => setHoursPickerId(null)}>
        <Pressable style={applianceStyles.hoursBackdrop} onPress={() => setHoursPickerId(null)}>
          <View style={applianceStyles.hoursMenu}>
            {backupHourOptions.map((hours) => {
              const selected = hoursPickerItem?.hours === hours;
              return (
                <Pressable
                  key={hours}
                  style={[applianceStyles.hoursOption, selected && applianceStyles.hoursOptionSelected]}
                  onPress={() => {
                    if (hoursPickerItem) store.setBackupApplianceHours(hoursPickerItem.id, hours);
                    setHoursPickerId(null);
                  }}
                >
                  <Text style={[applianceStyles.hoursOptionText, selected && applianceStyles.hoursOptionTextSelected]}>{hours}h</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const CalculationTotal = ({
  label,
  value,
  valueWh,
  prefix = '',
  helper,
  highlight = false
}: {
  label: string;
  value?: string;
  valueWh?: number;
  prefix?: string;
  helper?: string;
  highlight?: boolean;
}) => {
  const displayValue = value ?? `${prefix}${formatWh(valueWh ?? 0)} Wh`;
  const detailValue = value ? null : `= ${formatDetailKwh((valueWh ?? 0) / 1000)}`;

  return (
    <View style={backupStyles.totalRow}>
      <View style={backupStyles.totalCopy}>
        <Text style={[backupStyles.totalLabel, highlight && backupStyles.totalHighlight]}>{label}</Text>
        {helper ? <Text style={backupStyles.totalHelper}>{helper}</Text> : null}
      </View>
      <View style={backupStyles.totalValues}>
        <Text style={[backupStyles.totalValue, highlight && backupStyles.totalHighlight]}>{displayValue}</Text>
        {detailValue ? <Text style={[backupStyles.totalKwh, highlight && backupStyles.totalHighlight]}>{detailValue}</Text> : null}
      </View>
    </View>
  );
};

const BackupPlanStepScreen = ({
  navigation,
  store,
  onPrevious,
  onContinue
}: {
  navigation: any;
  store: any;
  onPrevious: () => void;
  onContinue: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const backupSummary = calculateBackupRequirementSummary(store.backupAppliances, 0);
  const selectedBackupAppliances = store.backupAppliances.filter((item: any) => item.quantity > 0);
  const selectedBackupQuantity = selectedBackupAppliances.reduce(
    (total: number, item: any) => total + Math.max(0, Number(item.quantity) || 0),
    0
  );
  const hasSelectedBackupAppliance = selectedBackupQuantity > 0;
  const requiredBackupEnergyKwh = backupSummary.baseRequiredEnergyKwh;
  const productsQuery = useBatterySizingCatalog();
  const recommendationConfigurationQuery = useRecommendationConfiguration();
  const [retryingCatalog, setRetryingCatalog] = useState(false);
  const inventoryProducts = productsQuery.data ?? [];
  const batteryProducts = inventoryProducts.filter(isBatteryCatalogProduct);
  const recommendationConfiguration = recommendationConfigurationQuery.data ?? DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION;
  const commercialRecommendation = useMemo(
    () => commercialRuleRecommendationStrategy.recommend({
      appliances: store.backupAppliances,
      products: inventoryProducts,
      selectedPanelWattage: Number(store.panelWattage) || null,
      configuration: recommendationConfiguration,
    }),
    [inventoryProducts, recommendationConfiguration, store.backupAppliances, store.panelWattage]
  );
  const toStoredBatteryConfiguration = (bank: CommercialBatteryBank): BatteryConfiguration => ({
    id: bank.id,
    capacityKwh: bank.batteryBankCapacityKwh,
    productIds: Array.from({ length: bank.quantity }, () => bank.batteryProductId),
    quantity: bank.quantity,
    brand: bank.brand,
    model: bank.model,
    totalPrice: bank.totalPrice,
    usableEnergyKwh: bank.batteryUsableEnergyKwh,
    image: bank.product.image,
    primaryProduct: bank.product,
    applicableUsableFactor: bank.applicableUsableFactor,
    requiredBackupEnergyKwh: bank.requiredBackupEnergyKwh,
    coveragePercentage: bank.coveragePercent,
    capacityShortfallKwh: bank.shortfallKwh,
    headroomKwh: bank.headroomKwh,
    coversRequirement: bank.coversRequirement,
    commercialTier: bank.tier,
    statusLabel: bank.statusLabel,
  });
  const backupOptions = (['loadManaged', 'recommended', 'extended'] as const)
    .map((tier) => commercialRecommendation.batteryTiers[tier])
    .filter((bank): bank is CommercialBatteryBank => Boolean(bank))
    .map(toStoredBatteryConfiguration);
  const storedConfiguration = store.selectedBatteryConfiguration as BatteryConfiguration | null;
  const recommendationEngineChanged =
    Number(store.batteryRecommendationEngineVersion) !== BATTERY_RECOMMENDATION_ENGINE_VERSION;
  const requirementChanged = store.batteryRecommendationRequirementKwh == null ||
    Math.abs(Number(store.batteryRecommendationRequirementKwh) - requiredBackupEnergyKwh) > 0.01;
  const storedOption = backupOptions.find(
    (option) => option.commercialTier === storedConfiguration?.commercialTier
  );
  const selectedBatteryConfiguration = !recommendationEngineChanged && !requirementChanged && storedOption
    ? storedOption
    : backupOptions.find((option) => option.commercialTier === 'recommended') ?? null;
  // Optional reserve choices change the battery bank, not the V1 PV/inverter
  // sizing strategy. Keep those targets anchored to the default Recommended
  // bank while package matching receives the customer's selected capacity.
  const selectedSystemTargets = commercialRecommendation.systemTargets;
  const selectedPanelConfiguration = selectedSystemTargets.targetPvKwp != null
    ? selectSolarPanelConfiguration({
        products: inventoryProducts,
        targetPvKwp: selectedSystemTargets.targetPvKwp,
        selectedPanelWattage: Number(store.panelWattage) || null,
      })
    : null;
  const formattedRequiredEnergyKwh = formatBatteryDeltaKwh(requiredBackupEnergyKwh);
  const formattedSafetyMarginPercent = formatBatteryDeltaKwh(commercialRecommendation.safetyMarginPercent);
  const retryCatalog = async () => {
    setRetryingCatalog(true);
    try {
      await productsQuery.refetch();
    } finally {
      setRetryingCatalog(false);
    }
  };

  useEffect(() => {
    if (
      selectedBatteryConfiguration &&
      (
        storedConfiguration?.id !== selectedBatteryConfiguration.id ||
        storedConfiguration?.totalPrice !== selectedBatteryConfiguration.totalPrice ||
        storedConfiguration?.image !== selectedBatteryConfiguration.image ||
        storedConfiguration?.primaryProduct?.name !== selectedBatteryConfiguration.primaryProduct.name ||
        storedConfiguration?.commercialTier !== selectedBatteryConfiguration.commercialTier ||
        recommendationEngineChanged ||
        requirementChanged
      )
    ) {
      store.setSelectedBatteryConfiguration(
        selectedBatteryConfiguration,
        requiredBackupEnergyKwh
      );
    }
  }, [
    recommendationEngineChanged,
    requirementChanged,
    requiredBackupEnergyKwh,
    selectedBatteryConfiguration,
    store.setSelectedBatteryConfiguration,
    storedConfiguration?.commercialTier,
    storedConfiguration?.id,
    storedConfiguration?.image,
    storedConfiguration?.primaryProduct?.name,
    storedConfiguration?.totalPrice,
  ]);

  useEffect(() => {
    if (selectedSystemTargets.requiresExpertReview || selectedSystemTargets.targetPvKwp == null) return;
    if (Math.abs(Number(store.recommendedSolarKw) - selectedSystemTargets.targetPvKwp) > 0.001) {
      store.setRecommendedSolarKw(selectedSystemTargets.targetPvKwp);
    }
    if (selectedPanelConfiguration && Number(store.panelWattage) !== selectedPanelConfiguration.panelWattage) {
      store.setPanelWattage(selectedPanelConfiguration.panelWattage);
    }
  }, [
    selectedPanelConfiguration,
    selectedSystemTargets.requiresExpertReview,
    selectedSystemTargets.targetPvKwp,
    store.panelWattage,
    store.recommendedSolarKw,
    store.setPanelWattage,
    store.setRecommendedSolarKw,
  ]);

  if (!hasSelectedBackupAppliance) {
    return (
      <SafeAreaView style={flowStyles.shell} edges={['top']}>
        <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
        <View style={backupPlanStyles.emptySelection}>
          <Text style={backupPlanStyles.emptySelectionTitle}>Select backup appliances first</Text>
          <Text style={backupPlanStyles.emptySelectionText}>Please select at least one appliance for backup before calculating a battery recommendation.</Text>
          <Pressable style={applianceStyles.primaryButton} onPress={onPrevious}>
            <Text style={applianceStyles.primaryButtonText}>Back to Appliance Selection</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (productsQuery.isLoading || recommendationConfigurationQuery.isLoading || retryingCatalog) {
    return (
      <SafeAreaView style={flowStyles.shell} edges={['top']}>
        <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
        <View style={backupPlanStyles.emptySelection}>
          <ActivityIndicator color="#F2A900" size="small" />
          <Text style={backupPlanStyles.emptySelectionTitle}>Loading battery options...</Text>
          <Text style={backupPlanStyles.emptySelectionText}>Checking the current product catalog for the best available capacity.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productsQuery.isError) {
    return (
      <SafeAreaView style={flowStyles.shell} edges={['top']}>
        <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
        <View style={backupPlanStyles.emptySelection}>
          <Text style={backupPlanStyles.emptySelectionTitle}>Battery options are unavailable</Text>
          <Text style={backupPlanStyles.emptySelectionText}>The product catalog could not be loaded. Check your connection and retry.</Text>
          <Pressable style={applianceStyles.primaryButton} onPress={() => void retryCatalog()}>
            <Text style={applianceStyles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (batteryProducts.length === 0) {
    return (
      <SafeAreaView style={flowStyles.shell} edges={['top']}>
        <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
        <View style={backupPlanStyles.emptySelection}>
          <Text style={backupPlanStyles.emptySelectionTitle}>No battery products available</Text>
          <Text style={backupPlanStyles.emptySelectionText}>There are currently no active battery products in the catalog.</Text>
          <Pressable style={applianceStyles.primaryButton} onPress={() => void retryCatalog()}>
            <Text style={applianceStyles.primaryButtonText}>Refresh Catalog</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (backupOptions.length === 0 && !commercialRecommendation.requiresExpertReview) {
    return (
      <SafeAreaView style={flowStyles.shell} edges={['top']}>
        <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
        <View style={backupPlanStyles.emptySelection}>
          <Text style={backupPlanStyles.emptySelectionTitle}>Battery capacity information is incomplete</Text>
          <Text style={backupPlanStyles.emptySelectionText}>Battery products were loaded, but none has a usable kWh capacity configured.</Text>
          <Pressable style={applianceStyles.primaryButton} onPress={() => void retryCatalog()}>
            <Text style={applianceStyles.primaryButtonText}>Refresh Catalog</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (commercialRecommendation.requiresExpertReview || !selectedBatteryConfiguration) {
    return (
      <SafeAreaView style={flowStyles.shell} edges={['top']}>
        <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
        <ScrollView contentContainerStyle={backupPlanStyles.emptySelection} showsVerticalScrollIndicator={false}>
          <Text style={backupPlanStyles.emptySelectionTitle}>{EXPERT_REVIEW_MESSAGE}</Text>
          <Text style={backupPlanStyles.emptySelectionText}>{commercialRecommendation.expertReviewReasons.join(' ') || 'A compatible product configuration could not be created safely.'}</Text>
          <View style={backupPlanStyles.partialOptionList}>
            {backupOptions.map((option) => (
              <View key={option.id} style={backupPlanStyles.partialOptionCard}>
                <View>
                  <Text style={backupPlanStyles.partialOptionName}>
                    {getBatteryProductDisplayName(option.primaryProduct, option.capacityKwh / option.quantity)}
                  </Text>
                  <Text style={backupPlanStyles.partialOptionMeta}>
                    {option.quantity} × {formatBatteryCapacityKwh(option.capacityKwh / option.quantity)} kWh = {formatBatteryCapacityKwh(option.capacityKwh)} kWh
                  </Text>
                </View>
                <Text style={backupPlanStyles.partialOptionCoverage}>{option.statusLabel}</Text>
              </View>
            ))}
          </View>
          <View style={backupPlanStyles.noCoverageActions}>
            <Pressable style={applianceStyles.primaryButton} onPress={onPrevious}>
              <Text style={applianceStyles.primaryButtonText}>Recalculate</Text>
            </Pressable>
            <Pressable style={backupPlanStyles.expertButton} onPress={() => navigation.navigate('BookSurvey')}>
              <Text style={backupPlanStyles.expertButtonText}>Get Expert Recommendation</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selectedProduct = selectedBatteryConfiguration.primaryProduct;
  const selectedUnitCapacityKwh = selectedBatteryConfiguration.capacityKwh / selectedBatteryConfiguration.quantity;
  const selectedProductName = getBatteryProductDisplayName(selectedProduct, selectedUnitCapacityKwh);
  const selectedReason = selectedBatteryConfiguration.statusLabel ??
    (selectedBatteryConfiguration.commercialTier === 'loadManaged'
      ? 'Close to your requirement — minor load management may be required'
      : selectedBatteryConfiguration.commercialTier === 'extended'
        ? 'Additional backup reserve'
        : 'Covers your requirement with safety margin');
  const selectedTierLabel = selectedBatteryConfiguration.commercialTier === 'recommended'
    ? 'RECOMMENDED BATTERY BANK'
    : selectedBatteryConfiguration.commercialTier === 'loadManaged'
      ? 'LOAD-MANAGED BATTERY BANK'
      : 'EXTENDED BACKUP BATTERY BANK';

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
      <ScrollView style={flowStyles.scroll} contentContainerStyle={[backupPlanStyles.content, { paddingBottom: 178 + safeBottom }]} showsVerticalScrollIndicator={false}>
        <View style={backupPlanStyles.titleBlock}>
          <Text style={backupPlanStyles.title}>Your Backup Plan is Ready</Text>
          <Text style={backupPlanStyles.subtitle}>Recommended battery capacity for your selected backup load</Text>
        </View>

        <View style={backupPlanStyles.heroCard}>
          <View style={backupPlanStyles.heroTop}>
            <View style={backupPlanStyles.heroCopy}>
              <Text style={backupPlanStyles.heroRecommendationLabel}>
                {selectedTierLabel}
              </Text>
              <Text style={backupPlanStyles.batteryValue}>
                {formatBatteryCapacityKwh(selectedBatteryConfiguration.capacityKwh)}
                <Text style={backupPlanStyles.batteryUnit}> kWh</Text>
              </Text>
              <Text style={backupPlanStyles.batteryLabel}>
                {selectedBatteryConfiguration.quantity} × {formatBatteryCapacityKwh(selectedUnitCapacityKwh)} kWh Battery Bank
              </Text>
            </View>
            <View style={backupPlanStyles.imageWrap}>
              <SafeImage
                source={selectedBatteryConfiguration.image ? { uri: selectedBatteryConfiguration.image } : undefined}
                style={backupPlanStyles.batteryImage}
                resizeMode="contain"
                fallback={(
                  <BrandLogo
                    brand={{
                      id: selectedProduct.brandId,
                      name: selectedProduct.brandName ?? selectedProduct.brand,
                      slug: selectedProduct.brandSlug,
                      aliases: selectedProduct.brandAliases,
                      logoUrl: selectedProduct.brandLogo,
                    }}
                    productLogoUrl={selectedProduct.brandLogo}
                    style={backupPlanStyles.batteryBrandFallback}
                    fallbackTextStyle={backupPlanStyles.batteryBrandFallbackText}
                  />
                )}
              />
              {selectedBatteryConfiguration.quantity > 1 ? (
                <View style={backupPlanStyles.quantityBadge}>
                  <Text style={backupPlanStyles.quantityBadgeText}>×{selectedBatteryConfiguration.quantity}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={backupPlanStyles.productLine}>
            <View style={backupPlanStyles.productCopy}>
              <Text style={backupPlanStyles.productBrand}>{selectedBatteryConfiguration.brand}</Text>
              <Text style={backupPlanStyles.productModel} numberOfLines={1}>{selectedProductName}</Text>
              <Text style={backupPlanStyles.productQuantity}>{selectedBatteryConfiguration.quantity} {selectedBatteryConfiguration.quantity === 1 ? 'unit' : 'units'}</Text>
            </View>
            <Text style={backupPlanStyles.productPrice}>{formatPkr(selectedBatteryConfiguration.totalPrice)}</Text>
          </View>
          <View style={backupPlanStyles.statsRow}>
            <View style={backupPlanStyles.statItem}>
              <Text style={backupPlanStyles.statLabel}>Total Capacity</Text>
              <Text style={backupPlanStyles.statValue}>{formatBatteryCapacityKwh(selectedBatteryConfiguration.capacityKwh)} kWh</Text>
              <Text style={backupPlanStyles.statSub}>{selectedBatteryConfiguration.quantity} × {formatBatteryCapacityKwh(selectedUnitCapacityKwh)} kWh</Text>
            </View>
            <View style={backupPlanStyles.statDivider} />
            <View style={backupPlanStyles.statItem}>
              <Text style={backupPlanStyles.statLabel}>Required Backup</Text>
              <Text style={backupPlanStyles.statValue}>{formattedRequiredEnergyKwh} kWh</Text>
              <Text style={backupPlanStyles.statSub}>selected appliances</Text>
            </View>
            <View style={backupPlanStyles.statDivider} />
            <View style={backupPlanStyles.statItem}>
              <Text style={backupPlanStyles.statLabel}>Safety Margin</Text>
              <Text style={backupPlanStyles.statValue}>{formattedSafetyMarginPercent}%</Text>
              <Text style={backupPlanStyles.statSub}>practical reserve</Text>
            </View>
          </View>
          <View style={backupPlanStyles.whyCard}>
            <Text style={backupPlanStyles.whyTitle}>Why this size?</Text>
            <Text style={backupPlanStyles.whyText}>{selectedReason}</Text>
          </View>
        </View>

        <Text style={backupPlanStyles.adjustTitle}>Want to adjust your backup?</Text>
        <View style={backupPlanStyles.optionRow}>
          {backupOptions.map((option) => {
            const selected = option.id === selectedBatteryConfiguration.id;
            const tierLabel = option.commercialTier === 'recommended'
              ? 'Recommended'
              : option.commercialTier === 'loadManaged'
                ? 'Load-Managed'
                : 'Extended Backup';
            const unitCapacityKwh = option.capacityKwh / option.quantity;
            return (
              <Pressable
                key={option.id}
                style={[backupPlanStyles.optionCard, selected && backupPlanStyles.optionSelected]}
                onPress={() => store.setSelectedBatteryConfiguration(option, requiredBackupEnergyKwh)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${formatBatteryCapacityKwh(option.capacityKwh)} kWh ${tierLabel} battery option`}
                accessibilityState={{ selected }}
              >
                {selected ? <Text style={backupPlanStyles.selectedLabel}>SELECTED</Text> : null}
                <Text style={backupPlanStyles.optionTier}>{tierLabel}</Text>
                <Text style={backupPlanStyles.optionSize}>{option.quantity} × {formatBatteryCapacityKwh(unitCapacityKwh)} kWh</Text>
                <Text style={backupPlanStyles.optionBackupTime}>Total: {formatBatteryCapacityKwh(option.capacityKwh)} kWh</Text>
                <Text style={[backupPlanStyles.optionNote, option.commercialTier === 'recommended' && backupPlanStyles.optionNoteRecommended]}>
                  {option.statusLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={[backupPlanStyles.footer, { paddingBottom: 10 + safeBottom }]}>
        <Pressable style={backupPlanStyles.continueButton} onPress={onContinue}>
          <Text style={backupPlanStyles.continueText}>Continue</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
        <Pressable style={backupPlanStyles.recalculateButton} onPress={onPrevious}>
          <Text style={backupPlanStyles.recalculateText}>Recalculate</Text>
        </Pressable>
      </View>
      <ChatButton />
    </SafeAreaView>
  );
};

const backupPlanStyles = StyleSheet.create({
  emptySelection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 72
  },
  emptySelectionTitle: {
    color: '#172031',
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900'
  },
  emptySelectionText: {
    marginTop: 8,
    marginBottom: 20,
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700'
  },
  partialOptionList: {
    width: '100%',
    gap: 8,
    marginBottom: 16
  },
  partialOptionCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D9B7',
    backgroundColor: '#FFFDF7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  partialOptionName: {
    color: '#172031',
    fontSize: 11,
    fontWeight: '900'
  },
  partialOptionMeta: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700'
  },
  partialOptionCoverage: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '900'
  },
  noCoverageActions: {
    width: '100%',
    gap: 10
  },
  expertButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#F5A400',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  expertButtonText: {
    color: '#8A5B00',
    fontSize: 13,
    fontWeight: '900'
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 178,
    gap: 12
  },
  catalogNotice: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3D58A',
    backgroundColor: '#FFF9E8',
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  catalogNoticeText: {
    color: '#7A5A16',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700'
  },
  titleBlock: {
    alignItems: 'center',
    gap: 5
  },
  title: {
    color: '#172031',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2
  },
  subtitle: {
    color: '#8FA0B5',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  heroCard: {
    minHeight: 178,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(245,183,0,0.34)',
    backgroundColor: '#FFF9E9',
    padding: 16,
    shadowColor: '#B78A25',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  heroCopy: { flex: 1 },
  heroRecommendationLabel: {
    alignSelf: 'flex-start',
    color: '#15803D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  batteryValue: {
    color: '#1D293A',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 52
  },
  batteryUnit: {
    color: '#1D293A',
    fontSize: 22,
    fontWeight: '900'
  },
  batteryLabel: {
    marginTop: -2,
    color: '#46566C',
    fontSize: 13,
    fontWeight: '900'
  },
  imageWrap: {
    width: 106,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  batteryImage: {
    width: 96,
    height: 86
  },
  quantityBadge: {
    position: 'absolute',
    right: 1,
    top: 2,
    minWidth: 26,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172031',
    borderWidth: 1,
    borderColor: '#FFFFFF'
  },
  quantityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },
  batteryBrandFallback: {
    width: 88,
    height: 58
  },
  batteryBrandFallbackText: {
    color: '#172031',
    fontSize: 15,
    fontWeight: '900'
  },
  productLine: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,183,0,0.22)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  productCopy: {
    flex: 1,
    minWidth: 0
  },
  productBrand: {
    color: '#A27500',
    fontSize: 10,
    fontWeight: '900'
  },
  productModel: {
    marginTop: 2,
    color: '#172031',
    fontSize: 11,
    fontWeight: '900'
  },
  productQuantity: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800'
  },
  productPrice: {
    color: '#172031',
    fontSize: 10,
    fontWeight: '900'
  },
  statsRow: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,183,0,0.22)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statDivider: {
    width: 1,
    height: 54,
    backgroundColor: 'rgba(245,183,0,0.24)'
  },
  statLabel: {
    color: '#A27500',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 11
  },
  statValue: {
    marginTop: 4,
    color: '#172031',
    fontSize: 14,
    fontWeight: '900'
  },
  statSub: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center'
  },
  explanationText: {
    marginTop: 14,
    color: '#46566C',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  whyCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.66)',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3
  },
  whyTitle: {
    color: '#172031',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 2
  },
  whyText: {
    color: '#46566C',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700'
  },
  preliminaryDisclaimer: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center'
  },
  adjustTitle: {
    marginTop: -2,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900'
  },
  optionRow: {
    flexDirection: 'row',
    gap: 7
  },
  optionCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.95)',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionSelected: {
    borderWidth: 1.6,
    borderColor: '#F5A400',
    backgroundColor: '#FFFDF6'
  },
  selectedLabel: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 2
  },
  optionSize: {
    color: '#172031',
    fontSize: 13,
    fontWeight: '900'
  },
  optionBackupTime: {
    marginTop: 3,
    color: '#C48A00',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center'
  },
  optionTier: {
    marginTop: 2,
    color: '#A27500',
    fontSize: 10,
    fontWeight: '900'
  },
  optionNote: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 11,
    textAlign: 'center'
  },
  optionNoteRecommended: {
    color: '#16A34A',
    fontWeight: '900'
  },
  continueButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F5A400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C07A00',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3
  },
  continueText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900'
  },
  recalculateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22
  },
  recalculateText: {
    color: '#7C8BA0',
    fontSize: 10,
    fontWeight: '900'
  },
  basedText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800'
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.72)',
    backgroundColor: 'rgba(251,250,246,0.97)',
    gap: 7
  }
});

const recommendedStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 13,
    paddingTop: 0,
    paddingBottom: 178,
    gap: 10
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
    marginTop: -2
  },
  title: {
    color: '#172031',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.35,
    textAlign: 'center'
  },
  flash: {
    color: '#FF7A00'
  },
  subtitle: {
    color: '#6B7D93',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  systemCard: {
    minHeight: 116,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: 'rgba(245,183,0,0.34)',
    backgroundColor: '#FFF6E1',
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#B78A25',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  imagePane: {
    flex: 1.35,
    backgroundColor: '#FFF7E8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  systemImage: {
    width: '112%',
    height: '112%'
  },
  specPane: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    justifyContent: 'center'
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  specIcon: {
    width: 18,
    alignItems: 'center'
  },
  specValue: {
    color: '#172031',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16
  },
  specLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1
  },
  specDivider: {
    height: 1,
    backgroundColor: 'rgba(245,183,0,0.18)',
    marginVertical: 6
  },
  designedText: {
    textAlign: 'center',
    color: '#46566C',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1
  },
  exploreButton: {
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FF9D13',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C87500',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3
  },
  exploreText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900'
  },
  trustText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900'
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.72)',
    backgroundColor: 'rgba(251,250,246,0.97)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(74,99,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#4A63FF',
    fontSize: 14,
    fontWeight: '800'
  },
  primaryButton: {
    flex: 1.45,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F5B700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryButtonText: {
    color: '#18202D',
    fontSize: 14,
    fontWeight: '900'
  }
});

const flowStyles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8F5EE' },
  scroll: { flex: 1 },
  appbar: {
    paddingTop: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.88)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepText: { color: '#172031', fontSize: 15, fontWeight: '800' },
  progressRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 6
  },
  progressSegment: { flex: 1, height: 6, borderRadius: 999, backgroundColor: 'rgba(23,32,49,0.08)' },
  progressSegmentActive: { backgroundColor: '#F5B700' },
  systemFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.72)',
    backgroundColor: 'rgba(251,250,246,0.97)'
  },
  chatButton: {
    position: 'absolute',
    right: 16,
    bottom: 78,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#08213F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#08213F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5
  }
});

const roofStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 178, gap: 14 },
  heroCard: {
    minHeight: 144,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2
  },
  heroTitle: { color: '#46566C', fontSize: 16, fontWeight: '800' },
  heroValue: { marginTop: 10, color: '#F0B91B', fontSize: 40, fontWeight: '900', letterSpacing: -1.1 },
  heroCopy: { marginTop: 4, textAlign: 'center', color: '#6B7280', fontSize: 12, fontWeight: '900', lineHeight: 17 },
  metricCard: { minHeight: 90, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'center' },
  metricLabel: { color: '#A27500', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  metricValue: { marginTop: 6, color: '#1F2A3D', fontSize: 24, fontWeight: '900' },
  metricSub: { marginTop: 6, color: '#64748B', fontSize: 12, fontWeight: '500' },
  selectedPanelText: { marginTop: 8, color: '#475569', fontSize: 12, fontWeight: '800', lineHeight: 16 },
  wattageSelector: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  wattagePill: { minWidth: 50, minHeight: 30, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(226,221,213,0.9)', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7 },
  wattagePillSkeleton: { opacity: 0.55, backgroundColor: '#F5EFE4' },
  wattagePillActive: { backgroundColor: '#F5B700', borderColor: '#F5B700' },
  wattagePillText: { color: '#334155', fontSize: 11, fontWeight: '900' },
  wattagePillTextActive: { color: '#111827' },
  noWattageText: { flex: 1, color: '#64748B', fontSize: 11, fontWeight: '800', lineHeight: 16 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(218,211,203,0.72)', backgroundColor: 'rgba(251,250,246,0.97)', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(74,99,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#4A63FF', fontSize: 14, fontWeight: '800' },
  primaryButton: { flex: 1.45, minHeight: 48, borderRadius: 14, backgroundColor: '#F5B700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#18202D', fontSize: 14, fontWeight: '800' }
});

const batteryChoiceStyles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 96 },
  titleBlock: { alignItems: 'center', marginBottom: 14 },
  title: { color: '#172031', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { marginTop: 13, color: '#46566C', textAlign: 'center', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  heroImageCard: {
    height: 142,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,183,0,0.22)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  optionCard: { minHeight: 66, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  optionSelected: { borderWidth: 1.2, borderColor: 'rgba(245,183,0,0.5)', backgroundColor: '#FFF9EB' },
  checkIcon: { width: 44, height: 44, borderRadius: 999, backgroundColor: '#F6B91A', alignItems: 'center', justifyContent: 'center' },
  xIcon: { width: 44, height: 44, borderRadius: 999, backgroundColor: '#5D6674', alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1 },
  optionTitle: { color: '#172031', fontSize: 14, fontWeight: '900' },
  optionSub: { marginTop: 4, color: '#64748B', fontSize: 12, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#FFF0BC', paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#A27500', fontSize: 10, fontWeight: '900' },
  laterText: { marginTop: 12, textAlign: 'center', color: '#64748B', fontSize: 12, fontWeight: '800' }
});

const backupStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 116, gap: 7 },
  title: { color: '#172031', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { marginTop: 6, color: '#46566C', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 46, paddingRight: 20 },
  headerText: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  rows: { gap: 6 },
  rowCard: { minHeight: 50, borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowSelected: { borderWidth: 1.2, borderColor: 'rgba(245,183,0,0.45)', backgroundColor: '#FFF9EB' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: '#D8DEE8', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#F5B700', borderColor: '#F5B700' },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF3D8', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowName: { color: '#172031', fontSize: 11, fontWeight: '900' },
  rowWatts: { marginTop: 1, color: '#64748B', fontSize: 10, fontWeight: '800' },
  qtyPill: { width: 62, height: 27, borderRadius: 999, borderWidth: 1, borderColor: '#DEE5EF', backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  qtyButton: { color: '#94A3B8', fontSize: 14, fontWeight: '900' },
  qtyValue: { color: '#172031', fontSize: 11, fontWeight: '900' },
  qtyButtonPlus: { color: '#172031', fontSize: 13, fontWeight: '900' },
  hoursPill: { width: 52, height: 28, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,183,0,0.38)', backgroundColor: '#FFFDF5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  hoursPillDisabled: { opacity: 0.48 },
  hoursText: { color: '#172031', fontSize: 11, fontWeight: '900' },
  capacityCard: { minHeight: 58, borderRadius: 14, borderWidth: 1.2, borderColor: 'rgba(245,183,0,0.4)', backgroundColor: '#FFF9EB', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capacityTitle: { color: '#172031', fontSize: 13, fontWeight: '900' },
  capacitySub: { marginTop: 5, color: '#64748B', fontSize: 10, fontWeight: '800' },
  capacityValue: { color: '#D89100', fontSize: 22, fontWeight: '900' },
  detailsCard: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  detailsCardOpen: { gap: 12 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailsTitle: { color: '#172031', fontSize: 13, fontWeight: '900' },
  detailsAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailsActionText: { color: '#C48A00', fontSize: 11, fontWeight: '900' },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  detailsSheetTitle: { color: '#172031', fontSize: 18, lineHeight: 22, fontWeight: '900' },
  detailsSheetSubtitle: { marginTop: 6, color: '#64748B', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  detailsScroll: { flexShrink: 1 },
  detailsBody: { marginTop: 14, gap: 9 },
  emptyDetails: { color: '#64748B', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  calcSection: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(243,210,122,0.5)', backgroundColor: '#FFFDF8', padding: 10 },
  calcSectionTitle: { color: '#172031', fontSize: 13, fontWeight: '900' },
  calcSectionFormula: { marginTop: 2, marginBottom: 8, color: '#64748B', fontSize: 11, lineHeight: 15, fontWeight: '700' },
  calcRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calcIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#FFF3D8', alignItems: 'center', justifyContent: 'center' },
  calcCopy: { flex: 1, minWidth: 0 },
  calcName: { color: '#172031', fontSize: 11, fontWeight: '900' },
  calcFormula: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '700' },
  calcValue: { color: '#172031', fontSize: 11, fontWeight: '900' },
  calcDivider: { height: 1, backgroundColor: '#EEF0F2', marginVertical: 8 },
  totalRow: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(243,210,122,0.5)', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  totalCopy: { flex: 1, minWidth: 0 },
  totalLabel: { flex: 1, color: '#172031', fontSize: 11, fontWeight: '900' },
  totalHelper: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '700' },
  totalValues: { alignItems: 'flex-end' },
  totalWh: { color: '#334155', fontSize: 11, fontWeight: '900' },
  totalValue: { color: '#334155', fontSize: 12, fontWeight: '900', textAlign: 'right' },
  totalKwh: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '800' },
  totalHighlight: { color: '#D89100' },
  addOther: { height: 34, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5 },
  addOtherText: { color: '#C48A00', fontSize: 12, fontWeight: '900' },
  extraPanel: { borderRadius: 14, backgroundColor: '#FFFFFF', padding: 10, gap: 7 },
  extraRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  extraName: { color: '#172031', fontSize: 12, fontWeight: '900' },
  extraWatts: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '700' },
  extraAdd: { minWidth: 58, height: 28, borderRadius: 999, backgroundColor: '#F5B700', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  extraAdded: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0' },
  extraAddText: { color: '#172031', fontSize: 11, fontWeight: '900' },
  extraAddedText: { color: '#15803D' },
  validationText: { alignSelf: 'center', color: '#DC2626', fontSize: 11, fontWeight: '800' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(218,211,203,0.72)', backgroundColor: 'rgba(251,250,246,0.97)', flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(74,99,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#4A63FF', fontSize: 14, fontWeight: '800' },
  primaryButton: { flex: 1.45, minHeight: 48, borderRadius: 14, backgroundColor: '#F5B700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: '#18202D', fontSize: 14, fontWeight: '800' }
});

const solarStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F8F5EE'
  },
  appbar: {
    paddingTop: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.88)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2
  },
  stepText: {
    color: '#172031',
    fontSize: 15,
    fontWeight: '800'
  },
  progressRow: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 6
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(23,32,49,0.08)'
  },
  progressSegmentActive: {
    backgroundColor: '#F5B700'
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 178,
    gap: 11
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2
  },
  title: {
    color: '#1F2A3D',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.45
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  recommendCard: {
    minHeight: 124,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(245,166,35,0.28)',
    backgroundColor: '#FFF9E9',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C48A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 1
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22
  },
  roundControl: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.32)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  roundControlDisabled: {
    opacity: 0.45
  },
  roundControlText: {
    color: '#C8A969',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '400'
  },
  roundControlPlus: {
    color: '#C48A00'
  },
  sizeCenter: {
    alignItems: 'center',
    minWidth: 92
  },
  sizeText: {
    color: '#1E293B',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 58,
    letterSpacing: -1.7
  },
  sizeUnit: {
    fontSize: 28,
    letterSpacing: -1
  },
  sizeLabel: {
    marginTop: -4,
    color: '#617189',
    fontSize: 12,
    fontWeight: '800'
  },
  recommendedText: {
    marginTop: 6,
    color: '#8F6500',
    fontSize: 12,
    fontWeight: '900'
  },
  adjustText: {
    marginTop: 5,
    color: '#617189',
    fontSize: 10,
    fontWeight: '700'
  },
  insightRow: {
    flexDirection: 'row',
    gap: 7
  },
  insightCard: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1
  },
  insightIcon: {
    color: '#D18C00',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3
  },
  insightText: {
    color: '#1F2A3D',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800'
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,222,208,0.82)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8
  },
  chartTitleWrap: {
    flex: 1
  },
  chartTitle: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '900'
  },
  chartSubtitle: {
    marginTop: 6,
    color: '#667085',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600'
  },
  toggle: {
    height: 30,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3
  },
  toggleActive: {
    height: 24,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleActiveText: {
    color: '#101828',
    fontSize: 10,
    fontWeight: '900'
  },
  toggleInactiveText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10
  },
  productionChartWrap: {
    position: 'relative',
    height: 184
  },
  productionPointTouchTarget: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245,164,0,0.001)',
    zIndex: 2
  },
  productionTooltip: {
    position: 'absolute',
    zIndex: 5,
    elevation: 8,
    overflow: 'visible',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBC46C',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8
  },
  productionTooltipArrow: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EBC46C',
    transform: [{ rotate: '45deg' }]
  },
  productionTooltipTime: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 11,
    fontWeight: '800'
  },
  productionTooltipValue: {
    marginTop: 1,
    color: '#101828',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900'
  },
  chartNote: {
    marginTop: 2,
    color: '#667085',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    paddingHorizontal: 4
  },
  runningLoad: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  runningLoadStrong: {
    color: '#1F2A3D',
    fontWeight: '900'
  },
  recalculateButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226,221,213,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  recalculateText: {
    color: '#253247',
    fontSize: 12,
    fontWeight: '900'
  },
  chatButton: {
    position: 'absolute',
    right: 16,
    bottom: 78,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#08213F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#08213F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.72)',
    backgroundColor: 'rgba(251,250,246,0.97)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,99,255,0.14)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#4A63FF',
    fontSize: 14,
    fontWeight: '800'
  },
  primaryButton: {
    flex: 1.45,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F5B700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F2B705',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 4
  },
  primaryButtonText: {
    color: '#18202D',
    fontSize: 14,
    fontWeight: '800'
  }
});

const applianceStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F6F1E9'
  },
  topbar: {
    height: 48,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topIconButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,221,213,0.78)',
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  topTitle: {
    color: '#172031',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2
  },
  appbar: {
    paddingTop: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.88)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2
  },
  stepText: {
    color: '#172031',
    fontSize: 15,
    fontWeight: '800'
  },
  progressRow: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 6
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(23,32,49,0.08)'
  },
  progressSegmentActive: {
    backgroundColor: '#F5B700'
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 178,
    gap: 10
  },
  questionBlock: {
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingBottom: 2
  },
  question: {
    maxWidth: 260,
    color: '#10213A',
    textAlign: 'left',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 23,
    letterSpacing: -0.55
  },
  questionAccent: {
    color: '#E3A900'
  },
  questionSub: {
    marginTop: 7,
    color: '#64748B',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: '800'
  },
  section: {
    gap: 0
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#FFFFFF'
  },
  sectionCard: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingBottom: 7,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(226,221,213,0.75)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  card: {
    minHeight: 55,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  backupCard: {
    minHeight: 62,
    maxHeight: 68,
    gap: 7
  },
  cardDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,221,213,0.72)'
  },
  cardSelected: {
    backgroundColor: '#FFFFFF'
  },
  cardIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: '#FFF4D8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardIconSelected: {
    backgroundColor: 'rgba(245,166,35,0.2)'
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1
  },
  backupCardCopy: {
    flexShrink: 1
  },
  cardTitle: {
    color: '#10213A',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 13
  },
  cardWatts: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800'
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backupStepper: {
    gap: 7
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226,221,213,0.92)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14
  },
  stepperButtonDisabled: {
    color: '#CBD5E1'
  },
  stepperPlusButton: {
    backgroundColor: '#FFE071',
    borderColor: '#FFE071'
  },
  stepperButtonPlus: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14
  },
  stepperValue: {
    minWidth: 10,
    color: '#10213A',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900'
  },
  hoursPill: {
    width: 46,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,183,0,0.42)',
    backgroundColor: '#FFF9E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2
  },
  hoursPillDisabled: {
    opacity: 0.42
  },
  hoursText: {
    color: '#172031',
    fontSize: 10,
    fontWeight: '900'
  },
  hoursBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.18)',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  hoursMenu: {
    width: 82,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    padding: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6
  },
  hoursOption: {
    height: 31,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hoursOptionSelected: {
    backgroundColor: '#FFF1B8'
  },
  hoursOptionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900'
  },
  hoursOptionTextSelected: {
    color: '#10213A'
  },
  addOtherButton: {
    minHeight: 36,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(203,190,173,0.95)',
    backgroundColor: 'rgba(255,255,255,0.52)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addOtherText: {
    color: '#172031',
    fontSize: 10,
    fontWeight: '900'
  },
  addOtherPlus: {
    fontWeight: '900'
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.72)',
    backgroundColor: 'rgba(251,250,246,0.98)',
    gap: 5
  },
  backupSummaryCard: {
    borderRadius: 16,
    backgroundColor: '#FFF7DF',
    borderWidth: 1,
    borderColor: '#F3D27A',
    paddingHorizontal: 11,
    paddingVertical: 10,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  backupSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  backupSummaryTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  backupSummaryIcon: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: '#F5B700',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backupSummaryTitle: {
    flex: 1,
    color: '#10213A',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900'
  },
  backupSummaryBadge: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D27A',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  backupSummaryBadgeText: {
    color: '#A66F00',
    fontSize: 10,
    fontWeight: '900'
  },
  backupSummaryGrid: {
    marginTop: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  backupSummaryMetric: {
    width: '48.8%',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(243,210,122,0.48)',
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  backupSummaryMetricCopy: {
    flex: 1,
    minWidth: 0
  },
  backupSummaryLabel: {
    color: '#7A5A10',
    fontSize: 10,
    fontWeight: '800'
  },
  backupSummaryValue: {
    marginTop: 3,
    color: '#10213A',
    fontSize: 10,
    fontWeight: '900'
  },
  backupSummaryHelper: {
    marginTop: 7,
    color: '#64748B',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700'
  },
  backupSummaryHint: {
    textAlign: 'center',
    color: '#7A5A10',
    fontSize: 10,
    fontWeight: '800'
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 74,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.72)',
    backgroundColor: 'rgba(251,250,246,0.97)',
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,99,255,0.14)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#4A63FF',
    fontSize: 14,
    fontWeight: '800'
  },
  primaryButton: {
    minHeight: 51,
    borderRadius: 12,
    backgroundColor: '#F5B700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F2B705',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 4
  },
  primaryButtonDisabled: {
    opacity: 0.55
  },
  primaryButtonText: {
    color: '#18202D',
    fontSize: 11,
    fontWeight: '900'
  },
  validationText: {
    color: '#C2410C',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800'
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.36)'
  },
  bottomSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginBottom: 12
  },
  sheetTitle: {
    color: '#172031',
    fontSize: 18,
    fontWeight: '900'
  },
  sheetSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  sheetList: {
    marginTop: 14,
    gap: 8
  },
  sheetRow: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(226,221,213,0.82)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sheetRowName: {
    color: '#172031',
    fontSize: 14,
    fontWeight: '800'
  },
  sheetRowWatts: {
    marginTop: 2,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700'
  },
  sheetAddButton: {
    minWidth: 64,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#F5B700',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  sheetAddButtonAdded: {
    backgroundColor: '#E8F7EC'
  },
  sheetAddText: {
    color: '#172031',
    fontSize: 12,
    fontWeight: '900'
  },
  sheetAddTextAdded: {
    color: '#168044'
  }
});
