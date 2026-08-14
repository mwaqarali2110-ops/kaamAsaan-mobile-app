import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Building2, CalendarCheck2, CalendarDays, Check, ChevronDown, Clock3, Home, MapPin, MessageCircle, Phone, ShieldCheck, ShoppingBag, User, Wrench } from 'lucide-react-native';
import { surveyBookingSchema, SurveyBookingForm } from '@/schemas/survey.schema';
import { systemApi } from '@/services/system.api';
import { useSystemStore, type BookingContext } from '@/store/useSystemStore';
import { useAuthStore } from '@/store/useAuthStore';
import { activeSurveyJourneyQueryKey } from '@/hooks/useSurveyJourney';
import { latestWelcomeNotificationQueryKey, notificationsQueryKey, unreadNotificationsQueryKey } from '@/hooks/useNotifications';
import { saveLocalActiveSurveyBooking } from '@/services/journey.api';
import { notificationsApi } from '@/services/notifications.api';
import { formatPkrAmount } from '@/utils/cleaningPricing';
import { buildPackagePromoContext, formatPkrCurrency, promoContextSignature } from '@/utils/promo';
import { createSelectedPackageSnapshot } from '@/utils/surveyPackageSnapshot';
import { DatePickerSheet, formatDateKey, formatDisplayDate } from '@/components/ui/DatePickerSheet';
import {
  buildCustomSystemPricing,
  buildCustomSystemSnapshot,
  calculateCustomSystemSizeKw,
  isCustomSystemComplete,
  resolvePanelQuantity,
  resolvePanelWattage
} from '@/utils/customSystem';
import { useRecommendationConfiguration } from '@/hooks/useRecommendationConfiguration';
import { DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION } from '@/utils/commercialRecommendation';
import { formatKw } from '@/utils/formatters';

const solarHouse = require("../../../assets/home/hero-house.png");

const TEAM_CONFIRMED_TIME_SLOT = "To be confirmed by team";
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

const SummaryLine = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <View style={styles.cleaningSummaryLine}>
    <Text style={[styles.cleaningSummaryLabel, strong && styles.cleaningSummaryStrong]}>{label}</Text>
    <Text style={[styles.cleaningSummaryValue, strong && styles.cleaningSummaryStrong]}>{value}</Text>
  </View>
);

