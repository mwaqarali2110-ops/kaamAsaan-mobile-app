import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AirVent, ArrowLeft, ArrowRight, BatteryCharging, Camera, Droplets, Home, Laptop, Lightbulb, Microwave, Monitor, PlugZap, Refrigerator, Shirt, Sun, Wifi, Zap } from 'lucide-react-native';
import type { Appliance } from '@/types/system.types';

type BatteryRunningLoadParams = {
  selectedAppliances: Appliance[];
  totalBackupWatts: number;
  backupHours: number;
};

const iconMap: Record<string, any> = {
  lights: Lightbulb,
  fans: Sun,
  fridge: Refrigerator,
  washing: Shirt,
  ac1TonInverter: AirVent,
  ac15TonInverter: AirVent,
  ac2TonInverter: AirVent,
  tv: Monitor,
  waterPump: Droplets,
  microwave: Microwave,
  iron: PlugZap,
  laptop: Laptop,
  router: Wifi,
  cctv: Camera,
  other: Home
};

const formatKw = (watts: number) => `${(watts / 1000).toFixed(1)} kW`;

export const BatteryRunningLoadScreen = ({ navigation, route }: any) => {
  const {
    selectedAppliances = [],
    totalBackupWatts = 0,
    backupHours = 1
  } = (route?.params ?? {}) as BatteryRunningLoadParams;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={20} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.topTitle}>Running Load</Text>
        <View style={styles.iconButton}>
          <BatteryCharging color="#F5A400" size={20} strokeWidth={2.4} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>YOUR RUNNING LOAD</Text>
          <View style={styles.valueRow}>
            <Zap color="#FDB813" fill="#FDB813" size={36} strokeWidth={2.2} />
            <Text style={styles.heroValue}>{formatKw(totalBackupWatts)}</Text>
          </View>
          <Text style={styles.heroSubtitle}>Based on selected backup appliances</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>View calculation</Text>
          {selectedAppliances.map((item, index) => {
            const Icon = iconMap[item.id] || Home;
            const itemWatts = item.quantity * item.watts;
            return (
              <View key={item.id} style={[styles.calcRow, index === selectedAppliances.length - 1 && styles.calcRowLast]}>
                <View style={styles.applianceIcon}>
                  <Icon color="#B07800" size={16} strokeWidth={2.3} />
                </View>
                <View style={styles.applianceCopy}>
                  <Text style={styles.applianceName}>{item.name}</Text>
                  <Text style={styles.applianceMeta}>{item.quantity} x {item.watts}W</Text>
                </View>
                <Text style={styles.applianceWatts}>{itemWatts}W</Text>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatKw(totalBackupWatts)}</Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('BatteryRecommendedSize', { selectedAppliances, totalBackupWatts, backupHours })}
        >
          <Text style={styles.primaryText}>See Recommended Battery Size</Text>
          <ArrowRight color="#111827" size={20} strokeWidth={2.7} />
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#10213A" size={16} strokeWidth={2.4} />
          <Text style={styles.secondaryText}>Adjust appliances</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: { height: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', alignItems: 'center', justifyContent: 'center', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  topTitle: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  content: { paddingHorizontal: 14, paddingTop: 7, paddingBottom: 42, gap: 12 },
  heroCard: { borderRadius: 22, backgroundColor: '#FFF8E5', borderWidth: 1, borderColor: '#F5C542', paddingHorizontal: 17, paddingVertical: 20, alignItems: 'center', shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 15, elevation: 2 },
  eyebrow: { color: '#B07800', fontSize: 10, fontWeight: '900', letterSpacing: 0.7, backgroundColor: '#FFF0BF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  valueRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroValue: { color: '#10213A', fontSize: 48, lineHeight: 54, fontWeight: '900' },
  heroSubtitle: { maxWidth: 260, color: '#64748B', fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 14, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  cardTitle: { color: '#10213A', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  calcRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F2F4' },
  calcRowLast: { borderBottomWidth: 0 },
  applianceIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#FFF3D6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  applianceCopy: { flex: 1 },
  applianceName: { color: '#10213A', fontSize: 12, fontWeight: '900' },
  applianceMeta: { marginTop: 3, color: '#64748B', fontSize: 10, fontWeight: '700' },
  applianceWatts: { color: '#10213A', fontSize: 12, fontWeight: '900' },
  totalRow: { marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEE4D5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  totalValue: { color: '#B07800', fontSize: 16, fontWeight: '900' },
  primaryButton: { height: 52, borderRadius: 16, backgroundColor: '#FDB813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 3 },
  primaryText: { color: '#111827', fontSize: 14, fontWeight: '900' },
  secondaryButton: { height: 46, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F5C542', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { color: '#10213A', fontSize: 13, fontWeight: '900' }
});
