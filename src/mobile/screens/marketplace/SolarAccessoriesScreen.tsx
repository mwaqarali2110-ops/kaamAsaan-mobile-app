import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, ShieldCheck, SlidersHorizontal, SunMedium, Wind, Wrench } from 'lucide-react-native';
import { ProductCard } from '@/components/cards/ProductCard';
import type { Product } from '@/types/product.types';

const NAVY = '#0F2744';
const GOLD = '#FDBB0A';
const CREAM = '#FBF7EC';
const categoryOptions = [
  ['all', 'All'], ['cleaning_brushes', 'Cleaning Brushes'], ['cleaning_shampoo', 'Cleaning Shampoo'],
  ['cleaning_kits', 'Cleaning Kits'], ['wipers', 'Wipers'], ['installation_tools', 'Installation Tools'],
  ['safety_equipment', 'Safety Equipment'],
] as const;
const normalize = (value?: string | null) => (value ?? '').toLowerCase().replace(/[\s-]+/g, '_').trim();
const stockInfo = (status?: string | null) => {
  const value = normalize(status);
  if (value === 'out_of_stock') return { label: 'Out of Stock', kind: 'out' as const };
  if (value === 'on_request' || value === 'booking_open' || value === 'eta' || value === 'preorder') return { label: 'On Request', kind: 'request' as const };
  return { label: 'In Stock', kind: 'in' as const };
};

type QueryShape = { data?: Product[]; isLoading: boolean; isError: boolean; isRefetching: boolean; refetch: () => unknown };

function ProductSkeleton() {
  return <View className="flex-row rounded-3xl border border-kaam-line bg-white p-3 shadow-sm"><View className="h-28 w-28 rounded-2xl bg-kaam-surface" /><View className="ml-3 flex-1"><View className="mt-1 h-3 w-1/3 rounded-md bg-kaam-surface" /><View className="mt-3 h-5 w-11/12 rounded-md bg-kaam-surface" /><View className="mt-3 h-3 w-3/4 rounded-md bg-kaam-surface" /><View className="mt-3 h-3 w-1/2 rounded-md bg-kaam-surface" /></View></View>;
}