export const BookSurveyScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateError, setDateError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const getSummary = useSystemStore((state) => state.getSummary);
  const startBooking = useSystemStore((state) => state.startBooking);
  const cleaningEstimate = useSystemStore((state) => state.cleaningEstimate);
  const clearCleaningEstimate = useSystemStore((state) => state.clearCleaningEstimate);
  const installationDetails = useSystemStore((state) => state.installationDetails);
  const clearInstallationDetails = useSystemStore((state) => state.clearInstallationDetails);
  const clearCustomSystem = useSystemStore((state) => state.clearCustomSystem);
  const selectedRecommendedPackageId = useSystemStore((state) => state.selectedRecommendedPackageId);
  const selectedRecommendedPackage = useSystemStore((state) => state.selectedRecommendedPackage);
  const promo = useSystemStore((state) => state.promo);
  const applyPromo = useSystemStore((state) => state.applyPromo);
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
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
  const bookingIdempotencyKey = useRef<string | null>(null);
  const bookingContext: BookingContext = route?.params?.bookingContext ??
    (route?.params?.source === 'cleaning_estimator'
      ? 'cleaning'
      : route?.params?.source === 'installation_service'
        ? 'installation'
        : route?.params?.packageId
          ? 'solar_package'
          : route?.params?.selectedServiceType
            ? 'electrical'
            : 'general');
  const isCleaningBooking = bookingContext === 'cleaning';
  const isInstallationBooking = bookingContext === 'installation';
  const isPackageBooking = bookingContext === 'solar_package';
  const isElectricalBooking = bookingContext === 'electrical';
  const isCustomSystemBooking = bookingContext === 'custom_system';
  const systemSummary = getSummary();
  const packageSummary = selectedRecommendedPackage ?? systemSummary.selectedRecommendedPackage;
  const promoContext = useMemo(() => buildPackagePromoContext(packageSummary), [packageSummary]);

  // --- Custom System Builder booking (no recommended package involved) ---
  const customSystem = useSystemStore((state) => state.customSystem);
  const selectedPanels = useSystemStore((state) => state.selectedPanels);
  const selectedInverter = useSystemStore((state) => state.selectedInverter);
  const selectedBattery = useSystemStore((state) => state.selectedBattery);
  const panelWattageSetting = useSystemStore((state) => state.panelWattage);
  const panelQuantityOverride = useSystemStore((state) => state.panelQuantityOverride);
  const recommendedSolarKw = useSystemStore((state) => state.recommendedSolarKw);
  const recommendationConfigurationQuery = useRecommendationConfiguration();
  const customSystemSnapshot = useMemo(() => {
    if (!isCustomSystemBooking) return null;
    const selection = {
      selectedPanel: selectedPanels,
      selectedInverter,
      selectedBattery
    };
    if (!isCustomSystemComplete(selection)) return null;

    const settings = (recommendationConfigurationQuery.data ?? DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION).settings;
    const additionalCharges =
      (settings.configuredInstallationCost ?? 0) +
      (settings.configuredStructureCost ?? 0) +
      (settings.configuredAccessoriesCost ?? 0);
    const panelWattage = resolvePanelWattage(selectedPanels, customSystem.panelWattage ?? panelWattageSetting);
    const panelQuantity = resolvePanelQuantity({
      explicitQuantity: customSystem.panelQuantity,
      panelQuantityOverride,
      targetSolarKw: recommendedSolarKw,
      panelWattage
    });
    const batteryQuantity = Math.max(1, customSystem.batteryQuantity || 1);
    const pricing = buildCustomSystemPricing({
      ...selection,
      panelQuantity,
      batteryQuantity,
      additionalCharges
    });

    return buildCustomSystemSnapshot({
      ...selection,
      panelQuantity,
      panelWattage,
      batteryQuantity,
      pricing
    });
  }, [
    customSystem.batteryQuantity,
    customSystem.panelQuantity,
    customSystem.panelWattage,
    isCustomSystemBooking,
    panelQuantityOverride,
    panelWattageSetting,
    recommendationConfigurationQuery.data,
    recommendedSolarKw,
    selectedBattery,
    selectedInverter,
    selectedPanels
  ]);
  const hasAppliedPackagePromo = Boolean(
    isPackageBooking &&
    promoContext &&
    promo.status === 'applied' &&
    promo.appliedCode &&
    promo.appliedPackageId === promoContext.packageId &&
    promo.appliedContextSignature === promoContextSignature(promoContext)
  );
  const openCalendar = () => setCalendarOpen(true);

  useEffect(() => {
    startBooking(bookingContext);
  }, [bookingContext, startBooking]);

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
    bookingIdempotencyKey.current ??= `survey-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    try {
      const serviceType = isInstallationBooking
        ? 'installation'
        : isCleaningBooking
          ? 'cleaning'
          : isElectricalBooking
            ? 'electrical'
            // A custom build is still a solar package purchase as far as the
            // backend is concerned — it just has no recommendedPackageId.
            : isPackageBooking || isCustomSystemBooking
              ? 'solar_package'
              : 'solar_survey';
      const selectedPackageSnapshot = isCustomSystemBooking
        ? customSystemSnapshot
        : isPackageBooking && packageSummary
          ? createSelectedPackageSnapshot({
              selectedPackage: packageSummary,
              grossTotal: promoContext?.originalTotal ?? packageSummary.totalPrice ?? 0,
              discountAmount: hasAppliedPackagePromo ? promo.discountAmount : 0,
              finalTotal: hasAppliedPackagePromo
                ? promo.finalTotal
                : promoContext?.originalTotal ?? packageSummary.totalPrice ?? 0,
              promoCode: hasAppliedPackagePromo ? promo.appliedCode : null
            })
          : null;
      const result = await mutation.mutateAsync({
        userId: session.user.id,
        idempotencyKey: bookingIdempotencyKey.current,
        fullName: values.name,
        phone: values.phone,
        city: values.city,
        address: values.address,
        preferredDate: formatDateKey(selectedDate),
        preferredTimeSlot: TEAM_CONFIRMED_TIME_SLOT,
        customerEmail: session.user.email ?? null,
        serviceType,
        selectedPackageSnapshot,
        notes: JSON.stringify({
          source: 'mobile-app',
          selectedRecommendedPackageId: selectedRecommendedPackageId ?? route?.params?.packageId ?? null,
          selectedRecommendedPackage,
          bookingContext,
          systemSummary,
          serviceType,
          serviceSubType: isElectricalBooking ? route?.params?.selectedServiceType ?? null : null,
          customSystem: isCustomSystemBooking ? customSystemSnapshot : null,
          selectedServiceTitle: isInstallationBooking
            ? 'Solar Panel Installation'
            : isCleaningBooking
              ? 'Solar Panel Cleaning'
              : isCustomSystemBooking
                ? 'Custom Designed System'
                : isPackageBooking
                  ? packageSummary?.packageName ?? systemSummary.packageName ?? 'Selected Solar Package'
                : route?.params?.selectedServiceTitle ?? null,
          cleaning: isCleaningBooking ? cleaningEstimate : null,
          installation: isInstallationBooking ? installationDetails : null,
          solarPackage: isPackageBooking && packageSummary ? {
            ...packageSummary,
            originalEstimatedAmount: promoContext?.originalTotal ?? packageSummary.totalPrice,
            promo: hasAppliedPackagePromo ? {
              promoId: promo.promoId,
              code: promo.appliedCode,
              discountType: promo.discountType,
              appliesTo: promo.appliesTo,
              eligibleAmount: promo.eligibleAmount,
              discountAmount: promo.discountAmount
            } : null,
            finalEstimatedAmount: hasAppliedPackagePromo
              ? promo.finalTotal
              : promoContext?.originalTotal ?? packageSummary.totalPrice
          } : null
        }),
        solarPackagePricing: hasAppliedPackagePromo && promoContext && promo.appliedCode ? {
          context: promoContext,
          promoCode: promo.appliedCode
        } : null
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
      await queryClient.invalidateQueries({ queryKey: activeSurveyJourneyQueryKey(session.user.id) });
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey(session.user.id) });
      await queryClient.invalidateQueries({ queryKey: unreadNotificationsQueryKey(session.user.id) });
      await queryClient.invalidateQueries({ queryKey: latestWelcomeNotificationQueryKey(session.user.id) });
      if (isCleaningBooking) clearCleaningEstimate();
      if (isInstallationBooking) clearInstallationDetails();
      if (isCustomSystemBooking) clearCustomSystem();
      navigation.replace('SurveyConfirmation', { bookingId: result.bookingId });
    } catch {
      // Mutation error is shown inline below the trust card.
      if (hasAppliedPackagePromo && promoContext && promo.appliedCode) {
        await applyPromo(promoContext, promo.appliedCode);
      }
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

        {isPackageBooking && packageSummary ? (
          <View style={styles.cleaningSummaryCard}>
            <Text style={styles.cleaningSummaryKicker}>System Summary</Text>
            <Text style={styles.cleaningSummaryTitle}>{packageSummary.packageName}</Text>
            <View style={styles.cleaningSummaryRows}>
              <SummaryLine label="System Size" value={`${packageSummary.totalSolarKw.toFixed(2)} kW`} />
              <SummaryLine label="Panels" value={`${packageSummary.panelQuantity} x ${Math.round((packageSummary.totalSolarKw * 1000) / Math.max(1, packageSummary.panelQuantity)) || systemSummary.panelWattage}W`} />
              <SummaryLine label="Inverter" value={`${packageSummary.inverterSizeKw} kW`} />
              <SummaryLine label="Battery" value={packageSummary.totalBatteryKwh > 0 ? `${packageSummary.totalBatteryKwh} kWh` : 'Not included'} />
              {hasAppliedPackagePromo ? (
                <>
                  <SummaryLine label="Original Estimate" value={formatPkrCurrency(promo.originalTotal)} />
                  <SummaryLine label={`Promo (${promo.appliedCode})`} value={`-${formatPkrCurrency(promo.discountAmount)}`} />
                </>
              ) : null}
              <SummaryLine
                label="Estimated Cost"
                value={hasAppliedPackagePromo
                  ? formatPkrCurrency(promo.finalTotal)
                  : formatPkrAmount(packageSummary.totalPrice)}
                strong
              />
            </View>
          </View>
        ) : null}

        {isCustomSystemBooking && customSystemSnapshot ? (
          <View style={styles.cleaningSummaryCard}>
            <Text style={styles.cleaningSummaryKicker}>Your Designed System</Text>
            <Text style={styles.cleaningSummaryTitle}>{customSystemSnapshot.packageName}</Text>
            <View style={styles.cleaningSummaryRows}>
              <SummaryLine
                label="System Size"
                value={formatKw(calculateCustomSystemSizeKw(
                  customSystemSnapshot.panel?.quantity ?? 0,
                  customSystemSnapshot.panel?.wattage ?? 0
                ))}
              />
              {customSystemSnapshot.panel ? (
                <SummaryLine
                  label="Solar Panels"
                  value={`${customSystemSnapshot.panel.quantity} x ${customSystemSnapshot.panel.wattage}W`}
                />
              ) : null}
              {customSystemSnapshot.inverter ? (
                <SummaryLine
                  label="Inverter"
                  value={`${customSystemSnapshot.inverter.brand} ${customSystemSnapshot.inverter.capacityKw} kW`}
                />
              ) : null}
              {customSystemSnapshot.battery ? (
                <SummaryLine
                  label="Battery"
                  value={`${customSystemSnapshot.battery.brand} ${customSystemSnapshot.battery.totalCapacityKwh} kWh`}
                />
              ) : null}
              <SummaryLine
                label="Total Estimated Price"
                value={formatPkrAmount(customSystemSnapshot.finalTotal)}
                strong
              />
            </View>
          </View>
        ) : null}

        {isCleaningBooking && cleaningEstimate ? (
          <View style={styles.cleaningSummaryCard}>
            <Text style={styles.cleaningSummaryKicker}>Cleaning Service Summary</Text>
            <Text style={styles.cleaningSummaryTitle}>Solar Panel Cleaning</Text>
            <View style={styles.cleaningSummaryRows}>
              <SummaryLine label="System Size" value={`${cleaningEstimate.systemSizeKw} kW`} />
              <SummaryLine label="Structure" value={cleaningEstimate.structureType === 'elevated' ? 'Elevated' : 'Standard'} />
              {cleaningEstimate.structureType === 'elevated' ? <SummaryLine label="Front Height" value={`${cleaningEstimate.frontHeightFt} ft`} /> : null}
              {cleaningEstimate.structureType === 'elevated' ? <SummaryLine label="Back Height" value={`${cleaningEstimate.backHeightFt} ft`} /> : null}
              <SummaryLine label="Estimated Charges" value={formatPkrAmount(cleaningEstimate.estimatedAmount)} strong />
            </View>
          </View>
        ) : null}
        <Pressable style={[styles.dateField, dateError && styles.inputError]} onPress={openCalendar} accessibilityRole="button">
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

      <DatePickerSheet
        visible={calendarOpen}
        value={selectedDate}
        onCancel={() => setCalendarOpen(false)}
        onConfirm={(date) => {
          setSelectedDate(date);
          setDateError("");
          setCalendarOpen(false);
        }}
      />

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
  confirmText: { color: '#0F1E33', fontSize: 17, fontWeight: '900' },
  cleaningSummaryCard: {
    borderRadius: 18,
    backgroundColor: '#FFF9E8',
    borderWidth: 1,
    borderColor: '#F1D47A',
    padding: 14,
    marginTop: 2,
    marginBottom: 4
  },
  cleaningSummaryKicker: {
    color: '#8A5D00',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  cleaningSummaryTitle: {
    marginTop: 4,
    color: '#0F1E33',
    fontSize: 16,
    fontWeight: '900'
  },
  cleaningSummaryRows: {
    marginTop: 10,
    gap: 7
  },
  cleaningSummaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  cleaningSummaryLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  cleaningSummaryValue: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right'
  },
  cleaningSummaryStrong: {
    color: '#0F1E33',
    fontSize: 13
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
