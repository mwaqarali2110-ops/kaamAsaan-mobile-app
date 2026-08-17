import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, BatteryCharging, CalendarDays, Home, PanelsTopLeft, ShieldCheck, Sun, Wrench, Zap } from 'lucide-react-native';
import { SafeImage } from '@/components/ui/SafeImage';
import { PromoCodeCard } from '@/components/promo/PromoCodeCard';
import { SafeBottomActionBar, getFixedFooterContentPadding } from '@/components/ui/SafeAreaLayout';
import { usePackageCompatibility, usePackageInventory } from '@/hooks/useProducts';
import { useRecommendationConfiguration } from '@/hooks/useRecommendationConfiguration';
import { useSystemStore } from '@/store/useSystemStore';
import { calculateRoofSpace } from '@/utils/calculations';
import { formatKw, formatPkr } from '@/utils/formatters';
import { buildPackagePromoContext, promoContextSignature } from '@/utils/promo';
import {
  generateRecommendedPackages,
  getProductBrandName,
  getProductWatt,
  getRecommendedPackageById
} from '@/utils/packageBuilder';
import { getBatteryProductDisplayName } from '@/utils/batteryRecommendation';
import {
  commercialRuleRecommendationStrategy,
  DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
} from '@/utils/commercialRecommendation';

const panelFallback = require('../../../assets/home/solar-panels.jpg');
const inverterFallback = require('../../../assets/home/inverter.jpg');
const batteryFallback = require('../../../assets/home/battery.webp');

const productTitle = (brand: string, name: string) => {
  const normalizedName = name.trim().toLowerCase();
  return normalizedName.startsWith(brand.trim().toLowerCase()) ? name : `${brand} ${name}`;
};

const formatQuantity = (quantity: number, label: string) =>
  quantity > 1 ? `${quantity} x ${label}` : label;

