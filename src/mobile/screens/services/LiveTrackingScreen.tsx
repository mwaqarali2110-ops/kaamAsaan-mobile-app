import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Clock3, Info, MessageCircle, Phone, User } from 'lucide-react-native';

const steps = [
  { title: 'Booking Confirmed', time: '9:04 AM', state: 'done' },
  { title: 'Technician Assigned', time: '9:20 AM', state: 'done' },
  { title: 'Technician On the Way', time: '10:15 AM', state: 'active' },
  { title: 'Inspection Started', time: '', state: 'pending' },
  { title: 'Service Completed', time: '', state: 'pending' },
  { title: 'Report Uploaded', time: '', state: 'pending' }
];

export const LiveTrackingScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.shell} edges={['top']}>
    <View style={styles.topBar}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
        <ArrowLeft color="#111827" size={18} strokeWidth={2.3} />
      </Pressable>
      <Text style={styles.title}>Live Tracking</Text>
      <View style={styles.topSpacer} />
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.etaPill}>
        <View style={styles.etaDot} />
        <Text style={styles.etaText}>Technician On the Way · ETA 25 min</Text>
      </View>

      <View style={styles.techCard}>
        <View style={styles.avatar}>
          <User color="#F5A400" size={22} strokeWidth={2} />
        </View>
        <View style={styles.techCopy}>
          <Text style={styles.techName}>Muhammad Bilal</Text>
          <Text style={styles.techTitle}>Certified Solar Technician</Text>
          <Text style={styles.rating}>★ ★ ★ ★ ★  <Text style={styles.ratingMeta}>4.9 (142 visits)</Text></Text>
        </View>
        <Pressable style={styles.callButton} accessibilityLabel="Call technician">
          <Phone color="#16A34A" size={18} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>SERVICE PROGRESS</Text>
        <View style={styles.timeline}>
          {steps.map((step, index) => {
            const done = step.state === 'done';
            const active = step.state === 'active';
            return (
              <View key={step.title} style={styles.timelineRow}>
                <View style={styles.markerColumn}>
                  <View style={[styles.marker, done && styles.markerDone, active && styles.markerActive]}>
                    {done ? <Check color="#FFFFFF" size={11} strokeWidth={3} /> : null}
                  </View>
                  {index < steps.length - 1 ? <View style={[styles.timelineLine, (done || active) && styles.timelineLineActive]} /> : null}
                </View>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepTitle, done && styles.stepDone, active && styles.stepActive]}>{step.title}</Text>
                  {step.time ? <Text style={styles.stepTime}>{step.time}</Text> : null}
                  {active ? (
                    <View style={styles.progressBadge}>
                      <Text style={styles.progressBadgeText}>In progress...</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Info color="#9B845F" size={15} strokeWidth={2} />
        <Text style={styles.infoText}>You will receive an SMS notification when your technician arrives. The service report will be uploaded here after completion.</Text>
      </View>
    </ScrollView>

    <Pressable style={styles.chatButton} accessibilityLabel="WhatsApp help">
      <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
    </Pressable>

    <View style={styles.footer}>
      <Pressable style={styles.reportButton} onPress={() => navigation.navigate('PostServiceHealthReport')}>
        <Text style={styles.reportText}>View Service Report</Text>
      </Pressable>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8F5EE' },
  topBar: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,211,203,0.65)',
    backgroundColor: '#FBF8F1'
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { flex: 1, textAlign: 'center', color: '#172031', fontSize: 13, fontWeight: '900' },
  topSpacer: { width: 32 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 116 },
  etaPill: {
    alignSelf: 'flex-start',
    height: 34,
    borderRadius: 999,
    backgroundColor: '#FFF1CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 8,
    marginBottom: 14
  },
  etaDot: { width: 9, height: 9, borderRadius: 999, backgroundColor: '#FFD166' },
  etaText: { color: '#F5A400', fontSize: 10.5, fontWeight: '900' },
  techCard: {
    minHeight: 78,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 14
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F5D482',
    backgroundColor: '#FFF7E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  techCopy: { flex: 1, paddingHorizontal: 12 },
  techName: { color: '#020617', fontSize: 13, fontWeight: '900' },
  techTitle: { marginTop: 3, color: '#334155', fontSize: 10.5, fontWeight: '700' },
  rating: { marginTop: 7, color: '#F5A400', fontSize: 9.5, fontWeight: '900' },
  ratingMeta: { color: '#172031', fontWeight: '800' },
  callButton: {
    width: 39,
    height: 39,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.8)',
    padding: 14,
    marginBottom: 14
  },
  progressLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 10 },
  timeline: { gap: 0 },
  timelineRow: { minHeight: 43, flexDirection: 'row' },
  markerColumn: { width: 25, alignItems: 'center' },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  markerDone: { backgroundColor: '#22C55E' },
  markerActive: { backgroundColor: '#F5B700' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: -1 },
  timelineLineActive: { backgroundColor: '#22C55E' },
  stepCopy: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 1, gap: 8 },
  stepTitle: { color: '#172031', fontSize: 12, fontWeight: '900' },
  stepDone: { color: '#22C55E' },
  stepActive: { color: '#F5A400' },
  stepTime: { color: '#172031', fontSize: 10, fontWeight: '700', marginTop: 1 },
  progressBadge: {
    minHeight: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F5C542',
    backgroundColor: '#FFF9E8',
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2
  },
  progressBadgeText: { color: '#F5A400', fontSize: 8.5, fontWeight: '900' },
  infoCard: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.8)',
    flexDirection: 'row',
    padding: 12,
    gap: 9
  },
  infoText: { flex: 1, color: '#64748B', fontSize: 10.5, lineHeight: 15, fontWeight: '600' },
  chatButton: {
    position: 'absolute',
    right: 18,
    bottom: 77,
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#F8F5EE'
  },
  reportButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F5A400',
    alignItems: 'center',
    justifyContent: 'center'
  },
  reportText: { color: '#111827', fontSize: 13, fontWeight: '900' }
});
