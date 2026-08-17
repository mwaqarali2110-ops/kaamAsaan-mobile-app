import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, CheckCircle2, X, Zap } from 'lucide-react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type JourneyStep = {
  step: string;
  title: string;
  description: string;
  label: string;
  preview: 'appliances' | 'solar' | 'panel' | 'backup' | 'battery' | 'packages' | 'survey' | 'tracking';
};

const journeySteps: JourneyStep[] = [
  {
    step: 'Step 1',
    title: 'Select your day load',
    description: 'Choose the appliances you use during the day so KaamAsaan can calculate your running load.',
    label: 'Day Load',
    preview: 'appliances'
  },
  {
    step: 'Step 2',
    title: 'Get solar size recommendation',
    description: 'KaamAsaan recommends the ideal solar system size based on your daytime load and estimated production.',
    label: 'Solar Size',
    preview: 'solar'
  },
  {
    step: 'Step 3',
    title: 'View panel layout',
    description: 'See how many panels are required, roof space needed, dimensions, and landscape/portrait layout.',
    label: 'Panel Layout',
    preview: 'panel'
  },
  {
    step: 'Step 4',
    title: 'Choose backup load',
    description: 'Select the appliances you want to run on battery backup and choose backup hours.',
    label: 'Backup Load',
    preview: 'backup'
  },
  {
    step: 'Step 5',
    title: 'Get battery recommendation',
    description: 'KaamAsaan recommends battery size based on running load and selected backup hours.',
    label: 'Battery Size',
    preview: 'battery'
  },
  {
    step: 'Step 6',
    title: 'Compare recommended packages',
    description: 'View suitable packages with inverter, panels, battery, pricing, and brand options.',
    label: 'Packages',
    preview: 'packages'
  },
  {
    step: 'Step 7',
    title: 'Book site survey',
    description: 'Choose a survey date and submit contact/address details. Our team will call to confirm timing.',
    label: 'Survey Booking',
    preview: 'survey'
  },
  {
    step: 'Step 8',
    title: 'Track your project',
    description: 'After survey booking, track confirmation, progress, installation, and support from My Project.',
    label: 'Project Tracking',
    preview: 'tracking'
  }
];

export const HowItWorksScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);

  const startJourney = () => navigation.navigate('DesignFlow');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={20} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>How it works</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.title}>How it works</Text>
          <Text style={styles.subtitle}>Follow a simple guided journey to design the right solar system for your home.</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Zap color="#10213A" size={16} strokeWidth={2.5} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Why this journey matters</Text>
            <Text style={styles.infoText}>
              KaamAsaan calculates your daytime load, roof space, backup need, and package options before you book a survey, so you can make an informed solar decision.
            </Text>
          </View>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineLine} />
          {journeySteps.map((item, index) => (
            <Pressable key={item.step} style={styles.stepCard} onPress={() => setSelectedStep(item)} accessibilityRole="button">
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTopRow}>
                  <Text style={styles.stepLabel}>{item.step}</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.label}</Text>
                  </View>
                </View>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
                <StepPreview type={item.preview} />
                <View style={styles.viewStepRow}>
                  <Text style={styles.viewStepText}>View step</Text>
                  <ArrowRight color="#D99A00" size={16} strokeWidth={2.6} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomCtaCard}>
          <Text style={styles.bottomCtaTitle}>Ready to design your system?</Text>
          <Text style={styles.bottomCtaText}>Start the actual Design Your System journey when you are ready.</Text>
          <Pressable style={styles.startButton} onPress={startJourney}>
            <Text style={styles.startButtonText}>Start Design Journey</Text>
            <ArrowRight color="#10213A" size={18} strokeWidth={2.6} />
          </Pressable>
          <Pressable style={styles.laterButton} onPress={() => navigation.goBack()}>
            <Text style={styles.laterText}>I'll explore later</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={Boolean(selectedStep)} transparent animationType="fade" onRequestClose={() => setSelectedStep(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedStep(null)}>
          <Pressable style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalStep}>{selectedStep?.step}</Text>
                <Text style={styles.modalTitle}>{selectedStep?.title}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setSelectedStep(null)} accessibilityLabel="Close">
                <X color="#334155" size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            {selectedStep ? <StepPreview type={selectedStep.preview} large /> : null}
            <Text style={styles.modalDescription}>{selectedStep?.description}</Text>
            <Pressable style={styles.modalStartButton} onPress={startJourney}>
              <Text style={styles.modalStartText}>Start this journey</Text>
              <ArrowRight color="#10213A" size={16} strokeWidth={2.6} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const StepPreview = ({ type, large = false }: { type: JourneyStep['preview']; large?: boolean }) => (
  <View style={[styles.preview, large && styles.previewLarge]}>
    {type === 'appliances' ? <AppliancesPreview /> : null}
    {type === 'solar' ? <SolarPreview /> : null}
    {type === 'panel' ? <PanelPreview /> : null}
    {type === 'backup' ? <BackupPreview /> : null}
    {type === 'battery' ? <BatteryPreview /> : null}
    {type === 'packages' ? <PackagesPreview /> : null}
    {type === 'survey' ? <SurveyPreview /> : null}
    {type === 'tracking' ? <TrackingPreview /> : null}
  </View>
);

const MiniRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.miniRow}>
    <View style={styles.miniDot} />
    <Text style={styles.miniLabel}>{label}</Text>
    {value ? <Text style={styles.miniValue}>{value}</Text> : null}
  </View>
);

const AppliancesPreview = () => (
  <View style={styles.previewInner}>
    <MiniRow label="LED Bulbs" value="2" />
    <MiniRow label="Fans" value="3" />
    <MiniRow label="Refrigerator" value="1" />
  </View>
);

const SolarPreview = () => (
  <Svg width="100%" height="76" viewBox="0 0 180 76">
    <Rect x="4" y="6" width="172" height="62" rx="14" fill="#FFFFFF" />
    <Line x1="20" y1="56" x2="164" y2="56" stroke="#EEF2F6" strokeWidth="1" />
    <Line x1="20" y1="38" x2="164" y2="38" stroke="#EEF2F6" strokeWidth="1" strokeDasharray="3 5" />
    <Path d="M20 58 C42 54 52 28 76 24 C104 18 112 18 136 31 C152 40 158 50 164 56" fill="none" stroke="#F5A400" strokeWidth="4" strokeLinecap="round" />
    <Path d="M20 58 C42 54 52 28 76 24 C104 18 112 18 136 31 C152 40 158 50 164 56 L164 62 L20 62 Z" fill="#FFE8A3" opacity="0.45" />
    <Circle cx="104" cy="21" r="5" fill="#F5A400" stroke="#FFFFFF" strokeWidth="2" />
  </Svg>
);

