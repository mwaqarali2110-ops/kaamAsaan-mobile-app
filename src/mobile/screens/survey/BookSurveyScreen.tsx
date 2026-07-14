import {
  latestWelcomeNotificationQueryKey,
  notificationsQueryKey,
  unreadNotificationsQueryKey,
} from "@/hooks/useNotifications";
import { activeSurveyJourneyQueryKey } from "@/hooks/useSurveyJourney";
import {
  SurveyBookingForm,
  surveyBookingSchema,
} from "@/schemas/survey.schema";
import { saveLocalActiveSurveyBooking } from "@/services/journey.api";
import { notificationsApi } from "@/services/notifications.api";
import { systemApi } from "@/services/system.api";
import { useAuthStore } from "@/store/useAuthStore";
import { useSystemStore } from "@/store/useSystemStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
  Wrench,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const solarHouse = require("../../../assets/home/hero-house.png");

const TEAM_CONFIRMED_TIME_SLOT = "To be confirmed by team";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstGridDate = new Date(firstDay);
  firstGridDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(firstGridDate);
    value.setDate(firstGridDate.getDate() + index);
    return value;
  });
};

const bottomTabs = [
  { title: "Home", Icon: Home, route: "MainTabs", params: { screen: "Home" } },
  {
    title: "Marketplace",
    Icon: ShoppingBag,
    route: "MainTabs",
    params: { screen: "Marketplace" },
  },
  { title: "Services", Icon: ShieldCheck },
  { title: "Tools", Icon: Wrench, route: "DesignFlow" },
  {
    title: "Profile",
    Icon: User,
    route: "MainTabs",
    params: { screen: "Profile" },
  },
];

