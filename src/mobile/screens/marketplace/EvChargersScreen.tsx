import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, EvCharger, PlugZap, Search, ShieldCheck, SlidersHorizontal, Wifi } from 'lucide-react-native';
import { ProductCard } from '@/components/cards/ProductCard';
import { connectorTypeLabels } from '@/services/marketplace.api';
import type { Product } from '@/types/product.types';

const NAVY = '#0F2744';
const GOLD = '#FDBB0A';
const CREAM = '#FBF7EC';

const stockInfo = (status?: string | null) => {
  const value = (status ?? '').toLowerCase().replace(/[\s-]+/g, '_').trim();
  if (value === 'out_of_stock') return { label: 'Out of Stock', kind: 'out' as const };
  if (value === 'on_request' || value === 'booking_open' || value === 'eta' || value === 'preorder') return { label: 'On Request', kind: 'request' as const };
  return { label: 'In Stock', kind: 'in' as const };
};

type QueryShape = { data?: Product[]; isLoading: boolean; isError: boolean; isRefetching: boolean; refetch: () => unknown };

function ProductSkeleton() {
  return <View className="flex-row rounded-3xl border border-kaam-line bg-white p-3 shadow-sm"><View className="h-28 w-28 rounded-2xl bg-kaam-surface" /><View className="ml-3 flex-1"><View className="mt-1 h-3 w-1/3 rounded-md bg-kaam-surface" /><View className="mt-3 h-5 w-11/12 rounded-md bg-kaam-surface" /><View className="mt-3 h-3 w-3/4 rounded-md bg-kaam-surface" /><View className="mt-3 h-3 w-1/2 rounded-md bg-kaam-surface" /></View></View>;
}

