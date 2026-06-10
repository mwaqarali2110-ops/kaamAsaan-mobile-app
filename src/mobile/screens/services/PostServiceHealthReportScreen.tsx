import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowDownToLine, BatteryMedium, Bolt, Check, MessageCircle, Shield, ShieldCheck, Wrench } from 'lucide-react-native';

const diagnostics = [
  {
    title: 'Generation Performance',
    value: '24.8 kWh/day',
    note: '+16% vs last month',
    status: 'Healthy',
    tone: 'healthy',
    Icon: Bolt
  },
  {
    title: 'Panel Condition',
    value: 'Good',
    note: 'No micro-cracks detected',
    status: 'Healthy',
    tone: 'healthy',
    Icon: Shield
  },
  {
    title: 'Wiring Condition',
    value: 'Tightened',
    note: '3 loose MC4 connectors fixed',
    status: 'Healthy',
    tone: 'healthy',
    Icon: Wrench
  },
  {
    title: 'Earthing Status',
    value: 'Verified',
    note: 'Resistance within safe limits',
    status: 'Healthy',
    tone: 'healthy',
    Icon: Shield
  },
  {
    title: 'Battery Condition',
    value: 'Fair',
    note: 'Capacity at 82% - monitor monthly',
    status: 'Attention',
    tone: 'attention',
    Icon: BatteryMedium
  },
  {
    title: 'Safety Status',
    value: 'Pass',
    note: 'All safety checks cleared',
    status: 'Healthy',
    tone: 'healthy',
    Icon: ShieldCheck
  }
];

const recommendations = [
  'Clean panels every 18-22 days during summer months',
  'Keep surroundings dust-free - trim nearby vegetation',
  'Schedule next maintenance in 6 months',
  'Monitor battery capacity trend monthly via inverter app'
];

export const PostServiceHealthReportScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.shell} edges={['top']}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreRing}>
            <Text style={styles.scoreText}>84</Text>
          </View>
          <View style={styles.scoreCopy}>
            <Text style={styles.scoreTitle}>Post-Service Health Score</Text>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>+16 points from pre-service scan</Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TECHNICIAN</Text>
            <Text style={styles.metaValue}>M. Bilal</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>VISIT DATE</Text>
            <Text style={styles.metaValue}>May 13, 2026</Text>
          </View>
          <View style={[styles.metaItem, styles.metaRight]}>
            <Text style={styles.metaLabel}>DURATION</Text>
            <Text style={styles.metaValue}>2h 40m</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>DIAGNOSTIC RESULTS</Text>
      <View style={styles.resultsCard}>
        {diagnostics.map((item, index) => {
          const healthy = item.tone === 'healthy';
          return (
            <View key={item.title} style={[styles.resultRow, index < diagnostics.length - 1 && styles.resultBorder]}>
              <View style={[styles.resultIcon, healthy ? styles.healthyIcon : styles.attentionIcon]}>
                <item.Icon color={healthy ? '#22C55E' : '#F5A400'} size={15} strokeWidth={2.2} />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultNote}>{item.note}</Text>
              </View>
              <View style={styles.resultValueWrap}>
                <Text style={[styles.resultValue, healthy ? styles.healthyText : styles.attentionText]}>{item.value}</Text>
                <View style={[styles.statusPill, healthy ? styles.healthyPill : styles.attentionPill]}>
                  <Text style={[styles.statusText, healthy ? styles.healthyText : styles.attentionText]}>{item.status}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>RECOMMENDATIONS</Text>
      <View style={styles.recommendations}>
        {recommendations.map((text, index) => (
          <View key={text} style={styles.recommendationRow}>
            <View style={styles.recommendationNumber}>
              <Text style={styles.recommendationNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.recommendationText}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>

    <Pressable style={styles.chatButton} accessibilityLabel="WhatsApp help">
      <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
    </Pressable>

    <View style={styles.footer}>
      <Pressable style={styles.membershipButton} onPress={() => navigation.navigate('SolarCareMembership')}>
        <Text style={styles.membershipText}>Get Solar Care Membership</Text>
      </Pressable>
      <Pressable style={styles.downloadButton}>
        <ArrowDownToLine color="#172031" size={16} strokeWidth={2.2} />
        <Text style={styles.downloadText}>Download PDF Report</Text>
      </Pressable>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8F3E8' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 158 },
  scoreCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(221,211,194,0.85)',
    padding: 14,
    marginBottom: 18,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreRing: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: '#27C768',
    borderTopColor: '#DDF7E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13
  },
  scoreText: { color: '#22C55E', fontSize: 16, fontWeight: '900' },
  scoreCopy: { flex: 1 },
  scoreTitle: { color: '#111827', fontSize: 12.5, fontWeight: '900', marginBottom: 8 },
  scoreBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#DFF8E9',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  scoreBadgeText: { color: '#16A34A', fontSize: 10, fontWeight: '900' },
  scoreDivider: { height: 1, backgroundColor: '#EFE7D8', marginVertical: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flex: 1 },
  metaRight: { alignItems: 'flex-end' },
  metaLabel: { color: '#7C6F5F', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
  metaValue: { color: '#020617', fontSize: 11, fontWeight: '900' },
  sectionLabel: { color: '#8B7254', fontSize: 10.5, fontWeight: '900', letterSpacing: 2.1, marginBottom: 10 },
  resultsCard: {
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(221,211,194,0.8)',
    marginBottom: 18,
    overflow: 'hidden'
  },
  resultRow: { minHeight: 63, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9 },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: '#EFE7D8' },
  resultIcon: {
    width: 27,
    height: 27,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  healthyIcon: { backgroundColor: '#DCFCE7' },
  attentionIcon: { backgroundColor: '#FFF1CC' },
  resultCopy: { flex: 1, paddingRight: 8 },
  resultTitle: { color: '#111827', fontSize: 11.5, fontWeight: '900', marginBottom: 3 },
  resultNote: { color: '#334155', fontSize: 9.5, lineHeight: 12, fontWeight: '600' },
  resultValueWrap: { alignItems: 'flex-end', minWidth: 82 },
  resultValue: { fontSize: 11.5, fontWeight: '900', marginBottom: 5 },
  healthyText: { color: '#16A34A' },
  attentionText: { color: '#F59E0B' },
  statusPill: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  healthyPill: { backgroundColor: '#DFF8E9' },
  attentionPill: { backgroundColor: '#FFF1CC' },
  statusText: { fontSize: 8.5, fontWeight: '900' },
  recommendations: { gap: 9 },
  recommendationRow: {
    minHeight: 41,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(221,211,194,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  recommendationNumber: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F5D482',
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  recommendationNumberText: { color: '#F5A400', fontSize: 9, fontWeight: '900' },
  recommendationText: { flex: 1, color: '#172031', fontSize: 10.5, lineHeight: 14, fontWeight: '700' },
  chatButton: {
    position: 'absolute',
    right: 17,
    bottom: 126,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#08213F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#08213F',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: '#F8F3E8'
  },
  membershipButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center'
  },
  membershipText: { color: '#111827', fontSize: 12.5, fontWeight: '900' },
  downloadButton: {
    height: 39,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9BE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  downloadText: { color: '#172031', fontSize: 11.5, fontWeight: '900' }
});
