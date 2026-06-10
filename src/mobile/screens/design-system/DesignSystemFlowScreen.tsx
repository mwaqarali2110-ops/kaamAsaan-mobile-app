import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AirVent, Award, BatteryCharging, Check, ChevronDown, Grid3X3, Headphones, Refrigerator, ArrowLeft, ArrowRight, Fan, Lightbulb, MessageCircle, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Sun, WalletCards, X, Zap } from 'lucide-react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { MySystemCard } from '@/components/ui/MySystemCard';
import { InfoCard } from '@/components/cards/InfoCard';
import { PanelLayoutPreview } from '@/components/solar-tools/PanelLayoutPreview';
import { useProducts } from '@/hooks/useProducts';
import { useSystemStore } from '@/store/useSystemStore';
import { calculateLoadKw, calculatePanelCount, calculateRoofSpace } from '@/utils/calculations';
import { formatKw, formatPkr } from '@/utils/formatters';
import type { Product } from '@/types/product.types';
import { buildRecommendedPackages, findBestPanelByWattage, getAvailablePanelWattages, getProductWatt, isOutOfStock, type RecommendedPackage } from '@/utils/packageBuilder';

const steps = ['appliances', 'solar', 'roof', 'backupNeed', 'backupAppliances', 'backupPlan', 'recommended', 'packages'] as const;
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

const batteryImage = require('../../../assets/home/battery.webp');
const batteryBackupHeroImage = require('../../../assets/design-system/battery-backup-screen.png');
const recommendedSystemImage = require('../../../assets/design-system/recommended-system.png');

