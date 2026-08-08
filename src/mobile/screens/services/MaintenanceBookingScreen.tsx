import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Clock3, Home, Phone, User } from 'lucide-react-native';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveSurveyJourney } from '@/hooks/useSurveyJourney';
import type { MaintenancePlanSelection } from '@/types/maintenance.types';

const Field = ({
  Icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline
}: {
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) => (
  <View style={[styles.field, multiline && styles.fieldMultiline]}>
    <Icon color="#526174" size={17} strokeWidth={2.2} />
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

export const MaintenanceBookingScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);
  const storedPlan = useMaintenanceBookingStore((state) => state.selectedPlan);
  const createBooking = useMaintenanceBookingStore((state) => state.createBooking);
  const activeJourneyQuery = useActiveSurveyJourney(userId);
  const plan = (route.params?.plan ?? storedPlan) as MaintenancePlanSelection | undefined;
  const [submitting, setSubmitting] = useState(false);
  const initialValues = route.params?.initialValues;
  const [name, setName] = useState(initialValues?.customerName ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [city, setCity] = useState(initialValues?.city ?? '');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const idempotencyKey = useRef<string | null>(null);

  const submit = async () => {
    if (submitting) return;
    if (!plan) {
      navigation.replace('PreventiveMaintenance');
      return;
    }
    if (activeJourneyQuery.isLoading) {
      Alert.alert('Checking eligibility', 'Please wait while we check your current solar project status.');
      return;
    }
    if (activeJourneyQuery.data) {
      navigation.replace('PreventiveMaintenance', { showActiveInstallationBlocked: true });
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !preferredDate.trim() || !preferredTimeSlot.trim()) {
      Alert.alert('Missing details', 'Please fill name, phone, address, city, date and time slot.');
      return;
    }

    setSubmitting(true);
    idempotencyKey.current ??= `premium-care-${userId ?? 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const booking = await createBooking({
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        preferredDate: preferredDate.trim(),
        preferredTimeSlot: preferredTimeSlot.trim(),
        notes: notes.trim()
      }, idempotencyKey.current);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['premium-care-lifecycle'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      ]);
      navigation.replace('MaintenanceBookingConfirmation', { booking });
    } catch (error) {
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back" accessibilityRole="button">
          <ArrowLeft color="#10213A" size={19} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topTitle}>Book Maintenance</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: 112 + safeBottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {plan ? (
            <View style={styles.planStrip}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planMeta}>{plan.frequency}</Text>
            </View>
          ) : null}

          <Field Icon={User} placeholder="Customer name" value={name} onChangeText={setName} />
          <Field Icon={Phone} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field Icon={Home} placeholder="Address" value={address} onChangeText={setAddress} />
          <Field Icon={Building2} placeholder="City" value={city} onChangeText={setCity} />
          <Field Icon={CalendarDays} placeholder="Preferred date" value={preferredDate} onChangeText={setPreferredDate} />
          <Field Icon={Clock3} placeholder="Preferred time slot" value={preferredTimeSlot} onChangeText={setPreferredTimeSlot} />
          <Field Icon={ArrowRight} placeholder="Notes optional" value={notes} onChangeText={setNotes} multiline />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: 14 + safeBottom }]}>
        <Pressable style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]} onPress={submit} disabled={submitting} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>{submitting ? 'Booking...' : 'Book Maintenance'}</Text>
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
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 112, gap: 10 },
  planStrip: { borderRadius: 14, backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#F3DCA8', padding: 12 },
  planTitle: { color: '#10213A', fontSize: 15, fontWeight: '900' },
  planMeta: { marginTop: 3, color: '#526174', fontSize: 11, fontWeight: '800' },
  field: { minHeight: 48, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED2', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  fieldMultiline: { minHeight: 88, alignItems: 'flex-start', paddingTop: 13 },
  input: { flex: 1, color: '#10213A', fontSize: 13, fontWeight: '700', paddingVertical: 0 },
  inputMultiline: { minHeight: 60 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: '#FBF8F1' },
  primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: '#F5A400', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  primaryButtonDisabled: { opacity: 0.62 },
  primaryButtonText: { color: '#10213A', fontSize: 14, fontWeight: '900' }
});
