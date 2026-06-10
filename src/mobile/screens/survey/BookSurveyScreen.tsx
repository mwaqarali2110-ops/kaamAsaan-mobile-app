import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Building2, CalendarCheck2, CalendarDays, Check, Clock3, Home, MapPin, MessageCircle, Phone, ShieldCheck, ShoppingBag, User, Wrench } from 'lucide-react-native';
import { surveyBookingSchema, SurveyBookingForm } from '@/schemas/survey.schema';
import { systemApi } from '@/services/system.api';
import { useSystemStore } from '@/store/useSystemStore';
import { useAuthStore } from '@/store/useAuthStore';

const solarHouse = require('../../../assets/home/hero-house.png');

const createUpcomingDates = () => Array.from({ length: 7 }, (_, offset) => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return {
    day: value.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: String(value.getDate()),
    month: value.toLocaleDateString('en-US', { month: 'short' }),
    iso: value.toISOString().slice(0, 10)
  };
});

const timeSlots = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];

const bottomTabs = [
  { title: 'Home', Icon: Home, route: 'MainTabs', params: { screen: 'Home' } },
  { title: 'Marketplace', Icon: ShoppingBag, route: 'MainTabs', params: { screen: 'Marketplace' } },
  { title: 'Services', Icon: ShieldCheck },
  { title: 'Tools', Icon: Wrench, route: 'DesignFlow' },
  { title: 'Profile', Icon: User, route: 'MainTabs', params: { screen: 'Profile' } }
];

const AddressField = ({
  control,
  name,
  placeholder,
  Icon,
  keyboardType
}: {
  control: any;
  name: 'name' | 'phone' | 'address' | 'city';
  placeholder: string;
  Icon: typeof Home;
  keyboardType?: 'default' | 'phone-pad';
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <View>
        <View style={[styles.inputWrap, error && styles.inputError]}>
          <View style={styles.inputIcon}>
            <Icon color="#334155" size={22} strokeWidth={2.1} />
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#64748B"
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
      </View>
    )}
  />
);

