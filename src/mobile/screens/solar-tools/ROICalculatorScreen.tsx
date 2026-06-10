import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, BatteryCharging, Info, MessageCircle, Sun, Zap } from 'lucide-react-native';

const cleanNumber = (value: string) => value.replace(/[^0-9.]/g, '');

export const ROICalculatorScreen = ({ navigation }: any) => {
  const [systemSize, setSystemSize] = useState('');
  const [batterySize, setBatterySize] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const hasSystemSize = Number(systemSize) > 0;
  const hasTotalCost = Number(totalCost) > 0;
  const hasError = submitted && (!hasSystemSize || !hasTotalCost);

  const chipValues = useMemo(() => ({ solar: 3, inverter: 4, battery: 6 }), []);

  const calculate = () => {
    setSubmitted(true);
    if (!hasSystemSize || !hasTotalCost) return;
    navigation.navigate('ROIResult', {
      systemSize: Number(systemSize),
      batterySize: Number(batterySize) || 0,
      totalCost: Number(totalCost)
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.topIconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <ArrowLeft color="#10213A" size={19} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.topTitle}>ROI Calculator</Text>
          <Pressable style={styles.topIconButton} accessibilityLabel="ROI calculator">
            <Zap color="#F5A400" size={20} fill="#F5A400" strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.inputCard}>
          <Field
            label="Solar System Size (kW)"
            placeholder="Enter system size"
            value={systemSize}
            onChangeText={(value) => setSystemSize(cleanNumber(value))}
            helper="Typical homes use 5-10 kW systems"
            error={submitted && !hasSystemSize}
          />

          <View style={styles.divider} />

          <Field
            label="Battery Size (kW) (optional)"
            placeholder="Enter battery size"
            value={batterySize}
            onChangeText={(value) => setBatterySize(cleanNumber(value))}
            helper="Optional - add only if backup is included"
          />

          <View style={styles.divider} />

          <Field
            label="Total System Cost (PKR)"
            placeholder="Enter total cost"
            value={totalCost}
            onChangeText={(value) => setTotalCost(value.replace(/[^0-9]/g, ''))}
            helper="Enter complete quoted price including installation"
            prefix="PKR"
            error={submitted && !hasTotalCost}
          />
        </View>

        {hasError ? <Text style={styles.errorText}>Enter system size and total system cost to calculate ROI.</Text> : null}

        <Pressable style={styles.calculateButton} onPress={calculate}>
          <Text style={styles.calculateText}>Calculate ROI</Text>
        </Pressable>

        <View style={styles.helpCard}>
          <View>
            <Text style={styles.helpTitle}>Not sure about your system?</Text>
            <Text style={styles.helpText}>Get help from our solar experts</Text>
          </View>
          <Pressable style={styles.helpArrow} onPress={() => navigation.navigate('DesignFlow')}>
            <ArrowRight color="#B07800" size={17} strokeWidth={2.4} />
          </Pressable>
        </View>
      </ScrollView>

      <SystemChip solar={chipValues.solar} inverter={chipValues.inverter} battery={chipValues.battery} />
      <Pressable style={styles.chatButton} accessibilityLabel="Help">
        <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.2} />
      </Pressable>
    </SafeAreaView>
  );
};

export const ROIResultScreen = ({ navigation, route }: any) => {
  const systemSize = route.params?.systemSize ?? 5;
  const totalCost = route.params?.totalCost ?? 750000;
  const annualSavings = Math.round(systemSize * 67500);
  const payback = Math.max(1, totalCost / annualSavings);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultTop}>
          <Pressable style={styles.backButtonLight} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <ArrowLeft color="#10213A" size={19} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.resultTitle}>ROI Estimate</Text>
        </View>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Estimated Monthly Savings</Text>
          <Text style={styles.resultValue}>PKR {Math.round(annualSavings / 12).toLocaleString('en-PK')}</Text>
          <Text style={styles.resultSub}>Approx. {payback.toFixed(1)} years payback period</Text>
        </View>
        <Pressable style={styles.calculateButton} onPress={() => navigation.navigate('SystemSummary')}>
          <Text style={styles.calculateText}>Review My System</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({
  label,
  placeholder,
  value,
  onChangeText,
  helper,
  prefix,
  error
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  helper: string;
  prefix?: string;
  error?: boolean;
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrap, error && styles.inputError]}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
    </View>
    <View style={styles.helperRow}>
      <Info color="#F5A400" size={14} strokeWidth={2.2} />
      <Text style={styles.helperText}>{helper}</Text>
    </View>
  </View>
);

const SystemChip = ({ solar, inverter, battery }: { solar: number; inverter: number; battery: number }) => (
  <View style={styles.summaryChip}>
    <Text style={styles.summaryEyebrow}>MY SYSTEM</Text>
    <View style={styles.summaryValues}>
      <Text style={styles.summaryValue}>☀ {solar} kW</Text>
      <Text style={styles.summaryValue}>⚡ {inverter}kW</Text>
      <Text style={styles.summaryValue}>🔋 {battery}kWh</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F3E8'
  },
  content: {
    paddingTop: 18,
    paddingBottom: 134
  },
  topBar: {
    height: 72,
    marginHorizontal: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topIconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.72)',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#10213A',
    fontSize: 21,
    fontWeight: '900'
  },
  inputCard: {
    marginHorizontal: 18,
    marginTop: 0,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3
  },
  field: {
    gap: 9
  },
  fieldLabel: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  inputWrap: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 13,
    color: '#10213A',
    fontSize: 13,
    fontWeight: '800'
  },
  prefix: {
    height: '100%',
    minWidth: 48,
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 15
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  helperText: {
    flex: 1,
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F2',
    marginVertical: 16
  },
  errorText: {
    marginHorizontal: 22,
    marginTop: 10,
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800'
  },
  calculateButton: {
    height: 52,
    marginHorizontal: 18,
    marginTop: 22,
    borderRadius: 17,
    backgroundColor: '#F9C744',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3
  },
  calculateText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900'
  },
  helpCard: {
    minHeight: 60,
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 14
  },
  helpTitle: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  helpText: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },
  helpArrow: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F5D482',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryChip: {
    position: 'absolute',
    left: 18,
    bottom: 72,
    borderRadius: 14,
    backgroundColor: 'rgba(45,52,38,0.92)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5
  },
  summaryEyebrow: {
    color: '#F5B700',
    fontSize: 7,
    fontWeight: '900'
  },
  summaryValues: {
    marginTop: 3,
    flexDirection: 'row',
    gap: 8
  },
  summaryValue: {
    color: '#F8F5D9',
    fontSize: 10,
    fontWeight: '800'
  },
  chatButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#071D35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#071D35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5
  },
  resultContent: {
    padding: 18,
    paddingBottom: 36
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backButtonLight: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultTitle: {
    color: '#10213A',
    fontSize: 20,
    fontWeight: '900'
  },
  resultCard: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  resultLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  resultValue: {
    marginTop: 8,
    color: '#10213A',
    fontSize: 28,
    fontWeight: '900'
  },
  resultSub: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  }
});
