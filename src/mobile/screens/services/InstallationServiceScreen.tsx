import React, { useState } from 'react';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Headphones, PanelsTopLeft } from 'lucide-react-native';
import { installationDetailsSchema, type InstallationDetailsForm } from '@/schemas/installation.schema';
import { useSystemStore, type InstallationStructureType } from '@/store/useSystemStore';

const installationHeroImage = require('../../../../panel installation hero section picture .png');

const structureOptions: Array<{ value: InstallationStructureType; label: string }> = [
  { value: 'standard', label: 'Standard Structure' },
  { value: 'elevated', label: 'Elevated Structure' },
  { value: 'ground_mounted', label: 'Ground Mounted' },
  { value: 'shed', label: 'Shed Type Structure' }
];

type FieldName = Exclude<keyof InstallationDetailsForm, 'structureType'>;

const decimalInput = (value: string) =>
  value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

const wholeNumberInput = (value: string) => value.replace(/[^0-9]/g, '');

const FormField = ({
  control,
  name,
  label,
  placeholder,
  keyboardType = 'default',
  sanitize
}: {
  control: any;
  name: FieldName;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  sanitize?: (value: string) => string;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onBlur, onChange, value }, fieldState: { error, isTouched } }) => (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[styles.input, isTouched && error && styles.inputError]}
          value={value}
          onBlur={onBlur}
          onChangeText={(nextValue) => onChange(sanitize ? sanitize(nextValue) : nextValue)}
          placeholder={placeholder}
          placeholderTextColor="rgba(17, 24, 39, 0.45)"
          keyboardType={keyboardType}
          inputMode={keyboardType === 'default' ? 'text' : 'decimal'}
          accessibilityLabel={label}
        />
        {isTouched && error ? <Text style={styles.errorText}>{error.message}</Text> : null}
      </View>
    )}
  />
);

