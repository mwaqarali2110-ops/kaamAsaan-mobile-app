import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ArrowRight, CalendarDays, Check, ChevronRight, MessageSquareText, ShieldCheck, Star, Users, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { getMaintenancePlan } from '@/data/maintenancePlans';
import { useMaintenanceLifecycle, useSubmitMaintenanceFeedback } from '@/hooks/useMaintenanceLifecycle';
import { useMaintenanceBookingStore } from '@/store/useMaintenanceBookingStore';
import type { MaintenanceVisit, MaintenanceVisitStatus } from '@/types/maintenance.types';

type Identity = { planId?: string; requestId?: string; visitId?: string };

const activeStages = ['Request Received', 'Confirmation Call', 'Team Assigned', 'Visit Scheduled', 'Visit Completed', 'Feedback', 'Next Visit Scheduled'];
const completedStages = ['Request Received', 'Confirmation Call', 'Team Assigned', 'Visit Scheduled', 'Visit Completed', 'Feedback', 'Plan Completed'];
const completedVisitStatuses = new Set<MaintenanceVisitStatus>(['completed', 'feedback_pending', 'feedback_received']);
const statusStage: Record<MaintenanceVisitStatus, number> = {
  upcoming: 0, confirmation_pending: 0, customer_contacted: 1, team_assigned: 2,
  scheduled: 3, rescheduled: 3, dispatched: 3, in_progress: 3, completed: 4,
  feedback_pending: 5, feedback_received: 6, cancelled: 0
};

const niceDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
  : 'To be confirmed';
const dateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
  : '';
const windowText = (visit?: MaintenanceVisit) => visit ? `${niceDate(visit.windowStart)} – ${niceDate(visit.windowEnd)}` : 'To be confirmed';
const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const nextStepCopy = (visit?: MaintenanceVisit, nextVisit?: MaintenanceVisit) => {
  switch (visit?.status) {
    case 'customer_contacted': return ['Your request has been confirmed', 'We are assigning the right maintenance team for your site.'];
    case 'team_assigned': return ['Maintenance team assigned', 'Your assigned team will visit during the confirmed schedule.'];
    case 'scheduled': case 'rescheduled': case 'dispatched': case 'in_progress':
      return ['Your maintenance visit is scheduled', `${niceDate(visit.scheduledDate)}${visit.scheduledTimeSlot ? ` · ${visit.scheduledTimeSlot}` : ''}${visit.assignedTeamName ? ` · ${visit.assignedTeamName}` : ''}`];
    case 'completed': case 'feedback_pending': return ['Visit completed', 'Please share your experience to help us improve.'];
    case 'feedback_received': return ['Thank you for your feedback', nextVisit ? `Your next maintenance window is ${windowText(nextVisit)}.` : 'Your annual Premium Care plan is complete.'];
    default: return ['Confirmation call is next', 'Our team will contact you shortly to confirm your details and preferred visit schedule.'];
  }
};

const Rating = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <View style={styles.ratingRow}>
    <Text style={styles.ratingLabel}>{label}</Text>
    <View style={styles.stars}>{[1, 2, 3, 4, 5].map((rating) => (
      <Pressable key={rating} onPress={() => onChange(rating)} hitSlop={5} accessibilityRole="button" accessibilityLabel={`${label} ${rating} stars`}>
        <Star size={24} color="#E8A000" fill={rating <= value ? '#F7B500' : 'transparent'} />
      </Pressable>
    ))}</View>
  </View>
);

