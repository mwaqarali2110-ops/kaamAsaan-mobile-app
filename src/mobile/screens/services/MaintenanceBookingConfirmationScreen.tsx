import React, { useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarPlus, Home, ListChecks, XCircle } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import { canCancelMaintenanceRequest } from '@/services/maintenance.api';
import type { MaintenanceBooking, MaintenanceCancellationReason } from '@/types/maintenance.types';

const maintenanceRequestImage = require('@/assets/services/maintenance-request-transparent.png');
const cancellationReasons: MaintenanceCancellationReason[] = [
  'Schedule not suitable',
  'Booked by mistake',
  'No longer required',
  'Price concern',
  'Other'
];

export const MaintenanceBookingConfirmationScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const latestBooking = useMaintenanceBookingStore((state) => state.latestBooking);
  const bookings = useMaintenanceBookingStore((state) => state.bookings);
  const cancelBooking = useMaintenanceBookingStore((state) => state.cancelBooking);
  const routeBooking = route.params?.booking as MaintenanceBooking | undefined;
  const requestId = routeBooking?.id ?? latestBooking?.id;
  const booking = bookings.find((item) => item.id === requestId)
    ?? (latestBooking?.id === requestId ? latestBooking : undefined)
    ?? routeBooking;
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<MaintenanceCancellationReason | undefined>();
  const [otherReason, setOtherReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState('');
  const isCancelled = booking?.status === 'cancelled';
  const canCancel = canCancelMaintenanceRequest(booking?.status);
  const plan = booking?.plan.title ?? 'Premium Care';
  const reference = booking?.referenceNumber ?? 'Unavailable';
  const schedule = booking ? `${booking.preferredDate}, ${booking.preferredTimeSlot}` : 'Not available';
  const details = [
    { label: 'Plan', value: plan },
    { label: 'Reference', value: reference },
    { label: 'Schedule', value: schedule }
  ];
  const handleTrackProject = () => navigation.navigate('PremiumCareProgress', {
    planId: booking?.maintenancePlanId ?? undefined,
    requestId: booking?.id
  });
  const handleBackHome = () => navigation.navigate('MainTabs', { screen: 'Home' });
  const handleBookAgain = () => {
    if (!booking) return;
    navigation.navigate('MaintenanceBooking', { plan: booking.plan });
  };
  const closeCancelModal = () => {
    if (cancelling) return;
    setCancelModalVisible(false);
    setCancellationError('');
  };
  const confirmCancellation = async () => {
    if (!booking || !canCancel || cancelling) return;
    setCancelling(true);
    setCancellationError('');
    try {
      await cancelBooking(
        booking.id,
        selectedReason,
        selectedReason === 'Other' ? otherReason : undefined
      );
      setCancelModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      AccessibilityInfo.announceForAccessibility('Maintenance request cancelled successfully.');
      Alert.alert('Request cancelled', 'Maintenance request cancelled successfully.');
    } catch {
      setCancellationError('Unable to cancel the request. Please try again.');
      AccessibilityInfo.announceForAccessibility('Unable to cancel the request. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(80, insets.bottom + 80) }]}
        showsVerticalScrollIndicator={false}
      >
        <Image source={maintenanceRequestImage} style={styles.successImage} resizeMode="contain" />

        <Text style={styles.title}>{isCancelled ? 'Maintenance request cancelled' : 'Maintenance request received'}</Text>
        <Text style={styles.message}>
          {isCancelled ? 'Your maintenance request has been cancelled successfully.' : 'Our team will contact you shortly.'}
        </Text>

        <View style={styles.detailsCard}>
          {details.map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          {isCancelled ? (
            <>
              <Pressable style={styles.primaryActionButton} onPress={handleBackHome} accessibilityRole="button" accessibilityLabel="Back to Home">
                <Home size={22} color="#0F172A" />
                <Text style={styles.primaryActionText}>Back to Home</Text>
              </Pressable>
              <Pressable style={styles.secondaryActionButton} onPress={handleBookAgain} accessibilityRole="button" accessibilityLabel="Book maintenance again">
                <CalendarPlus size={22} color="#EAB308" />
                <Text style={styles.secondaryActionText}>Book Again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.primaryActionButton} onPress={handleTrackProject} accessibilityRole="button">
                <ListChecks size={22} color="#0F172A" />
                <Text style={styles.primaryActionText}>Track in My Project</Text>
              </Pressable>

              <Pressable style={styles.secondaryActionButton} onPress={handleBackHome} accessibilityRole="button">
                <Home size={22} color="#EAB308" />
                <Text style={styles.secondaryActionText}>Back to Home</Text>
              </Pressable>

              {canCancel ? (
                <Pressable
                  style={styles.cancelActionButton}
                  onPress={() => setCancelModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel maintenance request"
                  accessibilityHint="Opens a confirmation dialog for this destructive action"
                >
                  <XCircle size={20} color="#A44B4B" />
                  <Text style={styles.cancelActionText}>Cancel Request</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
        statusBarTranslucent
      >
        <Pressable
          style={[
            styles.modalBackdrop,
            { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }
          ]}
          onPress={closeCancelModal}
          accessibilityRole="none"
        >
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <ScrollView
              contentContainerStyle={styles.modalCardContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.modalIcon}>
              <XCircle size={24} color="#A44B4B" strokeWidth={2.2} />
            </View>
            <Text style={styles.modalTitle}>Cancel maintenance request?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this request? Your scheduled maintenance visit will be removed.
            </Text>

            <Text style={styles.reasonLabel}>Reason (optional)</Text>
            <View style={styles.reasonList}>
              {cancellationReasons.map((reason) => (
                <Pressable
                  key={reason}
                  style={[styles.reasonChip, selectedReason === reason && styles.reasonChipSelected]}
                  onPress={() => setSelectedReason(reason)}
                  disabled={cancelling}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedReason === reason, disabled: cancelling }}
                >
                  <Text style={[styles.reasonChipText, selectedReason === reason && styles.reasonChipTextSelected]}>{reason}</Text>
                </Pressable>
              ))}
            </View>
            {selectedReason === 'Other' ? (
              <TextInput
                style={styles.otherInput}
                value={otherReason}
                onChangeText={setOtherReason}
                placeholder="Add a short reason"
                placeholderTextColor="#94A3B8"
                editable={!cancelling}
                maxLength={240}
              />
            ) : null}
            {cancellationError ? <Text style={styles.modalError} accessibilityLiveRegion="polite">{cancellationError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.keepRequestButton, cancelling && styles.actionDisabled]}
                onPress={closeCancelModal}
                disabled={cancelling}
                accessibilityRole="button"
                accessibilityLabel="Keep maintenance request"
              >
                <Text style={styles.keepRequestText}>Keep Request</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmCancelButton, cancelling && styles.actionDisabled]}
                onPress={() => void confirmCancellation()}
                disabled={cancelling}
                accessibilityRole="button"
                accessibilityLabel={cancelling ? 'Cancelling maintenance request' : 'Confirm cancel maintenance request'}
                accessibilityState={{ disabled: cancelling, busy: cancelling }}
              >
                {cancelling ? <ActivityIndicator size="small" color="#FFFFFF" /> : <XCircle size={16} color="#FFFFFF" />}
                <Text style={styles.confirmCancelText}>{cancelling ? 'Cancelling...' : 'Cancel Request'}</Text>
              </Pressable>
            </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 14
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
    fontSize: 18,
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
  },
  cancelActionButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9A3A3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  },
  cancelActionText: { color: '#A44B4B', fontSize: 15, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '100%',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0'
  },
  modalCardContent: { padding: 20 },
  modalIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FCEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalTitle: { color: '#0F172A', fontSize: 20, lineHeight: 25, fontWeight: '900' },
  modalMessage: { color: '#64748B', fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 7 },
  reasonLabel: { color: '#334155', fontSize: 12, fontWeight: '800', marginTop: 17, marginBottom: 9 },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reasonChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reasonChipSelected: { borderColor: '#D9A3A3', backgroundColor: '#FCEAEA' },
  reasonChipText: { color: '#526174', fontSize: 12, fontWeight: '700' },
  reasonChipTextSelected: { color: '#8D3F3F', fontWeight: '800' },
  otherInput: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D9A3A3',
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    marginTop: 10
  },
  modalError: { color: '#A33D3D', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  keepRequestButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  keepRequestText: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  confirmCancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#A44B4B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  confirmCancelText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  actionDisabled: { opacity: 0.58 }
});
