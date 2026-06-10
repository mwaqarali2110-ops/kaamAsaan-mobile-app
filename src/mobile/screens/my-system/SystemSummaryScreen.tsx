import React, { useMemo } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, CalendarDays, ChevronRight, DollarSign, Download, Home, Info, ShieldCheck, Sun, TrendingUp, Zap } from 'lucide-react-native';
import { useSystemStore } from '@/store/useSystemStore';
import { calculatePanelCount, calculateRoofSpace } from '@/utils/calculations';

const panelImage = require('../../../assets/home/solar-panels.jpg');
const inverterImage = require('../../../assets/home/inverter.jpg');
const batteryImage = require('../../../assets/home/battery.webp');

const formatPkr = (value: number) => `PKR ${value.toLocaleString('en-PK')}`;

const components = [
  {
    label: 'Solar Panels',
    name: '5 x JA 610W',
    price: 126000,
    image: panelImage,
    tint: '#FFF7E8'
  },
  {
    label: 'Inverter',
    name: 'Fox 4 kW Inverter',
    price: 265000,
    image: inverterImage,
    tint: '#EFF6FF'
  },
  {
    label: 'Battery Backup',
    name: 'FOX 6 kWh Battery Bank',
    price: 430000,
    image: batteryImage,
    tint: '#F0FDF4'
  },
  {
    label: 'Structure & Installation',
    name: 'Included',
    price: 111000,
    tint: '#FFF7ED'
  }
];

