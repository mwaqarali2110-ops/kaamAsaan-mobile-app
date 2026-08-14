import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BatteryCharging, CheckCircle2, Clock3, RefreshCw, ShieldCheck, TrendingUp, Zap } from 'lucide-react-native';
import type { Appliance } from '@/types/system.types';

type BatteryRecommendedSizeParams = {
  selectedAppliances: Appliance[];
  totalBackupWatts: number;
  backupHours: number;
};

const commonBatterySizes = [2.4, 3, 5, 7.5, 10, 12.5, 15, 20];
const batteryEfficiency = 0.9;
const depthOfDischarge = 0.8;
const safetyMargin = 1.2;

const formatNumber = (value: number) => Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
const getRecommendedBatteryKwh = (requiredKwh: number) => commonBatterySizes.find((size) => size >= requiredKwh) ?? Math.ceil(requiredKwh);

export const BatteryRecommendedSizeScreen = ({ navigation, route }: any) => {
  const {
    selectedAppliances = [],
    totalBackupWatts = 0,
    backupHours = 1
  } = (route?.params ?? {}) as BatteryRecommendedSizeParams;

  const runningLoadKw = totalBackupWatts / 1000;
  const rawEnergyKwh = (totalBackupWatts * backupHours) / 1000;
  const requiredBatteryKwh = (rawEnergyKwh / (batteryEfficiency * depthOfDischarge)) * safetyMargin;
  const recommendedBatteryKwh = getRecommendedBatteryKwh(requiredBatteryKwh);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={20} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.topTitle}>Recommended Battery Size</Text>
        <View style={styles.iconButton}>
          <BatteryCharging color="#F5A400" size={20} strokeWidth={2.4} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.recommendationCard}>
          <Text style={styles.eyebrow}>RECOMMENDED BATTERY SIZE</Text>
          <View style={styles.recommendationValueRow}>
            <BatteryCharging color="#FDB813" fill="#FDB813" size={38} strokeWidth={2.2} />
            <Text style={styles.recommendationValue}>{formatNumber(recommendedBatteryKwh)} <Text style={styles.recommendationUnit}>kWh</Text></Text>
          </View>
          <Text style={styles.recommendationTitle}>Ideal for your {runningLoadKw.toFixed(1)} kW backup load</Text>
          <Text style={styles.recommendationText}>Based on selected appliances, backup hours and battery safety margin</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why {formatNumber(recommendedBatteryKwh)} kWh?</Text>
          <ReasonRow Icon={TrendingUp} title="Covers your selected backup load" subtitle={`Designed for ${runningLoadKw.toFixed(1)} kW running load`} />
          <ReasonRow Icon={ShieldCheck} title="Battery safety margin included" subtitle="Helps protect battery life and performance" />
          <ReasonRow Icon={CheckCircle2} title="Better real-world backup" subtitle="Considers efficiency and usable battery capacity" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Battery Preview</Text>
          <View style={styles.previewGrid}>
            <PreviewItem Icon={Zap} value={`${runningLoadKw.toFixed(1)} kW`} label="Running Load" />
            <PreviewItem Icon={Clock3} value={`${backupHours} hour${backupHours === 1 ? '' : 's'}`} label="Backup Duration" />
            <PreviewItem Icon={BatteryCharging} value={`${rawEnergyKwh.toFixed(1)} kWh`} label="Energy Required" />
            <PreviewItem Icon={ShieldCheck} value={`${formatNumber(recommendedBatteryKwh)} kWh`} label="Recommended Battery" />
          </View>
        </View>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <ShieldCheck color="#15803D" size={28} strokeWidth={2.2} />
          </View>
          <View style={styles.confirmationCopy}>
            <Text style={styles.confirmationTitle}>This battery size is suitable for your selected backup load</Text>
            <Text style={styles.confirmationText}>You can increase backup hours if you need longer backup.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How we calculated this</Text>
          <Text style={styles.formulaText}>Battery size = (Load x Backup Hours) / Battery Efficiency / Usable Capacity x Safety Margin</Text>
          <Text style={styles.formulaExample}>
            {runningLoadKw.toFixed(1)} kW x {backupHours} hour{backupHours === 1 ? '' : 's'} = {rawEnergyKwh.toFixed(1)} kWh
          </Text>
          <Text style={styles.formulaExample}>
            After efficiency, usable capacity and safety margin ≈ {requiredBatteryKwh.toFixed(2)} kWh
          </Text>
          <Text style={styles.formulaResult}>Recommended size = {formatNumber(recommendedBatteryKwh)} kWh</Text>
        </View>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.pop(2)}>
          <ArrowLeft color="#10213A" size={16} strokeWidth={2.4} />
          <Text style={styles.secondaryText}>Adjust appliances</Text>
          <RefreshCw color="#10213A" size={16} strokeWidth={2.4} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const ReasonRow = ({ Icon, title, subtitle }: { Icon: any; title: string; subtitle: string }) => (
  <View style={styles.reasonRow}>
    <View style={styles.reasonIcon}><Icon color="#15803D" size={18} strokeWidth={2.3} /></View>
    <View style={styles.reasonCopy}>
      <Text style={styles.reasonTitle}>{title}</Text>
      <Text style={styles.reasonSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const PreviewItem = ({ Icon, value, label }: { Icon: any; value: string; label: string }) => (
  <View style={styles.previewItem}>
    <View style={styles.previewIcon}><Icon color="#B07800" size={16} strokeWidth={2.3} /></View>
    <Text style={styles.previewValue}>{value}</Text>
    <Text style={styles.previewLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: { height: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', alignItems: 'center', justifyContent: 'center', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  topTitle: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  content: { paddingHorizontal: 14, paddingTop: 7, paddingBottom: 42, gap: 12 },
  recommendationCard: { borderRadius: 22, backgroundColor: '#FFF8E5', borderWidth: 1, borderColor: '#F5C542', paddingHorizontal: 17, paddingVertical: 20, alignItems: 'center', shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 15, elevation: 2 },
  eyebrow: { color: '#B07800', fontSize: 10, fontWeight: '900', letterSpacing: 0.7, backgroundColor: '#FFF0BF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  recommendationValueRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  recommendationValue: { color: '#10213A', fontSize: 46, lineHeight: 52, fontWeight: '900' },
  recommendationUnit: { color: '#B07800', fontSize: 28, fontWeight: '900' },
  recommendationTitle: { color: '#10213A', fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  recommendationText: { maxWidth: 270, color: '#64748B', fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 14, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  cardTitle: { color: '#10213A', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  reasonRow: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 11 },
  reasonIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF8EC', alignItems: 'center', justifyContent: 'center' },
  reasonCopy: { flex: 1 },
  reasonTitle: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  reasonSubtitle: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 3 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewItem: { width: '48.5%', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 10, borderRadius: 15, backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#F1E6D3' },
  previewIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF3D6', alignItems: 'center', justifyContent: 'center' },
  previewValue: { color: '#10213A', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  previewLabel: { color: '#64748B', fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  confirmationCard: { borderRadius: 18, backgroundColor: '#F0F9F0', borderWidth: 1, borderColor: '#D4ECD5', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  confirmationIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5F7E7', alignItems: 'center', justifyContent: 'center' },
  confirmationCopy: { flex: 1 },
  confirmationTitle: { color: '#14532D', fontSize: 13, fontWeight: '900' },
  confirmationText: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 4 },
  formulaText: { color: '#10213A', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  formulaExample: { color: '#64748B', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 7 },
  formulaResult: { color: '#B07800', fontSize: 12, fontWeight: '900', marginTop: 8 },
  primaryButton: { height: 52, borderRadius: 16, backgroundColor: '#FDB813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 3 },
  primaryText: { color: '#111827', fontSize: 14, fontWeight: '900' },
  secondaryButton: { height: 46, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F5C542', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { color: '#10213A', fontSize: 13, fontWeight: '900' }
});