export function EvChargersScreen({ navigation, query, onSelectProduct }: { navigation: any; query: QueryShape; onSelectProduct: (product: Product) => void }) {
  const insets = useSafeAreaInsets();
  const [chargerType, setChargerType] = useState<'all' | 'ac' | 'dc'>('all');
  const [power, setPower] = useState<string>('all');
  const [connector, setConnector] = useState<string>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stockOnly, setStockOnly] = useState(false);

  // Filter option lists are derived from the active catalog rather than
  // hardcoded, so a new power rating or connector added in Admin shows up
  // here automatically without an app update.
  const powerOptions = useMemo(() => {
    const values = new Set<number>();
    (query.data ?? []).forEach((product) => { if (product.chargerPowerKw) values.add(Number(product.chargerPowerKw)); });
    return [...values].sort((a, b) => a - b);
  }, [query.data]);
  const connectorOptions = useMemo(() => {
    const values = new Set<string>();
    (query.data ?? []).forEach((product) => { if (product.connectorType) values.add(product.connectorType); });
    return [...values];
  }, [query.data]);

  const products = useMemo(() => [...(query.data ?? [])].filter((product) => {
    const matchesType = chargerType === 'all' || product.chargerType === chargerType;
    const matchesPower = power === 'all' || Number(product.chargerPowerKw) === Number(power);
    const matchesConnector = connector === 'all' || product.connectorType === connector;
    const matchesSearch = `${product.name} ${product.brand} ${product.shortSpec ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesType && matchesPower && matchesConnector && matchesSearch && (!stockOnly || stockInfo(product.stockStatus).kind === 'in');
  }).sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(a.priority ?? 0) - Number(b.priority ?? 0) || String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))), [chargerType, connector, power, query.data, search, stockOnly]);

  // EV chargers are order/quote-only in this release — every card action
  // routes straight to the product's order flow, same as accessories.
  const handleOrder = (product: Product) => {
    if (stockInfo(product.stockStatus).kind === 'out') return;
    onSelectProduct(product);
  };

  const header = <>
    <View style={styles.header}><Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back"><ArrowLeft color={NAVY} size={24} /></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>EV Chargers</Text><Text style={styles.headerSubtitle}>Home & commercial charging</Text></View><Pressable style={styles.headerIcon} onPress={() => setSearchOpen((value) => !value)} accessibilityLabel="Search EV chargers"><Search color={NAVY} size={24} /></Pressable><Pressable style={styles.headerIcon} onPress={() => setStockOnly((value) => !value)} accessibilityLabel="Filter in-stock EV chargers"><SlidersHorizontal color={stockOnly ? '#C27A00' : NAVY} size={24} /></Pressable></View>
    {searchOpen ? <View style={styles.searchBox}><Search color="#87909D" size={18} /><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search EV chargers" placeholderTextColor="#8B93A1" style={styles.searchInput} /></View> : null}
    <View style={styles.hero}><View style={styles.heroIcon}><EvCharger color={NAVY} size={36} /></View><View style={styles.heroContent}><Text style={styles.heroTitle}>EV Chargers</Text><Text style={styles.heroSubtitle}>AC & DC charging for home, office and commercial parking</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.benefits}><View style={styles.benefit}><PlugZap color={NAVY} size={16} /><Text style={styles.benefitText}>AC & DC</Text></View><View style={styles.benefit}><Wifi color={NAVY} size={16} /><Text style={styles.benefitText}>OCPP Ready</Text></View><View style={styles.benefit}><ShieldCheck color={NAVY} size={16} /><Text style={styles.benefitText}>Certified</Text></View></ScrollView></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
      <Pressable style={[styles.category, chargerType === 'all' && styles.categorySelected]} onPress={() => setChargerType('all')}><Text style={[styles.categoryText, chargerType === 'all' && styles.categoryTextSelected]}>All</Text></Pressable>
      <Pressable style={[styles.category, chargerType === 'ac' && styles.categorySelected]} onPress={() => setChargerType('ac')}><Text style={[styles.categoryText, chargerType === 'ac' && styles.categoryTextSelected]}>AC Chargers</Text></Pressable>
      <Pressable style={[styles.category, chargerType === 'dc' && styles.categorySelected]} onPress={() => setChargerType('dc')}><Text style={[styles.categoryText, chargerType === 'dc' && styles.categoryTextSelected]}>DC Fast Chargers</Text></Pressable>
    </ScrollView>
    {powerOptions.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        <Pressable style={[styles.category, power === 'all' && styles.categorySelected]} onPress={() => setPower('all')}><Text style={[styles.categoryText, power === 'all' && styles.categoryTextSelected]}>All Power</Text></Pressable>
        {powerOptions.map((value) => <Pressable key={value} style={[styles.category, power === String(value) && styles.categorySelected]} onPress={() => setPower(String(value))}><Text style={[styles.categoryText, power === String(value) && styles.categoryTextSelected]}>{value}kW</Text></Pressable>)}
      </ScrollView>
    ) : null}
    {connectorOptions.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        <Pressable style={[styles.category, connector === 'all' && styles.categorySelected]} onPress={() => setConnector('all')}><Text style={[styles.categoryText, connector === 'all' && styles.categoryTextSelected]}>All Connectors</Text></Pressable>
        {connectorOptions.map((value) => <Pressable key={value} style={[styles.category, connector === value && styles.categorySelected]} onPress={() => setConnector(value)}><Text style={[styles.categoryText, connector === value && styles.categoryTextSelected]}>{connectorTypeLabels[value] ?? value}</Text></Pressable>)}
      </ScrollView>
    ) : null}
  </>;

  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
    <FlatList data={query.isLoading ? [] : products} keyExtractor={(item) => item.id} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]} ListHeaderComponent={header} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} renderItem={({ item }) => <ProductCard product={item} variant="accessory" onPress={() => onSelectProduct(item)} onAdd={() => handleOrder(item)} />} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={GOLD} />}
      ListEmptyComponent={query.isLoading ? <View style={styles.skeletonList}><ProductSkeleton /><ProductSkeleton /><ProductSkeleton /></View> : query.isError ? <View style={styles.stateBox}><Text style={styles.stateTitle}>EV chargers could not be loaded.</Text><Text style={styles.stateText}>Please check your connection and try again.</Text><Pressable style={styles.retry} onPress={() => void query.refetch()}><Text style={styles.retryText}>Retry</Text></Pressable></View> : <View style={styles.stateBox}><Text style={styles.stateTitle}>No EV chargers are available yet.</Text><Text style={styles.stateText}>Try another filter or check back soon.</Text></View>}
      ListFooterComponent={!query.isLoading && !query.isError && products.length ? <View style={styles.trust}><ShieldCheck color={GOLD} size={20} /><Text style={styles.trustText}>Certified chargers  •  Professional installation  •  Warranty backed</Text></View> : null} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM }, content: { paddingHorizontal: 14, paddingTop: 6 }, header: { height: 66, flexDirection: 'row', alignItems: 'center', gap: 10 }, backButton: { width: 46, height: 46, borderRadius: 18, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#6A5738', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .1, shadowRadius: 10, elevation: 3 }, headerCopy: { flex: 1, minWidth: 0 }, headerTitle: { fontSize: 20, fontWeight: '900', color: NAVY }, headerSubtitle: { fontSize: 13, fontWeight: '600', color: '#667085', marginTop: 2 }, headerIcon: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center' }, searchBox: { height: 44, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E7DCC8', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8, marginBottom: 10 }, searchInput: { flex: 1, fontSize: 13, color: NAVY, fontWeight: '600' }, hero: { minHeight: 138, borderRadius: 24, backgroundColor: GOLD, padding: 14, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, heroIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,245,205,.72)', alignItems: 'center', justifyContent: 'center' }, heroContent: { flex: 1, minWidth: 0, paddingLeft: 14 }, heroTitle: { fontSize: 26, fontWeight: '900', color: NAVY }, heroSubtitle: { fontSize: 13, fontWeight: '600', color: NAVY, marginTop: 3 }, benefits: { gap: 7, paddingTop: 11, paddingRight: 20 }, benefit: { height: 29, borderRadius: 15, backgroundColor: 'rgba(255,250,225,.82)', paddingHorizontal: 8, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }, benefitText: { color: NAVY, fontSize: 10, fontWeight: '800' }, categories: { gap: 10, paddingVertical: 12, paddingRight: 12 }, category: { height: 42, borderRadius: 21, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFE7D9', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#6A5738', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .04, shadowRadius: 7, elevation: 1 }, categorySelected: { backgroundColor: NAVY, borderColor: NAVY }, categoryText: { color: NAVY, fontSize: 13, fontWeight: '700' }, categoryTextSelected: { color: '#FFF' }, stateBox: { borderRadius: 20, backgroundColor: '#FFF', padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#EEE4D3' }, stateTitle: { color: NAVY, fontSize: 15, fontWeight: '900', textAlign: 'center' }, stateText: { color: '#667085', fontSize: 12, textAlign: 'center', marginTop: 6 }, retry: { marginTop: 14, borderRadius: 12, backgroundColor: GOLD, paddingHorizontal: 22, paddingVertical: 10 }, retryText: { color: NAVY, fontWeight: '900' }, skeletonList: { gap: 13 }, trust: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, trustText: { fontSize: 12, color: '#667085', fontWeight: '600' }
});
