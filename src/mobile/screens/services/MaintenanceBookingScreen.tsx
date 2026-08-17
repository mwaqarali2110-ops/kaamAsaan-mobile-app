import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
  Wrench
} from 'lucide-react-native';
import { DatePickerSheet, formatDateKey, formatDisplayDate } from '@/components/ui/DatePickerSheet';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveSurveyJourney } from '@/hooks/useSurveyJourney';
import type { MaintenancePlanSelection } from '@/types/maintenance.types';

const TIME_SLOTS = ['Morning (9am - 12pm)', 'Afternoon (12pm - 4pm)', 'Evening (4pm - 7pm)'];

type FieldErrors = Partial<
  Record<'name' | 'phone' | 'address' | 'city' | 'preferredDate' | 'preferredTimeSlot', string>
>;

const Field = ({
  Icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline,
  error
}: {
  Icon: typeof Home;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
  error?: string;
}) => (
  <View>
    <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline, error && styles.inputError]}>
      <View style={[styles.inputIcon, multiline && styles.inputIconMultiline]}>
        <Icon color="#334155" size={22} strokeWidth={2.1} />
      </View>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  const [preferredDate, setPreferredDate] = useState<Date | null>(null);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const idempotencyKey = useRef<string | null>(null);

  const validate = () => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!phone.trim()) next.phone = 'Please enter a phone number.';
    if (!address.trim()) next.address = 'Please enter your address.';
    if (!city.trim()) next.city = 'Please enter your city.';
    if (!preferredDate) next.preferredDate = 'Please select a preferred date.';
    if (!preferredTimeSlot) next.preferredTimeSlot = 'Please choose a time slot.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitError('');
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
    if (!validate() || !preferredDate) return;

    setSubmitting(true);
    idempotencyKey.current ??= `premium-care-${userId ?? 'guest'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const booking = await createBooking({
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        preferredDate: formatDateKey(preferredDate),
        preferredTimeSlot,
        notes: notes.trim()
      }, idempotencyKey.current);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['premium-care-lifecycle'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      ]);
      navigation.replace('MaintenanceBookingConfirmation', { booking });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Booking failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <ArrowLeft color="#0F1E33" size={24} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Book Maintenance</Text>
        <View style={styles.topSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 120 + safeBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Wrench color="#F5A400" size={26} strokeWidth={2} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Let&apos;s schedule your maintenance</Text>
              <Text style={styles.heroText}>
                Pick a date and share your contact details. Our team will call to confirm the visit.
              </Text>
            </View>
          </View>

          {plan ? (
            <View style={styles.planStrip}>
              <View style={styles.planIcon}>
                <ShieldCheck color="#B77900" size={20} strokeWidth={2.2} />
              </View>
              <View style={styles.planCopy}>
                <Text style={styles.planLabel}>SELECTED PLAN</Text>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planMeta}>{plan.frequency}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionTitleRow}>
            <CalendarDays color="#0F1E33" size={24} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <Pressable
            style={[styles.dateField, errors.preferredDate && styles.inputError]}
            onPress={() => setCalendarOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select preferred maintenance date"
          >
            <View style={styles.inputIcon}>
              <CalendarDays color="#334155" size={20} strokeWidth={2.1} />
            </View>
            <Text style={[styles.dateFieldText, !preferredDate && styles.datePlaceholder]} numberOfLines={1}>
              {preferredDate ? formatDisplayDate(preferredDate) : 'Select maintenance date'}
            </Text>
            <ChevronDown color="#64748B" size={20} strokeWidth={2.3} />
          </Pressable>
          {errors.preferredDate ? <Text style={styles.errorText}>{errors.preferredDate}</Text> : null}

          <View style={[styles.sectionTitleRow, styles.sectionSpacing]}>
            <Clock3 color="#0F1E33" size={24} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>Preferred Time</Text>
          </View>
          <View style={styles.slotRow}>
            {TIME_SLOTS.map((slot) => {
              const selected = preferredTimeSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slotChip, selected && styles.slotChipSelected]}
                  onPress={() => {
                    setPreferredTimeSlot(slot);
                    setErrors((current) => ({ ...current, preferredTimeSlot: undefined }));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {selected ? (
                    <View style={styles.slotCheck}>
                      <Check color="#FFFFFF" size={12} strokeWidth={3.2} />
                    </View>
                  ) : null}
                  <Text style={[styles.slotText, selected && styles.slotTextSelected]}>{slot}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.preferredTimeSlot ? <Text style={styles.errorText}>{errors.preferredTimeSlot}</Text> : null}

          <View style={[styles.sectionTitleRow, styles.sectionSpacing]}>
            <User color="#0F1E33" size={24} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>Contact Details</Text>
          </View>
          <View style={styles.fields}>
            <Field Icon={User} placeholder="Full name" value={name} onChangeText={setName} error={errors.name} />
            <Field
              Icon={Phone}
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </View>

          <View style={styles.sectionTitleRow}>
            <MapPin color="#0F1E33" size={24} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>Service Address</Text>
          </View>
          <View style={styles.fields}>
            <Field
              Icon={Home}
              placeholder="House / flat number, street name"
              value={address}
              onChangeText={setAddress}
              error={errors.address}
            />
            <Field
              Icon={Building2}
              placeholder="City (e.g. Lahore, Karachi)"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />
          </View>

          <View style={styles.sectionTitleRow}>
            <MessageSquare color="#0F1E33" size={24} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <View style={styles.fields}>
            <Field
              Icon={MessageSquare}
              placeholder="Anything our technician should know (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <Text style={styles.timingNote}>Our team will contact you to confirm timing.</Text>

          <View style={styles.trustCard}>
            <View style={styles.trustIcon}>
              <ShieldCheck color="#FFFFFF" size={22} fill="#22A06B" strokeWidth={2.2} />
            </View>
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>Your information is safe with us</Text>
              <Text style={styles.trustText}>
                We only use your details to provide the best maintenance service.
              </Text>
            </View>
          </View>

          {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: 12 + safeBottom }]}>
        <Pressable
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={submit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting }}
        >
          <Text style={styles.confirmText}>{submitting ? 'Booking...' : 'Book Maintenance'}</Text>
          <ArrowRight color="#0F1E33" size={20} strokeWidth={2.5} />
        </Pressable>
      </View>

      <DatePickerSheet
        visible={calendarOpen}
        value={preferredDate}
        onCancel={() => setCalendarOpen(false)}
        onConfirm={(date) => {
          setPreferredDate(date);
          setErrors((current) => ({ ...current, preferredDate: undefined }));
          setCalendarOpen(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: { height: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  title: { flex: 1, color: '#0F1E33', textAlign: 'center', fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
  topSpacer: { width: 46 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  heroCard: {
    minHeight: 78,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F3DCA8',
    backgroundColor: '#FFF9EA',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    marginBottom: 13,
    overflow: 'hidden'
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F6D486',
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroCopy: { flex: 1, paddingLeft: 12, paddingRight: 4 },
  heroTitle: { color: '#0F1E33', fontSize: 14, fontWeight: '900', lineHeight: 16 },
  heroText: { marginTop: 3, color: '#334155', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  planStrip: {
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 16
  },
  planIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF3D4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  planCopy: { flex: 1, minWidth: 0 },
  planLabel: { color: '#9A7B33', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  planTitle: { marginTop: 3, color: '#0F1E33', fontSize: 15, fontWeight: '900' },
  planMeta: { marginTop: 2, color: '#64748B', fontSize: 12, fontWeight: '700' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  sectionSpacing: { marginTop: 4 },
  sectionTitle: { color: '#0F1E33', fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  dateField: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 12,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  dateFieldText: { flex: 1, color: '#0F1E33', fontSize: 14, fontWeight: '800' },
  datePlaceholder: { color: '#64748B', fontWeight: '600' },
  slotRow: { gap: 8, marginBottom: 12 },
  slotChip: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13
  },
  slotChipSelected: { borderColor: '#F5A400', backgroundColor: '#FFF9EA' },
  slotCheck: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#F5A400',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slotText: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '700' },
  slotTextSelected: { color: '#0F1E33', fontWeight: '900' },
  fields: { gap: 8, marginBottom: 12 },
  inputWrap: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13
  },
  inputWrapMultiline: { height: 96, alignItems: 'flex-start', paddingVertical: 11 },
  inputError: { borderColor: '#D9534F' },
  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFF3D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  inputIconMultiline: { marginTop: 1 },
  input: { flex: 1, color: '#0F1E33', fontSize: 14, fontWeight: '600' },
  inputMultiline: { height: 74, paddingTop: 2 },
  errorText: { marginTop: 5, marginBottom: 4, color: '#D9534F', fontSize: 11, fontWeight: '700' },
  timingNote: {
    marginTop: -2,
    marginBottom: 12,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  trustCard: {
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E9DA',
    backgroundColor: '#F5FBF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13
  },
  trustIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#22A06B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trustCopy: { flex: 1, minWidth: 0 },
  trustTitle: { color: '#0F1E33', fontSize: 14, fontWeight: '900' },
  trustText: { marginTop: 3, color: '#526174', fontSize: 12, lineHeight: 16, fontWeight: '600' },
  submitErrorText: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    padding: 10,
    color: '#B42318',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FBF8F1',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.82)'
  },
  confirmButton: {
    height: 56,
    borderRadius: 13,
    backgroundColor: '#F7B500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3
  },
  confirmButtonDisabled: { opacity: 0.68 },
  confirmText: { color: '#0F1E33', fontSize: 18, fontWeight: '900' }
});