export const DesignSystemFlowScreen = ({ navigation, route }: any) => {
  const initialStep = steps.includes(route?.params?.screen) ? route.params.screen : 'appliances';
  const [step, setStep] = useState<Step>(initialStep);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const store = useSystemStore();
  const panelCount = calculatePanelCount(store.recommendedSolarKw, store.panelWattage);
  const roof = calculateRoofSpace(panelCount);
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
      store.calculateRecommendation();
      setStep('solar');
    } else if (step === 'solar') {
      store.setRecommendedSolarKw(Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3)))));
      setStep('roof');
    }
    else if (step === 'roof') setStep('backupNeed');
    else if (step === 'backupNeed') setStep(store.backupDecision === 'yes' ? 'backupAppliances' : 'recommended');
    else if (step === 'backupAppliances') setStep('backupPlan');
    else if (step === 'backupPlan') setStep('recommended');
    else if (step === 'recommended') setStep('packages');
    else navigation.navigate('SystemSummary');
  };

  if (step === 'appliances') {
    return <ApplianceStepScreen navigation={navigation} store={store} onContinue={next} />;
  }

  if (step === 'solar') {
    return (
      <SolarRecommendationStepScreen
        navigation={navigation}
        store={store}
        onPrevious={() => setStep('appliances')}
        onContinue={next}
      />
    );
  }

  if (step === 'roof') {
    return <RoofSpaceStepScreen store={store} onPrevious={() => setStep('solar')} onContinue={next} />;
  }

  if (step === 'backupNeed') {
    return (
      <BatteryChoiceStepScreen
        store={store}
        onPrevious={() => setStep('roof')}
        onYes={() => setStep('backupAppliances')}
        onNo={() => setStep('recommended')}
      />
    );
  }

  if (step === 'backupAppliances') {
    return <BackupAppliancesStepScreen store={store} onPrevious={() => setStep('backupNeed')} onContinue={next} />;
  }

  if (step === 'backupPlan') {
    return <BackupPlanStepScreen store={store} onPrevious={() => setStep('backupAppliances')} onContinue={next} />;
  }

  if (step === 'recommended') {
    return (
      <RecommendedSystemStepScreen
        solarKw={store.recommendedSolarKw}
        batteryKwh={backupKwh}
        onPrevious={() => setStep(store.backupDecision === 'yes' ? 'backupPlan' : 'backupNeed')}
        onContinue={() => setStep('packages')}
      />
    );
  }

  if (step === 'packages') {
    return (
      <RecommendedPackagesStepScreen
        store={store}
        selectedPackage={store.packageName}
        onSelectPackage={store.setPackageName}
        onBack={() => setStep('recommended')}
        onReviewSystem={next}
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
  selectedPackage,
  onSelectPackage,
  onBack,
  onReviewSystem
}: {
  store: any;
  selectedPackage: string;
  onSelectPackage: (name: string) => void;
  onBack: () => void;
  onReviewSystem: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'lowCost'>('recommended');
  const productsQuery = useProducts();
  const allProducts = productsQuery.data ?? [];
  const requiredSolarKw = Math.max(1, Number(store.recommendedSolarKw || 3));
  const requiredInverterKw = getInverterSizeKw(requiredSolarKw);
  const requiredBatteryKwh = Number(store.selectedBatteryKwh || 0);
  const selectedPanelProduct = useMemo(() => {
    const selectedPanels = store.selectedPanels as Product | null;
    if (selectedPanels?.category === 'panel' && getProductWatt(selectedPanels) === Number(store.panelWattage)) {
      return selectedPanels;
    }
    return findBestPanelByWattage(Number(store.panelWattage), allProducts);
  }, [allProducts, store.panelWattage, store.selectedPanels]);
  const recommendedPackages = useMemo(
    () => buildRecommendedPackages({ requiredSolarKw, requiredInverterKw, requiredBatteryKwh }, selectedPanelProduct, allProducts),
    [allProducts, requiredBatteryKwh, requiredInverterKw, requiredSolarKw, selectedPanelProduct]
  );

  return (
    <SafeAreaView style={packagesStyles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={productsQuery.isRefetching} onRefresh={() => void productsQuery.refetch()} />}
        contentContainerStyle={packagesStyles.content}
      >
        <View style={packagesStyles.topRow}>
          <Pressable style={packagesStyles.backButton} onPress={onBack}>
            <ArrowLeft color="#10213A" size={22} strokeWidth={2.4} />
          </Pressable>
          <View style={packagesStyles.heroTitleCard}>
            <Star color="#F5A400" size={22} strokeWidth={2.4} />
            <View style={packagesStyles.heroCopy}>
              <Text style={packagesStyles.heroTitle}>Choose the package that fits you best</Text>
              <Text style={packagesStyles.heroSubtitle}>Compare smart packages and pick the best for your home.</Text>
            </View>
          </View>
        </View>

        <View style={packagesStyles.tabs}>
          <Pressable style={[packagesStyles.tab, activeTab === 'recommended' && packagesStyles.tabActive]} onPress={() => setActiveTab('recommended')}>
            <Award color="#10213A" size={21} strokeWidth={2.2} />
            <Text style={activeTab === 'recommended' ? packagesStyles.tabActiveText : packagesStyles.tabText}>Recommended Packages</Text>
          </Pressable>
          <Pressable style={[packagesStyles.tab, activeTab === 'lowCost' && packagesStyles.tabActive]} onPress={() => setActiveTab('lowCost')}>
            <WalletCards color="#10213A" size={21} strokeWidth={2.2} />
            <Text style={activeTab === 'lowCost' ? packagesStyles.tabActiveText : packagesStyles.tabText}>Low Cost Packages</Text>
          </Pressable>
        </View>

        <View style={packagesStyles.sectionHeader}>
          <Text style={packagesStyles.sectionTitle}>{activeTab === 'recommended' ? 'Recommended Packages' : 'Low Cost Packages'}</Text>
          <Text style={packagesStyles.sectionSubtitle}>
            {activeTab === 'recommended'
              ? `${formatKw(requiredSolarKw)} solar, ${formatKw(requiredInverterKw)} inverter, ${requiredBatteryKwh || 0} kWh battery using ${store.panelWattage}W panels.`
              : 'Lower-cost inverter and battery brand options will appear here later.'}
          </Text>
        </View>

        {activeTab === 'lowCost' ? (
          <View style={packagesStyles.emptyPackageCard}>
            <Text style={packagesStyles.emptyPackageTitle}>Low cost packages will appear here based on available market products.</Text>
          </View>
        ) : productsQuery.isLoading ? (
          <View style={packagesStyles.emptyPackageCard}><Text style={packagesStyles.emptyPackageTitle}>Loading live products...</Text></View>
        ) : productsQuery.isError ? (
          <View style={packagesStyles.emptyPackageCard}><Text style={packagesStyles.emptyPackageTitle}>Unable to load live products. Please try again.</Text></View>
        ) : !selectedPanelProduct ? (
          <View style={packagesStyles.emptyPackageCard}><Text style={packagesStyles.emptyPackageTitle}>No visible {store.panelWattage}W panel product found for package generation.</Text></View>
        ) : recommendedPackages.length === 0 ? (
          <View style={packagesStyles.emptyPackageCard}><Text style={packagesStyles.emptyPackageTitle}>No compatible recommended packages found from available products.</Text></View>
        ) : (
          <View style={packagesStyles.cards}>
            {recommendedPackages.map((pkg, index) => {
              const packageKey = [
                pkg.packageBrand,
                pkg.inverter?.product?.id,
                pkg.battery?.product?.id,
                pkg.panel?.id,
                pkg.batteryBrand,
                index
              ].filter(Boolean).join('-');

              return (
                <RecommendedPackageCard
                  key={packageKey}
                  pkg={pkg}
                  selected={selectedPackage === pkg.id}
                  onViewDetails={() => onSelectPackage(pkg.id)}
                  onSelect={() => !pkg.outOfStock && onSelectPackage(pkg.id)}
                />
              );
            })}
          </View>
        )}

        <View style={packagesStyles.trustCard}>
          <View style={packagesStyles.trustIcon}>
            <ShieldCheck color="#009A61" size={30} strokeWidth={2.3} />
          </View>
          <View style={packagesStyles.trustCopy}>
            <Text style={packagesStyles.trustTitle}>100% Compatible System</Text>
            <Text style={packagesStyles.trustText}>All components are matched against live marketplace products.</Text>
          </View>
          <ChevronDown color="#007C52" size={20} strokeWidth={2.3} style={packagesStyles.trustArrow} />
        </View>
      </ScrollView>

      <View style={packagesStyles.footer}>
        <Pressable style={packagesStyles.reviewButton} onPress={onReviewSystem}>
          <ShoppingCart color="#10213A" size={21} strokeWidth={2.4} />
          <Text style={packagesStyles.reviewText}>Review My System</Text>
        </Pressable>
        <Pressable style={packagesStyles.expertButton}>
          <Headphones color="#10213A" size={21} strokeWidth={2.4} />
          <Text style={packagesStyles.expertText}>Get Expert Opinion</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const PackageMiniBadge = ({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'blue' | 'gray' | 'red' | 'green' }) => (
  <View style={[packagesStyles.miniBadge, tone === 'blue' && packagesStyles.miniBadgeBlue, tone === 'gray' && packagesStyles.miniBadgeGray, tone === 'red' && packagesStyles.miniBadgeRed, tone === 'green' && packagesStyles.miniBadgeGreen]}>
    <Text style={[packagesStyles.miniBadgeText, tone === 'blue' && packagesStyles.miniBadgeTextBlue, tone === 'gray' && packagesStyles.miniBadgeTextGray, tone === 'red' && packagesStyles.miniBadgeTextRed, tone === 'green' && packagesStyles.miniBadgeTextGreen]}>{label}</Text>
  </View>
);

const ProductLine = ({ label, product, size }: { label: string; product: Product; size?: string }) => (
  <View style={packagesStyles.productLine}>
    <Text style={packagesStyles.productLineLabel}>{label}</Text>
    <Text style={packagesStyles.productLineName} numberOfLines={1}>{product.brand} {product.model || product.name}</Text>
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
  onViewDetails,
  onSelect
}: {
  pkg: RecommendedPackage;
  selected: boolean;
  onViewDetails: () => void;
  onSelect: () => void;
}) => (
  <View style={[packagesStyles.packageCard, selected && packagesStyles.packageCardSelected]}>
    <View style={packagesStyles.packageHeader}>
      <View style={packagesStyles.packageTitleWrap}>
        <Text style={packagesStyles.packageTitle}>{pkg.packageName}</Text>
        <Text style={packagesStyles.packageSubtitle}>{pkg.panelQuantity} x {getProductWatt(pkg.panel)}W panels = {formatKw(pkg.totalSolarKw)}</Text>
      </View>
      <View style={packagesStyles.badgeStack}>
        {pkg.bestMatch ? <PackageMiniBadge label="Best Match" /> : null}
        {pkg.nearestAvailable ? <PackageMiniBadge label="Nearest Available Size" tone="blue" /> : null}
        {pkg.outOfStock ? <PackageMiniBadge label="Out of Stock" tone="red" /> : null}
      </View>
    </View>

    {pkg.hasLowerInverter ? <Text style={packagesStyles.warningText}>Lower inverter size selected due to availability</Text> : null}

    <View style={packagesStyles.componentGrid}>
      <ProductLine label="Panels" product={pkg.panel} size={`${pkg.panelQuantity} x ${getProductWatt(pkg.panel)}W`} />
      <ProductLine label="Inverter" product={pkg.inverter.product} size={formatKw(pkg.inverter.size)} />
      <ProductLine label="Battery" product={pkg.battery.product} size={`${pkg.battery.size} kWh`} />
    </View>

    <View style={packagesStyles.priceBreakdown}>
      <PriceRow label="Panels price" value={pkg.panelsPrice} />
      <PriceRow label="Inverter price" value={pkg.inverterPrice} />
      <PriceRow label="Battery price" value={pkg.batteryPrice} />
      <View style={packagesStyles.divider} />
      <PriceRow label="Total package price" value={pkg.totalPrice} strong />
    </View>

    <View style={packagesStyles.packageActions}>
      <Pressable style={packagesStyles.detailsButton} onPress={onViewDetails}>
        <Text style={packagesStyles.detailsText}>View Details</Text>
        <ArrowRight color="#10213A" size={16} strokeWidth={2.5} />
      </Pressable>
      <Pressable style={[packagesStyles.selectButton, pkg.outOfStock && packagesStyles.selectButtonDisabled]} onPress={onSelect} disabled={pkg.outOfStock}>
        <Text style={[packagesStyles.selectButtonText, pkg.outOfStock && packagesStyles.selectButtonTextDisabled]}>Select Package</Text>
      </Pressable>
    </View>
  </View>
);

const packagesStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F3E8'
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 108
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
    fontSize: 10.5,
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
    fontSize: 8,
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
  productLineLabel: {
    color: '#C48A00',
    fontSize: 8.5,
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
    padding: 16
  },
  emptyPackageTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  packageBadge: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: '900'
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
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8
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
    fontSize: 8.5,
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
    fontWeight: '900',
    marginTop: 3
  },
  detailsButton: {
    minWidth: 122,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  detailsText: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  trustCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12
  },
  trustIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
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
    fontSize: 16,
    fontWeight: '900'
  },
  trustText: {
    color: '#047857',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 4
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
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.92)',
    backgroundColor: 'rgba(248,243,232,0.98)'
  },
  reviewButton: {
    flex: 1,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 3
  },
  reviewText: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  expertButton: {
    flex: 1,
    height: 56,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#F5A400',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  expertText: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  }
});

