import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AirVent, ArrowLeft, BatteryCharging, Camera, Droplets, Home, Laptop, Lightbulb, Microwave, Monitor, PlugZap, Refrigerator, Shirt, Sun, Wifi, Zap } from 'lucide-react-native';
import type { Appliance } from '@/types/system.types';
import { calculateBackupKwh, calculateLoadKw } from '@/utils/calculations';

const starterAppliances: Appliance[] = [
  { id: 'lights', name: 'LED Bulbs', watts: 12, quantity: 0, hours: 1 },
  { id: 'fans', name: 'Fans', watts: 80, quantity: 0, hours: 1 },
  { id: 'fridge', name: 'Refrigerators', watts: 200, quantity: 0, hours: 1 },
  { id: 'washing', name: 'Washing Machine', watts: 500, quantity: 0, hours: 1 },
  { id: 'ac1TonInverter', name: 'AC 1 Ton (Inverter)', watts: 900, quantity: 0, hours: 1 },
  { id: 'ac15TonInverter', name: 'AC 1.5 Ton (Inverter)', watts: 1200, quantity: 0, hours: 1 },
  { id: 'ac2TonInverter', name: 'AC 2 Ton (Inverter)', watts: 1800, quantity: 0, hours: 1 }
];

const extraAppliances: Appliance[] = [
  { id: 'tv', name: 'TV / LED TV', watts: 120, quantity: 0, hours: 1 },
  { id: 'waterPump', name: 'Water Pump', watts: 750, quantity: 0, hours: 1 },
  { id: 'microwave', name: 'Microwave', watts: 1000, quantity: 0, hours: 1 },
  { id: 'iron', name: 'Iron', watts: 1200, quantity: 0, hours: 1 },
  { id: 'laptop', name: 'Laptop / Computer', watts: 90, quantity: 0, hours: 1 },
  { id: 'router', name: 'WiFi Router', watts: 15, quantity: 0, hours: 1 },
  { id: 'cctv', name: 'CCTV / Security System', watts: 60, quantity: 0, hours: 1 },
  { id: 'other', name: 'Other Appliance', watts: 300, quantity: 0, hours: 1 }
];

const essentials = ['lights', 'fans', 'fridge', 'washing'];
const airConditioners = ['ac1TonInverter', 'ac15TonInverter', 'ac2TonInverter'];

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

