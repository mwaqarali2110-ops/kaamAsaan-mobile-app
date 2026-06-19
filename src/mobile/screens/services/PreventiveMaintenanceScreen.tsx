import React, { useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headphones,
  Home,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Sun,
  Thermometer,
  User,
  Wrench
} from 'lucide-react-native';
import { getMaintenancePlan } from '@/data/maintenancePlans';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import type { MaintenancePlanId } from '@/types/maintenance.types';

const heroImage = require('../../../assets/services/preventive-maintenance-hero-transparent.png');

const includedItems = [
  { title: 'Cleaning', Icon: Wrench },
  { title: 'Inspection', Icon: Search },
  { title: 'Thermal Scan', Icon: Thermometer },
  { title: 'Report', Icon: FileText }
];

const trustItems = [
  { title: 'Certified Team', Icon: ShieldCheck },
  { title: 'Safety First', Icon: CheckCircle2 },
  { title: 'Service Report', Icon: ClipboardCheck }
];

const plans = [
  {
    id: 'essential',
    title: 'Essential Care',
    subtitle: 'Basic Plan',
    visits: '4 Visits / Year',
    price: 'Rs 15,000',
    Icon: ShieldCheck,
    badge: undefined,
    highlighted: false,
    features: [
      'Quarterly panel cleaning',
      'Water filling in DC earthing pipe',
      'MC4 connectors tightening',
      'Nut bolts tightening'
    ]
  },
  {
    id: 'premium',
    title: 'Premium Care',
    subtitle: 'Premium Plan',
    visits: '4 Visits / Year',
    price: 'Rs 20,000',
    Icon: ShieldCheck,
    badge: 'MOST POPULAR',
    highlighted: true,
    features: [
      'Everything in Essential Care',
      'Production monitoring',
      'Diagnostic visit if required',
      'Warranty claim support',
      'Preventive maintenance report',
      'Inverter performance check',
      'System health review',
      'Priority support'
    ]
  }
] as const;

const bottomTabs = [
  { title: 'Home', Icon: Home, route: 'MainTabs', params: { screen: 'Home' } },
  { title: 'Marketplace', Icon: ShoppingBag, route: 'MainTabs', params: { screen: 'Marketplace' } },
  { title: 'Services', Icon: ShieldCheck },
  { title: 'Tools', Icon: Wrench, route: 'DesignFlow' },
  { title: 'Profile', Icon: User, route: 'MainTabs', params: { screen: 'Profile' } }
];

const openWhatsApp = async () => {
  const message = encodeURIComponent('Hi KaamAsaan, I need help with Solar Care.');
  const urls = [`whatsapp://send?text=${message}`, `https://wa.me/?text=${message}`];

  for (const url of urls) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  }
};

