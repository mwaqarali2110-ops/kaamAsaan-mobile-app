import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, FileText, Home, MessageCircle, ShieldCheck, ShoppingBag, Sun, User, Wrench, Zap } from 'lucide-react-native';

const heroImage = require('../../../assets/services/preventive-maintenance.png');

const benefits = [
  { title: 'Higher Efficiency', copy: 'Optimal performance for maximum savings.', Icon: Zap },
  { title: 'System Safety', copy: 'Ensure safe operation and prevent risks.', Icon: ShieldCheck },
  { title: 'Longer Life', copy: 'Extend the life of your solar investment.', Icon: Clock3 }
];

const miniCards = [
  { title: 'Certified technicians', Icon: CheckCircle2 },
  { title: 'Inspection checklist', Icon: ClipboardCheck },
  { title: 'Service report', Icon: FileText }
];

const bottomTabs = [
  { title: 'Home', Icon: Home, route: 'MainTabs', params: { screen: 'Home' } },
  { title: 'Marketplace', Icon: ShoppingBag, route: 'MainTabs', params: { screen: 'Marketplace' } },
  { title: 'Services', Icon: ShieldCheck },
  { title: 'Tools', Icon: Wrench, route: 'DesignFlow' },
  { title: 'Profile', Icon: User, route: 'MainTabs', params: { screen: 'Profile' } }
];

export const PreventiveMaintenanceScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.shell} edges={['top']}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
        <ArrowLeft color="#111827" size={20} strokeWidth={2.2} />
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.pill}>
            <Sun color="#D18B00" size={11} strokeWidth={2.2} />
            <Text style={styles.pillText}>SOLAR CARE</Text>
          </View>
          <Text style={styles.heading}>
            <Text style={styles.headingDark}>Preventive{'\n'}</Text>
            <Text style={styles.headingGold}>Maintenance</Text>
          </Text>
          <View style={styles.underline} />
          <Text style={styles.description}>Keep your solar system efficient, safe and long-lasting with regular professional maintenance.</Text>
          <Pressable style={styles.cta} onPress={() => navigation.navigate('MaintenancePackages')}>
            <ShieldCheck color="#7A5200" size={17} strokeWidth={2.2} />
            <Text style={styles.ctaText}>View Maintenance{'\n'}Packages</Text>
            <ArrowRight color="#111827" size={18} strokeWidth={2.5} />
          </Pressable>
        </View>
        <Image source={heroImage} style={styles.heroImage} resizeMode="contain" />
      </View>

      <View style={styles.benefits}>
        {benefits.map(({ title, copy, Icon }) => (
          <View key={title} style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Icon color="#D99A00" size={27} strokeWidth={1.9} />
            </View>
            <Text style={styles.benefitTitle}>{title}</Text>
            <Text style={styles.benefitCopy}>{copy}</Text>
          </View>
        ))}
      </View>

      <View style={styles.miniRow}>
        {miniCards.map(({ title, Icon }) => (
          <View key={title} style={styles.miniCard}>
            <Icon color="#16A34A" size={15} strokeWidth={2.2} />
            <Text style={styles.miniText}>{title}</Text>
          </View>
        ))}
      </View>
    </ScrollView>

    <Pressable style={styles.chatButton} accessibilityLabel="WhatsApp help">
      <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
    </Pressable>

    <View style={styles.bottomNav}>
      {bottomTabs.map(({ title, Icon, route, params }) => {
        const active = title === 'Home';
        return (
          <Pressable key={title} style={styles.navItem} onPress={() => route && navigation.navigate(route, params)}>
            <Icon color={active ? '#F5A400' : '#8A94A6'} size={18} strokeWidth={2.1} />
            <Text style={[styles.navText, active && styles.navTextActive]}>{title}</Text>
          </Pressable>
        );
      })}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 98 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  hero: {
    minHeight: 318,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  heroCopy: {
    width: '53%',
    zIndex: 2
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: 15,
    shadowColor: '#8B6F2D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2
  },
  pillText: { color: '#D18B00', fontSize: 9, fontWeight: '900' },
  heading: { fontSize: 31, lineHeight: 33, letterSpacing: -1.1, fontWeight: '900' },
  headingDark: { color: '#111827' },
  headingGold: { color: '#D99A00' },
  underline: { width: 32, height: 4, borderRadius: 999, backgroundColor: '#D99A00', marginTop: 10, marginBottom: 12 },
  description: { color: '#46566C', fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  cta: {
    marginTop: 18,
    width: 202,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F5A400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 4
  },
  ctaText: { color: '#111827', fontSize: 12, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  heroImage: {
    position: 'absolute',
    right: -24,
    top: -6,
    width: 226,
    height: 218
  },
  benefits: {
    marginTop: 30,
    flexDirection: 'row',
    gap: 8
  },
  benefitCard: {
    flex: 1,
    minHeight: 136,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2
  },
  benefitIcon: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F7E4B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13
  },
  benefitTitle: { color: '#172031', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  benefitCopy: { marginTop: 7, color: '#46566C', fontSize: 9, lineHeight: 12, fontWeight: '700', textAlign: 'center' },
  miniRow: {
    marginTop: 12,
    minHeight: 70,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2
  },
  miniCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 5 },
  miniText: { color: '#46566C', fontSize: 9.5, fontWeight: '800', textAlign: 'center' },
  chatButton: {
    position: 'absolute',
    right: 18,
    bottom: 82,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#08213F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#08213F',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.8)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { color: '#8A94A6', fontSize: 9, fontWeight: '800' },
  navTextActive: { color: '#F5A400' }
});
