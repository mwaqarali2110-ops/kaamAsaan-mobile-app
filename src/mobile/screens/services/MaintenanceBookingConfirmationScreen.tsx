import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Home, ListChecks } from 'lucide-react-native';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import type { MaintenanceBooking } from '@/types/maintenance.types';

export const MaintenanceBookingConfirmationScreen = ({ navigation, route }: any) => {
  const latestBooking = useMaintenanceBookingStore((state) => state.latestBooking);
  const booking = (route.params?.booking ?? latestBooking) as MaintenanceBooking | undefined;

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <CheckCircle2 color="#16A34A" size={42} strokeWidth={2.3} />
        </View>
        <Text style={styles.title}>Maintenance request received</Text>
        <Text style={styles.message}>Our team will contact you shortly.</Text>

        {booking ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{booking.plan.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reference</Text>
              <Text style={styles.summaryValue}>{booking.referenceNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Schedule</Text>
              <Text style={styles.summaryValue}>{booking.preferredDate}, {booking.preferredTimeSlot}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('MainTabs', { screen: 'MyProject' })} accessibilityRole="button">
            <ListChecks color="#10213A" size={18} strokeWidth={2.4} />
            <Text style={styles.primaryButtonText}>Track in My Project</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} accessibilityRole="button">
            <Home color="#E8A000" size={18} strokeWidth={2.4} />
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  content: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 76, height: 76, borderRadius: 999, backgroundColor: '#ECF8EF', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, color: '#10213A', fontSize: 22, lineHeight: 27, fontWeight: '900', textAlign: 'center' },
  message: { marginTop: 7, color: '#526174', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  summaryCard: { alignSelf: 'stretch', marginTop: 20, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED2', padding: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryLabel: { color: '#526174', fontSize: 11.5, fontWeight: '800' },
  summaryValue: { flex: 1, color: '#10213A', fontSize: 11.5, fontWeight: '900', textAlign: 'right' },
  actions: { alignSelf: 'stretch', marginTop: 22, gap: 10 },
  primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: '#F5A400', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  secondaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F5A400', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButtonText: { color: '#E8A000', fontSize: 13.5, fontWeight: '900' }
});