const ApplianceStepScreen = ({ navigation, store, onContinue }: { navigation: any; store: any; onContinue: () => void }) => {
  const [addOtherOpen, setAddOtherOpen] = useState(false);
  const defaultIds = new Set(applianceGroups.flatMap((group) => group.ids));
  const customAppliances = store.appliances.filter((item: any) => !defaultIds.has(item.id));
  const addAppliance = (item: { id: string; name: string; watts: number }) => {
    store.addAppliance({ ...item, quantity: 1, hours: 4 });
    setAddOtherOpen(false);
  };

  return (
    <SafeAreaView style={applianceStyles.shell} edges={['top']}>
      <View style={applianceStyles.topbar}>
        <Pressable style={applianceStyles.topIconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#172031" size={15} strokeWidth={2.4} />
        </Pressable>
        <Text style={applianceStyles.topTitle}>Solar Size</Text>
        <View style={applianceStyles.topIconButton}>
          <Zap color="#F5B700" size={15} strokeWidth={2.3} />
        </View>
      </View>

      <ScrollView
        style={applianceStyles.scroll}
        contentContainerStyle={applianceStyles.scrollContent}
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

      <View style={applianceStyles.bottomPanel}>
        <Pressable style={applianceStyles.primaryButton} onPress={onContinue}>
          <Text style={applianceStyles.primaryButtonText}>Calculate Load</Text>
        </Pressable>
        <MySystemCard solarKw={0} inverterKw={0} batteryKwh={0} />
      </View>
      <Modal visible={addOtherOpen} transparent animationType="slide" onRequestClose={() => setAddOtherOpen(false)}>
        <Pressable style={applianceStyles.modalBackdrop} onPress={() => setAddOtherOpen(false)}>
          <Pressable style={applianceStyles.bottomSheet}>
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

const SolarRecommendationStepScreen = ({ navigation, store, onPrevious, onContinue }: { navigation: any; store: any; onPrevious: () => void; onContinue: () => void }) => {
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

      <ScrollView style={solarStyles.scroll} contentContainerStyle={solarStyles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <Text style={solarStyles.chartSubtitle}>Estimated {season} output from your {systemKw} kW solar system after typical losses</Text>
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
          <RotateCcw color="#253247" size={15} strokeWidth={2.2} />
          <Text style={solarStyles.recalculateText}>Recalculate</Text>
        </Pressable>

      </ScrollView>

      <Pressable style={solarStyles.chatButton} accessibilityLabel="Help">
        <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.2} />
      </Pressable>

      <View style={solarStyles.footer}>
        <Pressable style={solarStyles.secondaryButton} onPress={onPrevious}>
          <Text style={solarStyles.secondaryButtonText}>Previous Step</Text>
        </Pressable>
        <Pressable style={solarStyles.primaryButton} onPress={onContinue}>
          <Text style={solarStyles.primaryButtonText}>Continue</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
        <MySystemCard solarKw={systemKw} inverterKw={inverterKw} batteryKwh={batteryKwh} />
      </View>
    </SafeAreaView>
  );
};

const SolarProductionChart = ({ pvSizeKw, runningLoadKw, season }: { pvSizeKw: number; runningLoadKw: number; season: 'summer' | 'winter' }) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState(5);
  const chart = { left: 36, right: 326, top: 18, bottom: 118 };
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const productionShape = [0.14, 0.42, 0.62, 0.75, 0.86, 0.86, 0.74, 0.52, 0.18];
  const productionTimes = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
  const dailyUnits = pvSizeKw * (season === 'summer' ? 6 : 3);
  const seasonalEquivalentKw = dailyUnits / 6;
  const peakProductionKw = seasonalEquivalentKw * Math.max(...productionShape);
  const maxKw = Math.max(3, Math.ceil(Math.max(peakProductionKw, runningLoadKw) * 1.15));
  const valueToY = (value: number) => {
    const boundedValue = Math.min(maxKw, Math.max(0, value));
    return chart.bottom - (boundedValue / maxKw) * height;
  };
  const productionData = productionShape.map((shapeValue, index) => {
    const solarKW = seasonalEquivalentKw * shapeValue;
    const x = chart.left + (index / (productionShape.length - 1)) * width;
    const y = valueToY(solarKW);
    return { time: productionTimes[index], solarKW, x, y };
  });
  const selectedPoint = productionData[Math.min(selectedPointIndex, productionData.length - 1)];
  const path = `M ${productionData.map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' L ')}`;
  const runningLoadY = valueToY(runningLoadKw);
  const yAxisLabels = [0, maxKw * 0.25, maxKw * 0.5, maxKw * 0.75, maxKw];
  const formatAxisLabel = (value: number) => Number.isInteger(value) ? `${value}` : value.toFixed(1);
  const tooltipWidth = 70;
  const tooltipHeight = 34;
  const tooltipX = Math.min(340 - tooltipWidth - 4, Math.max(4, selectedPoint.x - tooltipWidth / 2));
  const tooltipY = Math.max(4, selectedPoint.y - tooltipHeight - 10);

  return (
    <Svg width="100%" height={144} viewBox="0 0 340 144">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = chart.bottom - ratio * height;
        return <Line key={ratio} x1={chart.left - 10} y1={y} x2={chart.right} y2={y} stroke={ratio === 0 ? '#E8DFD2' : '#F1E8DC'} strokeWidth="1" />;
      })}
      <Line x1={chart.left} y1={runningLoadY} x2={chart.right - 9} y2={runningLoadY} stroke="#6D7280" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.75" />
      <SvgText x="4" y={chart.bottom + 3} fontSize="10" fill="#94A3B8">{formatAxisLabel(yAxisLabels[0])}</SvgText>
      <SvgText x="0" y={valueToY(yAxisLabels[1]) + 3} fontSize="10" fill="#94A3B8">{formatAxisLabel(yAxisLabels[1])}</SvgText>
      <SvgText x="0" y={valueToY(yAxisLabels[2]) + 3} fontSize="10" fill="#94A3B8">{formatAxisLabel(yAxisLabels[2])}</SvgText>
      <SvgText x="0" y={valueToY(yAxisLabels[3]) + 3} fontSize="10" fill="#94A3B8">{formatAxisLabel(yAxisLabels[3])}</SvgText>
      <SvgText x="0" y={chart.top + 3} fontSize="10" fill="#94A3B8">{formatAxisLabel(yAxisLabels[4])}</SvgText>
      <Path d={path} fill="none" stroke="#FFA51D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={selectedPoint.x} y1={selectedPoint.y} x2={selectedPoint.x} y2={chart.bottom} stroke="#F5A400" strokeWidth="1.2" opacity="0.8" />
      {productionData.map((point, index) => (
        <React.Fragment key={`${point.time}-${point.x}`}>
          <Circle cx={point.x} cy={point.y} r={index === selectedPointIndex ? 4.4 : 2.4} fill={index === selectedPointIndex ? '#FFFFFF' : '#FFA51D'} stroke="#FFA51D" strokeWidth={index === selectedPointIndex ? 2.2 : 0} />
          <Circle cx={point.x} cy={point.y} r="11" fill="transparent" onPress={() => setSelectedPointIndex(index)} />
        </React.Fragment>
      ))}
      <Rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="9" fill="#172031" opacity="0.96" />
      <SvgText x={tooltipX + tooltipWidth / 2} y={tooltipY + 13} fontSize="9.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">{selectedPoint.time}</SvgText>
      <SvgText x={tooltipX + tooltipWidth / 2} y={tooltipY + 27} fontSize="11" fontWeight="900" fill="#F5B700" textAnchor="middle">{selectedPoint.solarKW.toFixed(1)} kW</SvgText>
      <SvgText x="24" y="136" fontSize="10" fill="#94A3B8">9 AM</SvgText>
      <SvgText x="112" y="136" fontSize="10" fill="#94A3B8">11 AM</SvgText>
      <SvgText x="198" y="136" fontSize="10" fill="#94A3B8">1 PM</SvgText>
      <SvgText x="276" y="136" fontSize="10" fill="#94A3B8">3 PM</SvgText>
      <SvgText x="310" y="136" fontSize="10" fill="#94A3B8">5 PM</SvgText>
      <SvgText x="236" y={Math.max(12, runningLoadY - 6)} fontSize="10" fill="#7B808A">Running Load</SvgText>
    </Svg>
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

