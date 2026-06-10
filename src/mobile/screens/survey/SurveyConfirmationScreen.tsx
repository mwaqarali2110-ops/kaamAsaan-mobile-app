import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, Clock3, ClipboardCheck, Home, ShieldCheck } from 'lucide-react-native';
import { formatSurveyReference } from '@/services/journey.api';

export const SurveyConfirmationScreen = ({ navigation, route }: any) => {
  const bookingId = route.params?.bookingId as string | undefined;

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Check color="#FFFFFF" size={38} strokeWidth={3.2} />
        </View>
        <Text style={styles.heading}>Survey Request Received</Text>
        <Text style={styles.message}>
          Thank you for choosing KaamAsaan. We have received your survey request. Our solar consultant will contact you within 1 hour to confirm the details and guide you through the next steps.
        </Text>

        <View style={styles.statusCard}>
          <StatusRow Icon={ClipboardCheck} label="Status" value="Pending Confirmation" />
          <View style={styles.divider} />
          <StatusRow Icon={Clock3} label="Expected Call" value="Within 1 Hour" />
        </View>

        {bookingId ? (
          <View style={styles.referenceCard}>
            <ShieldCheck color="#168A4A" size={17} strokeWidth={2.2} />
            <Text style={styles.referenceText}>Reference: {formatSurveyReference({ id: bookingId })}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.homeButton} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
          <Home color="#10213A" size={20} strokeWidth={2.4} />
          <Text style={styles.homeButtonText}>Back to Home</Text>
          <ArrowRight color="#10213A" size={21} strokeWidth={2.4} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const StatusRow = ({ Icon, label, value }: { Icon: typeof Clock3; label: string; value: string }) => (
  <View style={styles.statusRow}>
    <View style={styles.statusIcon}>
      <Icon color="#168A4A" size={18} strokeWidth={2.3} />
    </View>
    <View style={styles.statusCopy}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: { flex: 1, justifyContent: 'space-between', backgroundColor: '#FBF8F1' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingBottom: 30 },
  successIcon: { width: 78, height: 78, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#22A06B', shadowColor: '#0F5132', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 5 },
  heading: { marginTop: 24, color: '#10213A', textAlign: 'center', fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  message: { marginTop: 13, color: '#526174', textAlign: 'center', fontSize: 13.5, fontWeight: '600', lineHeight: 21 },
  statusCard: { width: '100%', marginTop: 26, borderRadius: 18, borderWidth: 1, borderColor: '#D9E9DA', backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingVertical: 5, shadowColor: '#1F2937', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  statusRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF3' },
  statusCopy: { flex: 1 },
  statusLabel: { color: '#728094', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statusValue: { marginTop: 4, color: '#10213A', fontSize: 14, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#E7EEE8' },
  referenceCard: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: '#ECFDF3', paddingHorizontal: 13, paddingVertical: 8 },
  referenceText: { color: '#168A4A', fontSize: 11, fontWeight: '900' },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, backgroundColor: '#FBF8F1' },
  homeButton: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 15, backgroundColor: '#F7B500', shadowColor: '#C87500', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 3 },
  homeButtonText: { color: '#10213A', fontSize: 16, fontWeight: '900' }
});
