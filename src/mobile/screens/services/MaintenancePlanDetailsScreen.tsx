import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react-native';
import { formatMaintenancePrice } from '@/data/maintenancePlans';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import type { MaintenancePlanSelection } from '@/types/maintenance.types';

const includedServices = ['Cleaning', 'Inspection', 'Thermal Scan', 'Service Report'];

export const MaintenancePlanDetailsScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const storedPlan = useMaintenanceBookingStore((state) => state.selectedPlan);
  const setSelectedPlan = useMaintenanceBookingStore((state) => state.setSelectedPlan);
  const plan = (route.params?.plan ?? storedPlan) as MaintenancePlanSelection | undefined;

  const continueToBooking = () => {
    if (!plan) {
      navigation.replace('PreventiveMaintenance');
      return;
    }

    setSelectedPlan(plan);
    navigation.navigate('MaintenanceBooking', { plan });
  };

  if (!plan) {
    return (
      <SafeAreaView style={styles.shell} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back" accessibilityRole="button">
            <ArrowLeft color="#10213A" size={20} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.topTitle}>Plan Details</Text>
          <View style={styles.topSpacer} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No plan selected</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.replace('PreventiveMaintenance')} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Choose a Plan</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back" accessibilityRole="button">
          <ArrowLeft color="#10213A" size={20} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topTitle}>Plan Details</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: 112 + safeBottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.planCard}>
          <View style={styles.planIcon}>
            <ShieldCheck color="#E8A000" size={28} strokeWidth={2.3} />
          </View>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planFrequency}>{plan.frequency}</Text>
          <Text style={styles.planPrice}>{formatMaintenancePrice(plan.price)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Included Services</Text>
          {includedServices.map((service) => (
            <View key={service} style={styles.serviceRow}>
              <View style={styles.checkWrap}>
                <Check color="#16A34A" size={12} strokeWidth={2.7} />
              </View>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + safeBottom }]}>
        <Pressable style={styles.primaryButton} onPress={continueToBooking} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Continue to Booking</Text>
          <ArrowRight color="#10213A" size={18} strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(218,211,203,0.65)' },
  backButton: { width: 36, height: 36, borderRadius: 999, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', color: '#10213A', fontSize: 15, fontWeight: '900' },
  topSpacer: { width: 36 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 112, gap: 12 },
  planCard: { borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', padding: 18, borderWidth: 1, borderColor: '#E8DED2' },
  planIcon: { width: 58, height: 58, borderRadius: 999, backgroundColor: '#FFF0C6', alignItems: 'center', justifyContent: 'center' },
  planTitle: { marginTop: 12, color: '#10213A', fontSize: 22, fontWeight: '900' },
  planFrequency: { marginTop: 5, color: '#526174', fontSize: 12, fontWeight: '800' },
  planPrice: { marginTop: 12, color: '#10213A', fontSize: 24, fontWeight: '900' },
  section: { borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#E8DED2' },
  sectionTitle: { color: '#10213A', fontSize: 15, fontWeight: '900', marginBottom: 10 },
  serviceRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkWrap: { width: 22, height: 22, borderRadius: 999, backgroundColor: '#ECF8EF', alignItems: 'center', justifyContent: 'center' },
  serviceText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 14 },
  emptyTitle: { color: '#10213A', fontSize: 16, fontWeight: '900' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: '#FBF8F1' },
  primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: '#F5A400', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  primaryButtonText: { color: '#10213A', fontSize: 14, fontWeight: '900' }
});
