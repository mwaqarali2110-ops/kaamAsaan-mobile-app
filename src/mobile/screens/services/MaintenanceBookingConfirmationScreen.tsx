import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ListChecks } from 'lucide-react-native';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import type { MaintenanceBooking } from '@/types/maintenance.types';

const maintenanceRequestImage = require('@/assets/services/maintenance-request-transparent.png');

export const MaintenanceBookingConfirmationScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const latestBooking = useMaintenanceBookingStore((state) => state.latestBooking);
  const booking = (route.params?.booking ?? latestBooking) as MaintenanceBooking | undefined;
  const plan = booking?.plan.title ?? 'Premium Care';
  const reference = booking?.referenceNumber ?? 'KM-MNT-583925';
  const schedule = booking ? `${booking.preferredDate}, ${booking.preferredTimeSlot}` : 'Hg, Bb';
  const details = [
    { label: 'Plan', value: plan },
    { label: 'Reference', value: reference },
    { label: 'Schedule', value: schedule }
  ];
  const handleTrackProject = () => navigation.navigate('MainTabs', { screen: 'MyProject' });
  const handleBackHome = () => navigation.navigate('MainTabs', { screen: 'Home' });

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(80, insets.bottom + 80) }]}
        showsVerticalScrollIndicator={false}
      >
        <Image source={maintenanceRequestImage} style={styles.successImage} resizeMode="contain" />

        <Text style={styles.title}>Maintenance request received</Text>
        <Text style={styles.message}>Our team will contact you shortly.</Text>

        <View style={styles.detailsCard}>
          {details.map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <Pressable style={styles.primaryActionButton} onPress={handleTrackProject} accessibilityRole="button">
            <ListChecks size={22} color="#0F172A" />
            <Text style={styles.primaryActionText}>Track in My Project</Text>
          </Pressable>

          <Pressable style={styles.secondaryActionButton} onPress={handleBackHome} accessibilityRole="button">
            <Home size={22} color="#EAB308" />
            <Text style={styles.secondaryActionText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#FFF9ED'
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successImage: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginBottom: 24
  },
  title: {
    paddingHorizontal: 20,
    color: '#0F172A',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    paddingHorizontal: 20,
    color: '#64748B',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28
  },
  detailsCard: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E8DED0',
    shadowColor: '#7A6A52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginVertical: 6
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800'
  },
  detailValue: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'right'
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 28,
    gap: 16
  },
  primaryActionButton: {
    width: '100%',
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#D99A00',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  primaryActionText: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800'
  },
  secondaryActionButton: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  secondaryActionText: {
    color: '#EAB308',
    fontSize: 16,
    fontWeight: '800'
  }
});
