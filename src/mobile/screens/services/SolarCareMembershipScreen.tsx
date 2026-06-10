import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Bell, Check, MessageCircle, Shield, ShieldCheck, Star, Zap } from 'lucide-react-native';

const plans = [
  { name: 'MONTHLY', price: '1,500', period: '/ month', visits: '1 visit / month' },
  { name: 'QUARTERLY', price: '3,800', period: '/ quarter', visits: '3 visits / quarter', save: 'Save PKR 700' },
  { name: 'YEARLY', price: '12,500', period: '/ year', visits: '12 visits / year', save: 'Save PKR 5,500', badge: 'Best Value' }
];

const benefits = [
  { text: 'Priority technician support (24h)', Icon: Star },
  { text: 'Discounted emergency callouts', Icon: Zap },
  { text: 'Real-time performance alerts', Icon: Shield },
  { text: 'Annual warranty assistance', Icon: Check },
  { text: 'Monthly generation reports', Icon: Bell }
];

export const SolarCareMembershipScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.shell} edges={['top']}>
    <View style={styles.topBar}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
        <ArrowLeft color="#111827" size={18} strokeWidth={2.3} />
      </Pressable>
      <Text style={styles.topTitle}>Solar Care Membership</Text>
      <View style={styles.topSpacer} />
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Shield color="#F5A400" size={24} strokeWidth={1.9} />
        </View>
        <Text style={styles.heroTitle}>KaamAsaan{'\n'}Solar Care Membership</Text>
        <Text style={styles.heroText}>
          Protect your investment with scheduled visits, priority support and performance monitoring.
        </Text>
      </View>

      <View style={styles.planRow}>
        {plans.map((plan) => (
          <View key={plan.name} style={styles.planCard}>
            {plan.badge ? (
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>{plan.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceLine}>
              <Text style={styles.currency}>PKR </Text>
              <Text style={[styles.planPrice, plan.name === 'YEARLY' && styles.yearlyPrice]}>{plan.price}</Text>
            </View>
            <Text style={styles.planPeriod}>{plan.period}</Text>
            <Text style={styles.planVisits}>{plan.visits}</Text>
            {plan.save ? (
              <View style={styles.savePill}>
                <Text style={styles.saveText}>{plan.save}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>MEMBERSHIP BENEFITS</Text>
      <View style={styles.benefitsCard}>
        {benefits.map((benefit, index) => (
          <View key={benefit.text} style={[styles.benefitRow, index < benefits.length - 1 && styles.benefitBorder]}>
            <View style={styles.benefitIcon}>
              <benefit.Icon color="#F5A400" size={14} strokeWidth={2.1} />
            </View>
            <Text style={styles.benefitText}>{benefit.text}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.cancelText}>Cancel anytime. No lock-in commitment.</Text>
    </ScrollView>

    <Pressable style={styles.chatButton} accessibilityLabel="WhatsApp help">
      <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
    </Pressable>

    <View style={styles.footer}>
      <Pressable style={styles.subscribeButton}>
        <Text style={styles.subscribeText}>Subscribe Now</Text>
        <ArrowRight color="#111827" size={17} strokeWidth={2.4} />
      </Pressable>
      <Pressable style={styles.skipButton} onPress={() => navigation.goBack()}>
        <Text style={styles.skipText}>Continue Without Membership</Text>
      </Pressable>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8F3E8' },
  topBar: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,211,203,0.65)',
    backgroundColor: '#FBF8F1'
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topTitle: { flex: 1, color: '#172031', textAlign: 'center', fontSize: 13, fontWeight: '900' },
  topSpacer: { width: 32 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 144 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F5C542',
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  heroTitle: { color: '#111827', textAlign: 'center', fontSize: 18, lineHeight: 21, fontWeight: '900', marginBottom: 8 },
  heroText: { color: '#334155', textAlign: 'center', fontSize: 11.5, lineHeight: 17, fontWeight: '600', paddingHorizontal: 20 },
  planRow: { flexDirection: 'row', gap: 7, marginBottom: 17 },
  planCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9BE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingTop: 13,
    paddingBottom: 8,
    position: 'relative'
  },
  bestBadge: {
    position: 'absolute',
    top: -9,
    right: 8,
    borderRadius: 999,
    backgroundColor: '#FDB813',
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  bestBadgeText: { color: '#111827', fontSize: 7.5, fontWeight: '900' },
  planName: { color: '#8B7254', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 },
  priceLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  currency: { color: '#172031', fontSize: 8, fontWeight: '900', marginBottom: 2 },
  planPrice: { color: '#111827', fontSize: 16, fontWeight: '900' },
  yearlyPrice: { color: '#F5A400' },
  planPeriod: { color: '#172031', fontSize: 8.5, fontWeight: '800', marginTop: 3 },
  planVisits: { color: '#172031', fontSize: 8.5, fontWeight: '900', marginTop: 4 },
  savePill: { backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 5 },
  saveText: { color: '#16A34A', fontSize: 7.5, fontWeight: '900' },
  sectionLabel: { color: '#8B7254', fontSize: 10, fontWeight: '900', letterSpacing: 1.9, marginBottom: 10 },
  benefitsCard: {
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(221,211,194,0.8)',
    overflow: 'hidden',
    marginBottom: 18
  },
  benefitRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  benefitBorder: { borderBottomWidth: 1, borderBottomColor: '#EFE7D8' },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  benefitText: { flex: 1, color: '#172031', fontSize: 12, fontWeight: '900' },
  cancelText: { color: '#7C6F5F', textAlign: 'center', fontSize: 10.5, fontWeight: '600' },
  chatButton: {
    position: 'absolute',
    right: 17,
    bottom: 98,
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: '#F8F3E8'
  },
  subscribeButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  subscribeText: { color: '#111827', fontSize: 12.5, fontWeight: '900' },
  skipButton: {
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9BE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  skipText: { color: '#172031', fontSize: 11.5, fontWeight: '900' }
});
