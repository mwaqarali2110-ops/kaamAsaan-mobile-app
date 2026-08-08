import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from '@/components/ui/SafeAreaLayout';
import { useQueryClient } from '@tanstack/react-query';
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
  User
} from 'lucide-react-native';
import { formatSurveyReference, journeyApi, verifyCancellationSchema, type SurveyBookingStatus } from '@/services/journey.api';
import { activeSurveyJourneyQueryKey, latestSurveyJourneyQueryKey, useSurveyJourney, useSurveyJourneyRealtime } from '@/hooks/useSurveyJourney';
import { latestWelcomeNotificationQueryKey, notificationsQueryKey, unreadNotificationsQueryKey } from '@/hooks/useNotifications';
import { notificationsApi } from '@/services/notifications.api';
import { useAuthStore } from '@/store/useAuthStore';
import { SURVEY_MILESTONE_DEFINITIONS, type SurveyMilestone } from '@/types/survey.types';
import { getSolarJourneyStepState } from '../../../../../backend-development/supabase/contracts/solarJourneyMilestones';
import { resolveSurveyLifecycle, resolveSurveyMilestone, surveyMilestoneMeta } from '@/utils/surveyMilestones';

const timelineIcons: Record<SurveyMilestone, typeof ClipboardCheck> = {
  request_received: ClipboardCheck,
  survey_scheduled: CalendarDays,
  survey_completed: Check,
  quotation_shared: FileText,
  installation_completed: Home,
};

const cancellableStatuses: SurveyBookingStatus[] = [
  "pending",
  "confirmed",
  "assigned",
  "scheduled",
  "survey_scheduled",
];
const cancellationReasons = [
  "I am no longer interested",
  "I want to change the survey date",
  "I selected the wrong location",
  "I booked by mistake",
  "I chose another solar company",
  "Other",
] as const;

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "To be confirmed";