const ChatButton = () => (
  <Pressable style={flowStyles.chatButton} accessibilityLabel="Help">
    <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.2} />
  </Pressable>
);

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
  const solarSize = Math.round(solarKw || 3);
  const inverterSize = getInverterSizeKw(solarSize);
  const batterySize = batteryKwh;

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 7 of 8" active={7} />
      <ScrollView style={flowStyles.scroll} contentContainerStyle={recommendedStyles.content} showsVerticalScrollIndicator={false}>
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
              <View style={recommendedStyles.specIcon}><Sun color="#F5A400" size={15} strokeWidth={2.4} /></View>
              <View>
                <Text style={recommendedStyles.specValue}>{solarSize} kW</Text>
                <Text style={recommendedStyles.specLabel}>Solar Panels</Text>
              </View>
            </View>
            <View style={recommendedStyles.specDivider} />
            <View style={recommendedStyles.specRow}>
              <View style={recommendedStyles.specIcon}><Zap color="#F5A400" size={15} strokeWidth={2.4} /></View>
              <View>
                <Text style={recommendedStyles.specValue}>{inverterSize} kW</Text>
                <Text style={recommendedStyles.specLabel}>Inverter</Text>
              </View>
            </View>
            <View style={recommendedStyles.specDivider} />
            <View style={recommendedStyles.specRow}>
              <View style={recommendedStyles.specIcon}><BatteryCharging color="#F5A400" size={15} strokeWidth={2.4} /></View>
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
      <View style={recommendedStyles.footer}>
        <Pressable style={recommendedStyles.secondaryButton} onPress={onPrevious}>
          <Text style={recommendedStyles.secondaryButtonText}>Previous Step</Text>
        </Pressable>
        <Pressable style={recommendedStyles.primaryButton} onPress={onContinue}>
          <Text style={recommendedStyles.primaryButtonText}>Next</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
        <MySystemCard solarKw={solarSize} inverterKw={inverterSize} batteryKwh={batterySize} />
      </View>
    </SafeAreaView>
  );
};