export const SystemSummaryScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const recommendedSolarKw = useSystemStore((state) => state.recommendedSolarKw);
  const selectedBatteryKwh = useSystemStore((state) => state.selectedBatteryKwh);
  const batteryRecommendationRequirementKwh = useSystemStore((state) => state.batteryRecommendationRequirementKwh);
  const backupDecision = useSystemStore((state) => state.backupDecision);
  const panelWattage = useSystemStore((state) => state.panelWattage);
  const selectedRecommendedPackageId = useSystemStore((state) => state.selectedRecommendedPackageId);
  const storedSelectedRecommendedPackage = useSystemStore((state) => state.selectedRecommendedPackage);
  const setRecommendedPackages = useSystemStore((state) => state.setRecommendedPackages);
  const setSelectedRecommendedPackage = useSystemStore((state) => state.setSelectedRecommendedPackage);
  const clearSelectedRecommendedPackage = useSystemStore((state) => state.clearSelectedRecommendedPackage);
  const startBooking = useSystemStore((state) => state.startBooking);
  const promo = useSystemStore((state) => state.promo);
  const setPromoInput = useSystemStore((state) => state.setPromoInput);
  const applyPromo = useSystemStore((state) => state.applyPromo);
  const syncPromoContext = useSystemStore((state) => state.syncPromoContext);
  const removePromo = useSystemStore((state) => state.removePromo);
  const productsQuery = usePackageInventory();
  const compatibilityQuery = usePackageCompatibility();
  const recommendationConfigurationQuery = useRecommendationConfiguration();
  const backupAppliances = useSystemStore((state) => state.backupAppliances);
  const selectedBatteryConfiguration = useSystemStore((state) => state.selectedBatteryConfiguration);
  const routePackageId = route?.params?.packageId ?? null;
  const hasRequestedPackage = Boolean(selectedRecommendedPackageId || routePackageId);
  const recommendationConfiguration = recommendationConfigurationQuery.data ?? DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION;
  const commercialRecommendation = useMemo(() => commercialRuleRecommendationStrategy.recommend({
    appliances: backupAppliances ?? [],
    products: productsQuery.data ?? [],
    selectedPanelWattage: Number(panelWattage) || null,
    configuration: recommendationConfiguration,
  }), [backupAppliances, panelWattage, productsQuery.data, recommendationConfiguration]);
  const requiredBatteryKwh = backupDecision === 'yes'
    ? Number((selectedBatteryConfiguration?.capacityKwh ?? batteryRecommendationRequirementKwh ?? selectedBatteryKwh) || 0)
    : 0;
  // Keep PV/inverter sizing and expert review on the Recommended-bank baseline;
  // the customer-selected tier changes only the package battery target.
  const systemTargets = commercialRecommendation.systemTargets;
  const requiredSolarKw = systemTargets.targetPvKwp ?? Math.max(1, Number(recommendedSolarKw || 3));
  const requiredInverterKw = systemTargets.targetInverterKw ?? (requiredSolarKw > 0 ? Math.max(3, Math.ceil(requiredSolarKw)) : 0);

  const recommendedPackages = useMemo(
    () => generateRecommendedPackages({
      requiredPanelKw: requiredSolarKw,
      requiredInverterKw,
      requiredBatteryKwh,
      requiredBackupEnergyKwh: commercialRecommendation.requiredBackupEnergyKwh,
      batteryUsableFactor: recommendationConfiguration.settings.batteryUsableFactor,
      preliminaryDisclaimer: recommendationConfiguration.settings.preliminaryRecommendationDisclaimer,
      configuredInstallationCost: recommendationConfiguration.settings.configuredInstallationCost,
      configuredStructureCost: recommendationConfiguration.settings.configuredStructureCost,
      configuredAccessoriesCost: recommendationConfiguration.settings.configuredAccessoriesCost,
      acceptableBatteryShortfallPercent: recommendationConfiguration.settings.acceptableBatteryShortfallPercent,
      selectedBatteryTier: selectedBatteryConfiguration?.commercialTier,
      products: productsQuery.data ?? [],
      compatibilityRules: compatibilityQuery.data ?? [],
      selectedPanelWattage: Number(panelWattage) || undefined
    }),
    [
      compatibilityQuery.data,
      panelWattage,
      productsQuery.data,
      commercialRecommendation.requiredBackupEnergyKwh,
      recommendationConfiguration.settings,
      requiredBatteryKwh,
      requiredInverterKw,
      requiredSolarKw,
      selectedBatteryConfiguration?.commercialTier
    ]
  );

  const selectedPackage = useMemo(
    () => {
      const generatedSelection = getRecommendedPackageById(recommendedPackages, selectedRecommendedPackageId) ??
        getRecommendedPackageById(recommendedPackages, routePackageId);
      const storedSelectionMatches = Boolean(
        storedSelectedRecommendedPackage &&
        generatedSelection &&
        storedSelectedRecommendedPackage.id === generatedSelection.id &&
        (storedSelectedRecommendedPackage.id === selectedRecommendedPackageId || storedSelectedRecommendedPackage.id === routePackageId)
      );
      return storedSelectionMatches ? storedSelectedRecommendedPackage : generatedSelection;
    },
    [recommendedPackages, routePackageId, selectedRecommendedPackageId, storedSelectedRecommendedPackage]
  );
  const isLoading = productsQuery.isLoading || compatibilityQuery.isLoading || recommendationConfigurationQuery.isLoading;
  const promoContext = useMemo(() => buildPackagePromoContext(selectedPackage), [selectedPackage]);
  const currentPromoContextSignature = useMemo(
    () => promoContext ? promoContextSignature(promoContext) : null,
    [promoContext]
  );
  const hasCurrentAppliedPromo = Boolean(
    promoContext && promo.status === 'applied' && promo.appliedPackageId === promoContext.packageId &&
    promo.appliedContextSignature === currentPromoContextSignature
  );
  const displayPromo = promoContext && promo.status === 'applied' && !hasCurrentAppliedPromo
    ? {
        ...promo,
        status: 'loading' as const,
        message: 'Revalidating promo code...',
        discountAmount: 0,
        originalTotal: promoContext.originalTotal,
        finalTotal: promoContext.originalTotal,
      }
    : promo;
  const isPromoBusy = promo.status === 'loading' || (promo.status === 'applied' && !hasCurrentAppliedPromo);

  useEffect(() => {
    if (isLoading || productsQuery.isError || compatibilityQuery.isError) return;
    setRecommendedPackages(recommendedPackages);

    if (!hasRequestedPackage) return;
    if (selectedPackage) {
      setSelectedRecommendedPackage(selectedPackage);
      return;
    }

    // Only redirect while this screen is actually the active one. After a survey
    // is booked this screen still sits in the stack, and firing a navigation
    // action from it while it is unfocused/being popped corrupts the stack.
    if (!isFocused) return;

    clearSelectedRecommendedPackage();
    navigation.replace('DesignFlow', {
      screen: 'packages',
      packageNotice: 'This package is no longer available. Please select another package.'
    });
  }, [
    clearSelectedRecommendedPackage,
    isFocused,
    isLoading,
    navigation,
    compatibilityQuery.isError,
    productsQuery.isError,
    recommendedPackages,
    hasRequestedPackage,
    selectedPackage,
    setRecommendedPackages,
    setSelectedRecommendedPackage
  ]);

  useEffect(() => {
    if (!promoContext || isLoading) return;
    void syncPromoContext(promoContext);
  }, [
    isLoading,
    promo.appliedCode,
    promo.appliedContextSignature,
    promo.appliedPackageId,
    promo.status,
    promoContext,
    syncPromoContext
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.stateContainer}>
          <ActivityIndicator color="#F5A400" size="large" />
          <Text style={styles.stateTitle}>Loading your selected package...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedPackage) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={[styles.topBar, styles.standaloneTopBar]}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <ArrowLeft color="#10213A" size={22} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.title}>System Summary</Text>
          <View style={styles.iconButtonPlaceholder} />
        </View>
        <View style={styles.stateContainer}>
          <View style={styles.emptyIcon}>
            <PanelsTopLeft color="#D99A00" size={30} strokeWidth={2.2} />
          </View>
          <Text style={styles.stateTitle}>No package selected</Text>
          <Text style={styles.stateText}>Please return and select a recommended package.</Text>
          <Pressable
            style={styles.chooseButton}
            onPress={() => navigation.replace('DesignFlow', { screen: 'packages' })}
          >
            <Text style={styles.chooseButtonText}>Choose a Package</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const panelBrand = getProductBrandName(selectedPackage.panel);
  const panelWatt = Math.round(getProductWatt(selectedPackage.panel));
  const systemSizeKw = selectedPackage.totalSolarKw ||
    ((selectedPackage.panelQuantity * panelWatt) / 1000);
  const panelCount = selectedPackage.panelQuantity;
  const roofArea = calculateRoofSpace(panelCount).areaSqFt;
  const inverterBrand = getProductBrandName(selectedPackage.inverter.product);
  const batteryProduct = selectedPackage.battery?.product;
  const batteryBrand = batteryProduct ? getProductBrandName(batteryProduct) : '';

  const components = [
    {
      key: 'panels',
      label: 'Solar Panels',
      name: `${selectedPackage.panelQuantity} x ${panelBrand} ${panelWatt}W`,
      detail: selectedPackage.panel.name,
      price: formatPkr(selectedPackage.panelsPrice),
      image: selectedPackage.panel.image,
      fallback: panelFallback,
      Icon: Sun,
      tint: '#FFF7E8'
    },
    {
      key: 'inverter',
      label: 'Inverter',
      name: formatQuantity(selectedPackage.inverterQuantity, productTitle(inverterBrand, selectedPackage.inverter.product.name)),
      detail: `${formatKw(selectedPackage.inverter.size)} total capacity`,
      price: formatPkr(selectedPackage.inverterPrice),
      image: selectedPackage.inverter.product.image,
      fallback: inverterFallback,
      Icon: Zap,
      tint: '#EFF6FF'
    },
    ...(batteryProduct ? [{
      key: 'battery',
      label: 'Battery Backup',
      name: formatQuantity(
        selectedPackage.batteryQuantity,
        productTitle(batteryBrand, getBatteryProductDisplayName(batteryProduct))
      ),
      detail: `${selectedPackage.totalBatteryKwh} kWh total capacity`,
      price: formatPkr(selectedPackage.batteryPrice),
      image: batteryProduct.image,
      fallback: batteryFallback,
      Icon: BatteryCharging,
      tint: '#F0FDF4'
    }] : []),
    {
      key: 'installation',
      label: selectedPackage.installation.title,
      name: selectedPackage.installation.included ? 'Included' : 'Not included',
      detail: selectedPackage.installation.included ? 'Structure and professional installation' : 'Quoted separately',
      price: selectedPackage.installation.price > 0
        ? formatPkr(selectedPackage.installation.price)
        : 'Included',
      Icon: Wrench,
      tint: '#FFF7ED'
    }
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getFixedFooterContentPadding(68, insets.bottom) }
        ]}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <ArrowLeft color="#10213A" size={22} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.title}>System Summary</Text>
          <View style={styles.iconButtonPlaceholder} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>System Size</Text>
            <Text style={styles.systemSize}>{formatKw(systemSizeKw)}</Text>
            <View style={styles.compatBadge}>
              <ShieldCheck color="#0F8F54" size={16} strokeWidth={2.2} />
              <Text style={styles.compatText}>
                {selectedPackage.compatibilityStatus === 'compatible' ? 'Compatible' : 'Check compatibility'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumnRight}>
            <Text style={styles.summaryLabel}>Total Estimated Cost</Text>
            <Text style={styles.costValue}>
              {formatPkr(hasCurrentAppliedPromo
                ? promo.finalTotal
                : selectedPackage.totalPrice)}
            </Text>
            <Text style={styles.costSub}>{selectedPackage.packageName}</Text>
            <View style={styles.watermark}>
              <Sun color="#F5D482" size={22} strokeWidth={1.8} />
              <Home color="#E8D9BE" size={48} strokeWidth={1.5} />
            </View>
          </View>
        </View>

        <View style={styles.preliminaryNote}>
          <ShieldCheck color="#9A6B00" size={16} strokeWidth={2.2} />
          <Text style={styles.preliminaryNoteText}>{selectedPackage.preliminaryDisclaimer}</Text>
        </View>

        {promoContext ? (
          <PromoCodeCard
            promo={displayPromo}
            onChangeCode={setPromoInput}
            onApply={() => {
              void applyPromo(promoContext);
            }}
            onRemove={() => removePromo(promoContext.originalTotal)}
          />
        ) : null}

        <Text style={[styles.sectionTitle, promoContext && styles.sectionTitleAfterPromo]}>System Components</Text>
        <View style={styles.componentsCard}>
          {components.map((item, index) => (
            <View
              key={item.key}
              style={[styles.componentRow, index === components.length - 1 && styles.componentRowLast]}
            >
              <View style={[styles.productImageBox, { backgroundColor: item.tint }]}>
                {'image' in item && item.image ? (
                  <SafeImage
                    source={{ uri: item.image }}
                    fallbackSource={item.fallback}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <item.Icon color="#7C8794" size={30} strokeWidth={1.9} />
                )}
              </View>
              <View style={styles.componentCopy}>
                <Text style={styles.componentLabel}>{item.label}</Text>
                <Text style={styles.componentName}>{item.name}</Text>
                <Text style={styles.componentDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.componentPrice}>{item.price}</Text>
            </View>
          ))}
        </View>

        {!batteryProduct ? (
          <View style={styles.batteryNote}>
            <BatteryCharging color="#64748B" size={18} strokeWidth={2.1} />
            <Text style={styles.batteryNoteText}>Battery backup not included</Text>
          </View>
        ) : null}

        <View style={styles.compatibilityCard}>
          <View style={styles.compatibilityIcon}>
            <ShieldCheck color="#0F8F54" size={28} strokeWidth={2.2} />
          </View>
          <View style={styles.compatibilityCopy}>
            <Text style={styles.compatibilityTitle}>Compatible package</Text>
            <Text style={styles.compatibilityText}>
              {panelCount} panels require approximately {Math.round(roofArea)} sq ft of roof area.
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeBottomActionBar style={styles.footer}>
        <Pressable
          style={[styles.bookButton, isPromoBusy && styles.bookButtonDisabled]}
          disabled={isPromoBusy}
          onPress={() => {
            startBooking('solar_package');
            navigation.navigate('BookSurvey', { packageId: selectedPackage.id, bookingContext: 'solar_package' });
          }}
          accessibilityRole="button"
          accessibilityLabel="Book free survey"
          accessibilityState={{ disabled: isPromoBusy }}
        >
          <CalendarDays color="#FFFFFF" size={22} strokeWidth={2.3} />
          <Text style={styles.bookButtonText}>Book Free Survey</Text>
        </Pressable>
      </SafeBottomActionBar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  content: { paddingHorizontal: 16, paddingTop: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  standaloneTopBar: { marginHorizontal: 16, marginTop: 14 },
  iconButton: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,217,190,0.72)', elevation: 2 },
  iconButtonPlaceholder: { width: 48, height: 48 },
  title: { flex: 1, color: '#10213A', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  summaryCard: { minHeight: 145, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.75)', flexDirection: 'row', padding: 18, overflow: 'hidden', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  summaryColumn: { flex: 1, justifyContent: 'center' },
  summaryColumnRight: { flex: 1.22, justifyContent: 'center', paddingLeft: 17 },
  summaryDivider: { width: 1, marginVertical: 14, backgroundColor: '#E7E2DA' },
  summaryLabel: { color: '#64748B', fontSize: 13, fontWeight: '800' },
  systemSize: { color: '#10213A', fontSize: 32, fontWeight: '900', marginTop: 7 },
  compatBadge: { marginTop: 17, alignSelf: 'flex-start', borderRadius: 12, backgroundColor: '#EEF7EA', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 7 },
  compatText: { color: '#0F8F54', fontSize: 11, fontWeight: '900' },
  costValue: { color: '#10213A', fontSize: 20, fontWeight: '900', marginTop: 12 },
  costSub: { color: '#64748B', fontSize: 11, lineHeight: 14, fontWeight: '700', marginTop: 6, paddingRight: 20 },
  watermark: { position: 'absolute', right: 2, bottom: -6, flexDirection: 'row', alignItems: 'flex-end', opacity: 0.55, gap: 4 },
  preliminaryNote: { marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F2D88C', backgroundColor: '#FFFAE8', flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12 },
  preliminaryNoteText: { flex: 1, color: '#6F540B', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  sectionTitle: { color: '#10213A', fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 12 },
  sectionTitleAfterPromo: { marginTop: 0 },
  componentsCard: { borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.75)', paddingHorizontal: 14, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 2 },
  componentRow: { minHeight: 98, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF0F2', gap: 11, paddingVertical: 10 },
  componentRowLast: { borderBottomWidth: 0 },
  productImageBox: { width: 60, height: 60, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productImage: { width: 56, height: 56 },
  componentCopy: { flex: 1, minWidth: 0 },
  componentLabel: { color: '#64748B', fontSize: 12, fontWeight: '800' },
  componentName: { color: '#10213A', fontSize: 14, lineHeight: 17, fontWeight: '900', marginTop: 4 },
  componentDetail: { color: '#64748B', fontSize: 11, lineHeight: 14, fontWeight: '700', marginTop: 3 },
  componentPrice: { maxWidth: 82, color: '#10213A', fontSize: 12, lineHeight: 15, textAlign: 'right', fontWeight: '900' },
  batteryNote: { marginTop: 14, borderRadius: 14, backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12 },
  batteryNoteText: { color: '#64748B', fontSize: 12, fontWeight: '800' },
  compatibilityCard: { marginTop: 18, borderRadius: 20, borderWidth: 1, borderColor: '#D6EFD6', backgroundColor: '#F4FBF1', flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 },
  compatibilityIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  compatibilityCopy: { flex: 1 },
  compatibilityTitle: { color: '#0F8F54', fontSize: 15, fontWeight: '900' },
  compatibilityText: { color: '#64748B', fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FBF8F1', borderTopWidth: 1, borderTopColor: 'rgba(232,217,190,0.82)' },
  bookButton: { height: 58, borderRadius: 18, backgroundColor: '#071D35', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#071D35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 4 },
  bookButtonDisabled: { opacity: 0.65 },
  bookButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  emptyIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: '#FFF3C4', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: '#10213A', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  stateText: { color: '#64748B', fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  chooseButton: { minWidth: 180, height: 50, borderRadius: 16, backgroundColor: '#F5B400', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  chooseButtonText: { color: '#10213A', fontSize: 14, fontWeight: '900' }
});