export const MySolarJourneyScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user.id);
  const bookingId = route.params?.bookingId as string | undefined;
  const query = useSurveyJourney(bookingId);
  useSurveyJourneyRealtime(bookingId, userId);
  const booking = query.data;
  const openedFromTab = Boolean(route.params?.fromTab);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      void verifyCancellationSchema();
    }
  }, []);

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

  const milestone = resolveSurveyMilestone(booking.current_milestone, booking.status);
  const lifecycle = resolveSurveyLifecycle(booking.journey_status, booking.current_milestone, booking.status);
  const current = surveyMilestoneMeta[lifecycle === 'active' ? milestone : lifecycle];
  const canCancelBooking = cancellableStatuses.includes(booking.status);
  const isCancelled = lifecycle === 'cancelled';

  const openCancelModal = () => {
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (isCancelling) return;
    setCancelModalOpen(false);
    setCancelError(null);
  };

  const handleConfirmCancellation = async () => {
    if (__DEV__) {
      console.log("Cancel survey button pressed");
      console.log("Cancellation input", {
        bookingId: booking?.id,
        routeBookingId: route.params?.bookingId,
        fetchedBookingId: query.data?.id,
        reason: selectedReason,
        hasOtherNote: Boolean(otherReason.trim()),
      });
    }

    setCancelError(null);
    if (!booking?.id) {
      setCancelError(
        "Survey booking information is unavailable. Please refresh and try again.",
      );
      return;
    }
    if (!userId) {
      setCancelError("Your session has expired. Please sign in again.");
      return;
    }
    if (!canCancelBooking) {
      setCancelError(
        "This survey booking can no longer be cancelled because the survey process has already started.",
      );
      return;
    }
    if (!selectedReason) {
      setCancelError("Please select a cancellation reason.");
      return;
    }
    const trimmedOtherReason = otherReason.trim();
    if (selectedReason === "Other" && !trimmedOtherReason) {
      setCancelError("Please tell us the reason.");
      return;
    }
    if (selectedReason === "Other" && trimmedOtherReason.length < 3) {
      setCancelError("Please enter a valid cancellation reason.");
      return;
    }

    setIsCancelling(true);

    try {
      if (__DEV__) {
        console.log("Submitting survey cancellation", {
          bookingId: booking.id,
          userId,
          reason: selectedReason,
        });
      }

      const result = await journeyApi.cancelSurveyBooking({
        bookingId: booking.id,
        userId,
        cancellationReason: selectedReason,
        cancellationNote:
          selectedReason === "Other" ? trimmedOtherReason : null,
      });

      if (__DEV__) {
        console.log("Survey cancellation result", {
          success: result.success,
          bookingId: result.booking?.id,
          status: result.booking?.status,
          code: result.success ? undefined : result.code,
          message: result.success ? undefined : result.message,
        });
      }

      if (!result.success || !result.booking) {
        throw new Error(
          result.message || "Cancellation update returned no booking.",
        );
      }

      const cancelledBooking = result.booking;
      queryClient.setQueryData(
        ["survey-bookings", "detail", cancelledBooking.id],
        cancelledBooking,
      );
      queryClient.setQueryData(
        activeSurveyJourneyQueryKey(cancelledBooking.user_id),
        null,
      );
      queryClient.setQueryData(
        latestSurveyJourneyQueryKey(cancelledBooking.user_id),
        cancelledBooking,
      );
      await Promise.all([
        query.refetch(),
        queryClient.invalidateQueries({
          queryKey: activeSurveyJourneyQueryKey(cancelledBooking.user_id),
        }),
        queryClient.invalidateQueries({
          queryKey: latestSurveyJourneyQueryKey(cancelledBooking.user_id),
        }),
        queryClient.invalidateQueries({
          queryKey: notificationsQueryKey(cancelledBooking.user_id),
        }),
        queryClient.invalidateQueries({
          queryKey: unreadNotificationsQueryKey(cancelledBooking.user_id),
        }),
        queryClient.invalidateQueries({
          queryKey: latestWelcomeNotificationQueryKey(cancelledBooking.user_id),
        }),
      ]);

      setCancelModalOpen(false);
      setSelectedReason("");
      setOtherReason("");
      setCancelError(null);
      setSuccessMessage("Your survey booking has been cancelled successfully.");

      try {
        await notificationsApi.createSurveyCancellationNotificationOnce(
          cancelledBooking,
        );
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: notificationsQueryKey(cancelledBooking.user_id),
          }),
          queryClient.invalidateQueries({
            queryKey: unreadNotificationsQueryKey(cancelledBooking.user_id),
          }),
        ]);
      } catch (notificationError) {
        if (__DEV__) {
          const message =
            notificationError instanceof Error
              ? notificationError.message
              : String(notificationError);
          console.log("Survey cancellation notification creation failed", {
            message,
          });
        }
      }
    } catch (error) {
      const errorLike = error as { code?: string; message?: string };
      const message =
        error instanceof Error
          ? error.message
          : (errorLike?.message ?? "Unknown cancellation error");

      if (__DEV__) {
        console.log("Handled cancellation failure", {
          message,
        });
      }

      if (__DEV__ && errorLike?.code === "PGRST204") {
        setCancelError(
          "Database migration is missing on the connected Supabase project. Apply the survey booking cancellation columns migration and reload the Supabase schema cache.",
        );
      } else if (message.includes("No survey booking was updated")) {
        setCancelError(
          "This survey booking could not be updated. Please refresh the page and try again.",
        );
      } else {
        setCancelError(
          "We could not cancel your survey booking. Please try again or contact our representative.",
        );
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            openedFromTab ? navigation.navigate("Home") : navigation.goBack()
          }
          accessibilityLabel="Back"
        >
          <ArrowLeft color="#10213A" size={22} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>My Solar Journey</Text>
          <Text style={styles.subtitle}>
            Track your survey and installation progress
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: getSafeBottomPadding(insets.bottom, 34) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.referenceCard}>
          <View>
            <Text style={styles.eyebrow}>REFERENCE NUMBER</Text>
            <Text style={styles.reference}>
              {formatSurveyReference(booking)}
            </Text>
          </View>
          <View style={styles.referenceIcon}>
            <ShieldCheck color="#168A4A" size={24} strokeWidth={2.2} />
          </View>
        </View>

        <View style={[styles.currentCard, { borderColor: current.tone }]}>
          <View
            style={[styles.currentDot, { backgroundColor: current.tone }]}
          />
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
          <DetailRow Icon={CalendarDays} label="Confirmed Survey" value={booking.confirmed_survey_at ? new Date(booking.confirmed_survey_at).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'To be confirmed'} />
          {booking.assigned_team_name ? <DetailRow Icon={User} label="Assigned Team" value={`${booking.assigned_team_name}${booking.assigned_team_contact ? ` · ${booking.assigned_team_contact}` : ''}`} /> : null}
          {booking.progress_note ? <DetailRow Icon={ClipboardCheck} label="Latest Update" value={booking.progress_note} /> : null}
          <DetailRow Icon={CalendarDays} label="Requested On" value={formatDate(booking.created_at)} last />
        </View>

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        {isCancelled ? (
          <View style={styles.cancelledCard}>
            <Text style={styles.cancelledTitle}>Survey Booking Cancelled</Text>
            <Text style={styles.cancelledText}>
              Reason: {booking.cancellation_reason || "Not provided"}
            </Text>
            {booking.cancellation_note ? (
              <Text style={styles.cancelledText}>
                Note: {booking.cancellation_note}
              </Text>
            ) : null}
            <Text style={styles.cancelledText}>
              Cancelled on: {formatDate(booking.cancelled_at)}
            </Text>
            <Pressable
              style={styles.newSurveyButton}
              onPress={() => navigation.navigate("BookSurvey")}
            >
              <Text style={styles.newSurveyText}>Book a New Survey</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Journey Progress</Text>
        <View style={styles.timelineCard}>
          {SURVEY_MILESTONE_DEFINITIONS.map((item, index) => {
            const Icon = timelineIcons[item.key];
            const state = getSolarJourneyStepState(milestone, lifecycle, index);
            const active = state === 'active';
            const complete = state === 'completed';
            const tone = complete ? '#168A4A' : active ? surveyMilestoneMeta[item.key].tone : '#B7BFC9';
            return (
              <View key={item.key} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[styles.timelineIcon, { backgroundColor: tone }]}
                  >
                    <Icon color="#FFFFFF" size={14} strokeWidth={2.4} />
                  </View>
                  {index < SURVEY_MILESTONE_DEFINITIONS.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: complete ? '#A7D8BB' : '#E2E6EA' }]} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <View style={styles.timelineHead}>
                    <Text style={[styles.timelineTitle, (active || complete) && styles.timelineTitleStrong]}>{item.label}</Text>
                    <Text style={[styles.badge, { color: tone, backgroundColor: `${tone}14` }]}>
                      {complete ? 'Completed' : active ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                  <Text style={styles.timelineText}>{item.customerDescription}</Text>
                  {item.key === 'survey_scheduled' && booking.confirmed_survey_at ? (
                    <Text style={styles.timelineSchedule}>
                      {new Date(booking.confirmed_survey_at).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {canCancelBooking ? (
          <Pressable
            style={styles.cancelButton}
            onPress={openCancelModal}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel Survey Booking</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={cancelModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoider}>
            <View style={[styles.cancelSheet, { paddingBottom: getSafeBottomPadding(insets.bottom, 22) }]}>
              <ScrollView contentContainerStyle={styles.cancelSheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.cancelTitle}>Cancel Survey Booking?</Text>
                <Text style={styles.cancelMessage}>
                  Are you sure you want to cancel your solar site survey
                  booking? This action will stop the current survey process.
                </Text>

                <Text style={styles.reasonLabel}>Cancellation reason</Text>
                <View style={styles.reasonList}>
                  {cancellationReasons.map((reason) => {
                    const selected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        style={[
                          styles.reasonOption,
                          selected && styles.reasonOptionSelected,
                          isCancelling && styles.reasonOptionDisabled,
                        ]}
                        onPress={() => {
                          setSelectedReason(reason);
                          setCancelError(null);
                        }}
                        disabled={isCancelling}
                      >
                        <View
                          style={[
                            styles.reasonRadio,
                            selected && styles.reasonRadioSelected,
                          ]}
                        />
                        <Text
                          style={[
                            styles.reasonText,
                            selected && styles.reasonTextSelected,
                          ]}
                        >
                          {reason}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {selectedReason === "Other" ? (
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Please tell us the reason"
                    placeholderTextColor="#9B6470"
                    value={otherReason}
                    onChangeText={(value) => {
                      setOtherReason(value);
                      setCancelError(null);
                    }}
                    editable={!isCancelling}
                    multiline
                  />
                ) : null}

                {cancelError !== null ? (
                  <Text style={styles.cancelErrorText}>{cancelError}</Text>
                ) : null}
              </ScrollView>

              <View style={styles.cancelActions}>
                <Pressable
                  style={[
                    styles.keepButton,
                    isCancelling && styles.actionDisabled,
                  ]}
                  onPress={closeCancelModal}
                  disabled={isCancelling}
                >
                  <Text style={styles.keepButtonText}>Keep My Booking</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.confirmCancelButton,
                    isCancelling && styles.confirmCancelButtonDisabled,
                  ]}
                  onPress={handleConfirmCancellation}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : null}
                  <Text style={styles.confirmCancelText}>
                    {isCancelling ? "Cancelling..." : "Yes, Cancel Survey"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const DetailRow = ({
  Icon,
  label,
  value,
  last = false,
}: {
  Icon: typeof User;
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.detailRow, last && styles.detailRowLast]}>
    <View style={styles.detailIcon}>
      <Icon color="#B07800" size={16} strokeWidth={2.1} />
    </View>
    <View style={styles.detailCopy}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#F7F3EB" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#F7F3EB",
  },
  loadingText: { color: "#526174", fontSize: 13, fontWeight: "700" },
  errorTitle: { color: "#10213A", fontSize: 20, fontWeight: "900" },
  errorText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  backHome: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#F7B500",
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  backHomeText: { color: "#10213A", fontSize: 13, fontWeight: "900" },
  header: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E7DFD1",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#FBF8F1",
  },
  headerCopy: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 38 },
  title: { color: "#10213A", fontSize: 18, fontWeight: "900" },
  subtitle: { marginTop: 3, color: "#738094", fontSize: 11, fontWeight: "700" },
  content: { padding: 14, paddingBottom: 34, gap: 12 },
  referenceCard: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#172031",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  eyebrow: {
    color: "#8A6B14",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  reference: {
    marginTop: 6,
    color: "#10213A",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  referenceIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
  },
  currentCard: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    backgroundColor: "#FFFDF8",
  },
  currentDot: { width: 12, height: 12, marginTop: 4, borderRadius: 999 },
  currentCopy: { flex: 1 },
  currentLabel: {
    color: "#7A8492",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  currentTitle: {
    marginTop: 4,
    color: "#10213A",
    fontSize: 16,
    fontWeight: "900",
  },
  currentDetail: {
    marginTop: 4,
    color: "#657184",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  sectionTitle: {
    marginTop: 3,
    color: "#10213A",
    fontSize: 15,
    fontWeight: "900",
  },
  detailCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#172031",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  detailRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E7EBEF",
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#FFF7E6",
  },
  detailCopy: { flex: 1 },
  detailLabel: { color: '#7A8492', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { marginTop: 3, color: '#243246', fontSize: 12.5, fontWeight: '800', textTransform: 'capitalize' },
  timelineCard: { borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF', shadowColor: '#172031', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  timelineRow: { minHeight: 66, flexDirection: 'row', gap: 11 },
  timelineRail: { width: 30, alignItems: 'center' },
  timelineIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  timelineLine: { width: 2, flex: 1, marginVertical: 3 },
  timelineCopy: { flex: 1, paddingTop: 3, paddingBottom: 8 },
  timelineHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 7 },
  timelineTitle: { flex: 1, color: '#697586', fontSize: 12.5, fontWeight: '800' },
  timelineTitleStrong: { color: '#10213A' },
  timelineText: { marginTop: 5, color: '#7A8492', fontSize: 11, fontWeight: '600', lineHeight: 15 },
  timelineSchedule: { marginTop: 4, color: '#2563EB', fontSize: 10.5, fontWeight: '800', lineHeight: 15 },
  badge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8.5, fontWeight: '900' },
  successText: { overflow: 'hidden', borderRadius: 12, backgroundColor: '#ECFDF3', paddingHorizontal: 12, paddingVertical: 10, color: '#168A4A', fontSize: 12, fontWeight: '900' },
  cancelledCard: { borderRadius: 16, borderWidth: 1, borderColor: '#F0B4B4', backgroundColor: '#FFF7F7', padding: 14, gap: 6 },
  cancelledTitle: { color: '#B42318', fontSize: 14, fontWeight: '900' },
  cancelledText: { color: '#7A2E2E', fontSize: 11.5, fontWeight: '700', lineHeight: 17 },
  newSurveyButton: { marginTop: 8, alignSelf: 'flex-start', borderRadius: 12, backgroundColor: '#F7B500', paddingHorizontal: 16, paddingVertical: 10 },
  newSurveyText: { color: '#10213A', fontSize: 12, fontWeight: '900' },
  cancelButton: { marginTop: 2, borderRadius: 14, borderWidth: 1, borderColor: '#F0B4B4', backgroundColor: '#FFF7F7', paddingVertical: 13, alignItems: 'center' },
  cancelButtonText: { color: '#B42318', fontSize: 13, fontWeight: '900' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.36)' },
  keyboardAvoider: { width: '100%' },
  cancelSheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFFDF8', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 22 },
  cancelSheetContent: { paddingBottom: 4 },
  cancelTitle: { color: "#10213A", fontSize: 19, fontWeight: "900" },
  cancelMessage: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  reasonLabel: {
    marginTop: 16,
    color: "#10213A",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  reasonList: { marginTop: 8, gap: 8 },
  reasonOption: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E7DFD1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  reasonOptionSelected: { borderColor: "#D14343", backgroundColor: "#FFF2F2" },
  reasonOptionDisabled: { opacity: 0.68 },
  reasonRadio: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#B7BFC9",
  },
  reasonRadioSelected: { borderColor: "#D14343", backgroundColor: "#D14343" },
  reasonText: { flex: 1, color: "#334155", fontSize: 12.5, fontWeight: "700" },
  reasonTextSelected: { color: "#9F1D1D" },
  reasonInput: {
    marginTop: 10,
    minHeight: 82,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#F0B4B4",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#10213A",
    fontSize: 13,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  cancelErrorText: {
    marginTop: 10,
    color: "#B42318",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  cancelActions: { marginTop: 16, flexDirection: "row", gap: 10 },
  keepButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0EA",
  },
  actionDisabled: { opacity: 0.62 },
  keepButtonText: { color: "#10213A", fontSize: 12.5, fontWeight: "900" },
  confirmCancelButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    gap: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D14343",
  },
  confirmCancelButtonDisabled: { opacity: 0.62 },
  confirmCancelText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "900" },
});