const RoofSpaceStepScreen = ({ store, onPrevious, onContinue }: { store: any; onPrevious: () => void; onContinue: () => void }) => {
  const selectedPVSizeKW = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3))));
  const requestedPanelWattage = Math.round(Number(store.panelWattage || 610));
  const panelProductsQuery = useProducts('panel');
  const panelProducts = panelProductsQuery.data ?? [];
  const wattageOptions = useMemo(() => getAvailablePanelWattages(panelProducts), [panelProducts]);
  const selectedPanelWattage = wattageOptions.includes(requestedPanelWattage) ? requestedPanelWattage : wattageOptions[0] ?? requestedPanelWattage;
  const panelCount = calculatePanelCount(selectedPVSizeKW, selectedPanelWattage);
  const actualSolarKw = (panelCount * selectedPanelWattage) / 1000;
  const columns = Math.max(1, Math.ceil(Math.sqrt(panelCount)));
  const rows = Math.max(1, Math.ceil(panelCount / columns));
  const totalSlots = rows * columns;
  const missingPanels = totalSlots - panelCount;
  const centerRow = (rows - 1) / 2;
  const centerColumn = (columns - 1) / 2;
  const emptySlotIndexes = new Set(
    Array.from({ length: totalSlots })
      .map((_, index) => ({
        index,
        row: Math.floor(index / columns),
        column: index % columns
      }))
      .sort((a, b) => {
        const aDistance = Math.abs(a.row - centerRow) + Math.abs(a.column - centerColumn);
        const bDistance = Math.abs(b.row - centerRow) + Math.abs(b.column - centerColumn);
        const aLowerCenterBias = a.row >= centerRow ? 0 : 0.25;
        const bLowerCenterBias = b.row >= centerRow ? 0 : 0.25;
        return (aDistance + aLowerCenterBias) - (bDistance + bLowerCenterBias);
      })
      .slice(0, missingPanels)
      .map((slot) => slot.index)
  );
  const gridRows = Array.from({ length: rows }).map((_, rowIndex) =>
    Array.from({ length: columns }).map((__, columnIndex) => {
      const slotIndex = rowIndex * columns + columnIndex;
      return !emptySlotIndexes.has(slotIndex);
    })
  );
  const panelLandscapeWidthFt = 7.83;
  const panelLandscapeHeightFt = 3.67;
  const spacingFt = 1 / 12;
  const footprintWidthFt = columns * panelLandscapeWidthFt + Math.max(0, columns - 1) * spacingFt;
  const footprintHeightFt = rows * panelLandscapeHeightFt + Math.max(0, rows - 1) * spacingFt;
  const roofAreaSqFt = Math.round(footprintWidthFt * footprintHeightFt);
  const previewWidth = 206;
  const gridGap = 4;
  const gridPadding = 6;
  const cellWidth = Math.max(24, (previewWidth - gridPadding * 2 - gridGap * (columns - 1)) / columns);
  const cellHeight = Math.max(18, cellWidth * 0.68);
  const inverterSize = Math.max(3, Math.ceil(selectedPVSizeKW));
  const batterySize = store.backupDecision === 'yes' ? store.selectedBatteryKwh : 0;

  useEffect(() => {
    if (panelProductsQuery.isLoading || panelProductsQuery.isError || wattageOptions.length === 0) return;
    if (store.panelWattage !== selectedPanelWattage) store.setPanelWattage(selectedPanelWattage);
    const bestPanel = findBestPanelByWattage(selectedPanelWattage, panelProducts);
    if (bestPanel && store.selectedPanels?.id !== bestPanel.id) store.setSelectedProduct(bestPanel);
  }, [panelProducts, panelProductsQuery.isError, panelProductsQuery.isLoading, selectedPanelWattage, store, wattageOptions.length]);

  const handleWattageSelect = (wattage: number) => {
    store.setPanelWattage(wattage);
    const bestPanel = findBestPanelByWattage(wattage, panelProducts);
    if (bestPanel) store.setSelectedProduct(bestPanel);
  };

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 3 of 8" active={3} />
      <ScrollView
        style={flowStyles.scroll}
        contentContainerStyle={roofStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={panelProductsQuery.isRefetching} onRefresh={() => void panelProductsQuery.refetch()} />}
      >
        <View style={roofStyles.layoutCard}>
          <View style={roofStyles.layoutHead}>
            <View>
              <Text style={roofStyles.metricLabel}>PANEL LAYOUT</Text>
              <Text style={roofStyles.layoutTitle}>{panelCount} panels x {selectedPanelWattage}W</Text>
            </View>
            <View style={roofStyles.areaBadge}>
              <Text style={roofStyles.areaBadgeText}>{roofAreaSqFt} sq ft</Text>
            </View>
          </View>
          <View style={roofStyles.toggle}>
            <View style={roofStyles.toggleActive}>
              <Text style={roofStyles.toggleActiveText}>Landscape</Text>
            </View>
            <View style={roofStyles.toggleInactive}>
              <Text style={roofStyles.toggleInactiveText}>Portrait</Text>
            </View>
          </View>
          <View style={roofStyles.orientationCard}>
            <Text style={roofStyles.orientationTitle}>LANDSCAPE ORIENTATION</Text>
            <View style={roofStyles.orientationControls}>
              <View style={roofStyles.rowsPill}>
                <Text style={roofStyles.rowsButton}>-</Text>
                <Text style={roofStyles.rowsText}>{rows} rows</Text>
                <Text style={roofStyles.rowsButton}>+</Text>
              </View>
              <Text style={roofStyles.compactText}>Compact</Text>
              <Text style={roofStyles.compactText}>Reset</Text>
            </View>
            <View style={roofStyles.panelPreviewRow}>
              <View style={[roofStyles.panelGrid, { width: previewWidth }]}>
                {gridRows.map((gridRow, rowIndex) => (
                  <View key={rowIndex} style={[roofStyles.panelGridRow, { gap: gridGap }]}>
                    {gridRow.map((filled, panelIndex) => (
                      <View
                        key={`${rowIndex}-${panelIndex}`}
                        style={[
                          roofStyles.panelCell,
                          !filled && roofStyles.panelCellEmpty,
                          { width: cellWidth, height: cellHeight }
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <View style={roofStyles.dimensionLabels}>
              <Text style={roofStyles.dimensionText}>← {footprintWidthFt.toFixed(1)} ft →</Text>
              <Text style={roofStyles.dimensionText}>← {footprintHeightFt.toFixed(1)} ft →</Text>
            </View>
          </View>
        </View>

        <View style={roofStyles.metricCard}>
          <Text style={roofStyles.metricLabel}>REQUIRED PANELS</Text>
          <Text style={roofStyles.metricValue}>{panelCount}</Text>
          <View style={roofStyles.wattageSelector}>
            {panelProductsQuery.isLoading ? (
              [1, 2, 3].map((item) => (
                <View key={item} style={[roofStyles.wattagePill, roofStyles.wattagePillSkeleton]}>
                  <Text style={roofStyles.wattagePillText}>...</Text>
                </View>
              ))
            ) : wattageOptions.length === 0 ? (
              <Text style={roofStyles.noWattageText}>No panel wattages available. Please add solar panel products from admin dashboard.</Text>
            ) : wattageOptions.map((wattage) => {
              const selected = wattage === selectedPanelWattage;
              return (
                <Pressable
                  key={wattage}
                  style={[roofStyles.wattagePill, selected && roofStyles.wattagePillActive]}
                  onPress={() => handleWattageSelect(wattage)}
                >
                  <Text style={[roofStyles.wattagePillText, selected && roofStyles.wattagePillTextActive]}>{wattage}W</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={roofStyles.heroCard}>
          <Text style={roofStyles.heroTitle}>Total Roof Space</Text>
          <Text style={roofStyles.heroValue}>~{roofAreaSqFt} sq ft</Text>
          <Text style={roofStyles.heroCopy}>AUTO-CALCULATED FOR YOUR {selectedPVSizeKW} KW{'\n'}RECOMMENDATION.</Text>
        </View>
      </ScrollView>
      <ChatButton />
      <View style={roofStyles.footer}>
        <Pressable style={roofStyles.secondaryButton} onPress={onPrevious}>
          <Text style={roofStyles.secondaryButtonText}>Previous Step</Text>
        </Pressable>
        <Pressable style={roofStyles.primaryButton} onPress={onContinue}>
          <Text style={roofStyles.primaryButtonText}>Next</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
        <MySystemCard solarKw={actualSolarKw} inverterKw={inverterSize} batteryKwh={batterySize} />
      </View>
    </SafeAreaView>
  );
};

const BatteryChoiceStepScreen = ({
  store,
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
      <StepHeader step="Step 4 of 8" active={4} />
      <View style={batteryChoiceStyles.content}>
        <View style={batteryChoiceStyles.titleBlock}>
          <Text style={batteryChoiceStyles.title}>Do you want battery backup?</Text>
          <Text style={batteryChoiceStyles.subtitle}>Battery backup keeps your important appliances{'\n'}running during outages.</Text>
        </View>
        <View style={batteryChoiceStyles.heroImageCard}>
          <Image source={batteryBackupHeroImage} style={batteryChoiceStyles.heroImage} resizeMode="cover" />
        </View>
        <Pressable style={[batteryChoiceStyles.optionCard, selected !== 'no' && batteryChoiceStyles.optionSelected]} onPress={handleYes}>
          <View style={batteryChoiceStyles.checkIcon}><Check color="#FFFFFF" size={23} strokeWidth={2.8} /></View>
          <View style={batteryChoiceStyles.optionCopy}>
            <Text style={batteryChoiceStyles.optionTitle}>Yes, I want backup</Text>
            <Text style={batteryChoiceStyles.optionSub}>Let's calculate my battery size</Text>
          </View>
          <View style={batteryChoiceStyles.badge}><Text style={batteryChoiceStyles.badgeText}>RECOMMENDED</Text></View>
        </Pressable>
        <Pressable style={batteryChoiceStyles.optionCard} onPress={handleNo}>
          <View style={batteryChoiceStyles.xIcon}><X color="#FFFFFF" size={23} strokeWidth={2.8} /></View>
          <View style={batteryChoiceStyles.optionCopy}>
            <Text style={batteryChoiceStyles.optionTitle}>No, I don't need backup</Text>
            <Text style={batteryChoiceStyles.optionSub}>I'll continue without battery</Text>
          </View>
        </Pressable>
        <Text style={batteryChoiceStyles.laterText}>You can always add battery later.</Text>
      </View>
      <ChatButton />
      <View style={flowStyles.systemFooter}>
        <MySystemCard solarKw={solarKw} inverterKw={inverterKw} batteryKwh={batteryKwh} />
      </View>
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

const DEFAULT_BACKUP_HOURS = 1;

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
const formatDetailKwh = (valueWh: number) => `${(valueWh / 1000).toFixed(1)} kWh`;

const backupHourOptions = [1, 2, 3, 4, 5, 6, 8];
const batterySizeOptions = [5, 6, 10];
const calculateActualBackupLoadKw = (appliances: any[]) =>
  appliances.reduce((sum, item) => sum + (item.watts * item.quantity * (item.hours ?? DEFAULT_BACKUP_HOURS)), 0) / 1000;
const calculateRequiredBackupKwh = (appliances: any[]) => {
  const totalWh = calculateActualBackupLoadKw(appliances) * 1000;
  const safetyMargin = totalWh * 0.25;
  return (totalWh + safetyMargin) / 1000;
};
const getRecommendedBatteryKwh = (requiredKwh: number) =>
  batterySizeOptions.find((size) => size >= requiredKwh) ?? batterySizeOptions[batterySizeOptions.length - 1];
const formatBackupLoadKw = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};
const formatBackupHours = (hours: number) => `${hours.toFixed(2)} Hours`;

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
        <Pressable style={applianceStyles.stepperButton} onPress={() => onChange(Math.max(0, quantity - 1))}>
          <Text style={[applianceStyles.stepperButtonText, quantity <= 0 && applianceStyles.stepperButtonDisabled]}>-</Text>
        </Pressable>
        <Text style={applianceStyles.stepperValue}>{quantity}</Text>
        <Pressable style={[applianceStyles.stepperButton, applianceStyles.stepperPlusButton]} onPress={() => onChange(Math.min(20, quantity + 1))}>
          <Text style={applianceStyles.stepperButtonPlus}>+</Text>
        </Pressable>
      </View>
      <Pressable
        style={[applianceStyles.hoursPill, !selected && applianceStyles.hoursPillDisabled]}
        onPress={onOpenHours}
        disabled={!selected}
      >
        <Text style={applianceStyles.hoursText}>{hours ?? DEFAULT_BACKUP_HOURS}h</Text>
        <ChevronDown color="#9A6E00" size={10} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
};

const BackupCalculationDetailsCard = ({
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
  const safetyMarginWh = totalWh * 0.25;
  const requiredWh = totalWh + safetyMarginWh;

  return (
    <View style={[backupStyles.detailsCard, expanded && backupStyles.detailsCardOpen]}>
      <Pressable style={backupStyles.detailsHeader} onPress={onToggle}>
        <Text style={backupStyles.detailsTitle}>Calculation details</Text>
        <View style={backupStyles.detailsAction}>
          <Text style={backupStyles.detailsActionText}>{expanded ? 'Hide' : 'View'}</Text>
          <ChevronDown
            color="#C48A00"
            size={15}
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
                        <Icon color="#B98900" size={13} strokeWidth={2} />
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

const BackupAppliancesStepScreen = ({ store, onPrevious, onContinue }: { store: any; onPrevious: () => void; onContinue: () => void }) => {
  const [addOtherOpen, setAddOtherOpen] = useState(false);
  const [hoursPickerId, setHoursPickerId] = useState<string | null>(null);
  const [calculationOpen, setCalculationOpen] = useState(false);
  const batteryKwh = calculateRequiredBackupKwh(store.backupAppliances);
  const solarKw = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3))));
  const inverterKw = getInverterSizeKw(solarKw);
  const defaultIds = new Set(applianceGroups.flatMap((group) => group.ids));
  const customAppliances = store.backupAppliances.filter((item: any) => !defaultIds.has(item.id));
  const hoursPickerItem = hoursPickerId ? store.backupAppliances.find((item: any) => item.id === hoursPickerId) : null;
  const addAppliance = (item: { id: string; name: string; watts: number }) => {
    store.addBackupAppliance({ ...item, quantity: 1, hours: DEFAULT_BACKUP_HOURS });
    setAddOtherOpen(false);
  };

  useEffect(() => {
    store.setSelectedBatteryKwh(batteryKwh);
  }, [batteryKwh]);

  return (
    <SafeAreaView style={applianceStyles.shell} edges={['top']}>
      <View style={applianceStyles.topbar}>
        <Pressable style={applianceStyles.topIconButton} onPress={onPrevious} accessibilityLabel="Back">
          <ArrowLeft color="#172031" size={15} strokeWidth={2.4} />
        </Pressable>
        <Text style={applianceStyles.topTitle}>Battery Size</Text>
        <View style={applianceStyles.topIconButton}>
          <Zap color="#F5B700" size={15} strokeWidth={2.3} />
        </View>
      </View>

      <ScrollView
        style={applianceStyles.scroll}
        contentContainerStyle={applianceStyles.scrollContent}
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

        <BackupCalculationDetailsCard
          appliances={store.backupAppliances}
          expanded={calculationOpen}
          onToggle={() => setCalculationOpen((open) => !open)}
        />
      </ScrollView>

      <View style={applianceStyles.bottomPanel}>
        <Pressable style={applianceStyles.primaryButton} onPress={onContinue}>
          <Text style={applianceStyles.primaryButtonText}>Calculate Battery Size</Text>
        </Pressable>
        <MySystemCard solarKw={solarKw} inverterKw={inverterKw} batteryKwh={batteryKwh} />
      </View>

      <Modal visible={addOtherOpen} transparent animationType="slide" onRequestClose={() => setAddOtherOpen(false)}>
        <Pressable style={applianceStyles.modalBackdrop} onPress={() => setAddOtherOpen(false)}>
          <Pressable style={applianceStyles.bottomSheet}>
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

const CalculationTotal = ({ label, valueWh, prefix = '', highlight = false }: { label: string; valueWh: number; prefix?: string; highlight?: boolean }) => (
  <View style={backupStyles.totalRow}>
    <Text style={backupStyles.totalLabel}>{label}</Text>
    <View style={backupStyles.totalValues}>
      <Text style={[backupStyles.totalWh, highlight && backupStyles.totalHighlight]}>{prefix}{formatWh(valueWh)} Wh</Text>
      <Text style={[backupStyles.totalKwh, highlight && backupStyles.totalHighlight]}>= {formatDetailKwh(valueWh)}</Text>
    </View>
  </View>
);

const BackupPlanStepScreen = ({
  store,
  onPrevious,
  onContinue
}: {
  store: any;
  onPrevious: () => void;
  onContinue: () => void;
}) => {
  const actualBackupLoadKw = calculateActualBackupLoadKw(store.backupAppliances);
  const applianceCount = store.backupAppliances.filter((item: any) => item.quantity > 0).length;
  const requiredBatteryKwh = calculateRequiredBackupKwh(store.backupAppliances);
  const recommendedBatteryKwh = getRecommendedBatteryKwh(requiredBatteryKwh);
  const storedBatteryKwh = Number(store.selectedBatteryKwh || 0);
  const selectedBatteryKwh = batterySizeOptions.includes(storedBatteryKwh) ? storedBatteryKwh : recommendedBatteryKwh;
  const solarKw = Math.min(20, Math.max(1, Math.round(Number(store.recommendedSolarKw || 3))));
  const inverterKw = getInverterSizeKw(solarKw);
  const selectedBatteryUsableKwh = selectedBatteryKwh * 0.9;
  const backupHours = actualBackupLoadKw > 0 ? selectedBatteryUsableKwh / actualBackupLoadKw : 0;
  const backupOptions = batterySizeOptions.map((size) => ({
    size,
    note: size === recommendedBatteryKwh ? 'Recommended size' : 'Longer backup, more comfort'
  }));
  const formattedLoadKw = formatBackupLoadKw(actualBackupLoadKw);

  useEffect(() => {
    if (storedBatteryKwh !== selectedBatteryKwh) {
      store.setSelectedBatteryKwh(selectedBatteryKwh);
    }
  }, [selectedBatteryKwh, storedBatteryKwh]);

  return (
    <SafeAreaView style={flowStyles.shell} edges={['top']}>
      <StepHeader step="Step 6 of 8" active={6} onBack={onPrevious} />
      <ScrollView style={flowStyles.scroll} contentContainerStyle={backupPlanStyles.content} showsVerticalScrollIndicator={false}>
        <View style={backupPlanStyles.titleBlock}>
          <Text style={backupPlanStyles.title}>Your Backup Plan is Ready</Text>
          <Text style={backupPlanStyles.subtitle}>Recommended battery capacity for your selected backup load</Text>
        </View>

        <View style={backupPlanStyles.heroCard}>
          <View style={backupPlanStyles.heroTop}>
            <View style={backupPlanStyles.heroCopy}>
              <Text style={backupPlanStyles.batteryValue}>{selectedBatteryKwh}<Text style={backupPlanStyles.batteryUnit}> kWh</Text></Text>
              <Text style={backupPlanStyles.batteryLabel}>Battery System</Text>
              <Text style={backupPlanStyles.loadText}>Runs your <Text style={backupPlanStyles.loadStrong}>{formattedLoadKw} kW</Text> load</Text>
            </View>
            <View style={backupPlanStyles.imageWrap}>
              <Image source={batteryImage} style={backupPlanStyles.batteryImage} resizeMode="contain" />
            </View>
          </View>
          <View style={backupPlanStyles.statsRow}>
            <View style={backupPlanStyles.statItem}>
              <Text style={backupPlanStyles.statLabel}>Backup Time</Text>
              <Text style={backupPlanStyles.statValue}>{formatBackupHours(backupHours)}</Text>
              <Text style={backupPlanStyles.statSub}>(at {formattedLoadKw} kW load)</Text>
            </View>
            <View style={backupPlanStyles.statDivider} />
            <View style={backupPlanStyles.statItem}>
              <Text style={backupPlanStyles.statLabel}>Appliances</Text>
              <Text style={backupPlanStyles.statValue}>{applianceCount}</Text>
              <Text style={backupPlanStyles.statSub}>{applianceCount} covered</Text>
            </View>
          </View>
        </View>

        <Text style={backupPlanStyles.adjustTitle}>Want to adjust your backup?</Text>
        <View style={backupPlanStyles.optionRow}>
          {backupOptions.map((option) => {
            const selected = option.size === selectedBatteryKwh;
            const optionHours = actualBackupLoadKw > 0 ? (option.size * 0.9) / actualBackupLoadKw : 0;
            return (
              <Pressable
                key={option.size}
                style={[backupPlanStyles.optionCard, selected && backupPlanStyles.optionSelected]}
                onPress={() => store.setSelectedBatteryKwh(option.size)}
              >
                {selected ? <Text style={backupPlanStyles.selectedLabel}>SELECTED</Text> : null}
                <Text style={backupPlanStyles.optionSize}>{option.size} kWh</Text>
                <Text style={backupPlanStyles.optionBackup}>Backup: {formatBackupHours(optionHours)}</Text>
                <Text style={backupPlanStyles.optionNote}>{option.note}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={backupPlanStyles.basedText}>Based on your actual usage</Text>
      </ScrollView>
      <View style={backupPlanStyles.footer}>
        <Pressable style={backupPlanStyles.continueButton} onPress={onContinue}>
          <Text style={backupPlanStyles.continueText}>Continue</Text>
          <ArrowRight color="#18202D" size={18} strokeWidth={2.4} />
        </Pressable>
        <Pressable style={backupPlanStyles.recalculateButton} onPress={onPrevious}>
          <Text style={backupPlanStyles.recalculateText}>Recalculate</Text>
        </Pressable>
        <MySystemCard solarKw={solarKw} inverterKw={inverterKw} batteryKwh={selectedBatteryKwh} />
      </View>
      <ChatButton />
    </SafeAreaView>
  );
};

const backupPlanStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 178,
    gap: 12
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
  loadText: {
    marginTop: 7,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },
  loadStrong: {
    color: '#172031',
    fontWeight: '900'
  },
  imageWrap: {
    width: 106,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center'
  },
  batteryImage: {
    width: 96,
    height: 86
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
    fontSize: 9,
    fontWeight: '900'
  },
  statValue: {
    marginTop: 4,
    color: '#172031',
    fontSize: 15,
    fontWeight: '900'
  },
  statSub: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '800'
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
    minHeight: 74,
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
    fontSize: 7.5,
    fontWeight: '900',
    marginBottom: 2
  },
  optionSize: {
    color: '#172031',
    fontSize: 13,
    fontWeight: '900'
  },
  optionBackup: {
    marginTop: 3,
    color: '#C48A00',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center'
  },
  optionNote: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 8.2,
    fontWeight: '800',
    lineHeight: 11,
    textAlign: 'center'
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
    marginTop: -4,
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
    fontSize: 10.5,
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
    fontSize: 8.5,
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
    fontSize: 10.5,
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
    fontSize: 12.5,
    fontWeight: '900'
  },
  trustText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 9.2,
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
  metricValue: { marginTop: 6, color: '#1F2A3D', fontSize: 23, fontWeight: '900' },
  metricSub: { marginTop: 6, color: '#64748B', fontSize: 12, fontWeight: '500' },
  layoutCard: { borderRadius: 18, backgroundColor: '#FFFFFF', padding: 14, gap: 12 },
  layoutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  layoutTitle: { marginTop: 5, color: '#1F2A3D', fontSize: 14, fontWeight: '900' },
  areaBadge: { borderRadius: 999, backgroundColor: '#FFF5DA', borderWidth: 1, borderColor: '#F2D990', paddingHorizontal: 13, paddingVertical: 7 },
  areaBadgeText: { color: '#8C6503', fontSize: 10, fontWeight: '900' },
  toggle: { height: 38, borderRadius: 12, backgroundColor: '#F4F4F5', flexDirection: 'row', padding: 2 },
  toggleActive: { flex: 1, borderRadius: 10, backgroundColor: '#F5B700', alignItems: 'center', justifyContent: 'center' },
  toggleInactive: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toggleActiveText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  toggleInactiveText: { color: '#6B7280', fontSize: 12, fontWeight: '800' },
  orientationCard: { borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', padding: 12, gap: 10 },
  orientationTitle: { color: '#6B7280', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  orientationControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowsPill: { height: 30, borderRadius: 999, backgroundColor: '#EEF2F7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 8 },
  rowsButton: { width: 22, textAlign: 'center', color: '#64748B', fontSize: 15, fontWeight: '900' },
  rowsText: { color: '#1F2A3D', fontSize: 11, fontWeight: '900' },
  compactText: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  panelPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  panelGrid: { width: 178, borderRadius: 10, borderWidth: 2, borderColor: '#DCE8F6', backgroundColor: '#F8FBFF', padding: 6, gap: 4 },
  panelGridRow: { flexDirection: 'row', justifyContent: 'center' },
  panelCell: { width: 78, height: 54, borderRadius: 4, backgroundColor: '#173553', borderWidth: 1, borderColor: '#5B7896' },
  panelCellEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  dimensionLabels: { alignItems: 'center', gap: 4 },
  dimensionText: { color: '#334155', fontSize: 11, fontWeight: '900' },
  wattageSelector: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  wattagePill: { minWidth: 50, height: 30, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(226,221,213,0.9)', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
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
  badgeText: { color: '#A27500', fontSize: 8, fontWeight: '900' },
  laterText: { marginTop: 12, textAlign: 'center', color: '#64748B', fontSize: 12, fontWeight: '800' }
});

const backupStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 116, gap: 7 },
  title: { color: '#172031', fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { marginTop: 6, color: '#46566C', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 46, paddingRight: 20 },
  headerText: { color: '#64748B', fontSize: 9, fontWeight: '900' },
  rows: { gap: 6 },
  rowCard: { minHeight: 50, borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowSelected: { borderWidth: 1.2, borderColor: 'rgba(245,183,0,0.45)', backgroundColor: '#FFF9EB' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: '#D8DEE8', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#F5B700', borderColor: '#F5B700' },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF3D8', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowName: { color: '#172031', fontSize: 10.5, fontWeight: '900' },
  rowWatts: { marginTop: 1, color: '#64748B', fontSize: 7.5, fontWeight: '800' },
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
  capacityValue: { color: '#D89100', fontSize: 21, fontWeight: '900' },
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
  detailsBody: { gap: 10 },
  emptyDetails: { color: '#64748B', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  calcRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calcIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#FFF3D8', alignItems: 'center', justifyContent: 'center' },
  calcCopy: { flex: 1, minWidth: 0 },
  calcName: { color: '#172031', fontSize: 11, fontWeight: '900' },
  calcFormula: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '700' },
  calcValue: { color: '#172031', fontSize: 11, fontWeight: '900' },
  calcDivider: { height: 1, backgroundColor: '#EEF0F2', marginVertical: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  totalLabel: { flex: 1, color: '#172031', fontSize: 11, fontWeight: '900' },
  totalValues: { alignItems: 'flex-end' },
  totalWh: { color: '#334155', fontSize: 11, fontWeight: '900' },
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
    fontSize: 19,
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
    fontSize: 27,
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
    fontSize: 9.5,
    fontWeight: '800'
  },
  chartCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 13,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10
  },
  chartTitleWrap: {
    flex: 1
  },
  chartTitle: {
    color: '#1F2A3D',
    fontSize: 13,
    fontWeight: '900'
  },
  chartSubtitle: {
    marginTop: 5,
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600'
  },
  toggle: {
    height: 26,
    borderRadius: 999,
    backgroundColor: '#F2F0EC',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2
  },
  toggleActive: {
    height: 22,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#F5B700',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleActiveText: {
    color: '#172031',
    fontSize: 10,
    fontWeight: '900'
  },
  toggleInactiveText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10
  },
  chartNote: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 9.3,
    lineHeight: 13,
    fontWeight: '500'
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
    fontSize: 21,
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
    fontSize: 8,
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
    fontSize: 10.2,
    fontWeight: '900',
    lineHeight: 13
  },
  cardWatts: {
    color: '#64748B',
    fontSize: 7.6,
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
    fontSize: 10.5,
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
    fontSize: 8.5,
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
  primaryButtonText: {
    color: '#18202D',
    fontSize: 10.5,
    fontWeight: '900'
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.36)'
  },
  bottomSheet: {
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
