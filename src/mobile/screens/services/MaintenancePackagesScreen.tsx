import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check, MessageCircle, Star } from 'lucide-react-native';

type PackageId = 'basic' | 'smart' | 'complete';

const packages: Array<{
  id: PackageId;
  title: string;
  price: string;
  recommended?: boolean;
  features: string[];
}> = [
  {
    id: 'basic',
    title: 'Basic Care',
    price: '2,500',
    features: ['Panel cleaning', 'Visual panel inspection', 'Generation check', 'Basic health report']
  },
  {
    id: 'smart',
    title: 'Smart Care',
    price: '5,500',
    recommended: true,
    features: ['Thermal panel inspection', 'DC wiring tightening', 'MC4 connector check', 'Earthing verification', 'Inverter diagnostics', 'Detailed health report']
  },
  {
    id: 'complete',
    title: 'Complete Solar Care',
    price: '9,900',
    features: ['Everything in Smart Care', 'Battery full inspection', 'Performance optimization', 'Full preventive report', 'Priority support (7 days)', 'Follow-up check call']
  }
];

const trustItems = ['Certified Technicians', 'PKR Fixed Price', '30-Day Guarantee'];

export const MaintenancePackagesScreen = ({ navigation }: any) => {
  const [selected, setSelected] = useState<PackageId>('smart');

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#111827" size={19} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.topTitle}>Maintenance Packages</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Select a package based on your system's needs. All visits include a certified KaamAsaan technician.</Text>

        <View style={styles.cards}>
          {packages.map((pkg) => {
            const isSelected = selected === pkg.id;
            return (
              <Pressable key={pkg.id} style={[styles.packageCard, isSelected && styles.packageCardSelected]} onPress={() => setSelected(pkg.id)}>
                {pkg.recommended ? (
                  <View style={styles.recommendedBadge}>
                    <Star color="#9B6900" size={10} fill="#9B6900" />
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                ) : null}

                <View style={styles.packageHeader}>
                  <View>
                    <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>{pkg.title}</Text>
                    <Text style={styles.visitText}>Per visit</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.currency}>PKR</Text>
                    <Text style={styles.price}>{pkg.price}</Text>
                  </View>
                </View>

                <View style={styles.features}>
                  {pkg.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Check color={pkg.id === 'complete' ? '#16A34A' : '#4A6F9B'} size={12} strokeWidth={2.5} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.selectButton, isSelected && styles.selectButtonActive]}>
                  <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>{isSelected ? 'Selected' : 'Tap to select'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.trustRow}>
          {trustItems.map((item) => (
            <View key={item} style={styles.trustItem}>
              <View style={styles.trustDot} />
              <Text style={styles.trustText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.chatButton} accessibilityLabel="WhatsApp help">
        <MessageCircle color="#FFFFFF" size={19} strokeWidth={2.2} />
      </Pressable>

      <View style={styles.footer}>
        <Pressable style={styles.proceedButton} onPress={() => navigation.navigate('BookSurvey')}>
          <Text style={styles.proceedText}>Proceed to Booking</Text>
          <ArrowRight color="#111827" size={18} strokeWidth={2.5} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#FBF7EF' },
  topBar: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,211,203,0.65)'
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topTitle: { flex: 1, textAlign: 'center', color: '#172031', fontSize: 15, fontWeight: '900' },
  topSpacer: { width: 36 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 124 },
  intro: { color: '#334155', fontSize: 11.4, lineHeight: 17, fontWeight: '600', marginBottom: 10 },
  cards: { gap: 8 },
  packageCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(218,211,203,0.9)',
    padding: 10,
    shadowColor: '#8B6F2D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2
  },
  packageCardSelected: { borderColor: '#F5B700', borderWidth: 1.6, backgroundColor: '#FFFDF7' },
  recommendedBadge: {
    position: 'absolute',
    right: 12,
    top: -1,
    height: 20,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: '#FFE08A',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  recommendedText: { color: '#9B6900', fontSize: 9, fontWeight: '900' },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  packageTitle: { color: '#111827', fontSize: 13.2, fontWeight: '900' },
  packageTitleSelected: { color: '#D99A00' },
  visitText: { marginTop: 2, color: '#334155', fontSize: 9.2, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  currency: { marginTop: 6, color: '#172031', fontSize: 9, fontWeight: '900' },
  price: { color: '#111827', fontSize: 21, lineHeight: 25, fontWeight: '900', letterSpacing: -0.5 },
  features: { marginTop: 8, gap: 5 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText: { color: '#334155', fontSize: 10.3, fontWeight: '700' },
  selectButton: {
    height: 26,
    borderRadius: 7,
    marginTop: 9,
    backgroundColor: '#FFF6E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectButtonActive: { backgroundColor: '#F5B700' },
  selectButtonText: { color: '#7A5200', fontSize: 11, fontWeight: '900' },
  selectButtonTextActive: { color: '#111827' },
  trustRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#16A34A' },
  trustText: { color: '#172031', fontSize: 9.5, fontWeight: '800' },
  chatButton: {
    position: 'absolute',
    right: 18,
    bottom: 70,
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
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FBF7EF'
  },
  proceedButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: '#F5A400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C87500',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3
  },
  proceedText: { color: '#111827', fontSize: 14, fontWeight: '900' }
});