export const BatterySizeToolScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || 16;
  const [appliances, setAppliances] = useState([...starterAppliances, ...extraAppliances]);
  const [showMoreAppliances, setShowMoreAppliances] = useState(false);
  const loadKw = useMemo(() => calculateLoadKw(appliances), [appliances]);
  const backupKwh = useMemo(() => calculateBackupKwh(appliances), [appliances]);
  const selectedAppliances = useMemo(() => appliances.filter((item) => item.quantity > 0), [appliances]);
  const backupEnergyKwh = useMemo(
    () => selectedAppliances.reduce((sum, item) => sum + (item.watts * item.quantity * item.hours) / 1000, 0),
    [selectedAppliances]
  );
  const averageBackupHours = useMemo(() => {
    if (!selectedAppliances.length) return 0;
    const totalQuantity = selectedAppliances.reduce((sum, item) => sum + item.quantity, 0);
    const weightedHours = selectedAppliances.reduce((sum, item) => sum + item.hours * item.quantity, 0);
    return totalQuantity > 0 ? weightedHours / totalQuantity : 0;
  }, [selectedAppliances]);

  const updateQuantity = (id: string, delta: number) => {
    setAppliances((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item));
  };

  const handleMoreAppliances = () => {
    console.log('More appliances pressed');
    setShowMoreAppliances(true);
  };

  const handleCalculateBatterySize = () => {
    console.log('Calculate Battery Size pressed');
    const selectedAppliances = appliances.filter((item) => item.quantity > 0);
    const totalBackupWatts = selectedAppliances.reduce((sum, item) => sum + item.quantity * item.watts, 0);
    console.log('Total backup watts:', totalBackupWatts);

    if (totalBackupWatts <= 0) {
      Alert.alert('Please select at least one appliance.');
      return;
    }

    const backupHours = 1;
    navigation.navigate('BatteryRunningLoad', {
      selectedAppliances,
      totalBackupWatts,
      backupHours
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={18} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topTitle}>Battery Size</Text>
        <Pressable style={styles.iconButton} accessibilityLabel="Battery size tool">
          <BatteryCharging color="#F5A400" size={17} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 216 + safeBottom }]}>
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Which appliances do you want on backup?</Text>
          <Text style={styles.subtitle}>Select appliances for battery backup</Text>
        </View>

        <ApplianceSection
          title="ESSENTIALS"
          appliances={appliances.filter((item) => essentials.includes(item.id))}
          onChange={updateQuantity}
        />

        <ApplianceSection
          title="AIR CONDITIONERS"
          appliances={appliances.filter((item) => airConditioners.includes(item.id))}
          onChange={updateQuantity}
        />

        <Pressable style={styles.moreButton} onPress={handleMoreAppliances}>
          <Text style={styles.moreText}>+  More appliances</Text>
        </Pressable>

        <View style={styles.systemCard}>
          <Text style={styles.systemEyebrow}>MY SYSTEM</Text>
          <View style={styles.systemGrid}>
            <SystemMetric Icon={Sun} value="0 kW" label="System Size" />
            <SystemMetric Icon={Zap} value={`${loadKw.toFixed(1)} kW`} label="Est. Power" />
            <SystemMetric Icon={BatteryCharging} value={`${backupKwh.toFixed(1)} kWh`} label="Est. Battery" />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 12 + safeBottom }]}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <View style={styles.summaryIcon}>
                <Zap color="#10213A" size={15} strokeWidth={2.5} />
              </View>
              <Text style={styles.summaryTitle}>Your Backup Load Summary</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>Live Calculation</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Running Load" value={`${loadKw.toFixed(1)} kW`} />
            <SummaryMetric label="Backup Energy" value={`${backupEnergyKwh.toFixed(1)} kWh`} />
            <SummaryMetric label="Appliances" value={`${selectedAppliances.length} selected`} />
            <SummaryMetric label="Average Backup" value={averageBackupHours > 0 ? `${averageBackupHours.toFixed(1)} hrs` : 'Based on hours'} />
          </View>
          <Text style={styles.summaryHelper}>Battery recommendation will be based on this running load and selected backup hours.</Text>
        </View>
        <Text style={styles.reviewHint}>Review your load summary before continuing.</Text>
        <Pressable style={styles.calculateButton} onPress={handleCalculateBatterySize}>
          <Text style={styles.calculateText}>Calculate Battery Size</Text>
        </Pressable>
      </View>

      <Modal visible={showMoreAppliances} transparent animationType="slide" onRequestClose={() => setShowMoreAppliances(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMoreAppliances(false)}>
          <Pressable style={[styles.bottomSheet, { paddingBottom: 16 + safeBottom }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Add more appliances</Text>
                <Text style={styles.sheetSubtitle}>Add backup items to refine your estimate</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => setShowMoreAppliances(false)}>
                <Text style={styles.sheetCloseText}>x</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <ApplianceSection
                title="MORE APPLIANCES"
                appliances={appliances.filter((item) => extraAppliances.some((extra) => extra.id === item.id))}
                onChange={updateQuantity}
              />
            </ScrollView>
            <Pressable style={styles.doneButton} onPress={() => setShowMoreAppliances(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const ApplianceSection = ({ title, appliances, onChange }: { title: string; appliances: Appliance[]; onChange: (id: string, delta: number) => void }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionLabel}>{title}</Text>
    {appliances.map((item, index) => (
      <View key={item.id} style={[styles.applianceRow, index === appliances.length - 1 && styles.applianceRowLast]}>
        <View style={styles.applianceIcon}>
          {React.createElement(iconMap[item.id] || Home, { color: '#B07800', size: 15, strokeWidth: 2.2 })}
        </View>
        <View style={styles.applianceCopy}>
          <Text style={styles.applianceName}>{item.name}</Text>
          <Text style={styles.wattage}>{item.watts} W each</Text>
        </View>
        <Counter value={item.quantity} onMinus={() => onChange(item.id, -1)} onPlus={() => onChange(item.id, 1)} />
      </View>
    ))}
  </View>
);

const Counter = ({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) => (
  <View style={styles.counter}>
    <Pressable style={styles.counterButton} onPress={onMinus}>
      <Text style={styles.counterText}>-</Text>
    </Pressable>
    <Text style={styles.count}>{value}</Text>
    <Pressable style={[styles.counterButton, styles.counterButtonPlus]} onPress={onPlus}>
      <Text style={styles.counterText}>+</Text>
    </Pressable>
  </View>
);

const SystemMetric = ({ Icon, value, label }: { Icon: any; value: string; label: string }) => (
  <View style={styles.systemMetric}>
    <Icon color="#B07800" size={15} strokeWidth={2.3} />
    <Text style={styles.systemValue}>{value}</Text>
    <Text style={styles.systemLabel}>{label}</Text>
  </View>
);

const SummaryMetric = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryMetric}>
    <Text style={styles.summaryMetricLabel}>{label}</Text>
    <Text style={styles.summaryMetricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  topBar: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.72)',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  topTitle: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  content: { paddingHorizontal: 14, paddingBottom: 92 },
  headingBlock: { paddingTop: 12, paddingBottom: 12 },
  heading: { color: '#10213A', fontSize: 22, lineHeight: 25, fontWeight: '900' },
  subtitle: { marginTop: 7, color: '#64748B', fontSize: 11, fontWeight: '700' },
  sectionCard: {
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    paddingHorizontal: 13,
    paddingTop: 11,
    marginBottom: 12,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  sectionLabel: { color: '#64748B', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  applianceRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F4'
  },
  applianceRowLast: { borderBottomWidth: 0 },
  applianceIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  applianceCopy: { flex: 1 },
  applianceName: { color: '#10213A', fontSize: 12, fontWeight: '900' },
  wattage: { marginTop: 3, color: '#64748B', fontSize: 9.5, fontWeight: '700' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterButton: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterButtonPlus: { backgroundColor: '#FFE486', borderColor: '#FFE486' },
  counterText: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  count: { width: 18, textAlign: 'center', color: '#10213A', fontSize: 12, fontWeight: '900' },
  moreButton: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E8D9BE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  moreText: { color: '#10213A', fontSize: 11, fontWeight: '800' },
  systemCard: {
    borderRadius: 17,
    backgroundColor: '#FFF2BF',
    borderWidth: 1,
    borderColor: '#F3D27A',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12
  },
  systemEyebrow: { color: '#8A5D00', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },
  systemGrid: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  systemMetric: { flex: 1, alignItems: 'center', gap: 4 },
  systemValue: { color: '#10213A', fontSize: 11, fontWeight: '900' },
  systemLabel: { color: '#64748B', fontSize: 8.5, fontWeight: '800' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 12,
    backgroundColor: 'rgba(251,248,241,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.72)'
  },
  summaryCard: {
    borderRadius: 18,
    backgroundColor: '#FFF7DF',
    borderWidth: 1,
    borderColor: '#F3D27A',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  summaryTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryTitle: {
    flex: 1,
    color: '#10213A',
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '900'
  },
  summaryBadge: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D27A',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  summaryBadgeText: {
    color: '#A66F00',
    fontSize: 8.5,
    fontWeight: '900'
  },
  summaryGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },
  summaryMetric: {
    width: '48.5%',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(243,210,122,0.48)',
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  summaryMetricLabel: {
    color: '#7A5A10',
    fontSize: 8.5,
    fontWeight: '800'
  },
  summaryMetricValue: {
    marginTop: 3,
    color: '#10213A',
    fontSize: 11,
    fontWeight: '900'
  },
  summaryHelper: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '700'
  },
  reviewHint: {
    marginBottom: 7,
    textAlign: 'center',
    color: '#7A5A10',
    fontSize: 9.5,
    fontWeight: '800'
  },
  calculateButton: {
    height: 47,
    borderRadius: 14,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3
  },
  calculateText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.28)'
  },
  bottomSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FBF8F1',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E8D9BE',
    marginBottom: 12
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sheetTitle: { color: '#10213A', fontSize: 18, fontWeight: '900' },
  sheetSubtitle: { marginTop: 4, color: '#64748B', fontSize: 11, fontWeight: '700' },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8D9BE'
  },
  sheetCloseText: { color: '#10213A', fontSize: 16, fontWeight: '900' },
  sheetContent: { paddingBottom: 4 },
  doneButton: {
    height: 47,
    borderRadius: 14,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  doneButtonText: { color: '#111827', fontSize: 13, fontWeight: '900' }
});
