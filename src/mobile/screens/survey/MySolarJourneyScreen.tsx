import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock3,
  FileText,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Wrench
} from 'lucide-react-native';
import { formatSurveyReference, SurveyBookingStatus } from '@/services/journey.api';
import { useSurveyJourney } from '@/hooks/useSurveyJourney';

const timeline = [
  ['Survey Request Received', 'Your survey request has been received by KaamAsaan.', ClipboardCheck],
  ['Representative Call', 'Our solar consultant will call you within 1 hour.', Phone],
  ['Survey Scheduled', 'Your site survey date and time will be confirmed.', CalendarDays],
  ['Site Survey', 'Our team will inspect your roof, load, and installation requirements.', Home],
  ['Proposal Preparation', 'Your recommended solar system and cost estimate will be prepared.', FileText],
  ['Quotation Shared', 'Your quotation will be shared for review.', ShieldCheck],
  ['Installation Planning', 'Installation plan will be finalized after approval.', Wrench],
  ['Installation Completed', 'Your solar installation will be completed by the assigned team.', Check]
] as const;

type TimelineState = 'completed' | 'active' | 'pending' | 'cancelled';

const getTimelineState = (status: SurveyBookingStatus, index: number): TimelineState => {
  if (status === 'cancelled') return index === 0 ? 'cancelled' : 'pending';
  if (status === 'pending') return index === 0 ? 'active' : 'pending';
  if (status === 'confirmed') return index < 1 ? 'completed' : index === 1 ? 'active' : 'pending';
  if (status === 'survey_scheduled') return index < 2 ? 'completed' : index === 2 ? 'active' : 'pending';
  if (status === 'survey_completed' || status === 'completed') return index <= 3 ? 'completed' : 'pending';
  if (status === 'proposal_preparation') return index < 4 ? 'completed' : index === 4 ? 'active' : 'pending';
  if (status === 'quotation_shared') return index < 5 ? 'completed' : index === 5 ? 'active' : 'pending';
  if (status === 'installation_planning') return index < 6 ? 'completed' : index === 6 ? 'active' : 'pending';
  return 'completed';
};

