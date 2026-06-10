import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AirVent, ArrowLeft, ArrowRight, BatteryCharging, ChevronUp, Home, Lightbulb, MessageCircle, Plus, Refrigerator, Shirt, Sun, Zap } from 'lucide-react-native';
import type { Appliance } from '@/types/system.types';
import { calculateEnergyKwh, calculateLoadKw, recommendSolarKw } from '@/utils/calculations';
import { useSystemStore } from '@/store/useSystemStore';

const starterAppliances: Appliance[] = [
  { id: 'lights', name: 'LED Bulbs', watts: 12, quantity: 0, hours: 6 },
  { id: 'fans', name: 'Fans', watts: 80, quantity: 0, hours: 8 },
  { id: 'fridge', name: 'Refrigerators', watts: 200, quantity: 0, hours: 10 },
  { id: 'washing', name: 'Washing Machine', watts: 500, quantity: 0, hours: 1 },
  { id: 'ac1TonInverter', name: 'AC 1 Ton (Inverter)', watts: 900, quantity: 0, hours: 4 },
  { id: 'ac15TonInverter', name: 'AC 1.5 Ton (Inverter)', watts: 1200, quantity: 0, hours: 4 },
  { id: 'ac2TonInverter', name: 'AC 2 Ton (Inverter)', watts: 1800, quantity: 0, hours: 4 }
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

export const SolarSizeToolScreen = ({ navigation }: any) => {
  const [appliances, setAppliances] = useState(starterAppliances);
  const [showResult, setShowResult] = useState(false);
  const setRecommendedSolarKw = useSystemStore((state) => state.setRecommendedSolarKw);

  const loadKw = useMemo(() => calculateLoadKw(appliances), [appliances]);
  const energyKwh = useMemo(() => calculateEnergyKwh(appliances), [appliances]);
  const systemKw = useMemo(() => (loadKw > 0 ? recommendSolarKw(appliances) : 0), [appliances, loadKw]);
  const selectedAppliances = useMemo(() => appliances.filter((item) => item.quantity > 0), [appliances]);

  const updateQuantity = (id: string, delta: number) => {
    setAppliances((items) => items.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item));
  };

  const calculateLoad = () => {
    setRecommendedSolarKw(systemKw || 0);
    setShowResult(true);
  };

  const seeRecommendedSize = () => {
    setRecommendedSolarKw(systemKw || 0);
    navigation.navigate('RecommendedSolarSize', { loadKw, systemKw });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => showResult ? setShowResult(false) : navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#10213A" size={18} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topTitle}>{showResult ? 'Running Load' : 'Solar Size'}</Text>
        <Pressable style={styles.iconButton} accessibilityLabel="Solar size tool">
          <Zap color="#F5A400" size={17} strokeWidth={2.4} />
        </Pressable>
      </View>

      {showResult ? (
        <RunningLoadResult
          appliances={selectedAppliances}
          loadKw={loadKw}
          onAdjust={() => setShowResult(false)}
          onContinue={seeRecommendedSize}
        />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Which appliances{'\n'}do you use <Text style={styles.headingAccent}>during the day?</Text></Text>
          <Text style={styles.subtitle}>Select the appliances that apply to you</Text>
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
            <SystemMetric Icon={Sun} value={`${systemKw} kW`} label="System Size" />
            <SystemMetric Icon={Zap} value={`${loadKw.toFixed(1)} kW`} label="Est. Power" />
            <SystemMetric Icon={BatteryCharging} value={`${energyKwh.toFixed(1)} kWh`} label="Est. Daily Energy" />
          </View>
        </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.calculateButton} onPress={calculateLoad}>
              <Text style={styles.calculateText}>Calculate Load</Text>
            </Pressable>
          </View>
        </>
      )}
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

const RunningLoadResult = ({
  appliances,
  loadKw,
  onAdjust,
  onContinue
}: {
  appliances: Appliance[];
  loadKw: number;
  onAdjust: () => void;
  onContinue: () => void;
}) => {
  const totalWatts = appliances.reduce((sum, item) => sum + item.watts * item.quantity, 0);
  const displayKw = loadKw.toFixed(1);

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultContent}>
        <View style={styles.loadCard}>
          <Text style={styles.loadEyebrow}>YOUR RUNNING LOAD</Text>
          <View style={styles.loadValueRow}>
            <Zap color="#F5A400" size={34} fill="#F5A400" strokeWidth={2.4} />
            <Text style={styles.loadValue}>{displayKw} <Text style={styles.loadUnit}>kW</Text></Text>
          </View>
          <Text style={styles.loadHelper}>Based on selected appliances</Text>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>View calculation</Text>
            <ChevronUp color="#10213A" size={20} strokeWidth={2.6} />
          </View>
          {(appliances.length ? appliances : starterAppliances.slice(0, 5)).map((item, index) => {
            const quantity = item.quantity || 0;
            const watts = quantity * item.watts;
            return (
              <View key={item.id} style={[styles.calcRow, index === (appliances.length ? appliances.length : 5) - 1 && styles.calcRowLast]}>
                <View style={styles.calcIcon}>
                  {React.createElement(iconMap[item.id] || Home, { color: '#10213A', size: 18, strokeWidth: 2.1 })}
                </View>
                <Text style={styles.calcName}>{item.name}</Text>
                <Text style={styles.calcFormula}>{quantity} × {item.watts}W</Text>
                <Text style={styles.calcWatts}>{watts}W</Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalWatts > 0 ? displayKw : '0.0'} kW</Text>
          </View>
        </View>

        <Pressable style={styles.recommendButton} onPress={onContinue}>
          <Text style={styles.recommendText}>See Recommended Size</Text>
          <ArrowRight color="#111827" size={18} strokeWidth={2.6} />
        </Pressable>

        <Pressable style={styles.adjustButton} onPress={onAdjust}>
          <Text style={styles.adjustText}>← Adjust appliances</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.floatingChip}>
        <Text style={styles.floatingEyebrow}>MY SYSTEM</Text>
        <View style={styles.floatingValues}>
          <Text style={styles.floatingValue}>☀ 3 kW</Text>
          <Text style={styles.floatingDivider}>|</Text>
          <Text style={styles.floatingValue}>⚡ 4 kW</Text>
          <Text style={styles.floatingDivider}>|</Text>
          <Text style={styles.floatingValue}>🌿 6 kWh</Text>
        </View>
      </View>
      <Pressable style={styles.chatButton} accessibilityLabel="Help">
        <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
      </Pressable>
    </>
  );
};

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
  headingAccent: { color: '#F5A400' },
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
  calculateText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  resultContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 148
  },
  loadCard: {
    borderRadius: 24,
    backgroundColor: '#FFF7DE',
    borderWidth: 1,
    borderColor: '#F5D482',
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2
  },
  loadEyebrow: {
    color: '#B07800',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  loadValueRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  loadValue: {
    color: '#0F172A',
    fontSize: 46,
    fontWeight: '900'
  },
  loadUnit: {
    color: '#B07800',
    fontSize: 31,
    fontWeight: '900'
  },
  loadHelper: {
    marginTop: 14,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700'
  },
  breakdownCard: {
    marginTop: 18,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.72)',
    overflow: 'hidden',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2
  },
  breakdownHeader: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2'
  },
  breakdownTitle: {
    color: '#10213A',
    fontSize: 18,
    fontWeight: '900'
  },
  calcRow: {
    minHeight: 66,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
    gap: 10
  },
  calcRowLast: {
    borderBottomWidth: 0
  },
  calcIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  calcName: {
    flex: 1,
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  calcFormula: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  calcWatts: {
    minWidth: 48,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right'
  },
  totalRow: {
    minHeight: 62,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalLabel: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900'
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900'
  },
  recommendButton: {
    height: 58,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3
  },
  recommendText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900'
  },
  adjustButton: {
    alignSelf: 'center',
    minWidth: 200,
    height: 48,
    marginTop: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F5D482',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  adjustText: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900'
  },
  floatingChip: {
    position: 'absolute',
    left: 18,
    bottom: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(45,52,38,0.94)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5
  },
  floatingEyebrow: {
    color: '#F5B700',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  floatingValues: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  floatingValue: {
    color: '#F8F5D9',
    fontSize: 13,
    fontWeight: '800'
  },
  floatingDivider: {
    color: 'rgba(248,245,217,0.32)',
    fontSize: 13,
    fontWeight: '800'
  },
  chatButton: {
    position: 'absolute',
    right: 22,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#26331F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 5
  }
});
