import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, BatteryCharging, Cable, Cpu, EvCharger, Grid2X2, Search } from 'lucide-react-native';
import { AppTopBar } from '@/components/ui/AppTopBar';
import type { ProductCategory } from '@/types/product.types';

type MarketplaceCategory = {
  id: ProductCategory;
  title: string;
  subtitle: string;
  icon: typeof Cpu;
  tint: string;
  tintSoft: string;
  routeCategory: ProductCategory;
};

type MarketplaceCategoryCardProps = {
  category: MarketplaceCategory;
  onPress: (category: ProductCategory) => void;
};

const marketplaceCategories: MarketplaceCategory[] = [
  {
    id: 'inverter',
    title: 'Inverter',
    subtitle: 'Hybrid and on-grid options',
    icon: Cpu,
    tint: '#F59A00',
    tintSoft: '#FFF3E0',
    routeCategory: 'inverter'
  },
  {
    id: 'panel',
    title: 'Solar Panel',
    subtitle: 'Efficient panels for maximum output',
    icon: Grid2X2,
    tint: '#128A3E',
    tintSoft: '#E6F5EA',
    routeCategory: 'panel'
  },
  {
    id: 'battery',
    title: 'Batteries',
    subtitle: 'Reliable energy storage solutions',
    icon: BatteryCharging,
    tint: '#2563EB',
    tintSoft: '#E7EEFD',
    routeCategory: 'battery'
  },
  {
    id: 'accessory',
    title: 'Solar Accessories',
    subtitle: 'Cables, connectors and more',
    icon: Cable,
    tint: '#B07800',
    tintSoft: '#FCF1DA',
    routeCategory: 'accessory'
  },
  {
    id: 'ev_charger',
    title: 'EV Chargers',
    subtitle: 'Home and commercial charging',
    icon: EvCharger,
    tint: '#0F766E',
    tintSoft: '#E1F4F2',
    routeCategory: 'ev_charger'
  }
];

const MarketplaceCategoryCard = ({ category, onPress }: MarketplaceCategoryCardProps) => {
  const Icon = category.icon;

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(category.routeCategory)}
      accessibilityLabel={category.title}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(245, 164, 0, 0.08)' }}
    >
      <View style={[styles.iconTile, { backgroundColor: category.tintSoft }]}>
        <Icon color={category.tint} size={22} strokeWidth={2.2} />
      </View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={styles.title}>
          {category.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {category.subtitle}
        </Text>
      </View>
      <ChevronRight color="#B0B8C1" size={20} strokeWidth={2.4} />
    </Pressable>
  );
};

export const ExploreMarketplaceScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return marketplaceCategories;
    return marketplaceCategories.filter(
      (category) => category.title.toLowerCase().includes(query) || category.subtitle.toLowerCase().includes(query)
    );
  }, [search]);

  const handleCategoryPress = (category: ProductCategory) => {
    navigation.navigate('MarketplaceFlow', { category });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <AppTopBar navigation={navigation} activeRoute="Marketplace" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Marketplace</Text>
        <Text style={styles.headerSubtitle}>Select a product category to get started</Text>
      </View>

      <View style={styles.searchBox}>
        <Search color="#94A0AC" size={18} strokeWidth={2.2} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search categories..."
          placeholderTextColor="#94A0AC"
          style={styles.searchInput}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredCategories.map((category) => (
          <MarketplaceCategoryCard key={category.id} category={category} onPress={handleCategoryPress} />
        ))}
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No categories match "{search}".</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF7EF'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#071B33',
    lineHeight: 24
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#737B86',
    marginTop: 3
  },
  searchBox: {
    marginHorizontal: 20,
    marginBottom: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0CE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#071B33'
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  card: {
    // Explicit row: icon tile, then a text column (title above subtitle),
    // then the chevron — all three side by side on one line. Do not remove
    // flexDirection here; a plain View/Pressable defaults to column on RN.
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 14,
    gap: 12,
    // White elevated card: no border, shadow does the separation from the
    // cream background instead.
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardCopy: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: '#071B33'
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: '#68717C',
    marginTop: 2
  },
  emptyState: {
    paddingTop: 30,
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#737B86'
  }
});