export const PreventiveMaintenanceScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const isNavigatingRef = useRef(false);
  const [plansY, setPlansY] = useState(0);
  const setSelectedPlan = useMaintenanceBookingStore((state) => state.setSelectedPlan);
  const contentWidth = width - 32;
  const serviceCardWidth = Math.floor((contentWidth - 24) / 4);
  const planCardWidth = Math.floor((contentWidth - 12) / 2);
  const heroCopyWidth = Math.min(174, Math.max(150, Math.floor(width * 0.45)));
  const heroImageWidth = Math.min(218, Math.max(190, Math.floor(width * 0.55)));
  const heroCtaWidth = Math.min(206, Math.max(188, Math.floor(width * 0.54)));

  const scrollToPlans = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, plansY - 12), animated: true });
  };

  const handleSelectMaintenancePlan = (planId: MaintenancePlanId) => {
    if (isNavigatingRef.current) return;

    const plan = getMaintenancePlan(planId);
    if (__DEV__) {
      console.log(`${plan.title} plan pressed`);
      console.log('Maintenance plan selected:', plan.planId);
    }
    isNavigatingRef.current = true;
    setSelectedPlan(plan);
    navigation.navigate('MaintenancePlanDetails', { plan });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 650);
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <ArrowLeft color="#10213A" size={21} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
            onPress={() => void openWhatsApp()}
            hitSlop={10}
            accessibilityLabel="Open support"
            accessibilityRole="button"
          >
            <Headphones color="#10213A" size={19} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconButton, styles.notificationButton, pressed && styles.iconPressed]}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={10}
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
          >
            <Bell color="#10213A" size={18} strokeWidth={2.4} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 78 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.heroCopy, { width: heroCopyWidth }]}>
            <View style={styles.pill}>
              <Sun color="#E8A000" size={13} strokeWidth={2.3} />
              <Text style={styles.pillText}>SOLAR CARE</Text>
            </View>

            <Text style={styles.heading}>
              <Text style={styles.headingDark}>Preventive{'\n'}</Text>
              <Text style={styles.headingGold}>Maintenance</Text>
            </Text>
            <Text style={styles.subtitle}>Protect your solar investment.</Text>
            <View style={styles.underline} />

            <Pressable
              style={({ pressed }) => [styles.primaryCta, { width: heroCtaWidth }, pressed && styles.buttonPressed]}
              onPress={scrollToPlans}
              accessibilityRole="button"
            >
              <ShieldCheck color="#10213A" size={18} strokeWidth={2.4} />
              <Text style={styles.primaryCtaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86}>View Maintenance Plans</Text>
              <ArrowRight color="#10213A" size={20} strokeWidth={2.5} />
            </Pressable>
          </View>
          <View style={styles.heroImageWrap} pointerEvents="none">
            <Image
              source={heroImage}
              style={{ width: heroImageWidth, height: heroImageWidth * 1.05 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.plansSection} onLayout={(event) => setPlansY(event.nativeEvent.layout.y)}>
          <Text style={styles.sectionTitle}>Maintenance Plans</Text>
          <View style={styles.sectionUnderline} />
          <View style={styles.planTrack}>
            {plans.map(({ id, title, subtitle, badge, visits, price, Icon, highlighted, features }) => (
              <View
                key={id}
                style={[
                  styles.planCard,
                  { width: planCardWidth },
                  highlighted && styles.planCardHighlighted
                ]}
              >
                {badge ? (
                  <View style={styles.planBadge} pointerEvents="none">
                    <Star color="#FFFFFF" size={10} fill="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.planBadgeText}>{badge}</Text>
                  </View>
                ) : null}

                <View style={[styles.planIcon, highlighted && styles.planIconHighlighted]}>
                  <Icon color={highlighted ? '#B07800' : '#6B7280'} size={24} strokeWidth={2.2} />
                </View>
                <Text style={styles.planTitle}>{title}</Text>
                <Text style={[styles.planSubtitle, highlighted && styles.planSubtitleHighlighted]}>{subtitle}</Text>
                <View style={styles.planDivider} />
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{price}</Text>
                  <Text style={styles.planPriceMeta}> / year</Text>
                </View>

                {highlighted ? (
                  <View style={styles.premiumFeatureBox}>
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                      contentContainerStyle={styles.premiumFeatureContent}
                    >
                      {features.map((feature) => (
                        <View key={feature} style={styles.planFeatureRow}>
                          <CheckCircle2 color="#F5A400" size={15} strokeWidth={2.4} />
                          <Text style={styles.planFeatureText}>{feature}</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <View pointerEvents="none" style={styles.featureFade} />
                  </View>
                ) : (
                  <View style={styles.featureBox}>
                    {features.map((feature) => (
                      <View key={feature} style={styles.planFeatureRow}>
                        <CheckCircle2 color="#F5A400" size={15} strokeWidth={2.4} />
                        <Text style={styles.planFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={[styles.visitBadge, highlighted && styles.visitBadgeHighlighted]}>
                  <CalendarDays color={highlighted ? '#B07800' : '#6B7280'} size={14} strokeWidth={2.2} />
                  <Text style={[styles.planVisits, highlighted && styles.planVisitsHighlighted]}>{visits}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.selectButton,
                    highlighted ? styles.selectButtonFilled : styles.selectButtonOutline,
                    pressed && styles.cardPressed
                  ]}
                  onPress={() => handleSelectMaintenancePlan(id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${title} maintenance plan`}
                >
                  <Text style={[styles.selectButtonText, highlighted && styles.selectButtonTextFilled]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
                    {highlighted ? 'Book Premium' : 'Choose Essential'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.promoStrip}>
          <View style={styles.promoIcon}>
            <ShieldCheck color="#E8A000" size={22} strokeWidth={2.3} />
          </View>
          <View style={styles.promoCopy}>
            <Text style={styles.promoTitle}>Regular care. Maximum performance.</Text>
            <Text style={styles.promoText}>Keep your system efficient and long-lasting.</Text>
          </View>
          <View style={styles.promoChecklist}>
            <ClipboardCheck color="#6B7280" size={34} strokeWidth={1.9} />
            <View style={styles.promoBolt} />
          </View>
        </View>

        <View style={styles.serviceTrack}>
          {includedItems.map(({ title, Icon }) => (
            <View key={title} style={[styles.serviceCard, { width: serviceCardWidth }]}>
              <Icon color="#E8A000" size={27} strokeWidth={2.2} />
              <Text style={styles.serviceText}>{title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.trustStrip}>
          {trustItems.map(({ title, Icon }, index) => (
            <View key={title} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <Icon color="#16A34A" size={15} strokeWidth={2.3} />
              </View>
              <Text style={styles.trustText}>{title}</Text>
              {index < trustItems.length - 1 ? <View style={styles.trustDivider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { height: 58 + insets.bottom, paddingBottom: Math.max(3, insets.bottom) }]}>
        {bottomTabs.map(({ title, Icon, route, params }) => {
          const active = title === 'Services';
          return (
            <Pressable
              key={title}
              style={styles.navItem}
              onPress={() => route && navigation.navigate(route, params)}
              accessibilityRole="button"
            >
              <Icon color={active ? '#F5A400' : '#6B7280'} size={19} strokeWidth={2.1} />
              <Text style={[styles.navText, active && styles.navTextActive]}>{title}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  header: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 31,
    height: 31,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 2
  },
  iconPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  notificationButton: { position: 'relative' },
  notificationDot: {
    position: 'absolute',
    right: 2,
    top: 1,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F5A400'
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  hero: {
    minHeight: 206,
    position: 'relative',
    justifyContent: 'flex-start'
  },
  heroCopy: {
    zIndex: 2
  },
  pill: {
    alignSelf: 'flex-start',
    minHeight: 26,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F3DCA8'
  },
  pillText: { color: '#E8A000', fontSize: 8.5, fontWeight: '900' },
  heading: { marginTop: 26, color: '#10213A', fontSize: 24, lineHeight: 28, fontWeight: '900', letterSpacing: 0 },
  headingDark: { color: '#10213A' },
  headingGold: { color: '#E8A000' },
  subtitle: { marginTop: 8, color: '#526174', fontSize: 11, lineHeight: 15, fontWeight: '700' },
  underline: { width: 32, height: 3, borderRadius: 999, backgroundColor: '#E8A000', marginTop: 9 },
  primaryCta: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5A400',
    marginTop: 9,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 11,
    elevation: 3
  },
  primaryCtaText: { flex: 1, color: '#10213A', textAlign: 'center', fontSize: 10.5, fontWeight: '900' },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  heroImageWrap: {
    position: 'absolute',
    right: -10,
    top: 5,
    zIndex: 1
  },
  serviceTrack: { flexDirection: 'row', gap: 8, paddingTop: 2 },
  serviceCard: {
    height: 80,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2
  },
  serviceText: { color: '#10213A', fontSize: 8.2, fontWeight: '900', textAlign: 'center' },
  trustStrip: {
    minHeight: 47,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2
  },
  trustItem: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 3 },
  trustIcon: { width: 24, height: 24, borderRadius: 999, backgroundColor: '#ECF8EF', alignItems: 'center', justifyContent: 'center' },
  trustText: { flexShrink: 1, color: '#10213A', fontSize: 7.8, fontWeight: '900' },
  trustDivider: { position: 'absolute', right: 0, width: 1, height: 28, backgroundColor: '#E7DFD1' },
  plansSection: { paddingTop: 4 },
  sectionTitle: { color: '#10213A', fontSize: 15, fontWeight: '900', letterSpacing: 0 },
  sectionUnderline: { width: 42, height: 3, borderRadius: 999, backgroundColor: '#E8A000', marginTop: 8, marginBottom: 10 },
  planTrack: { flexDirection: 'row', gap: 12 },
  planCard: {
    height: 352,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  planCardHighlighted: { borderColor: '#F5A400', borderWidth: 1.5, backgroundColor: '#FFFDF8', paddingTop: 24 },
  planBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    height: 22,
    borderRadius: 999,
    backgroundColor: '#E8A000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3
  },
  planBadgeText: { color: '#FFFFFF', fontSize: 8.2, fontWeight: '900' },
  planIcon: { width: 52, height: 52, borderRadius: 999, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  planIconHighlighted: { backgroundColor: '#FFF0C6' },
  planTitle: { marginTop: 9, color: '#10213A', fontSize: 14, lineHeight: 17, fontWeight: '900', textAlign: 'center' },
  planSubtitle: { marginTop: 2, color: '#6B7280', fontSize: 10.5, fontWeight: '800', textAlign: 'center' },
  planSubtitleHighlighted: { color: '#B07800' },
  planDivider: { width: '100%', height: 1, backgroundColor: '#E8DED2', marginTop: 12, marginBottom: 10 },
  planPriceRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  planPrice: { color: '#10213A', textAlign: 'center', fontSize: 18, lineHeight: 22, fontWeight: '900' },
  planPriceMeta: { color: '#526174', fontSize: 10, lineHeight: 16, fontWeight: '800' },
  featureBox: {
    width: '100%',
    height: 112,
    marginTop: 12,
    justifyContent: 'center'
  },
  premiumFeatureBox: {
    width: '100%',
    height: 112,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3DCA8',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1
  },
  premiumFeatureContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20
  },
  featureFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.86)'
  },
  planFeatureRow: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E7D7'
  },
  planFeatureText: { flex: 1, color: '#10213A', fontSize: 9.5, lineHeight: 13, fontWeight: '800' },
  visitBadge: {
    minWidth: 112,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    marginTop: 11
  },
  visitBadgeHighlighted: { backgroundColor: '#FFF5DE' },
  planVisits: { color: '#4B5563', textAlign: 'center', fontSize: 10, fontWeight: '900' },
  planVisitsHighlighted: { color: '#B07800' },
  selectButton: {
    width: '100%',
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: 'auto'
  },
  selectButtonOutline: { borderWidth: 1.2, borderColor: '#F5A400', backgroundColor: '#FFFFFF' },
  selectButtonFilled: { backgroundColor: '#F5A400' },
  selectButtonText: { color: '#E39A00', fontSize: 10, fontWeight: '900' },
  selectButtonTextFilled: { color: '#10213A' },
  promoStrip: {
    minHeight: 62,
    borderRadius: 10,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F3DCA8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    overflow: 'hidden'
  },
  promoIcon: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#FFF0C6', alignItems: 'center', justifyContent: 'center' },
  promoCopy: { flex: 1 },
  promoTitle: { color: '#10213A', fontSize: 10.5, fontWeight: '900', lineHeight: 13 },
  promoText: { marginTop: 3, color: '#334155', fontSize: 8.5, fontWeight: '700', lineHeight: 11 },
  promoChecklist: { width: 38, alignItems: 'center', justifyContent: 'center' },
  promoBolt: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 16,
    backgroundColor: '#F5A400',
    transform: [{ skewX: '-18deg' }]
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.8)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center'
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { color: '#6B7280', fontSize: 8.5, fontWeight: '800' },
  navTextActive: { color: '#F5A400' }
});