export const InstallationServiceScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const stackFields = width < 350;
  const setInstallationDetails = useSystemStore((state) => state.setInstallationDetails);
  const clearInstallationDetails = useSystemStore((state) => state.clearInstallationDetails);
  const [structureMenuOpen, setStructureMenuOpen] = useState(false);
  const form = useForm<InstallationDetailsForm>({
    resolver: zodResolver(installationDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      panelWattage: '',
      numberOfPanels: '',
      inverterSize: '',
      inverterBrand: '',
      batterySize: '',
      batteryBrand: '',
      structureType: undefined
    }
  });
  const structureType = form.watch('structureType');
  const structureLabel = structureOptions.find((option) => option.value === structureType)?.label;

  const confirmSurvey = form.handleSubmit((values) => {
    setInstallationDetails({
      panelWattage: Number(values.panelWattage),
      numberOfPanels: Number(values.numberOfPanels),
      inverterSizeKw: Number(values.inverterSize),
      inverterBrand: values.inverterBrand.trim(),
      batterySizeKwh: Number(values.batterySize),
      batteryBrand: values.batteryBrand.trim(),
      structureType: values.structureType as InstallationStructureType
    });
    navigation.navigate('BookSurvey', { source: 'installation_service', bookingContext: 'installation' });
  });

  const talkToExpert = () => {
    clearInstallationDetails();
    navigation.navigate('BookSurvey', { source: 'installation_service', bookingContext: 'installation' });
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            android_ripple={{ color: 'rgba(166,111,0,0.10)', borderless: false }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#111827" size={28} strokeWidth={2.25} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.screenTitle}>Solar Panel Installation</Text>
            <Text style={styles.screenSubtitle}>Book a survey for your installation needs</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 92 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground source={installationHeroImage} style={styles.hero} imageStyle={styles.heroImage} resizeMode="cover">
            <View style={styles.heroOverlay} />
            <View style={styles.heroBottomShade} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Professional Solar{`\n`}Panel Installation</Text>
              <Text style={styles.heroSubtitle}>Plan your installation with{`\n`}expert support.</Text>
            </View>
          </ImageBackground>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Panel Details</Text>
            <View style={[styles.fieldsRow, stackFields && styles.fieldsStack]}>
              <FormField control={form.control} name="panelWattage" label="Panel Wattage" placeholder="e.g. 615W" keyboardType="decimal-pad" sanitize={decimalInput} />
              <FormField control={form.control} name="numberOfPanels" label="No. of Panels" placeholder="e.g. 10" keyboardType="number-pad" sanitize={wholeNumberInput} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inverter Details</Text>
            <View style={[styles.fieldsRow, stackFields && styles.fieldsStack]}>
              <FormField control={form.control} name="inverterSize" label="Inverter Size" placeholder="e.g. 10 kW" keyboardType="decimal-pad" sanitize={decimalInput} />
              <FormField control={form.control} name="inverterBrand" label="Brand" placeholder="e.g. Solis" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Battery Bank</Text>
            <View style={[styles.fieldsRow, stackFields && styles.fieldsStack]}>
              <FormField control={form.control} name="batterySize" label="Battery Size" placeholder="e.g. 10 kWh" keyboardType="decimal-pad" sanitize={decimalInput} />
              <FormField control={form.control} name="batteryBrand" label="Battery Brand" placeholder="e.g. Pylontech" />
            </View>
          </View>

          <View style={styles.structureCard}>
            <Text style={styles.cardTitle}>Structure Type</Text>
            <Pressable
              style={[styles.dropdown, form.formState.touchedFields.structureType && form.formState.errors.structureType && styles.inputError]}
              onPress={() => setStructureMenuOpen(true)}
              android_ripple={{ color: 'rgba(227,160,0,0.08)', borderless: false }}
              accessibilityRole="button"
              accessibilityLabel="Select structure type"
              accessibilityState={{ expanded: structureMenuOpen }}
            >
              <PanelsTopLeft color="#A66F00" size={22} strokeWidth={2} />
              <Text style={[styles.dropdownText, !structureLabel && styles.placeholderText]} numberOfLines={1}>
                {structureLabel ?? 'Select structure type'}
              </Text>
              <ChevronDown color="#A66F00" size={20} strokeWidth={2.35} />
            </Pressable>
            {form.formState.touchedFields.structureType && form.formState.errors.structureType ? (
              <Text style={styles.errorText}>{form.formState.errors.structureType.message}</Text>
            ) : null}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Survey Summary</Text>
            <Text style={styles.summaryText}>Fill all details to continue with survey booking.</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable
            style={styles.secondaryButton}
            onPress={talkToExpert}
            android_ripple={{ color: 'rgba(227,160,0,0.10)', borderless: false }}
            accessibilityRole="button"
          >
            <Headphones color="#A66F00" size={20} strokeWidth={2.1} />
            <Text style={styles.secondaryButtonText} numberOfLines={1}>Talk to an Expert</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, !form.formState.isValid && styles.primaryButtonDisabled]}
            onPress={confirmSurvey}
            disabled={!form.formState.isValid}
            android_ripple={form.formState.isValid ? { color: 'rgba(17,24,39,0.08)', borderless: false } : undefined}
            accessibilityRole="button"
            accessibilityState={{ disabled: !form.formState.isValid }}
          >
            <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Confirm &amp; Book Survey</Text>
            <ArrowRight color={form.formState.isValid ? '#111827' : '#6B7280'} size={22} strokeWidth={2.4} />
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
                    onPress={() => {
                      form.setValue('structureType', option.value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                      setStructureMenuOpen(false);
                    }}
                    android_ripple={{ color: 'rgba(227,160,0,0.08)', borderless: false }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 11 },
  backButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9DCC5', overflow: 'hidden' },
  headerCopy: { flex: 1, minWidth: 0 },
  screenTitle: { color: '#111827', fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.35 },
  screenSubtitle: { marginTop: 0, color: '#656A73', fontSize: 13, lineHeight: 16, fontWeight: '500' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 16, gap: 14 },
  hero: { width: '100%', aspectRatio: 2.04, borderRadius: 21, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { borderRadius: 21 },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,8,12,0.20)' },
  heroBottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: 'rgba(4,7,11,0.36)' },
  heroCopy: { paddingHorizontal: 18, paddingBottom: 16, zIndex: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '800', letterSpacing: -0.28 },
  heroSubtitle: { marginTop: 5, color: '#F9FAFB', fontSize: 13, lineHeight: 17, fontWeight: '600' },
  card: { borderRadius: 20, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#EEE4D4', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.055, shadowRadius: 10, elevation: 2 },
  structureCard: { borderRadius: 20, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#EEE4D4', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.055, shadowRadius: 10, elevation: 2 },
  summaryCard: { borderRadius: 20, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#EEE4D4', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.052, shadowRadius: 10, elevation: 2 },
  cardTitle: { color: '#232733', fontSize: 18, lineHeight: 22, fontWeight: '700', marginBottom: 10 },
  fieldsRow: { flexDirection: 'row', gap: 8 },
  fieldsStack: { flexDirection: 'column' },
  fieldGroup: { flex: 1, minWidth: 0 },
  fieldLabel: { marginLeft: 5, marginBottom: 5, color: '#252A34', fontSize: 12, lineHeight: 15, fontWeight: '700' },
  input: { width: '100%', height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#C5C8CE', backgroundColor: '#FFFFFF', color: '#111827', fontSize: 16, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 7 },
  inputError: { borderColor: '#D84A4A', backgroundColor: '#FFFDFD' },
  errorText: { marginTop: 4, color: '#C62828', fontSize: 10, lineHeight: 12, fontWeight: '700' },
  dropdown: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#AEB2BA', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, overflow: 'hidden' },
  dropdownText: { flex: 1, minWidth: 0, color: '#252A34', fontSize: 16, fontWeight: '700' },
  placeholderText: { color: 'rgba(17, 24, 39, 0.45)', fontSize: 15, fontWeight: '500' },
  summaryText: { marginTop: -4, color: '#737985', fontSize: 12, lineHeight: 16, fontWeight: '500' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 15, paddingTop: 7, backgroundColor: 'rgba(251,248,241,0.98)', borderTopWidth: 1, borderTopColor: '#E8DFD1', flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 0.95, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.25, borderColor: '#E3A000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 9, overflow: 'hidden' },
  secondaryButtonText: { color: '#9A6900', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  primaryButton: { flex: 1.25, height: 52, borderRadius: 16, backgroundColor: '#FDB813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 11, overflow: 'hidden' },
  primaryButtonDisabled: { backgroundColor: '#E7D8A8' },
  primaryButtonText: { flexShrink: 1, color: '#111827', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.34)' },
  selectorSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FBF8F1', paddingHorizontal: 18, paddingTop: 10 },
  selectorHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 14 },
  selectorTitle: { color: '#111827', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  selectorOption: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#E2E4E8', backgroundColor: '#FFFFFF', paddingHorizontal: 15, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, overflow: 'hidden' },
  selectorOptionSelected: { borderColor: '#E3A000', backgroundColor: '#FFF8E2' },
  selectorOptionText: { color: '#30343A', fontSize: 14, fontWeight: '800' },
  selectorOptionTextSelected: { color: '#8A5D00' }
});
