import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AirVent, ArrowLeft, BatteryCharging, Home, Lightbulb, Refrigerator, Shirt, Sun, Zap } from 'lucide-react-native';
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

const essentials = ['lights', 'fans', 'fridge', 'washing'];
const airConditioners = ['ac1TonInverter', 'ac15TonInverter', 'ac2TonInverter'];

const iconMap: Record<string, any> = {
  lights: Lightbulb,
  fans: Sun,
  fridge: Refrigerator,
  washing: Shirt,
  ac1TonInverter: AirVent,
  ac15TonInverter: AirVent,
  ac2TonInverter: AirVent
};

export const BatterySizeToolScreen = ({ navigation }: any) => {
  const [appliances, setAppliances] = useState(starterAppliances);

  const loadKw = useMemo(() => calculateLoadKw(appliances), [appliances]);
  const backupKwh = useMemo(() => calculateBackupKwh(appliances), [appliances]);

  const updateQuantity = (id: string, delta: number) => {
    setAppliances((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item));
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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

        <Pressable style={styles.moreButton}>
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

      <View style={styles.footer}>
        <Pressable style={styles.calculateButton}>
          <Text style={styles.calculateText}>Calculate Battery Size</Text>
        </Pressable>
      </View>
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
    <Icon color="#B07800" size={14} strokeWidth={2.3} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
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
    backgroundColor: '#FFF2C2',
    borderWidth: 1,
    borderColor: '#F5D482',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  systemEyebrow: { color: '#B07800', fontSize: 8.5, fontWeight: '900', marginBottom: 9 },
  systemGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  systemMetric: { flex: 1, alignItems: 'center', gap: 3 },
  metricValue: { color: '#10213A', fontSize: 11, fontWeight: '900' },
  metricLabel: { color: '#64748B', fontSize: 8, fontWeight: '700', textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(251,248,241,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.72)'
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
  calculateText: { color: '#111827', fontSize: 13, fontWeight: '900' }
});
