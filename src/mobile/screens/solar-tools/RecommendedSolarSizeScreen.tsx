import React, { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, BatteryCharging, Grid3X3, MessageCircle, RefreshCw, ShieldCheck, Sun, TrendingUp, Wallet, Zap } from 'lucide-react-native';
import { calculatePanelCount } from '@/utils/calculations';

const formatKw = (value: number) => Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);

export const RecommendedSolarSizeScreen = ({ navigation, route }: any) => {
  const loadKw = Number(route.params?.loadKw ?? 0);
  const systemKw = Number(route.params?.systemKw ?? 0);
  const panelCount = useMemo(() => calculatePanelCount(systemKw || 1, 550), [systemKw]);
  const dailyLow = Math.round(systemKw * 4);
  const dailyHigh = Math.round(systemKw * 5);
  const monthlySaving = Math.round(systemKw * 1050 / 100) * 100;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={19} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.topTitle}>Recommended Size</Text>
        <Pressable style={styles.iconButton} accessibilityLabel="Recommended solar size">
          <Zap color="#F5A400" size={19} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.recommendationCard}>
          <Text style={styles.eyebrow}>RECOMMENDED SOLAR SIZE</Text>
          <View style={styles.recommendationValueRow}>
            <Zap color="#FDB813" fill="#FDB813" size={38} strokeWidth={2.2} />
            <Text style={styles.recommendationValue}>{formatKw(systemKw)} <Text style={styles.recommendationUnit}>kW</Text></Text>
          </View>
          <Text style={styles.recommendationTitle}>Ideal for your {loadKw.toFixed(1)} kW running load</Text>
          <Text style={styles.recommendationText}>Based on selected appliances and average solar conditions</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why {formatKw(systemKw)} kW?</Text>
          <ReasonRow Icon={TrendingUp} title="20-30% extra production for safety" subtitle="Handles cloudy days and future needs" />
          <ReasonRow Icon={BatteryCharging} title="Better battery charging efficiency" subtitle="Faster charging and longer backup" />
          <ReasonRow Icon={Wallet} title="Best long-term value" subtitle="More savings, higher ROI" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Preview</Text>
          <View style={styles.previewGrid}>
            <PreviewItem Icon={Sun} value={`${formatKw(systemKw)} kW`} label="System Size" />
            <PreviewItem Icon={Grid3X3} value={`${panelCount} Panels`} label="550W each" />
            <PreviewItem Icon={Zap} value={`~${dailyLow}-${dailyHigh} kWh`} label="Daily Generation" />
            <PreviewItem Icon={Wallet} value={`~PKR ${monthlySaving.toLocaleString('en-PK')}`} label="Est. Monthly Saving" />
          </View>
        </View>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <ShieldCheck color="#15803D" size={27} strokeWidth={2.2} />
          </View>
          <View style={styles.confirmationCopy}>
            <Text style={styles.confirmationTitle}>This size is perfect for your current load</Text>
            <Text style={styles.confirmationText}>You can always upgrade later if needed.</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('SystemSummary')}>
          <Text style={styles.primaryText}>Continue to System Summary</Text>
          <ArrowRight color="#111827" size={19} strokeWidth={2.7} />
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Recalculate</Text>
          <RefreshCw color="#10213A" size={17} strokeWidth={2.4} />
        </Pressable>
      </ScrollView>

      <View style={styles.systemChip}>
        <Text style={styles.systemEyebrow}>MY SYSTEM</Text>
        <View style={styles.systemValues}>
          <Text style={styles.systemValue}>Sun 3 kW</Text>
          <Text style={styles.systemDivider}>|</Text>
          <Text style={styles.systemValue}>Power 4 kW</Text>
          <Text style={styles.systemDivider}>|</Text>
          <Text style={styles.systemValue}>Battery 6 kWh</Text>
        </View>
      </View>

      <Pressable style={styles.chatButton} accessibilityLabel="Help">
        <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
      </Pressable>
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
    <View style={styles.previewIcon}><Icon color="#B07800" size={17} strokeWidth={2.3} /></View>
    <Text style={styles.previewValue}>{value}</Text>
    <Text style={styles.previewLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: { height: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', alignItems: 'center', justifyContent: 'center', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  topTitle: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  content: { paddingHorizontal: 14, paddingTop: 7, paddingBottom: 128, gap: 12 },
  recommendationCard: { borderRadius: 22, backgroundColor: '#FFF8E5', borderWidth: 1, borderColor: '#F5C542', paddingHorizontal: 17, paddingVertical: 20, alignItems: 'center', shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 15, elevation: 2 },
  eyebrow: { color: '#B07800', fontSize: 10, fontWeight: '900', letterSpacing: 0.7, backgroundColor: '#FFF0BF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  recommendationValueRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  recommendationValue: { color: '#10213A', fontSize: 48, lineHeight: 54, fontWeight: '900' },
  recommendationUnit: { color: '#B07800', fontSize: 29, fontWeight: '900' },
  recommendationTitle: { color: '#10213A', fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  recommendationText: { maxWidth: 260, color: '#64748B', fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 14, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  cardTitle: { color: '#10213A', fontSize: 17, fontWeight: '900', marginBottom: 8 },
  reasonRow: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 11 },
  reasonIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF8EC', alignItems: 'center', justifyContent: 'center' },
  reasonCopy: { flex: 1 },
  reasonTitle: { color: '#10213A', fontSize: 12.5, fontWeight: '900' },
  reasonSubtitle: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 3 },
  previewGrid: { flexDirection: 'row', alignItems: 'stretch' },
  previewItem: { flex: 1, alignItems: 'center', paddingHorizontal: 3, borderRightWidth: 1, borderRightColor: '#EEF0F2' },
  previewIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF3D6', alignItems: 'center', justifyContent: 'center' },
  previewValue: { color: '#10213A', fontSize: 11.5, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  previewLabel: { color: '#64748B', fontSize: 9.5, lineHeight: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  confirmationCard: { borderRadius: 18, backgroundColor: '#F0F9F0', borderWidth: 1, borderColor: '#D4ECD5', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  confirmationIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5F7E7', alignItems: 'center', justifyContent: 'center' },
  confirmationCopy: { flex: 1 },
  confirmationTitle: { color: '#14532D', fontSize: 12.5, fontWeight: '900' },
  confirmationText: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 4 },
  primaryButton: { height: 52, borderRadius: 16, backgroundColor: '#FDB813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 3 },
  primaryText: { color: '#111827', fontSize: 14, fontWeight: '900' },
  secondaryButton: { height: 46, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F5C542', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  systemChip: { position: 'absolute', left: 16, bottom: 18, borderRadius: 16, backgroundColor: 'rgba(45,52,38,0.95)', paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 5 },
  systemEyebrow: { color: '#F5B700', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  systemValues: { flexDirection: 'row', gap: 7, marginTop: 6 },
  systemValue: { color: '#F8F5D9', fontSize: 10, fontWeight: '800' },
  systemDivider: { color: 'rgba(248,245,217,0.35)', fontSize: 10, fontWeight: '800' },
  chatButton: { position: 'absolute', right: 18, bottom: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: '#26331F', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 }
});