const PanelPreview = () => (
  <View style={styles.panelPreview}>
    {[0, 1, 2].map((row) => (
      <View key={row} style={styles.panelPreviewRow}>
        {[0, 1].map((column) => (
          <View key={`${row}-${column}`} style={styles.panelPreviewTile}>
            <View style={styles.panelPreviewLineV} />
            <View style={styles.panelPreviewLineH} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

const BackupPreview = () => (
  <View style={styles.previewInner}>
    <MiniRow label="Fans" value="3 hrs" />
    <MiniRow label="WiFi Router" value="4 hrs" />
    <MiniRow label="Lights" value="2 hrs" />
  </View>
);

const BatteryPreview = () => (
  <View style={styles.batteryPreview}>
    <View>
      <Text style={styles.previewBigValue}>10 kWh</Text>
      <Text style={styles.previewMuted}>Battery System</Text>
    </View>
    <View style={styles.batteryIconMini}>
      <CheckCircle2 color="#D99A00" size={24} strokeWidth={2.4} />
    </View>
  </View>
);

const PackagesPreview = () => (
  <View style={styles.packagesPreview}>
    <View style={styles.packageMiniCard} />
    <View style={[styles.packageMiniCard, styles.packageMiniCardActive]} />
    <View style={styles.packageMiniCard} />
  </View>
);

const SurveyPreview = () => (
  <View style={styles.previewInner}>
    <View style={styles.inputMini} />
    <View style={styles.inputMini} />
    <View style={[styles.inputMini, styles.inputMiniShort]} />
  </View>
);

const TrackingPreview = () => (
  <View style={styles.previewInner}>
    {['Survey booked', 'Team confirmation', 'Installation'].map((item, index) => (
      <View key={item} style={styles.trackRow}>
        <View style={[styles.trackDot, index === 0 && styles.trackDotActive]} />
        <Text style={styles.trackText}>{item}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF2' },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { color: '#10213A', fontSize: 15, fontWeight: '900' },
  headerSpacer: { width: 38 },
  content: { paddingHorizontal: 18, paddingTop: 8, gap: 14 },
  heroBlock: { alignItems: 'center', paddingHorizontal: 8 },
  title: { color: '#10213A', fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { marginTop: 8, color: '#64748B', textAlign: 'center', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  infoCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2
  },
  infoIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#F5B400', alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoTitle: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  infoText: { marginTop: 5, color: '#64748B', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  timeline: { position: 'relative', paddingLeft: 28, gap: 12 },
  timelineLine: { position: 'absolute', left: 13, top: 20, bottom: 20, width: 2, borderRadius: 999, backgroundColor: '#F3D27A' },
  stepCard: {
    minHeight: 184,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2
  },
  stepBadge: {
    position: 'absolute',
    left: -35,
    top: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5B400',
    borderWidth: 3,
    borderColor: '#FFFBF2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBadgeText: { color: '#10213A', fontSize: 12, fontWeight: '900' },
  stepContent: { flex: 1 },
  stepTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepLabel: { color: '#D99A00', fontSize: 11, fontWeight: '900' },
  tag: { borderRadius: 999, backgroundColor: '#FFF4D6', paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { color: '#A66F00', fontSize: 10, fontWeight: '900' },
  stepTitle: { marginTop: 8, color: '#10213A', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  stepDescription: { marginTop: 6, color: '#64748B', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  viewStepRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  viewStepText: { color: '#D99A00', fontSize: 12, fontWeight: '900' },
  preview: {
    marginTop: 12,
    minHeight: 86,
    borderRadius: 16,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#F0E4D2',
    overflow: 'hidden',
    justifyContent: 'center'
  },
  previewLarge: { minHeight: 132, marginTop: 14 },
  previewInner: { padding: 12, gap: 8 },
  miniRow: { height: 18, flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5B400' },
  miniLabel: { flex: 1, color: '#10213A', fontSize: 11, fontWeight: '800' },
  miniValue: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  panelPreview: { alignSelf: 'center', gap: 5 },
  panelPreviewRow: { flexDirection: 'row', gap: 5 },
  panelPreviewTile: { width: 45, height: 28, borderRadius: 5, borderWidth: 1, borderColor: '#7FA2C6', backgroundColor: '#123A5A', overflow: 'hidden' },
  panelPreviewLineV: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(174,207,237,0.55)' },
  panelPreviewLineH: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(174,207,237,0.55)' },
  batteryPreview: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewBigValue: { color: '#10213A', fontSize: 24, fontWeight: '900' },
  previewMuted: { marginTop: 3, color: '#64748B', fontSize: 11, fontWeight: '700' },
  batteryIconMini: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF4D6', alignItems: 'center', justifyContent: 'center' },
  packagesPreview: { padding: 12, flexDirection: 'row', gap: 8 },
  packageMiniCard: { flex: 1, height: 58, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED0' },
  packageMiniCardActive: { borderColor: '#F5B400', backgroundColor: '#FFF7DF' },
  inputMini: { height: 17, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED0' },
  inputMiniShort: { width: '68%' },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#F3D27A', backgroundColor: '#FFFFFF' },
  trackDotActive: { backgroundColor: '#F5B400', borderColor: '#F5B400' },
  trackText: { color: '#10213A', fontSize: 11, fontWeight: '800' },
  bottomCtaCard: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED0', padding: 16, marginTop: 2 },
  bottomCtaTitle: { color: '#10213A', fontSize: 18, fontWeight: '900' },
  bottomCtaText: { marginTop: 6, color: '#64748B', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  startButton: { marginTop: 14, height: 54, borderRadius: 16, backgroundColor: '#F5B400', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startButtonText: { color: '#10213A', fontSize: 15, fontWeight: '900' },
  laterButton: { height: 42, alignItems: 'center', justifyContent: 'center' },
  laterText: { color: '#64748B', fontSize: 13, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.36)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detailModal: { width: '100%', borderRadius: 22, backgroundColor: '#FFFBF2', padding: 16, borderWidth: 1, borderColor: '#E8DED0' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  modalStep: { color: '#D99A00', fontSize: 11, fontWeight: '900' },
  modalTitle: { marginTop: 4, color: '#10213A', fontSize: 22, lineHeight: 26, fontWeight: '900' },
  closeButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DED0', alignItems: 'center', justifyContent: 'center' },
  modalDescription: { marginTop: 12, color: '#64748B', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  modalStartButton: { marginTop: 16, height: 52, borderRadius: 16, backgroundColor: '#F5B400', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalStartText: { color: '#10213A', fontSize: 15, fontWeight: '900' }
});