export const PremiumCareProgressScreen = ({ navigation, route, identity: propIdentity }: any) => {
  const insets = useSafeAreaInsets();
  const identity: Identity = propIdentity ?? route?.params ?? {};
  const query = useMaintenanceLifecycle(identity);
  const submitFeedback = useSubmitMaintenanceFeedback(identity);
  const setSelectedPlan = useMaintenanceBookingStore((state) => state.setSelectedPlan);
  const focused = useIsFocused();
  const [feedbackVisible, setFeedbackVisible] = useState(Boolean(identity.visitId));
  const [overall, setOverall] = useState(0);
  const [quality, setQuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comments, setComments] = useState('');
  const [followUp, setFollowUp] = useState(false);

  useEffect(() => { if (focused) void query.refetch(); }, [focused]);
  const lifecycle = query.data;
  const currentVisit = useMemo(() => lifecycle?.visits.find((visit) => visit.visitNumber === lifecycle.plan.currentVisitNumber) ?? lifecycle?.visits[0], [lifecycle]);
  const nextVisit = lifecycle?.visits.find((visit) => currentVisit && visit.visitNumber === currentVisit.visitNumber + 1);
  const currentStage = currentVisit ? statusStage[currentVisit.status] : 0;
  const totalVisits = lifecycle?.plan.totalVisits ?? 0;
  const completedVisitsCount = lifecycle?.visits.filter((visit) => completedVisitStatuses.has(visit.status)).length ?? 0;
  const hasFurtherVisit = lifecycle?.visits.some((visit) => visit.visitNumber > (lifecycle.plan.currentVisitNumber || 0)) ?? false;
  const isPlanCompleted = Boolean(
    lifecycle
    && lifecycle.plan.status === 'completed'
    && totalVisits > 0
    && completedVisitsCount >= totalVisits
    && lifecycle.plan.currentVisitNumber >= totalVisits
    && !hasFurtherVisit
  );
  const progressStages = isPlanCompleted ? completedStages : activeStages;
  const progressStage = isPlanCompleted ? progressStages.length : currentStage;
  const finalCompletedVisit = isPlanCompleted
    ? [...(lifecycle?.visits ?? [])]
      .filter((visit) => completedVisitStatuses.has(visit.status))
      .sort((left, right) => right.visitNumber - left.visitNumber)[0]
    : undefined;
  const planCompletionDate = dateTime(finalCompletedVisit?.completedAt ?? lifecycle?.plan.updatedAt);
  const [nextTitle, nextMessage] = nextStepCopy(currentVisit, nextVisit);
  const currentHistory = lifecycle?.history.filter((entry) => !entry.visitId || entry.visitId === currentVisit?.id) ?? [];
  const completedStageTimestamp = (index: number) => {
    if (index >= progressStage) return '';
    const matching = currentHistory.find((entry) => {
      const visitStatus = entry.newStatus as MaintenanceVisitStatus;
      return visitStatus in statusStage && statusStage[visitStatus] >= index;
    });
    return dateTime(matching?.createdAt);
  };
  const feedbackVisit = lifecycle?.visits.find((visit) => visit.id === identity.visitId)
    ?? lifecycle?.visits.find((visit) => visit.status === 'feedback_pending' || visit.status === 'completed');

  const renewPremiumCare = () => {
    if (!lifecycle || !isPlanCompleted) return;
    const plan = getMaintenancePlan('premium');
    setSelectedPlan(plan);
    navigation.navigate('MaintenanceBooking', {
      plan,
      renewalFromPlanId: lifecycle.plan.id,
      initialValues: lifecycle.request ? {
        customerName: lifecycle.request.customerName,
        phone: lifecycle.request.phone,
        address: lifecycle.request.address,
        city: lifecycle.request.city
      } : undefined
    });
  };

  const saveFeedback = async () => {
    if (!feedbackVisit || overall < 1) return;
    await submitFeedback.mutateAsync({
      visitId: feedbackVisit.id, overallRating: overall,
      serviceQualityRating: quality || undefined, professionalismRating: professionalism || undefined,
      punctualityRating: punctuality || undefined, comments, needsFollowUp: followUp
    });
    setFeedbackVisible(false);
  };

  if (query.isLoading) return <SafeAreaView style={styles.shell}><View style={styles.center}><ActivityIndicator color="#F5A400" size="large" /><Text style={styles.muted}>Loading your Premium Care plan…</Text></View></SafeAreaView>;
  if (query.error || !lifecycle) return (
    <SafeAreaView style={styles.shell}>
      <Header title="Premium Care" subtitle="Your annual maintenance plan" onBack={navigation?.goBack ? () => navigation.goBack() : undefined} />
      <View style={styles.center}><Text style={styles.errorTitle}>Plan details are unavailable</Text><Text style={styles.muted}>Pull back into this screen or try again shortly.</Text><Pressable style={styles.retry} onPress={() => query.refetch()}><Text style={styles.retryText}>Try Again</Text></Pressable></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.shell} edges={['top', 'left', 'right']}>
      <Header title="Premium Care" subtitle="Your annual maintenance plan" onBack={route?.params && navigation?.goBack ? () => navigation.goBack() : undefined} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 32) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}><View><Text style={styles.eyebrow}>PREMIUM CARE</Text><Text style={styles.reference}>{lifecycle.plan.reference}</Text></View><View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{statusLabel(lifecycle.plan.status)}</Text></View></View>
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>12</Text><Text style={styles.metricLabel}>Months</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{lifecycle.plan.totalVisits}</Text><Text style={styles.metricLabel}>Visits / year</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{lifecycle.plan.currentVisitNumber} of {lifecycle.plan.totalVisits}</Text><Text style={styles.metricLabel}>Current visit</Text></View>
          </View>
          <View style={styles.planDates}><CalendarDays size={16} color="#B07800" /><Text style={styles.planDatesText}>{niceDate(lifecycle.plan.startDate)} – {niceDate(lifecycle.plan.endDate)}</Text></View>
        </View>

        <View style={styles.nextCard}>
          <View style={[styles.nextIcon, isPlanCompleted && styles.completedIcon]}>{isPlanCompleted ? <ShieldCheck size={20} color="#FFFFFF" /> : <ChevronRight size={20} color="#10213A" />}</View>
          <View style={styles.flex}><Text style={[styles.sectionEyebrow, isPlanCompleted && styles.completedEyebrow]}>{isPlanCompleted ? 'PLAN COMPLETED' : 'WHAT HAPPENS NEXT'}</Text><Text style={styles.nextTitle}>{isPlanCompleted ? 'Thank you for choosing Premium Care' : nextTitle}</Text><Text style={styles.nextMessage}>{isPlanCompleted ? `Your annual plan and all ${totalVisits} maintenance visits have been completed successfully.` : nextMessage}</Text>
            {isPlanCompleted ? <><Text style={styles.renewalLine}>Continue protecting your solar system with a new Premium Care plan.</Text><Pressable style={styles.renewButton} onPress={renewPremiumCare} accessibilityRole="button" accessibilityLabel="Renew Premium Care"><ShieldCheck size={16} color="#10213A" /><Text style={styles.renewButtonText}>Renew Premium Care</Text><ArrowRight size={16} color="#10213A" /></Pressable></> : null}
            {!isPlanCompleted && (currentVisit?.status === 'completed' || currentVisit?.status === 'feedback_pending') ? <Pressable style={styles.feedbackButton} onPress={() => setFeedbackVisible(true)}><MessageSquareText size={16} color="#10213A" /><Text style={styles.feedbackButtonText}>Give Feedback</Text></Pressable> : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Current Visit Progress</Text>
        <View style={styles.progressCard}>{progressStages.map((stage, index) => {
          const done = index < progressStage;
          const active = index === progressStage;
          const isFinalCompletedStep = isPlanCompleted && index === progressStages.length - 1;
          return <View key={stage} style={styles.stepRow}>
            <View style={styles.stepRail}><View style={[styles.stepDot, done && styles.stepDone, active && styles.stepActive]}>{done ? <Check size={12} color="#FFFFFF" /> : <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{index + 1}</Text>}</View>{index < progressStages.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}</View>
            <View style={styles.stepCopy}><Text style={[styles.stepTitle, (done || active) && styles.stepTitleStrong]}>{stage}</Text>{isFinalCompletedStep ? <><Text style={styles.completionHint}>All {totalVisits} Premium Care visits completed</Text><Text style={styles.timestamp}>{planCompletionDate}</Text></> : active ? <Text style={styles.currentHint}>{statusLabel(currentVisit?.status ?? 'confirmation_pending')}</Text> : done ? <Text style={styles.timestamp}>{completedStageTimestamp(index)}</Text> : null}</View>
          </View>;
        })}</View>

        <Text style={styles.sectionTitle}>Your Maintenance Schedule</Text>
        <View style={styles.scheduleList}>{lifecycle.visits.map((visit) => {
          const highlighted = visit.id === currentVisit?.id || visit.visitNumber === (currentVisit?.visitNumber ?? 0) + 1;
          return <View key={visit.id} style={[styles.visitCard, highlighted && styles.visitCardHighlighted]}>
            <View style={[styles.visitNumber, visit.status === 'feedback_received' && styles.visitNumberDone]}>{visit.status === 'feedback_received' ? <Check size={16} color="#FFFFFF" /> : <Text style={styles.visitNumberText}>{visit.visitNumber}</Text>}</View>
            <View style={styles.flex}><Text style={styles.visitTitle}>Visit {visit.visitNumber}</Text><Text style={styles.visitWindow}>{visit.scheduledDate ? `${niceDate(visit.scheduledDate)}${visit.scheduledTimeSlot ? ` · ${visit.scheduledTimeSlot}` : ''}` : windowText(visit)}</Text>{visit.assignedTeamName ? <Text style={styles.team}><Users size={12} color="#64748B" /> {visit.assignedTeamName}</Text> : null}</View>
            <View style={styles.visitStatus}><Text style={styles.visitStatusText}>{statusLabel(visit.status)}</Text></View>
          </View>;
        })}</View>
      </ScrollView>

      <Modal visible={feedbackVisible} transparent animationType="fade" onRequestClose={() => setFeedbackVisible(false)} statusBarTranslucent>
        <KeyboardAvoidingView
          style={[styles.modalBackdrop, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 18) }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalCard}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Share your feedback</Text><Text style={styles.modalSubtitle}>Visit {feedbackVisit?.visitNumber ?? ''} · Your feedback helps us improve.</Text></View><Pressable onPress={() => setFeedbackVisible(false)} hitSlop={10}><X size={20} color="#526174" /></Pressable></View>
          <Rating label="Overall experience" value={overall} onChange={setOverall} />
          <Rating label="Service quality" value={quality} onChange={setQuality} />
          <Rating label="Team professionalism" value={professionalism} onChange={setProfessionalism} />
          <Rating label="Punctuality" value={punctuality} onChange={setPunctuality} />
          <TextInput style={styles.comments} value={comments} onChangeText={setComments} placeholder="Comments (optional)" placeholderTextColor="#94A3B8" multiline />
          <View style={styles.followRow}><Text style={styles.followLabel}>I need a follow-up</Text><Switch value={followUp} onValueChange={setFollowUp} trackColor={{ true: '#F7B500', false: '#CBD5E1' }} /></View>
          {submitFeedback.error ? <Text style={styles.formError}>{submitFeedback.error.message}</Text> : null}
          <Pressable style={[styles.submitButton, (overall < 1 || submitFeedback.isPending) && styles.disabled]} onPress={() => void saveFeedback()} disabled={overall < 1 || submitFeedback.isPending}><Text style={styles.submitText}>{submitFeedback.isPending ? 'Submitting…' : 'Submit Feedback'}</Text></Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF8F1' }, content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 9 }, muted: { color: '#64748B', fontSize: 13, textAlign: 'center' }, errorTitle: { color: '#10213A', fontSize: 18, fontWeight: '900' }, retry: { marginTop: 8, backgroundColor: '#F7B500', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }, retryText: { color: '#10213A', fontWeight: '900' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E8DED2', padding: 16 }, summaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, eyebrow: { color: '#B07800', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, reference: { color: '#10213A', fontSize: 18, fontWeight: '900', marginTop: 3 }, statusBadge: { backgroundColor: '#FFF3C7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, statusBadgeText: { color: '#8A5B00', fontSize: 10, fontWeight: '900' }, metrics: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, marginTop: 14, paddingVertical: 12 }, metric: { flex: 1, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#D7DEE7' }, metricValue: { color: '#10213A', fontSize: 15, fontWeight: '900' }, metricLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', marginTop: 2 }, planDates: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }, planDatesText: { color: '#526174', fontSize: 11, fontWeight: '700' },
  nextCard: { flexDirection: 'row', gap: 12, backgroundColor: '#FFF6DC', borderWidth: 1, borderColor: '#F0D487', borderRadius: 18, padding: 15 }, nextIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F7B500', alignItems: 'center', justifyContent: 'center' }, completedIcon: { backgroundColor: '#1A9A67' }, flex: { flex: 1 }, sectionEyebrow: { color: '#9A6900', fontSize: 10, fontWeight: '900', letterSpacing: .8 }, completedEyebrow: { color: '#147A54' }, nextTitle: { color: '#10213A', fontSize: 15, fontWeight: '900', marginTop: 3 }, nextMessage: { color: '#526174', fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 4 }, renewalLine: { color: '#334155', fontSize: 11, lineHeight: 16, fontWeight: '800', marginTop: 8 }, renewButton: { width: '100%', minHeight: 44, marginTop: 11, borderRadius: 12, backgroundColor: '#F7B500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 13 }, renewButtonText: { flex: 1, color: '#10213A', fontSize: 13, fontWeight: '900', textAlign: 'center' }, feedbackButton: { alignSelf: 'flex-start', marginTop: 11, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F7B500', borderRadius: 11, paddingHorizontal: 13 }, feedbackButtonText: { color: '#10213A', fontSize: 12, fontWeight: '900' },
  sectionTitle: { color: '#10213A', fontSize: 15, fontWeight: '900', marginTop: 2 }, progressCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E8DED2', padding: 15 }, stepRow: { minHeight: 48, flexDirection: 'row' }, stepRail: { width: 28, alignItems: 'center' }, stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF1F4', alignItems: 'center', justifyContent: 'center', zIndex: 1 }, stepDone: { backgroundColor: '#1A9A67' }, stepActive: { backgroundColor: '#F7B500', borderWidth: 3, borderColor: '#FFF0B5' }, stepNumber: { color: '#94A3B8', fontSize: 10, fontWeight: '900' }, stepNumberActive: { color: '#10213A' }, line: { position: 'absolute', width: 2, top: 22, bottom: -4, backgroundColor: '#E2E8F0' }, lineDone: { backgroundColor: '#7AC8A8' }, stepCopy: { flex: 1, paddingLeft: 9, paddingTop: 3 }, stepTitle: { color: '#94A3B8', fontSize: 13, fontWeight: '700' }, stepTitleStrong: { color: '#10213A', fontWeight: '900' }, currentHint: { color: '#9A6900', fontSize: 10, fontWeight: '800', marginTop: 2 }, completionHint: { color: '#147A54', fontSize: 10, fontWeight: '800', marginTop: 2 }, timestamp: { color: '#7B8796', fontSize: 10, marginTop: 2 },
  scheduleList: { gap: 9 }, visitCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED2', borderRadius: 15, padding: 12 }, visitCardHighlighted: { borderColor: '#EAC557', backgroundColor: '#FFFCF2' }, visitNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0BE', alignItems: 'center', justifyContent: 'center' }, visitNumberDone: { backgroundColor: '#1A9A67' }, visitNumberText: { color: '#8A5B00', fontSize: 12, fontWeight: '900' }, visitTitle: { color: '#10213A', fontSize: 13, fontWeight: '900' }, visitWindow: { color: '#64748B', fontSize: 11, fontWeight: '600', marginTop: 3 }, team: { color: '#64748B', fontSize: 10, marginTop: 4 }, visitStatus: { maxWidth: 92, backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, visitStatusText: { color: '#526174', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, modalScroll: { width: '100%', maxWidth: 440, maxHeight: '100%' }, modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 17 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, modalTitle: { color: '#10213A', fontSize: 18, fontWeight: '900' }, modalSubtitle: { color: '#64748B', fontSize: 11, marginTop: 3 }, ratingRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, ratingLabel: { color: '#334155', fontSize: 12, fontWeight: '800' }, stars: { flexDirection: 'row', gap: 4 }, comments: { minHeight: 72, borderWidth: 1, borderColor: '#D8E0E8', borderRadius: 12, padding: 11, color: '#10213A', marginTop: 15, textAlignVertical: 'top' }, followRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, followLabel: { color: '#334155', fontSize: 12, fontWeight: '800' }, formError: { color: '#B42318', fontSize: 11, fontWeight: '700', marginTop: 8 }, submitButton: { minHeight: 48, borderRadius: 13, backgroundColor: '#F7B500', alignItems: 'center', justifyContent: 'center', marginTop: 12 }, submitText: { color: '#10213A', fontSize: 13, fontWeight: '900' }, disabled: { opacity: .5 }
});