const AddressField = ({
  control,
  name,
  placeholder,
  Icon,
  keyboardType,
}: {
  control: any;
  name: "name" | "phone" | "address" | "city";
  placeholder: string;
  Icon: typeof Home;
  keyboardType?: "default" | "phone-pad";
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
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateError, setDateError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const getSummary = useSystemStore((state) => state.getSummary);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth],
  );
  const form = useForm<SurveyBookingForm>({
    resolver: zodResolver(surveyBookingSchema),
    defaultValues: {
      name: "",
      phone: "",
      city: "",
      address: "",
    },
  });
  const mutation = useMutation({ mutationFn: systemApi.submitSurveyBooking });
  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null;
  const draftDateKey = draftDate ? formatDateKey(draftDate) : null;
  const todayKey = formatDateKey(today);

  const openCalendar = () => {
    const initialDate = selectedDate ?? today;
    setDraftDate(initialDate);
    setCalendarMonth(
      new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );
    setCalendarOpen(true);
  };

  const closeCalendar = () => {
    setCalendarOpen(false);
  };

  const confirmCalendarDate = () => {
    if (!draftDate) return;
    setSelectedDate(draftDate);
    setDateError("");
    setCalendarOpen(false);
  };

  const moveCalendarMonth = (direction: -1 | 1) => {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  useEffect(() => {
    if (!profile) return;
    form.reset({
      name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      city: profile.city ?? "",
      address: form.getValues("address"),
    });
  }, [form, profile]);

  const submit = form.handleSubmit(async (values) => {
    if (!selectedDate) {
      setDateError("Please select a survey date.");
      return;
    }
    if (!session?.user.id) {
      navigation.replace("Login", { redirectTo: "BookSurvey" });
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
        preferredDate: formatDateKey(selectedDate),
        preferredTimeSlot: TEAM_CONFIRMED_TIME_SLOT,
        notes: JSON.stringify({
          source: "mobile-app",
          systemSummary: getSummary(),
        }),
      });
      if (result.booking) {
        await saveLocalActiveSurveyBooking(result.booking);
        try {
          await notificationsApi.createSurveyWelcomeNotificationOnce(
            result.booking,
          );
        } catch (notificationError) {
          console.error(
            "Survey welcome notification creation failed:",
            notificationError,
          );
        }
        queryClient.setQueryData(
          activeSurveyJourneyQueryKey(session.user.id),
          result.booking,
        );
        queryClient.setQueryData(
          ["survey-bookings", "detail", result.booking.id],
          result.booking,
        );
      }
      await queryClient.invalidateQueries({
        queryKey: activeSurveyJourneyQueryKey(session.user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKey(session.user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: unreadNotificationsQueryKey(session.user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: latestWelcomeNotificationQueryKey(session.user.id),
      });
      navigation.replace("SurveyConfirmation", { bookingId: result.bookingId });
    } catch {
      // Mutation error is shown inline below the trust card.
      setIsSubmitted(false);
    }
  });

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        >
          <ArrowLeft color="#0F1E33" size={24} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Book Survey</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 176 + safeBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <CalendarCheck2 color="#F5A400" size={28} strokeWidth={2} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Let's schedule your survey</Text>
            <Text style={styles.heroText}>
              Choose a date and provide your contact details. Our team will call
              to confirm the visit time.
            </Text>
          </View>
          <View style={styles.heroArt}>
            <CalendarDays color="#F5A400" size={58} strokeWidth={1.6} />
            <View style={styles.clockBubble}>
              <Clock3 color="#172031" size={34} strokeWidth={1.9} />
            </View>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <CalendarDays color="#0F1E33" size={24} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Select Date</Text>
        </View>
        <Pressable
          style={[styles.dateField, dateError && styles.inputError]}
          onPress={openCalendar}
          accessibilityRole="button"
        >
          <View style={styles.inputIcon}>
            <CalendarDays color="#334155" size={21} strokeWidth={2.1} />
          </View>
          <Text
            style={[
              styles.dateFieldText,
              !selectedDate && styles.datePlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedDate
              ? formatDisplayDate(selectedDate)
              : "Select survey date"}
          </Text>
          <ChevronDown color="#64748B" size={19} strokeWidth={2.3} />
        </Pressable>
        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

        <View style={styles.sectionTitleRow}>
          <User color="#0F1E33" size={24} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Contact Details</Text>
        </View>
        <View style={styles.fields}>
          <AddressField
            control={form.control}
            name="name"
            placeholder="Full name"
            Icon={User}
          />
          <AddressField
            control={form.control}
            name="phone"
            placeholder="Phone number"
            Icon={Phone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.sectionTitleRow}>
          <MapPin color="#0F1E33" size={24} strokeWidth={2.1} />
          <Text style={styles.sectionTitle}>Service Address</Text>
        </View>
        <View style={styles.fields}>
          <AddressField
            control={form.control}
            name="address"
            placeholder="House / flat number, street name"
            Icon={Home}
          />
          <AddressField
            control={form.control}
            name="city"
            placeholder="City (e.g. Lahore, Karachi)"
            Icon={Building2}
          />
        </View>

        <Text style={styles.timingNote}>
          Our team will contact you to confirm timing.
        </Text>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <ShieldCheck
              color="#FFFFFF"
              size={24}
              fill="#22A06B"
              strokeWidth={2.2}
            />
          </View>
          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>
              Your information is safe with us
            </Text>
            <Text style={styles.trustText}>
              We only use your details to provide the best maintenance service.
            </Text>
          </View>
          <View style={styles.houseWrap}>
            <Image
              source={solarHouse}
              style={styles.houseImage}
              resizeMode="contain"
            />
            <View style={styles.houseShield}>
              <Check color="#FFFFFF" size={22} strokeWidth={3} />
            </View>
          </View>
        </View>
        {mutation.error ? (
          <Text style={styles.submitErrorText}>{mutation.error.message}</Text>
        ) : null}
      </ScrollView>

      <Pressable
        style={[styles.chatButton, { bottom: 92 + safeBottom }]}
        accessibilityLabel="WhatsApp help"
      >
        <MessageCircle color="#FFFFFF" size={20} strokeWidth={2.2} />
      </Pressable>

      <View style={[styles.footer, { paddingBottom: 12 + safeBottom }]}>
        <Pressable
          style={[
            styles.confirmButton,
            (mutation.isPending || isSubmitted) && styles.confirmButtonDisabled,
          ]}
          onPress={submit}
          disabled={mutation.isPending || isSubmitted}
        >
          <Text style={styles.confirmText}>
            {mutation.isPending || isSubmitted
              ? "Confirming..."
              : "Confirm Booking"}
          </Text>
          <ArrowRight color="#111827" size={28} strokeWidth={2.3} />
        </Pressable>
      </View>

      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={closeCalendar}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeCalendar}>
          <Pressable
            style={[
              styles.calendarSheet,
              { paddingBottom: Math.max(18, insets.bottom + 12) },
            ]}
          >
            <View style={styles.calendarHeader}>
              <Pressable
                style={styles.calendarNavButton}
                onPress={() => moveCalendarMonth(-1)}
                accessibilityRole="button"
              >
                <ChevronLeft color="#0F1E33" size={22} strokeWidth={2.5} />
              </Pressable>
              <Text style={styles.calendarMonthTitle}>
                {formatMonthTitle(calendarMonth)}
              </Text>
              <Pressable
                style={styles.calendarNavButton}
                onPress={() => moveCalendarMonth(1)}
                accessibilityRole="button"
              >
                <ChevronRight color="#0F1E33" size={22} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => (
                <Text
                  key={day}
                  style={[
                    styles.weekdayText,
                    day === "Sun" && styles.sundayText,
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day) => {
                const dayKey = formatDateKey(day);
                const inCurrentMonth =
                  day.getMonth() === calendarMonth.getMonth();
                const selected = draftDateKey === dayKey;
                const todayDate = todayKey === dayKey;

                return (
                  <Pressable
                    key={dayKey}
                    style={[
                      styles.calendarDay,
                      selected && styles.calendarDaySelected,
                      todayDate && !selected && styles.calendarDayToday,
                    ]}
                    onPress={() => setDraftDate(startOfLocalDay(day))}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        !inCurrentMonth && styles.calendarDayMuted,
                        todayDate && !selected && styles.calendarDayTodayText,
                        selected && styles.calendarDaySelectedText,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <Pressable style={styles.calendarCancel} onPress={closeCalendar}>
                <Text style={styles.calendarCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.calendarConfirm}
                onPress={confirmCalendarDate}
              >
                <Text style={styles.calendarConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View
        style={[
          styles.bottomNav,
          {
            height: 64 + insets.bottom,
            paddingBottom: Math.max(4, insets.bottom),
          },
        ]}
      >
        {bottomTabs.map(({ title, Icon, route, params }) => {
          const active = title === "Home";
          return (
            <Pressable
              key={title}
              style={styles.navItem}
              onPress={() => route && navigation.navigate(route, params)}
            >
              <Icon
                color={active ? "#F5A400" : "#566174"}
                size={20}
                strokeWidth={2}
              />
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#FBF8F1" },
  topBar: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  title: {
    flex: 1,
    color: "#0F1E33",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  topSpacer: { width: 46 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 176 },
  heroCard: {
    minHeight: 78,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F3DCA8",
    backgroundColor: "#FFF9EA",
    flexDirection: "row",
    alignItems: "center",
    padding: 9,
    marginBottom: 13,
    overflow: "hidden",
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F6D486",
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, paddingLeft: 12, paddingRight: 4 },
  heroTitle: {
    color: "#0F1E33",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 16,
  },
  heroText: {
    marginTop: 3,
    color: "#334155",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  heroArt: {
    width: 68,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  clockBubble: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#F5A400",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  sectionTitle: {
    color: "#0F1E33",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  dateField: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DED2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 12,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  dateFieldText: {
    flex: 1,
    color: "#0F1E33",
    fontSize: 13.5,
    fontWeight: "800",
  },
  datePlaceholder: {
    color: "#64748B",
    fontWeight: "600",
  },
  fields: { gap: 8, marginBottom: 12 },
  inputWrap: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E8DED2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },
  inputError: { borderColor: "#D9534F" },
  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#FFF3D4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  input: { flex: 1, color: "#0F1E33", fontSize: 14, fontWeight: "600" },
  errorText: {
    marginTop: 5,
    color: "#D9534F",
    fontSize: 11,
    fontWeight: "700",
  },
  timingNote: {
    marginTop: -2,
    marginBottom: 12,
    color: "#64748B",
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  submitErrorText: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    padding: 10,
    color: "#B42318",
    fontSize: 11.5,
    fontWeight: "800",
    lineHeight: 16,
  },
  trustCard: {
    minHeight: 104,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B8E1D2",
    backgroundColor: "#F2FBF7",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    overflow: "hidden",
  },
  trustIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#22A06B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F5132",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  trustCopy: { flex: 1, paddingLeft: 13, paddingRight: 6 },
  trustTitle: {
    color: "#0F1E33",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  trustText: {
    marginTop: 5,
    color: "#334155",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  houseWrap: {
    width: 74,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  houseImage: { width: 90, height: 66 },
  houseShield: {
    position: "absolute",
    right: 1,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#79C84E",
    alignItems: "center",
    justifyContent: "center",
  },
  chatButton: {
    position: "absolute",
    right: 18,
    bottom: 102,
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "#08213F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#08213F",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#FBF8F1",
  },
  confirmButton: {
    height: 56,
    borderRadius: 13,
    backgroundColor: "#F7B500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    shadowColor: "#C87500",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  confirmButtonDisabled: { opacity: 0.68 },
  confirmText: { color: "#0F1E33", fontSize: 17, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  calendarSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFBF2",
    paddingHorizontal: 18,
    paddingTop: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  calendarHeader: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarNavButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8DED2",
  },
  calendarMonthTitle: {
    color: "#0F1E33",
    fontSize: 16,
    fontWeight: "900",
  },
  weekdayRow: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    color: "#64748B",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900",
  },
  sundayText: {
    color: "#B42318",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  calendarDaySelected: {
    borderRadius: 14,
    backgroundColor: "#F5A400",
  },
  calendarDayToday: {
    borderRadius: 14,
    backgroundColor: "#FFF3D4",
    borderWidth: 1,
    borderColor: "#F5A400",
  },
  calendarDayText: {
    color: "#0F1E33",
    fontSize: 13,
    fontWeight: "800",
  },
  calendarDayMuted: {
    color: "#C0B7A8",
  },
  calendarDayTodayText: {
    color: "#B77900",
  },
  calendarDaySelectedText: {
    color: "#FFFFFF",
  },
  calendarActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  calendarCancel: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DED2",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },
  calendarConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F7B500",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarConfirmText: {
    color: "#0F1E33",
    fontSize: 14,
    fontWeight: "900",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "rgba(218,211,203,0.8)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navText: { color: "#566174", fontSize: 10, fontWeight: "700" },
  navTextActive: { color: "#F5A400" },
});