export const SystemSummaryScreen = ({ navigation }: any) => {
  const recommendedSolarKw = useSystemStore((state) => state.recommendedSolarKw);
  const panelWattage = useSystemStore((state) => state.panelWattage);

  const { systemSize, roofArea } = useMemo(() => {
    const panelCount = calculatePanelCount(recommendedSolarKw, panelWattage);
    return {
      systemSize: recommendedSolarKw || 3,
      roofArea: calculateRoofSpace(panelCount).areaSqFt || 110
    };
  }, [recommendedSolarKw, panelWattage]);

  const financials = useMemo(() => [
    { label: 'Monthly Savings', value: 'PKR 16,875', Icon: DollarSign, tint: '#DCFCE7', color: '#059669' },
    { label: 'Payback Period', value: '4.6 yrs', Icon: Zap, tint: '#FFF3C4', color: '#F5A400' },
    { label: 'Annual Generation', value: '4,050 kWh', Icon: TrendingUp, tint: '#DBEAFE', color: '#3B82F6' },
    { label: 'Roof Area Needed', value: `~${Math.round(roofArea)} sq ft`, Icon: Home, tint: '#F3E8FF', color: '#A855F7' }
  ], [roofArea]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#10213A" size={22} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.title}>System Summary</Text>
          <Pressable style={styles.iconButton}>
            <Download color="#10213A" size={20} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>System Size</Text>
            <Text style={styles.systemSize}>{systemSize} kW</Text>
            <View style={styles.compatBadge}>
              <ShieldCheck color="#0F8F54" size={18} strokeWidth={2.2} />
              <Text style={styles.compatText}>100% Compatible</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumnRight}>
            <Text style={styles.summaryLabel}>Total Estimated Cost</Text>
            <Text style={styles.costValue}>PKR 932,000</Text>
            <Text style={styles.costSub}>Incl. tax & installation</Text>
            <View style={styles.watermark}>
              <Sun color="#F5D482" size={22} strokeWidth={1.8} />
              <Home color="#E8D9BE" size={48} strokeWidth={1.5} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>System Components</Text>

        <View style={styles.componentsCard}>
          {components.map((item, index) => (
            <Pressable key={item.label} style={[styles.componentRow, index === components.length - 1 && styles.componentRowLast]}>
              <View style={[styles.productImageBox, { backgroundColor: item.tint }]}>
                {item.image ? (
                  <Image source={item.image} style={styles.productImage} resizeMode="contain" />
                ) : (
                  <GridStructureIcon />
                )}
              </View>
              <View style={styles.componentCopy}>
                <Text style={styles.componentLabel}>{item.label}</Text>
                <Text style={styles.componentName}>{item.name}</Text>
              </View>
              <Text style={styles.componentPrice}>{formatPkr(item.price)}</Text>
              <ChevronRight color="#64748B" size={20} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>

        <View style={styles.infoLine}>
          <Info color="#64748B" size={18} strokeWidth={2.1} />
          <Text style={styles.infoText}>All components are perfectly matched for optimal performance.</Text>
        </View>

        <Text style={styles.sectionTitle}>Financial Overview</Text>

        <View style={styles.financialGrid}>
          {financials.map(({ label, value, Icon, tint, color }) => (
            <View key={label} style={styles.financialCard}>
              <View style={[styles.financialIcon, { backgroundColor: tint }]}>
                <Icon color={color} size={25} strokeWidth={2.2} />
              </View>
              <View style={styles.financialCopy}>
                <Text style={styles.financialLabel}>{label}</Text>
                <Text style={styles.financialValue}>{value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.compatibilityCard}>
          <View style={styles.compatibilityIcon}>
            <ShieldCheck color="#0F8F54" size={30} strokeWidth={2.2} />
          </View>
          <View style={styles.compatibilityCopy}>
            <Text style={styles.compatibilityTitle}>Your system is 100% compatible</Text>
            <Text style={styles.compatibilityText}>All components are verified and work perfectly together.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.bookButton} onPress={() => navigation.navigate('BookSurvey')}>
          <CalendarDays color="#FFFFFF" size={22} strokeWidth={2.3} />
          <Text style={styles.bookButtonText}>Book Free Survey</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const GridStructureIcon = () => (
  <View style={styles.structureIcon}>
    <View style={styles.structureTop} />
    <View style={styles.structureLegs}>
      <View style={styles.structureLeg} />
      <View style={styles.structureLeg} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF8F1'
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 122
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.72)',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  title: {
    flex: 1,
    color: '#10213A',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  summaryCard: {
    minHeight: 145,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.75)',
    flexDirection: 'row',
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  summaryColumn: {
    flex: 1,
    justifyContent: 'center'
  },
  summaryColumnRight: {
    flex: 1.18,
    justifyContent: 'center',
    paddingLeft: 17
  },
  summaryDivider: {
    width: 1,
    marginVertical: 14,
    backgroundColor: '#E7E2DA'
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800'
  },
  systemSize: {
    color: '#10213A',
    fontSize: 38,
    fontWeight: '900',
    marginTop: 7
  },
  compatBadge: {
    marginTop: 17,
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#EEF7EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  compatText: {
    color: '#0F8F54',
    fontSize: 12,
    fontWeight: '900'
  },
  costValue: {
    color: '#10213A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12
  },
  costSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6
  },
  watermark: {
    position: 'absolute',
    right: 2,
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    opacity: 0.6,
    gap: 4
  },
  sectionTitle: {
    color: '#10213A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 12
  },
  componentsCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.75)',
    paddingHorizontal: 14,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2
  },
  componentRow: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
    gap: 11
  },
  componentRowLast: {
    borderBottomWidth: 0
  },
  productImageBox: {
    width: 62,
    height: 62,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  productImage: {
    width: 58,
    height: 58
  },
  componentCopy: {
    flex: 1,
    minWidth: 0
  },
  componentLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800'
  },
  componentName: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 5
  },
  componentPrice: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '800'
  },
  structureIcon: {
    width: 43,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }]
  },
  structureTop: {
    width: 38,
    height: 20,
    borderWidth: 2,
    borderColor: '#7C8794',
    borderRadius: 2
  },
  structureLegs: {
    width: 34,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  structureLeg: {
    width: 2,
    height: 13,
    backgroundColor: '#7C8794'
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 17
  },
  infoText: {
    flex: 1,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  financialCard: {
    width: '48%',
    minHeight: 92,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2
  },
  financialIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  financialCopy: {
    flex: 1
  },
  financialLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  financialValue: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6
  },
  compatibilityCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D6EFD6',
    backgroundColor: '#F4FBF1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14
  },
  compatibilityIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  compatibilityCopy: {
    flex: 1
  },
  compatibilityTitle: {
    color: '#0F8F54',
    fontSize: 15,
    fontWeight: '900'
  },
  compatibilityText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 5
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: 'rgba(251,248,241,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.82)'
  },
  bookButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#071D35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#071D35',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 4
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900'
  }
});