export function SolarAccessoriesScreen({ navigation, query, onSelectProduct }: { navigation: any; query: QueryShape; onSelectProduct: (product: Product) => void }) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const products = useMemo(() => [...(query.data ?? [])].filter((product) => {
    const matchesCategory = selectedCategory === 'all' || normalize(product.accessorySubcategory ?? product.subCategory) === selectedCategory;
    const matchesSearch = `${product.name} ${product.brand} ${product.shortSpec ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch && (!stockOnly || stockInfo(product.stockStatus).kind === 'in');
  }).sort((a,b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(a.priority ?? 0) - Number(b.priority ?? 0) || String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))), [query.data, search, selectedCategory, stockOnly]);

  // Accessories are order-only: every action routes to the product's order flow.
  const handleOrder = (product: Product) => {
    if (stockInfo(product.stockStatus).kind === 'out') return;
    onSelectProduct(product);
  };

  const header = <>
    <View style={styles.header}><Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back"><ArrowLeft color={NAVY} size={24} /></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>Solar Accessories</Text><Text style={styles.headerSubtitle}>Mounting & installation products</Text></View><Pressable style={styles.headerIcon} onPress={() => setSearchOpen((value) => !value)} accessibilityLabel="Search accessories"><Search color={NAVY} size={24} /></Pressable><Pressable style={styles.headerIcon} onPress={() => setStockOnly((value) => !value)} accessibilityLabel="Filter in-stock accessories"><SlidersHorizontal color={stockOnly ? '#C27A00' : NAVY} size={24} /></Pressable></View>
    {searchOpen ? <View style={styles.searchBox}><Search color="#87909D" size={18} /><TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search solar accessories" placeholderTextColor="#8B93A1" style={styles.searchInput} /></View> : null}
    <View style={styles.hero}><View style={styles.heroIcon}><SunMedium color={NAVY} size={36} /><View style={styles.heroPanel}><View /><View /><View /><View /></View></View><View style={styles.heroContent}><Text style={styles.heroTitle}>Solar Accessories</Text><Text style={styles.heroSubtitle}>Cleaning, maintenance & installation essentials</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.benefits}><View style={styles.benefit}><ShieldCheck color={NAVY} size={16} /><Text style={styles.benefitText}>Durable</Text></View><View style={styles.benefit}><Wind color={NAVY} size={16} /><Text style={styles.benefitText}>Weather Resistant</Text></View><View style={styles.benefit}><Wrench color={NAVY} size={16} /><Text style={styles.benefitText}>Installation Ready</Text></View></ScrollView></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{categoryOptions.map(([value,label]) => <Pressable key={value} style={[styles.category, selectedCategory === value && styles.categorySelected]} onPress={() => setSelectedCategory(value)}><Text style={[styles.categoryText, selectedCategory === value && styles.categoryTextSelected]}>{label}</Text></Pressable>)}</ScrollView>
  </>;

  return <SafeAreaView style={styles.screen} edges={['top','left','right']}>
    <FlatList data={query.isLoading ? [] : products} keyExtractor={(item) => item.id} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]} ListHeaderComponent={header} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} renderItem={({ item }) => <ProductCard product={item} variant="accessory" onPress={() => onSelectProduct(item)} onAdd={() => handleOrder(item)} />} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={GOLD} />}
      ListEmptyComponent={query.isLoading ? <View style={styles.skeletonList}><ProductSkeleton /><ProductSkeleton /><ProductSkeleton /></View> : query.isError ? <View style={styles.stateBox}><Text style={styles.stateTitle}>Accessories could not be loaded.</Text><Text style={styles.stateText}>Please check your connection and try again.</Text><Pressable style={styles.retry} onPress={() => void query.refetch()}><Text style={styles.retryText}>Retry</Text></Pressable></View> : <View style={styles.stateBox}><Text style={styles.stateTitle}>No products are available in this category yet.</Text><Text style={styles.stateText}>Try another category or clear the in-stock filter.</Text></View>}
      ListFooterComponent={!query.isLoading && !query.isError && products.length ? <View style={styles.trust}><ShieldCheck color={GOLD} size={20} /><Text style={styles.trustText}>Trusted quality  •  Fast delivery  •  Easy returns</Text></View> : null} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:CREAM},content:{paddingHorizontal:14,paddingTop:6},header:{height:66,flexDirection:'row',alignItems:'center',gap:10},backButton:{width:46,height:46,borderRadius:18,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',shadowColor:'#6A5738',shadowOffset:{width:0,height:4},shadowOpacity:.1,shadowRadius:10,elevation:3},headerCopy:{flex:1,minWidth:0},headerTitle:{fontSize:20,fontWeight:'900',color:NAVY},headerSubtitle:{fontSize:12.5,fontWeight:'600',color:'#667085',marginTop:2},headerIcon:{width:34,height:42,alignItems:'center',justifyContent:'center'},cartBadge:{position:'absolute',right:-2,top:5,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:'#D92D20',alignItems:'center',justifyContent:'center'},cartBadgeText:{color:'#FFF',fontSize:9,fontWeight:'900'},searchBox:{height:44,borderRadius:14,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E7DCC8',flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:8,marginBottom:10},searchInput:{flex:1,fontSize:13,color:NAVY,fontWeight:'600'},hero:{minHeight:138,borderRadius:24,backgroundColor:GOLD,padding:14,flexDirection:'row',alignItems:'center',overflow:'hidden'},heroIcon:{width:88,height:88,borderRadius:44,backgroundColor:'rgba(255,245,205,.72)',alignItems:'center',justifyContent:'center'},heroPanel:{width:40,height:25,marginTop:-5,flexDirection:'row',flexWrap:'wrap',padding:2,borderWidth:2,borderColor:NAVY,transform:[{skewX:'-8deg'}]},heroContent:{flex:1,minWidth:0,paddingLeft:14},heroTitle:{fontSize:25,fontWeight:'900',color:NAVY},heroSubtitle:{fontSize:13,fontWeight:'600',color:NAVY,marginTop:3},benefits:{gap:7,paddingTop:11,paddingRight:20},benefit:{height:29,borderRadius:15,backgroundColor:'rgba(255,250,225,.82)',paddingHorizontal:8,flexShrink:0,flexDirection:'row',alignItems:'center',gap:4},benefitText:{color:NAVY,fontSize:10,fontWeight:'800'},categories:{gap:10,paddingVertical:15,paddingRight:12},category:{height:42,borderRadius:21,backgroundColor:'#FFF',borderWidth:1,borderColor:'#EFE7D9',paddingHorizontal:18,alignItems:'center',justifyContent:'center',shadowColor:'#6A5738',shadowOffset:{width:0,height:3},shadowOpacity:.04,shadowRadius:7,elevation:1},categorySelected:{backgroundColor:NAVY,borderColor:NAVY},categoryText:{color:NAVY,fontSize:13,fontWeight:'700'},categoryTextSelected:{color:'#FFF'},stateBox:{borderRadius:20,backgroundColor:'#FFF',padding:24,alignItems:'center',borderWidth:1,borderColor:'#EEE4D3'},stateTitle:{color:NAVY,fontSize:15,fontWeight:'900',textAlign:'center'},stateText:{color:'#667085',fontSize:12,textAlign:'center',marginTop:6},retry:{marginTop:14,borderRadius:12,backgroundColor:GOLD,paddingHorizontal:22,paddingVertical:10},retryText:{color:NAVY,fontWeight:'900'},skeletonList:{gap:13},trust:{minHeight:60,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},trustText:{fontSize:11.5,color:'#667085',fontWeight:'600'},toast:{position:'absolute',top:78,alignSelf:'center',zIndex:50,elevation:8,backgroundColor:'#FFF',borderWidth:1,borderColor:'#B7E4C0',borderRadius:16,paddingHorizontal:14,height:40,flexDirection:'row',alignItems:'center',gap:7,shadowColor:'#000',shadowOpacity:.13,shadowRadius:10},toastText:{color:'#166534',fontSize:11.5,fontWeight:'800'}
});