const statusCopy: Record<SurveyBookingStatus, { title: string; detail: string; tone: string }> = {
  pending: { title: 'Survey request received', detail: 'Our consultant will contact you within 1 hour.', tone: '#F5A623' },
  confirmed: { title: 'Representative call confirmed', detail: 'Our consultant is coordinating your preferred survey schedule.', tone: '#2563EB' },
  survey_scheduled: { title: 'Survey scheduled', detail: 'Your site survey date and time have been confirmed.', tone: '#2563EB' },
  survey_completed: { title: 'Survey completed', detail: 'Our team has completed the site inspection.', tone: '#168A4A' },
  proposal_preparation: { title: 'Proposal preparation', detail: 'Your recommended solar system and estimate are being prepared.', tone: '#E87916' },
  quotation_shared: { title: 'Quotation shared', detail: 'Your quotation is ready for review.', tone: '#7C3AED' },
  installation_planning: { title: 'Installation planning', detail: 'Your installation plan is being finalized after approval.', tone: '#0F8B8D' },
  installation_completed: { title: 'Installation completed', detail: 'Your solar installation has been completed successfully.', tone: '#168A4A' },
  completed: { title: 'Survey completed', detail: 'Your site survey has been completed successfully.', tone: '#168A4A' },
  cancelled: { title: 'Survey cancelled', detail: 'This survey request is no longer active.', tone: '#D14343' }
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : 'To be confirmed';

export const MySolarJourneyScreen = ({ navigation, route }: any) => {
  const query = useSurveyJourney(route.params?.bookingId);
  const booking = query.data;

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color="#F5A623" size="large" />
        <Text style={styles.loadingText}>Loading your solar journey...</Text>
      </SafeAreaView>
    );
  }

  if (!booking || query.isError) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.errorTitle}>Journey details unavailable</Text>
        <Text style={styles.errorText}>Please try again in a moment.</Text>
        <Pressable style={styles.backHome} onPress={() => navigation.goBack()}>
          <Text style={styles.backHomeText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const current = statusCopy[booking.status];

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={22} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>My Solar Journey</Text>
          <Text style={styles.subtitle}>Track your survey and installation progress</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.referenceCard}>
          <View>
            <Text style={styles.eyebrow}>REFERENCE NUMBER</Text>
            <Text style={styles.reference}>{formatSurveyReference(booking)}</Text>
          </View>
          <View style={styles.referenceIcon}>
            <ShieldCheck color="#168A4A" size={25} strokeWidth={2.2} />
          </View>
        </View>

        <View style={[styles.currentCard, { borderColor: current.tone }]}>
          <View style={[styles.currentDot, { backgroundColor: current.tone }]} />
          <View style={styles.currentCopy}>
            <Text style={styles.currentLabel}>CURRENT STATUS</Text>
            <Text style={styles.currentTitle}>{current.title}</Text>
            <Text style={styles.currentDetail}>{current.detail}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.detailCard}>
          <DetailRow Icon={User} label="Name" value={booking.full_name} />
          <DetailRow Icon={Phone} label="Phone" value={booking.phone} />
          <DetailRow Icon={MapPin} label="City" value={booking.city} />
          <DetailRow Icon={Home} label="Address" value={booking.address} last />
        </View>

        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.detailCard}>
          <DetailRow Icon={ClipboardCheck} label="Booking Type" value={booking.booking_type.replace(/_/g, ' ')} />
          <DetailRow Icon={CalendarDays} label="Preferred Date" value={formatDate(booking.preferred_date)} />
          <DetailRow Icon={Clock3} label="Time Slot" value={booking.preferred_time_slot || 'To be confirmed'} />
          <DetailRow Icon={CalendarDays} label="Requested On" value={formatDate(booking.created_at)} last />
        </View>

        <Text style={styles.sectionTitle}>Journey Progress</Text>
        <View style={styles.timelineCard}>
          {timeline.map(([title, description, Icon], index) => {
            const state = getTimelineState(booking.status, index);
            const active = state === 'active';
            const complete = state === 'completed';
            const cancelled = state === 'cancelled';
            const tone = cancelled ? '#D14343' : complete ? '#168A4A' : active ? current.tone : '#B7BFC9';
            return (
              <View key={title} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineIcon, { backgroundColor: tone }]}>
                    <Icon color="#FFFFFF" size={14} strokeWidth={2.4} />
                  </View>
                  {index < timeline.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: complete ? '#A7D8BB' : '#E2E6EA' }]} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <View style={styles.timelineHead}>
                    <Text style={[styles.timelineTitle, (active || complete) && styles.timelineTitleStrong]}>{title}</Text>
                    <Text style={[styles.badge, { color: tone, backgroundColor: `${tone}14` }]}>
                      {cancelled ? 'Cancelled' : complete ? 'Completed' : active ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                  <Text style={styles.timelineText}>{description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ Icon, label, value, last = false }: { Icon: typeof User; label: string; value: string; last?: boolean }) => (
  <View style={[styles.detailRow, last && styles.detailRowLast]}>
    <View style={styles.detailIcon}><Icon color="#B07800" size={16} strokeWidth={2.1} /></View>
    <View style={styles.detailCopy}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F7F3EB' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#F7F3EB' },
  loadingText: { color: '#526174', fontSize: 13, fontWeight: '700' },
  errorTitle: { color: '#10213A', fontSize: 19, fontWeight: '900' },
  errorText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  backHome: { marginTop: 8, borderRadius: 12, backgroundColor: '#F7B500', paddingHorizontal: 22, paddingVertical: 12 },
  backHomeText: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  header: { minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E7DFD1' },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#FBF8F1' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 38 },
  title: { color: '#10213A', fontSize: 18, fontWeight: '900' },
  subtitle: { marginTop: 3, color: '#738094', fontSize: 10.5, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 34, gap: 12 },
  referenceCard: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, paddingHorizontal: 16, backgroundColor: '#FFFFFF', shadowColor: '#172031', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  eyebrow: { color: '#8A6B14', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  reference: { marginTop: 6, color: '#10213A', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  referenceIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#ECFDF3' },
  currentCard: { minHeight: 91, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, borderWidth: 1, padding: 15, backgroundColor: '#FFFDF8' },
  currentDot: { width: 12, height: 12, marginTop: 4, borderRadius: 999 },
  currentCopy: { flex: 1 },
  currentLabel: { color: '#7A8492', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  currentTitle: { marginTop: 4, color: '#10213A', fontSize: 16, fontWeight: '900' },
  currentDetail: { marginTop: 4, color: '#657184', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  sectionTitle: { marginTop: 3, color: '#10213A', fontSize: 15, fontWeight: '900' },
  detailCard: { borderRadius: 16, paddingHorizontal: 14, backgroundColor: '#FFFFFF', shadowColor: '#172031', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  detailRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E7EBEF' },
  detailRowLast: { borderBottomWidth: 0 },
  detailIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#FFF7E6' },
  detailCopy: { flex: 1 },
  detailLabel: { color: '#7A8492', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { marginTop: 3, color: '#243246', fontSize: 12.5, fontWeight: '800', textTransform: 'capitalize' },
  timelineCard: { borderRadius: 16, padding: 14, backgroundColor: '#FFFFFF', shadowColor: '#172031', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  timelineRow: { minHeight: 77, flexDirection: 'row', gap: 11 },
  timelineRail: { width: 30, alignItems: 'center' },
  timelineIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  timelineLine: { width: 2, flex: 1, marginVertical: 3 },
  timelineCopy: { flex: 1, paddingTop: 3, paddingBottom: 12 },
  timelineHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 7 },
  timelineTitle: { flex: 1, color: '#697586', fontSize: 12.5, fontWeight: '800' },
  timelineTitleStrong: { color: '#10213A' },
  timelineText: { marginTop: 5, color: '#7A8492', fontSize: 11, fontWeight: '600', lineHeight: 15 },
  badge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8.5, fontWeight: '900' }
});
