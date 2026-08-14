import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDownUp, ArrowLeft, ArrowRight, Check, ChevronDown, Headphones, ShieldCheck } from 'lucide-react-native';
import { useSystemStore } from '@/store/useSystemStore';
import { useServicePricing } from '@/hooks/useProducts';
import {
  calculateCleaningEstimate,
  CLEANING_PRICING,
  formatPkrAmount,
  type CleaningPricingRates,
  type CleaningStructureType
} from '@/utils/cleaningPricing';

const cleaningHeroImage = require('../../../../cleaning hero section picture.png');

const structureOptions: Array<{ value: CleaningStructureType; label: string }> = [
  { value: 'standard', label: 'Standard Structure' },
  { value: 'elevated', label: 'Elevated Structure' }
];

const numericValue = (value: string) =>
  value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

const parsePositiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const CleaningServiceEstimatorScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const stackHeightFields = width < 350;
  const servicePricingQuery = useServicePricing();
  const pricing = useMemo((): CleaningPricingRates => {
    const live = servicePricingQuery.data;
    if (!live) return CLEANING_PRICING;
    return {
      baseVisitCharge: live.cleaningBaseVisitCharge,
      standardRatePerKw: live.cleaningStandardRatePerKw,
      elevatedRatePerKw: live.cleaningElevatedRatePerKw,
      elevatedHeightRate: live.cleaningElevatedHeightRate,
      minimumCharge: live.cleaningMinimumCharge,
      taxRate: live.cleaningTaxRate
    };
  }, [servicePricingQuery.data]);
  const storedEstimate = useSystemStore((state) => state.cleaningEstimate);
  const setCleaningEstimate = useSystemStore((state) => state.setCleaningEstimate);
  const clearCleaningEstimate = useSystemStore((state) => state.clearCleaningEstimate);
  const [systemSize, setSystemSize] = useState('');
  const [structureType, setStructureType] = useState<CleaningStructureType | null>(storedEstimate?.structureType ?? null);
  const [frontHeight, setFrontHeight] = useState(storedEstimate?.frontHeightFt ? String(storedEstimate.frontHeightFt) : '');
  const [backHeight, setBackHeight] = useState(storedEstimate?.backHeightFt ? String(storedEstimate.backHeightFt) : '');
  const [structureMenuOpen, setStructureMenuOpen] = useState(false);
  const [sizeTouched, setSizeTouched] = useState(false);
  const [frontTouched, setFrontTouched] = useState(false);
  const [backTouched, setBackTouched] = useState(false);

  const systemSizeKw = parsePositiveNumber(systemSize);
  const frontHeightFt = parsePositiveNumber(frontHeight);
  const backHeightFt = parsePositiveNumber(backHeight);
  const elevated = structureType === 'elevated';
  const sizeError = sizeTouched
    ? !systemSizeKw
      ? 'Please enter a system size greater than 0.'
      : systemSizeKw > CLEANING_PRICING.maxSystemSizeKw
        ? `Please enter a system size up to ${CLEANING_PRICING.maxSystemSizeKw} kW.`
        : ''
    : '';
  const frontError = elevated && frontTouched && !frontHeightFt ? 'Enter a front height greater than 0.' : '';
  const backError = elevated && backTouched && !backHeightFt ? 'Enter a back height greater than 0.' : '';
  const isValid = Boolean(
    systemSizeKw &&
    systemSizeKw <= CLEANING_PRICING.maxSystemSizeKw &&
    structureType &&
    (!elevated || (frontHeightFt && backHeightFt))
  );
  const estimate = useMemo(() => {
    if (!isValid || !systemSizeKw || !structureType) return null;
    return calculateCleaningEstimate({
      systemSizeKw,
      structureType,
      frontHeightFt: elevated ? frontHeightFt : null,
      backHeightFt: elevated ? backHeightFt : null,
      pricing
    });
  }, [backHeightFt, elevated, frontHeightFt, isValid, pricing, structureType, systemSizeKw]);

  const saveEstimate = () => {
    if (!estimate) return false;
    setCleaningEstimate(estimate);
    return true;
  };

  const continueToSurvey = () => {
    if (!saveEstimate()) return;
    navigation.navigate('BookSurvey', { source: 'cleaning_estimator', bookingContext: 'cleaning' });
  };

  const talkToExpert = () => {
    if (!saveEstimate()) clearCleaningEstimate();
    navigation.navigate('BookSurvey', { source: 'cleaning_estimator', bookingContext: 'cleaning' });
  };

  const selectedStructureLabel = structureOptions.find((option) => option.value === structureType)?.label;

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            android_ripple={{ color: 'rgba(166, 111, 0, 0.10)', borderless: false }}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#111827" size={27} strokeWidth={2.25} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Solar Panel Cleaning</Text>
            <Text style={styles.subtitle}>Get an estimated cleaning cost for your system</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 92 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground source={cleaningHeroImage} style={styles.hero} imageStyle={styles.heroImage} resizeMode="cover">
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Professional Solar{`\n`}Panel Cleaning</Text>
              <Text style={styles.heroSubtitle}>Improve panel performance{`\n`}with expert cleaning.</Text>
            </View>
          </ImageBackground>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Enter Solar Size</Text>
            <View style={[styles.largeInputWrap, Boolean(sizeError) && styles.inputErrorBorder]}>
              <TextInput
                style={styles.largeInput}
                value={systemSize}
                onChangeText={(value) => setSystemSize(numericValue(value))}
                onBlur={() => setSizeTouched(true)}
                placeholder="e.g 10kW"
                placeholderTextColor="rgba(17, 24, 39, 0.45)"
                keyboardType="decimal-pad"
                inputMode="decimal"
                accessibilityLabel="Solar system size in kilowatts"
              />
              <Text style={styles.largeUnit}>kW</Text>
            </View>
            {sizeError ? <Text style={styles.errorText}>{sizeError}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Structure Type</Text>
            <Pressable
              style={[styles.dropdownField, structureMenuOpen && styles.dropdownFieldActive]}
              android_ripple={{ color: 'rgba(227, 160, 0, 0.08)', borderless: false }}
              onPress={() => setStructureMenuOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Select solar panel structure type"
              accessibilityState={{ expanded: structureMenuOpen }}
            >
              <Text style={[styles.dropdownText, !selectedStructureLabel && styles.dropdownPlaceholder]}>
                {selectedStructureLabel ?? 'Select structure type'}
              </Text>
              <ChevronDown color="#9A6900" size={21} strokeWidth={2.35} />
            </Pressable>

            {elevated ? (
              <View style={styles.heightsSection}>
                <Text style={styles.heightsTitle}>Structure Heights</Text>
                <View style={[styles.heightRow, stackHeightFields && styles.heightRowStack]}>
                  <View style={styles.heightFieldGroup}>
                    <View style={[styles.heightInputWrap, Boolean(frontError) && styles.inputErrorBorder]}>
                      <ArrowDownUp color="#6B7280" size={19} strokeWidth={2} />
                      <TextInput
                        style={styles.heightInput}
                        value={frontHeight}
                        onChangeText={(value) => setFrontHeight(numericValue(value))}
                        onBlur={() => setFrontTouched(true)}
                        placeholder="Front height"
                        placeholderTextColor="rgba(17, 24, 39, 0.45)"
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        accessibilityLabel="Front structure height in feet"
                      />
                      <Text style={styles.heightUnit}>ft</Text>
                    </View>
                    {frontError ? <Text style={styles.errorText}>{frontError}</Text> : null}
                  </View>
                  <View style={styles.heightFieldGroup}>
                    <View style={[styles.heightInputWrap, Boolean(backError) && styles.inputErrorBorder]}>
                      <ArrowDownUp color="#6B7280" size={19} strokeWidth={2} />
                      <TextInput
                        style={styles.heightInput}
                        value={backHeight}
                        onChangeText={(value) => setBackHeight(numericValue(value))}
                        onBlur={() => setBackTouched(true)}
                        placeholder="Back height"
                        placeholderTextColor="rgba(17, 24, 39, 0.45)"
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        accessibilityLabel="Back structure height in feet"
                      />
                      <Text style={styles.heightUnit}>ft</Text>
                    </View>
                    {backError ? <Text style={styles.errorText}>{backError}</Text> : null}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.estimateCard}>
            <Text style={styles.estimateTitle}>Estimated Charges</Text>
            <Text style={[styles.estimateAmount, !estimate && styles.estimateAmountEmpty]}>
              {estimate ? formatPkrAmount(estimate.estimatedAmount) : 'PKR —'}
            </Text>
            <View style={styles.estimateNoteRow}>
              <ShieldCheck color="#B77900" size={18} strokeWidth={2.1} />
              <Text style={styles.estimateNote}>Final amount may vary after survey.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable
            style={styles.secondaryButton}
            android_ripple={{ color: 'rgba(227, 160, 0, 0.10)', borderless: false }}
            onPress={talkToExpert}
            accessibilityRole="button"
            accessibilityLabel="Talk to an expert"
          >
            <Headphones color="#A66F00" size={21} strokeWidth={2.1} />
            <Text style={styles.secondaryText} numberOfLines={1}>Talk to an Expert</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, !estimate && styles.primaryButtonDisabled]}
            android_ripple={estimate ? { color: 'rgba(17, 24, 39, 0.08)', borderless: false } : undefined}
            onPress={continueToSurvey}
            disabled={!estimate}
            accessibilityRole="button"
            accessibilityLabel="Continue to book survey"
            accessibilityState={{ disabled: !estimate }}
          >
            <Text style={styles.primaryText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>Continue to Book Survey</Text>
            <ArrowRight color={estimate ? '#111827' : '#6B7280'} size={21} strokeWidth={2.4} />
          </Pressable>
        </View>

        <Modal visible={structureMenuOpen} transparent animationType="fade" onRequestClose={() => setStructureMenuOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setStructureMenuOpen(false)} accessibilityLabel="Close structure selector">
            <Pressable style={[styles.selectorSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(event) => event.stopPropagation()}>
              <View style={styles.selectorHandle} />
              <Text style={styles.selectorTitle}>Select Structure Type</Text>
              {structureOptions.map((option) => {
                const selected = structureType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.selectorOption, selected && styles.selectorOptionSelected]}
                    android_ripple={{ color: 'rgba(227, 160, 0, 0.08)', borderless: false }}
                    onPress={() => {
                      setStructureType(option.value);
                      setStructureMenuOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                  >
                    <Text style={[styles.selectorOptionText, selected && styles.selectorOptionTextSelected]}>{option.label}</Text>
                    {selected ? <Check color="#8A5D00" size={20} strokeWidth={2.7} /> : null}
                  </Pressable>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shell: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 11
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9DCC5',
    overflow: 'hidden'
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: '#111111', fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.35 },
  subtitle: { marginTop: 0, color: '#5F6368', fontSize: 13, lineHeight: 16, fontWeight: '500' },
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 8,
    gap: 14
  },
  hero: {
    width: '100%',
    aspectRatio: 2.04,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  heroImage: { borderRadius: 22 },
  heroCopy: { paddingHorizontal: 17, paddingBottom: 16, zIndex: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '800', letterSpacing: -0.28 },
  heroSubtitle: { marginTop: 5, color: '#F9FAFB', fontSize: 13, lineHeight: 17, fontWeight: '600' },
  card: {
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EEE4D4',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 10,
    elevation: 2
  },
  sectionTitle: { color: '#16181D', fontSize: 18, lineHeight: 22, fontWeight: '700', marginBottom: 10 },
  largeInputWrap: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFC2C8',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12
  },
  largeInput: { flex: 1, minWidth: 0, color: '#111827', fontSize: 16, fontWeight: '700', paddingVertical: 7 },
  largeUnit: { color: '#9A6900', fontSize: 14, fontWeight: '900' },
  inputErrorBorder: { borderColor: '#E05252', backgroundColor: '#FFFDFD' },
  errorText: { marginTop: 6, color: '#C62828', fontSize: 10.5, lineHeight: 14, fontWeight: '700' },
  dropdownField: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3A000',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    overflow: 'hidden'
  },
  dropdownFieldActive: { backgroundColor: '#FFFCF4', borderColor: '#D99000' },
  dropdownText: { flex: 1, color: '#171A20', fontSize: 16, fontWeight: '700' },
  dropdownPlaceholder: { color: 'rgba(17, 24, 39, 0.45)', fontSize: 15, fontWeight: '500' },
  heightsSection: { marginTop: 10 },
  heightsTitle: { color: '#23262C', fontSize: 13, lineHeight: 16, fontWeight: '700', marginBottom: 7 },
  heightRow: { flexDirection: 'row', gap: 8 },
  heightRowStack: { flexDirection: 'column' },
  heightFieldGroup: { flex: 1, minWidth: 0 },
  heightInputWrap: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5C8CE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10
  },
  heightInput: { flex: 1, minWidth: 0, color: '#111827', fontSize: 13, fontWeight: '700', paddingVertical: 7 },
  heightUnit: { color: '#30343A', fontSize: 12, fontWeight: '800' },
  estimateCard: {
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EEE4D4',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.052,
    shadowRadius: 10,
    elevation: 2
  },
  estimateTitle: { color: '#23262C', fontSize: 18, lineHeight: 22, fontWeight: '700' },
  estimateAmount: { marginTop: 3, color: '#A66F00', fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.2 },
  estimateAmountEmpty: { color: '#A9ACB3' },
  estimateNoteRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 7 },
  estimateNote: { flex: 1, color: '#60646C', fontSize: 11, lineHeight: 15, fontWeight: '500' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 15,
    paddingTop: 7,
    backgroundColor: 'rgba(251, 248, 241, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E8DFD1',
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    flex: 0.92,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.25,
    borderColor: '#E3A000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    overflow: 'hidden'
  },
  secondaryText: { color: '#9A6900', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  primaryButton: {
    flex: 1.4,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    overflow: 'hidden'
  },
  primaryButtonDisabled: { backgroundColor: '#E7D8A8' },
  primaryText: { flexShrink: 1, color: '#111827', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.34)' },
  selectorSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FBF8F1',
    paddingHorizontal: 18,
    paddingTop: 10
  },
  selectorHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 14 },
  selectorTitle: { color: '#111827', fontSize: 19, fontWeight: '900', marginBottom: 12 },
  selectorOption: {
    minHeight: 56,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E4E8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'hidden'
  },
  selectorOptionSelected: { borderColor: '#E3A000', backgroundColor: '#FFF8E2' },
  selectorOptionText: { color: '#30343A', fontSize: 15, fontWeight: '800' },
  selectorOptionTextSelected: { color: '#8A5D00' }
});