export const BookSurveyScreen = ({ navigation }: any) => {
  const [selectedDate, setSelectedDate] = useState(1);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const getSummary = useSystemStore((state) => state.getSummary);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const dates = useMemo(createUpcomingDates, []);
  const form = useForm<SurveyBookingForm>({
    resolver: zodResolver(surveyBookingSchema),
    defaultValues: {
      name: '',
      phone: '',
      city: '',
      address: ''
    }
  });
  const mutation = useMutation({ mutationFn: systemApi.submitSurveyBooking });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      city: profile.city ?? '',
      address: form.getValues('address')
    });
  }, [form, profile]);

  const submit = form.handleSubmit(async (values) => {
    if (!session?.user.id) {
      navigation.replace('Login', { redirectTo: 'BookSurvey' });
      return;
    }
    if (isSubmitted || mutation.isPending) return;
    setIsSubmitted(true);
    try {
      const result = await mutation.mutateAsync({
        userId: session.user.id,
        fullName: values.name,
        phone: values.phone,
        city: values.city,
        address: values.address,
        preferredDate: dates[selectedDate].iso,
        preferredTimeSlot: selectedTime,
        notes: JSON.stringify({ source: 'mobile-app', systemSummary: getSummary() })
      });
      await queryClient.invalidateQueries({ queryKey: ['survey-bookings', 'active', session.user.id] });
      navigation.replace('SurveyConfirmation', { bookingId: result.bookingId });
    } catch {
      // Mutation error is shown inline below the trust card.
      setIsSubmitted(false);
    }
  });

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#0F1E33" size={24} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Book Survey</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <CalendarCheck2 color="#F5A400" size={28} strokeWidth={2} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Let's schedule your survey</Text>
            <Text style={styles.heroText}>Choose a convenient date, time and provide your site address.</Text>
          </View>
          <View style={styles.heroArt}>
            <CalendarDays color="#F5A400" size={58} strokeWidth={1.6} />
            <View style={styles.clockBubble}>
              <Clock3 color="#172031" size={34} strokeWidth={1.9} />
            </View>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <CalendarDays color="#0F1E33" size={23} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Select Date</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateTrack}>
          {dates.map((item, index) => {
            const active = selectedDate === index;
            return (
              <Pressable key={`${item.day}-${item.date}`} style={[styles.dateCard, active && styles.dateCardActive]} onPress={() => setSelectedDate(index)}>
                <Text style={[styles.dateDay, active && styles.dateTextActive]}>{item.day}</Text>
                <Text style={[styles.dateNumber, active && styles.dateTextActive]}>{item.date}</Text>
                <Text style={[styles.dateMonth, active && styles.dateTextActive]}>{item.month}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.dots}>
          <View style={styles.dotActive} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <View style={styles.sectionTitleRow}>
          <Clock3 color="#0F1E33" size={24} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
        </View>
        <View style={styles.timeGrid}>
          {timeSlots.map((slot) => {
            const active = selectedTime === slot;
            return (
              <Pressable key={slot} style={[styles.timePill, active && styles.timePillActive]} onPress={() => setSelectedTime(slot)}>
                <Text style={[styles.timeText, active && styles.timeTextActive]}>{slot}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionTitleRow}>
          <User color="#0F1E33" size={24} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Contact Details</Text>
        </View>
        <View style={styles.fields}>
          <AddressField control={form.control} name="name" placeholder="Full name" Icon={User} />
          <AddressField control={form.control} name="phone" placeholder="Phone number" Icon={Phone} keyboardType="phone-pad" />
        </View>

        <View style={styles.sectionTitleRow}>
          <MapPin color="#0F1E33" size={25} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Service Address</Text>
        </View>
        <View style={styles.fields}>
          <AddressField control={form.control} name="address" placeholder="House / flat number, street name" Icon={Home} />
          <AddressField control={form.control} name="city" placeholder="City (e.g. Lahore, Karachi)" Icon={Building2} />
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <ShieldCheck color="#FFFFFF" size={25} fill="#22A06B" strokeWidth={2.2} />
          </View>
          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>Your information is safe with us</Text>
            <Text style={styles.trustText}>We only use your details to provide the best maintenance service.</Text>
          </View>
          <View style={styles.houseWrap}>
            <Image source={solarHouse} style={styles.houseImage} resizeMode="contain" />
            <View style={styles.houseShield}>
              <Check color="#FFFFFF" size={22} strokeWidth={3} />
            </View>
          </View>
        </View>
        {mutation.error ? <Text style={styles.submitErrorText}>{mutation.error.message}</Text> : null}
      </ScrollView>

      <Pressable style={styles.chatButton} accessibilityLabel="WhatsApp help">
        <MessageCircle color="#FFFFFF" size={20} strokeWidth={2.2} />
      </Pressable>

      <View style={styles.footer}>
        <Pressable style={[styles.confirmButton, (mutation.isPending || isSubmitted) && styles.confirmButtonDisabled]} onPress={submit} disabled={mutation.isPending || isSubmitted}>
          <Text style={styles.confirmText}>{mutation.isPending || isSubmitted ? 'Confirming...' : 'Confirm Booking'}</Text>
          <ArrowRight color="#111827" size={27} strokeWidth={2.3} />
        </Pressable>
      </View>

      <View style={styles.bottomNav}>
        {bottomTabs.map(({ title, Icon, route, params }) => {
          const active = title === 'Home';
          return (
            <Pressable key={title} style={styles.navItem} onPress={() => route && navigation.navigate(route, params)}>
              <Icon color={active ? '#F5A400' : '#566174'} size={21} strokeWidth={2} />
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
  topBar: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 176 },
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
  heroText: { marginTop: 3, color: '#334155', fontSize: 10.8, lineHeight: 15, fontWeight: '600' },
  heroArt: { width: 68, height: 62, alignItems: 'center', justifyContent: 'center' },
  clockBubble: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#F5A400',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  sectionTitle: { color: '#0F1E33', fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  dateTrack: { gap: 8, paddingBottom: 7 },
  dateCard: {
    width: 58,
    height: 70,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateCardActive: { borderColor: '#F5A400', backgroundColor: '#FFF9EA' },
  dateDay: { color: '#0F172A', fontSize: 12, fontWeight: '800' },
  dateNumber: { marginTop: 3, color: '#05070A', fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  dateMonth: { marginTop: 2, color: '#0F172A', fontSize: 11, fontWeight: '700' },
  dateTextActive: { color: '#F5A400' },
  dots: { flexDirection: 'row', alignSelf: 'center', gap: 12, marginBottom: 13 },
  dotActive: { width: 23, height: 6, borderRadius: 999, backgroundColor: '#F5A400' },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#E2DDD4' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 13 },
  timePill: {
    width: '31.5%',
    height: 34,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8DED2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timePillActive: { borderColor: '#F5A400', backgroundColor: '#FFF9EA' },
  timeText: { color: '#0F172A', fontSize: 12.5, fontWeight: '900' },
  timeTextActive: { color: '#F5A400' },
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
  input: { flex: 1, color: '#0F1E33', fontSize: 13.5, fontWeight: '600' },
  errorText: { marginTop: 5, color: '#D9534F', fontSize: 11, fontWeight: '700' },
  submitErrorText: { marginTop: 10, borderRadius: 10, backgroundColor: '#FEF2F2', padding: 10, color: '#B42318', fontSize: 11.5, fontWeight: '800', lineHeight: 16 },
  trustCard: {
    minHeight: 104,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B8E1D2',
    backgroundColor: '#F2FBF7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    overflow: 'hidden'
  },
  trustIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#22A06B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F5132',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  trustCopy: { flex: 1, paddingLeft: 13, paddingRight: 6 },
  trustTitle: { color: '#0F1E33', fontSize: 13.5, fontWeight: '900', lineHeight: 18 },
  trustText: { marginTop: 5, color: '#334155', fontSize: 11.8, lineHeight: 17, fontWeight: '600' },
  houseWrap: { width: 74, height: 68, alignItems: 'center', justifyContent: 'center' },
  houseImage: { width: 90, height: 66 },
  houseShield: {
    position: 'absolute',
    right: 1,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#79C84E',
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatButton: {
    position: 'absolute',
    right: 18,
    bottom: 102,
    width: 50,
    height: 50,
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
    bottom: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FBF8F1'
  },
  confirmButton: {
    height: 56,
    borderRadius: 13,
    backgroundColor: '#F7B500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3
  },
  confirmButtonDisabled: { opacity: 0.68 },
  confirmText: { color: '#0F1E33', fontSize: 17, fontWeight: '900' },
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
  navText: { color: '#566174', fontSize: 10, fontWeight: '700' },
  navTextActive: { color: '#F5A400' }
});
