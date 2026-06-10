import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, BatteryCharging, Bolt, CheckCircle2, ChevronRight, Home, Search, ShieldCheck, SlidersHorizontal, Sun, User, Zap } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { AppButton } from '@/components/ui/AppButton';
import { InfoCard } from '@/components/cards/InfoCard';
import { ProductCard } from '@/components/cards/ProductCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { useBrands, useProducts } from '@/hooks/useProducts';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import { useSystemStore } from '@/store/useSystemStore';
import type { Product, ProductCategory } from '@/types/product.types';
import { colors } from '@/constants/colors';

const categoryTitle = {
  inverter: 'Inverter',
  panel: 'Solar Panel',
  battery: 'Batteries',
  accessory: 'Solar Accessories'
};

const inverterBrandLogos = {
  fox: require('../../../assets/home/brand-fox-ess.png'),
  solis: require('../../../assets/home/brand-solis.png')
};

const solarBrandLogos = {
  longi: require('../../../assets/home/brand-longi.png'),
  jinko: require('../../../assets/home/brand-jinko.png'),
  canadian: require('../../../assets/home/brand-canadian-solar.png')
};

const batteryBrandLogos = {
  fox: require('../../../assets/home/brand-fox-ess.png'),
  dyness: require('../../../assets/home/brand-dyness.png'),
  soluna: require('../../../assets/home/brand-soluna.png'),
  pylontech: require('../../../assets/home/pylontech.jpg')
};

const inverterBrands = [
  {
    name: 'Fox ESS',
    productBrand: 'FOX',
    category: 'Hybrid',
    badge: 'HYBRID',
    title: 'Advanced Hybrid Technology',
    description: 'Reliable hybrid energy systems',
    models: 12,
    initials: 'FX',
    logo: inverterBrandLogos.fox
  },
  {
    name: 'Sungrow',
    productBrand: 'Sungrow',
    category: 'Premium',
    badge: 'PREMIUM',
    title: 'Premium Smart Energy',
    description: 'AI-powered solar inverter solutions',
    models: 9,
    initials: 'SG'
  },
  {
    name: 'GoodWe',
    productBrand: 'GoodWe',
    category: 'Hybrid',
    badge: 'HYBRID',
    title: 'Global Energy Solutions',
    description: 'Smart efficient inverter systems',
    models: 10,
    initials: 'GW'
  },
  {
    name: 'Solis',
    productBrand: 'Solis',
    category: 'On-Grid',
    badge: 'ON-GRID',
    title: 'Tier-1 Inverter Manufacturer',
    description: 'Trusted high-performance inverters',
    models: 9,
    initials: 'SL',
    logo: inverterBrandLogos.solis
  },
  {
    name: 'Huawei',
    productBrand: 'Huawei',
    category: 'Premium',
    badge: 'PREMIUM',
    title: 'Smart Energy Ecosystem',
    description: 'AI-managed power conversion systems',
    models: 7,
    initials: 'HW'
  }
];

const solarPanelBrands = [
  {
    name: 'Longi',
    productBrand: 'Longi',
    category: 'Tier-1',
    badge: 'TIER-1',
    title: 'China · Tier-1 Manufacturer',
    description: 'Premium efficiency panels',
    models: 12,
    initials: 'LG',
    logo: solarBrandLogos.longi
  },
  {
    name: 'JA Solar',
    productBrand: 'JA Solar',
    category: 'Popular',
    badge: 'POPULAR',
    title: 'Global Trusted Brand',
    description: 'Reliable balanced performance',
    models: 9,
    initials: 'JA'
  },
  {
    name: 'Astro',
    productBrand: 'Astro',
    category: 'Budget',
    badge: 'BUDGET',
    title: 'Affordable Practical Option',
    description: 'Value-focused installations',
    models: 6,
    initials: 'A'
  },
  {
    name: 'Jinko Solar',
    productBrand: 'Jinko Solar',
    category: 'Tier-1',
    badge: 'TIER-1',
    title: 'Tier-1 Global Manufacturer',
    description: 'High reliability and performance',
    models: 11,
    initials: 'JK',
    logo: solarBrandLogos.jinko
  },
  {
    name: 'AIKO',
    productBrand: 'AIKO',
    category: 'Premium',
    badge: 'PREMIUM',
    title: 'Advanced Solar Technology',
    description: 'Premium high-performance panels',
    models: 7,
    initials: 'A'
  }
];

const batteryBrands = [
  {
    name: 'Fox ESS',
    productBrand: 'FOX',
    category: 'Budget',
    badge: 'BUDGET',
    title: 'Hybrid Backup Technology',
    description: 'Premium backup energy systems',
    models: 9,
    initials: 'FX',
    logo: batteryBrandLogos.fox
  },
  {
    name: 'Dyness',
    productBrand: 'Dyness',
    category: 'Lithium',
    badge: 'LITHIUM',
    title: 'Advanced Lithium Storage',
    description: 'Reliable long backup solutions',
    models: 8,
    initials: 'DY',
    logo: batteryBrandLogos.dyness
  },
  {
    name: 'Soluna',
    productBrand: 'Soluna',
    category: 'Premium',
    badge: 'PREMIUM',
    title: 'Premium Energy Storage',
    description: 'High-performance lithium batteries',
    models: 7,
    initials: 'SN',
    logo: batteryBrandLogos.soluna
  },
  {
    name: 'PylonTech',
    productBrand: 'Pylontech',
    category: 'Lithium',
    badge: 'LITHIUM',
    title: 'Tier-1 Battery Manufacturer',
    description: 'Trusted energy storage systems',
    models: 6,
    initials: 'PT',
    logo: batteryBrandLogos.pylontech
  },
  {
    name: 'Huawei',
    productBrand: 'Huawei',
    category: 'Premium',
    badge: 'PREMIUM',
    title: 'Smart Battery Ecosystem',
    description: 'AI-managed home energy backup',
    models: 5,
    initials: 'H'
  },
  {
    name: 'GoodWe',
    productBrand: 'GoodWe',
    category: 'Lithium',
    badge: 'LITHIUM',
    title: 'Integrated Battery Solutions',
    description: 'Intelligent backup for hybrid systems',
    models: 5,
    initials: 'GW'
  }
];

type BrandCardItem = {
  name: string;
  productBrand: string;
  category: string;
  badge: string;
  title: string;
  description: string;
  initials: string;
  logo?: number | { uri: string };
};

const normalizeBrand = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const brandsMatch = (left: string, right: string) => {
  const normalizedLeft = normalizeBrand(left);
  const normalizedRight = normalizeBrand(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
};

const mergeLiveBrands = (liveBrands: { name: string; logoUrl?: string }[], presets: BrandCardItem[]) => liveBrands.map((brand) => {
  const key = normalizeBrand(brand.name);
  const preset = presets.find((item) => normalizeBrand(item.name) === key || normalizeBrand(item.productBrand) === key);
  return {
    name: brand.name,
    productBrand: brand.name,
    category: preset?.category ?? 'Premium',
    badge: preset?.badge ?? 'VERIFIED',
    title: preset?.title ?? 'KaamAsaan Verified Brand',
    description: preset?.description ?? 'Approved marketplace products',
    initials: preset?.initials ?? brand.name.slice(0, 2).toUpperCase(),
    logo: brand.logoUrl ? { uri: brand.logoUrl } : preset?.logo
  };
});

const QueryFeedback = ({ message }: { message: string }) => (
  <View className="rounded-2xl border border-kaam-line bg-white p-4">
    <Text className="text-center text-sm font-bold text-kaam-muted">{message}</Text>
  </View>
);

const getErrorMessage = (error: unknown) => {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return String(error);
};

const modelSubtitleByCategory: Record<ProductCategory, string> = {
  inverter: 'Premium inverter models',
  panel: 'Premium solar panel models',
  battery: 'Premium battery models',
  accessory: 'Mounting & installation products'
};

const getBrandLabel = (category: ProductCategory, productBrand: string | null) => {
  if (!productBrand) return categoryTitle[category];
  const source = category === 'inverter' ? inverterBrands : category === 'panel' ? solarPanelBrands : category === 'battery' ? batteryBrands : [];
  return source.find((item) => item.productBrand === productBrand)?.name ?? productBrand;
};

const getListingHero = (category: ProductCategory, brandLabel: string, productBrand: string | null) => {
  if (category === 'panel') {
    return {
      type: 'panel' as const,
      heading: 'Higher Efficiency.',
      accent: 'Maximum Savings.',
      subtitle: `${brandLabel} solar panels designed for long-term performance.`,
      badges: ['Tier-1 Cells', 'High Efficiency', '30 Year Performance']
    };
  }

  if (category === 'battery') {
    return {
      type: 'battery' as const,
      heading: productBrand === 'Pylontech' ? 'Reliable Storage.' : 'Premium Energy.',
      accent: productBrand === 'Pylontech' ? 'Long Backup.' : 'Reliable Tomorrow.',
      subtitle: `${brandLabel} batteries for smarter, stronger home backup.`,
      badges: ['Premium Quality', 'Long Cycle Life', 'Easy Installation'],
      warranty: '10 Years Warranty'
    };
  }

  const inverterCopy: Record<string, { heading: string; accent: string; subtitle: string }> = {
    FOX: {
      heading: 'Smarter Energy.',
      accent: 'Better Control.',
      subtitle: 'Advanced inverter technology for efficient solar performance.'
    },
    GoodWe: {
      heading: 'Reliable Hybrid',
      accent: 'Energy Solutions.',
      subtitle: 'Efficient hybrid systems for dependable home solar power.'
    },
    Solis: {
      heading: 'Trusted Performance',
      accent: 'for Every Home.',
      subtitle: 'Proven inverter performance for residential solar systems.'
    }
  };
  const copy = inverterCopy[productBrand ?? ''] ?? {
    heading: 'Smarter Energy.',
    accent: 'Better Control.',
    subtitle: `${brandLabel} inverter models for efficient solar performance.`
  };

  return {
    type: 'inverter' as const,
    ...copy,
    badges: ['Hybrid Ready', 'Smart Monitoring', 'Stable Output']
  };
};

const BrandHeroBanner = ({
  type,
  heading,
  accent,
  subtitle,
  badges,
  warranty
}: {
  type: 'battery' | 'inverter' | 'panel';
  heading: string;
  accent: string;
  subtitle: string;
  badges: string[];
  warranty?: string;
}) => (
  <View style={brandStyles.heroBanner}>
    <View style={brandStyles.sunGlow} />
    <View style={brandStyles.heroHouseScene}>
      <View style={brandStyles.heroRoof} />
      <View style={brandStyles.heroHouseBody} />
      <View style={brandStyles.heroTree} />
    </View>
    {warranty ? (
      <View style={brandStyles.warrantyBadge}>
        <Text style={brandStyles.warrantyBig}>10</Text>
        <Text style={brandStyles.warrantyText}>YEARS{'\n'}WARRANTY</Text>
      </View>
    ) : null}

    <View style={brandStyles.heroLeft}>
      <View style={brandStyles.heroPremiumPill}>
        <Text style={brandStyles.heroPremiumText}>PREMIUM</Text>
      </View>
      <Text style={brandStyles.heroHeading}>
        {heading}{'\n'}<Text style={brandStyles.heroAccent}>{accent}</Text>
      </Text>
      <Text style={brandStyles.heroSubtitle}>{subtitle}</Text>
    </View>

    <View style={brandStyles.productStage}>
      {type === 'panel' ? (
        <View style={brandStyles.panelProduct}>
          {Array.from({ length: 9 }).map((_, index) => <View key={index} style={brandStyles.panelProductCell} />)}
        </View>
      ) : (
        <View style={[brandStyles.energyProduct, type === 'inverter' && brandStyles.inverterProduct]}>
          <Text style={brandStyles.productLogo}>{type === 'battery' ? 'FOX' : 'INV'}</Text>
          <View style={brandStyles.productSlot} />
        </View>
      )}
    </View>

    <View style={brandStyles.heroBadges}>
      {badges.map((badge, index) => (
        <View key={badge} style={brandStyles.heroBadge}>
          <View style={brandStyles.heroBadgeIcon}>
            {index === 0 ? <ShieldCheck color="#F5A400" size={13} strokeWidth={2.3} /> : index === 1 ? <Zap color="#F5A400" size={13} fill="#F5A400" /> : <CheckCircle2 color="#F5A400" size={13} strokeWidth={2.3} />}
          </View>
          <Text style={brandStyles.heroBadgeText}>{badge}</Text>
        </View>
      ))}
    </View>
  </View>
);

const InverterBrandSelectionScreen = ({ navigation, onSelectBrand }: { navigation: any; onSelectBrand: (brand: string) => void }) => {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('All');
  const brandsQuery = useBrands('inverter');
  const liveBrands = useMemo(() => mergeLiveBrands(brandsQuery.data ?? [], inverterBrands), [brandsQuery.data]);
  const filteredBrands = liveBrands.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.trim().toLowerCase());
    const matchesFilter = filter === 'All' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={brandStyles.shell}>
      <View style={brandStyles.topBar}>
        <Pressable style={brandStyles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#111827" size={18} strokeWidth={2.3} />
        </Pressable>
        <View style={brandStyles.titleBlock}>
          <Text style={brandStyles.title}>Select Inverter Brand</Text>
          <Text style={brandStyles.subtitle}>Browse trusted inverter manufacturers</Text>
        </View>
        <View style={brandStyles.toolIcon}>
          <Zap color="#B07800" size={17} fill="#B07800" />
        </View>
      </View>

      <ScrollView style={brandStyles.scroll} contentContainerStyle={brandStyles.content} showsVerticalScrollIndicator={false}>
        <View style={brandStyles.searchWrap}>
          <Search color="#94A3B8" size={17} strokeWidth={2.1} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search inverter brands"
            placeholderTextColor="#94A3B8"
            style={brandStyles.searchInput}
          />
        </View>

        <View style={brandStyles.chips}>
          {['All', 'Hybrid', 'On-Grid', 'Premium'].map((item) => (
            <Pressable key={item} style={[brandStyles.chip, filter === item && brandStyles.chipActive]} onPress={() => setFilter(item)}>
              <Text style={[brandStyles.chipText, filter === item && brandStyles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={brandStyles.list}>
          {brandsQuery.isLoading ? <QueryFeedback message="Loading inverter brands..." /> : null}
          {brandsQuery.isError ? <QueryFeedback message="Unable to load inverter brands. Please try again." /> : null}
          {!brandsQuery.isLoading && !brandsQuery.isError && filteredBrands.length === 0 ? <QueryFeedback message="No inverter brands are available yet." /> : null}
          {filteredBrands.map((item, index) => (
            <Pressable key={item.name} style={[brandStyles.brandCard, index === 0 && brandStyles.brandCardSelected]} onPress={() => onSelectBrand(item.productBrand)}>
              <View style={brandStyles.logoBox}>
                {item.logo ? (
                  <SafeImage source={item.logo} style={brandStyles.logoImage} resizeMode="contain" fallback={<Text style={brandStyles.logoText}>{item.initials}</Text>} />
                ) : (
                  <Text style={brandStyles.logoText}>{item.initials}</Text>
                )}
              </View>
              <View style={brandStyles.brandCopy}>
                <View style={brandStyles.brandNameRow}>
                  <Text style={brandStyles.brandName}>{item.name}</Text>
                  <View style={[brandStyles.badge, item.badge === 'PREMIUM' && brandStyles.premiumBadge, item.badge === 'ON-GRID' && brandStyles.gridBadge]}>
                    <Text style={brandStyles.badgeText}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={brandStyles.brandTitle}>{item.title}</Text>
                <Text style={brandStyles.brandDescription}>{item.description}</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2.3} />
            </Pressable>
          ))}
        </View>

        <View style={brandStyles.trustStrip}>
          {[
            { text: 'Verified brands', Icon: CheckCircle2 },
            { text: 'Genuine specs', Icon: ShieldCheck },
            { text: 'Real market pricing', Icon: BatteryCharging }
          ].map(({ text, Icon }) => (
            <View key={text} style={brandStyles.trustItem}>
              <Icon color="#16A34A" size={12} strokeWidth={2.2} />
              <Text style={brandStyles.trustText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={brandStyles.bottomNav}>
        {[
          { label: 'Home', Icon: Home, active: false },
          { label: 'Explore', Icon: Search, active: true },
          { label: 'Plans', Icon: Bolt, active: false },
          { label: 'Profile', Icon: User, active: false }
        ].map(({ label, Icon, active }) => (
          <Pressable key={label} style={brandStyles.navItem} onPress={() => label === 'Home' ? navigation.navigate('MainTabs', { screen: 'Home' }) : undefined}>
            <Icon color={active ? '#F5A400' : '#94A3B8'} size={18} strokeWidth={2.1} />
            <Text style={[brandStyles.navText, active && brandStyles.navTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const SolarPanelBrandSelectionScreen = ({ navigation, onSelectBrand }: { navigation: any; onSelectBrand: (brand: string) => void }) => {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('All');
  const brandsQuery = useBrands('panel');
  const liveBrands = useMemo(() => mergeLiveBrands(brandsQuery.data ?? [], solarPanelBrands), [brandsQuery.data]);
  const filteredBrands = liveBrands.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.trim().toLowerCase());
    const matchesFilter = filter === 'All' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={brandStyles.shell}>
      <View style={brandStyles.topBar}>
        <Pressable style={brandStyles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#111827" size={18} strokeWidth={2.3} />
        </Pressable>
        <View style={brandStyles.titleBlock}>
          <Text style={brandStyles.title}>Select Brand</Text>
          <Text style={brandStyles.subtitle}>Browse trusted solar manufacturers</Text>
        </View>
        <View style={brandStyles.toolIcon}>
          <Sun color="#B07800" size={17} strokeWidth={2.2} />
        </View>
      </View>

      <ScrollView style={brandStyles.scroll} contentContainerStyle={brandStyles.content} showsVerticalScrollIndicator={false}>
        <View style={brandStyles.searchWrap}>
          <Search color="#94A3B8" size={17} strokeWidth={2.1} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search solar brands"
            placeholderTextColor="#94A3B8"
            style={brandStyles.searchInput}
          />
        </View>

        <View style={brandStyles.chips}>
          {['All', 'Tier-1', 'Premium', 'Budget'].map((item) => (
            <Pressable key={item} style={[brandStyles.chip, filter === item && brandStyles.chipActive]} onPress={() => setFilter(item)}>
              <Text style={[brandStyles.chipText, filter === item && brandStyles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={brandStyles.list}>
          {brandsQuery.isLoading ? <QueryFeedback message="Loading solar brands..." /> : null}
          {brandsQuery.isError ? <QueryFeedback message="Unable to load solar brands. Please try again." /> : null}
          {!brandsQuery.isLoading && !brandsQuery.isError && filteredBrands.length === 0 ? <QueryFeedback message="No solar panel brands are available yet." /> : null}
          {filteredBrands.map((item, index) => (
            <Pressable key={item.name} style={[brandStyles.brandCard, index === 0 && brandStyles.brandCardSelected]} onPress={() => onSelectBrand(item.productBrand)}>
              <View style={brandStyles.logoBox}>
                {item.logo ? (
                  <SafeImage source={item.logo} style={brandStyles.logoImage} resizeMode="contain" fallback={<Text style={brandStyles.logoText}>{item.initials}</Text>} />
                ) : (
                  <Text style={brandStyles.logoText}>{item.initials}</Text>
                )}
              </View>
              <View style={brandStyles.brandCopy}>
                <View style={brandStyles.brandNameRow}>
                  <Text style={brandStyles.brandName}>{item.name}</Text>
                  <View style={[brandStyles.badge, item.badge === 'PREMIUM' && brandStyles.premiumBadge, item.badge === 'BUDGET' && brandStyles.gridBadge, item.badge === 'POPULAR' && brandStyles.popularBadge]}>
                    <Text style={brandStyles.badgeText}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={brandStyles.brandTitle}>{item.title}</Text>
                <Text style={brandStyles.brandDescription}>{item.description}</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2.3} />
            </Pressable>
          ))}
        </View>

        <View style={brandStyles.trustStrip}>
          {[
            { text: 'Tier-1 brands', Icon: CheckCircle2 },
            { text: 'Verified specs', Icon: ShieldCheck },
            { text: 'Real pricing', Icon: BatteryCharging }
          ].map(({ text, Icon }) => (
            <View key={text} style={brandStyles.trustItem}>
              <Icon color="#B07800" size={12} strokeWidth={2.2} />
              <Text style={brandStyles.trustText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={brandStyles.bottomNav}>
        {[
          { label: 'Home', Icon: Home, active: false },
          { label: 'Explore', Icon: Search, active: true },
          { label: 'Plans', Icon: Bolt, active: false },
          { label: 'Profile', Icon: User, active: false }
        ].map(({ label, Icon, active }) => (
          <Pressable key={label} style={brandStyles.navItem} onPress={() => label === 'Home' ? navigation.navigate('MainTabs', { screen: 'Home' }) : undefined}>
            <Icon color={active ? '#F5A400' : '#94A3B8'} size={18} strokeWidth={2.1} />
            <Text style={[brandStyles.navText, active && brandStyles.navTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const BatteryBrandSelectionScreen = ({ navigation, onSelectBrand }: { navigation: any; onSelectBrand: (brand: string) => void }) => {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('All');
  const brandsQuery = useBrands('battery');
  const liveBrands = useMemo(() => mergeLiveBrands(brandsQuery.data ?? [], batteryBrands), [brandsQuery.data]);
  const filteredBrands = liveBrands.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.trim().toLowerCase());
    const matchesFilter = filter === 'All' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={brandStyles.shell}>
      <View style={brandStyles.topBar}>
        <Pressable style={brandStyles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#111827" size={18} strokeWidth={2.3} />
        </Pressable>
        <View style={brandStyles.titleBlock}>
          <Text style={brandStyles.title}>Select Battery Brand</Text>
          <Text style={brandStyles.subtitle}>Browse trusted battery manufacturers</Text>
        </View>
        <View style={brandStyles.toolIcon}>
          <BatteryCharging color="#B07800" size={17} strokeWidth={2.2} />
        </View>
      </View>

      <ScrollView style={brandStyles.scroll} contentContainerStyle={brandStyles.content} showsVerticalScrollIndicator={false}>
        <View style={brandStyles.searchWrap}>
          <Search color="#94A3B8" size={17} strokeWidth={2.1} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search battery brands"
            placeholderTextColor="#94A3B8"
            style={brandStyles.searchInput}
          />
        </View>

        <View style={brandStyles.chips}>
          {['All', 'Lithium', 'Premium', 'Budget'].map((item) => (
            <Pressable key={item} style={[brandStyles.chip, filter === item && brandStyles.chipActive]} onPress={() => setFilter(item)}>
              <Text style={[brandStyles.chipText, filter === item && brandStyles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={brandStyles.list}>
          {brandsQuery.isLoading ? <QueryFeedback message="Loading battery brands..." /> : null}
          {brandsQuery.isError ? <QueryFeedback message="Unable to load battery brands. Please try again." /> : null}
          {!brandsQuery.isLoading && !brandsQuery.isError && filteredBrands.length === 0 ? <QueryFeedback message="No battery brands are available yet." /> : null}
          {filteredBrands.map((item, index) => (
            <Pressable key={item.name} style={[brandStyles.brandCard, index === 0 && brandStyles.brandCardSelected]} onPress={() => onSelectBrand(item.productBrand)}>
              <View style={brandStyles.logoBox}>
                {item.logo ? (
                  <SafeImage source={item.logo} style={brandStyles.logoImage} resizeMode="contain" fallback={<Text style={brandStyles.logoText}>{item.initials}</Text>} />
                ) : (
                  <Text style={brandStyles.logoText}>{item.initials}</Text>
                )}
              </View>
              <View style={brandStyles.brandCopy}>
                <View style={brandStyles.brandNameRow}>
                  <Text style={brandStyles.brandName}>{item.name}</Text>
                  <View style={[brandStyles.badge, item.badge === 'PREMIUM' && brandStyles.premiumBadge, item.badge === 'BUDGET' && brandStyles.gridBadge]}>
                    <Text style={brandStyles.badgeText}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={brandStyles.brandTitle}>{item.title}</Text>
                <Text style={brandStyles.brandDescription}>{item.description}</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2.3} />
            </Pressable>
          ))}
        </View>

        <View style={brandStyles.trustStrip}>
          {[
            { text: 'Verified brands', Icon: CheckCircle2 },
            { text: 'Genuine specs', Icon: ShieldCheck },
            { text: 'Real market pricing', Icon: BatteryCharging }
          ].map(({ text, Icon }) => (
            <View key={text} style={brandStyles.trustItem}>
              <Icon color="#B07800" size={12} strokeWidth={2.2} />
              <Text style={brandStyles.trustText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={brandStyles.bottomNav}>
        {[
          { label: 'Home', Icon: Home, active: false },
          { label: 'Explore', Icon: Search, active: true },
          { label: 'Plans', Icon: Bolt, active: false },
          { label: 'Profile', Icon: User, active: false }
        ].map(({ label, Icon, active }) => (
          <Pressable key={label} style={brandStyles.navItem} onPress={() => label === 'Home' ? navigation.navigate('MainTabs', { screen: 'Home' }) : undefined}>
            <Icon color={active ? '#F5A400' : '#94A3B8'} size={18} strokeWidth={2.1} />
            <Text style={[brandStyles.navText, active && brandStyles.navTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export const MarketplaceFlowScreen = ({ route, navigation }: any) => {
  const initialCategory: ProductCategory = route.params?.category ?? 'inverter';
  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [brand, setBrand] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const productsQuery = useProducts(category);
  const { compareIds, toggleCompare } = useMarketplaceStore();
  const setSelectedProduct = useSystemStore((state) => state.setSelectedProduct);

  const brands = useMemo(() => [...new Set((productsQuery.data ?? []).map((item) => item.brand))], [productsQuery.data]);
  const visibleProducts = useMemo(() => brand ? (productsQuery.data ?? []).filter((item) => brandsMatch(item.brand, brand)) : (productsQuery.data ?? []), [brand, productsQuery.data]);
  const selectedBrandLabel = useMemo(() => getBrandLabel(category, brand), [category, brand]);
  const isBrandProductList = Boolean(brand && category !== 'accessory');
  const listingHero = useMemo(() => isBrandProductList ? getListingHero(category, selectedBrandLabel, brand) : null, [brand, category, isBrandProductList, selectedBrandLabel]);

  useEffect(() => {
    if (isFocused) void productsQuery.refetch();
  }, [isFocused, productsQuery.refetch]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('Brand selected:', brand);
    console.log('Category selected:', category);
    if (productsQuery.error) console.error('Products query actual error:', productsQuery.error);
    const fetchedProducts = productsQuery.data ?? [];
    console.log('Total products fetched:', fetchedProducts.length);
    console.log('FOX products found:', fetchedProducts.filter((item) => item.category === category && brandsMatch(item.brand, 'FOX')).length);
    console.log('Displayed products:', visibleProducts.length);
  }, [brand, category, productsQuery.data, productsQuery.error, visibleProducts.length]);

  const chooseProduct = (product: Product) => {
    setSelectedProduct(product);
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  if (category === 'inverter' && !brand) {
    return <InverterBrandSelectionScreen navigation={navigation} onSelectBrand={setBrand} />;
  }

  if (category === 'panel' && !brand) {
    return <SolarPanelBrandSelectionScreen navigation={navigation} onSelectBrand={setBrand} />;
  }

  if (category === 'battery' && !brand) {
    return <BatteryBrandSelectionScreen navigation={navigation} onSelectBrand={setBrand} />;
  }

  return (
    <Screen refreshing={productsQuery.isRefetching} onRefresh={() => void productsQuery.refetch()}>
      <Header
        title={isBrandProductList ? selectedBrandLabel : categoryTitle[category]}
        subtitle={isBrandProductList ? modelSubtitleByCategory[category] : category === 'accessory' ? modelSubtitleByCategory.accessory : 'Brand Selection'}
        onBack={() => isBrandProductList ? setBrand(null) : navigation.goBack()}
        right={<View className="flex-row gap-2"><Search color={colors.navy} size={18} /><SlidersHorizontal color={colors.navy} size={18} /></View>}
      />

      {category === 'accessory' ? (
        <View className="mb-4 rounded-3xl bg-kaam-yellow p-5">
          <Text className="text-2xl font-extrabold text-kaam-navy">Solar Accessories</Text>
          <Text className="mt-2 text-sm font-semibold text-kaam-navy/70">Durable mounting, structure, and accessory products for clean solar installations.</Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {['Galvanized Steel', 'Wind Resistant', 'Installation Ready'].map((badge) => <Text key={badge} className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-kaam-navy">{badge}</Text>)}
          </View>
        </View>
      ) : null}

      {listingHero ? (
        <View style={{ marginBottom: 14 }}>
          <BrandHeroBanner {...listingHero} />
        </View>
      ) : null}

      <View className="mb-4 flex-row flex-wrap gap-2">
        {(['inverter', 'panel', 'battery', 'accessory'] as ProductCategory[]).map((item) => (
          <Pressable key={item} className={`rounded-full px-4 py-2 ${category === item ? 'bg-kaam-yellow' : 'bg-white'}`} onPress={() => { setCategory(item); setBrand(null); }}>
            <Text className="text-xs font-extrabold text-kaam-navy">{categoryTitle[item]}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {isBrandProductList ? (
          <>
            <Text className="rounded-full bg-kaam-navy px-4 py-2 text-xs font-bold text-white">{selectedBrandLabel}</Text>
            <Pressable className="rounded-full bg-white px-4 py-2" onPress={() => setBrand(null)}>
              <Text className="text-xs font-bold text-kaam-navy">Change Brand</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable className={`rounded-full px-4 py-2 ${!brand ? 'bg-kaam-navy' : 'bg-white'}`} onPress={() => setBrand(null)}>
              <Text className={`text-xs font-bold ${!brand ? 'text-white' : 'text-kaam-navy'}`}>All</Text>
            </Pressable>
            {brands.map((item) => (
              <Pressable key={item} className={`rounded-full px-4 py-2 ${brand === item ? 'bg-kaam-navy' : 'bg-white'}`} onPress={() => setBrand(item)}>
                <Text className={`text-xs font-bold ${brand === item ? 'text-white' : 'text-kaam-navy'}`}>{item}</Text>
              </Pressable>
            ))}
          </>
        )}
      </View>

      <FlatList
        scrollEnabled={false}
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            selected={false}
            compared={compareIds.includes(item.id)}
            onCompare={() => toggleCompare(item.id)}
            onPress={() => chooseProduct(item)}
          />
        )}
      />
      {productsQuery.isLoading ? <QueryFeedback message="Loading products..." /> : null}
      {productsQuery.isError ? <QueryFeedback message={__DEV__ ? `Unable to load products: ${getErrorMessage(productsQuery.error)}` : 'Unable to load products. Please try again.'} /> : null}
      {!productsQuery.isLoading && !productsQuery.isError && visibleProducts.length === 0 ? <QueryFeedback message="No products are available in this category yet." /> : null}

    </Screen>
  );
};

const brandStyles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8F3E8' },
  topBar: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,211,203,0.65)',
    backgroundColor: '#FBF8F1'
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  titleBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  title: { color: '#172031', fontSize: 14, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 10.5, fontWeight: '700', marginTop: 3 },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#FFF2D1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 88 },
  heroBanner: {
    height: 158,
    borderRadius: 18,
    backgroundColor: '#FFF1CE',
    borderWidth: 1,
    borderColor: 'rgba(245,212,130,0.72)',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#8A6A24',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  sunGlow: {
    position: 'absolute',
    top: -32,
    left: 122,
    width: 124,
    height: 124,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.74)'
  },
  heroHouseScene: {
    position: 'absolute',
    right: -10,
    bottom: 18,
    width: 150,
    height: 82,
    opacity: 0.72
  },
  heroRoof: {
    position: 'absolute',
    right: 12,
    top: 7,
    width: 104,
    height: 30,
    backgroundColor: '#C7953A',
    transform: [{ skewX: '-22deg' }],
    borderRadius: 4
  },
  heroHouseBody: {
    position: 'absolute',
    right: 18,
    top: 30,
    width: 118,
    height: 48,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.78)'
  },
  heroTree: {
    position: 'absolute',
    right: 132,
    top: 48,
    width: 16,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(109,142,56,0.45)'
  },
  warrantyBadge: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 45,
    height: 49,
    borderRadius: 9,
    backgroundColor: 'rgba(255,248,230,0.9)',
    borderWidth: 1,
    borderColor: '#F5D482',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  warrantyBig: { color: '#B07800', fontSize: 17, fontWeight: '900', lineHeight: 18 },
  warrantyText: { color: '#7A5610', textAlign: 'center', fontSize: 6.5, fontWeight: '900', lineHeight: 8 },
  heroLeft: { position: 'absolute', left: 16, top: 14, width: '54%', zIndex: 2 },
  heroPremiumPill: {
    alignSelf: 'flex-start',
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.78)',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 6
  },
  heroPremiumText: { color: '#B07800', fontSize: 8.5, fontWeight: '900' },
  heroHeading: { color: '#111827', fontSize: 20, lineHeight: 22, fontWeight: '900' },
  heroAccent: { color: '#E8A400' },
  heroSubtitle: { color: '#334155', fontSize: 10.5, lineHeight: 14, fontWeight: '700', marginTop: 6 },
  productStage: {
    position: 'absolute',
    right: 18,
    top: 43,
    width: 92,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  energyProduct: {
    width: 62,
    height: 82,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.17,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inverterProduct: { width: 68, height: 76, borderRadius: 12 },
  productLogo: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  productSlot: { width: 22, height: 5, borderRadius: 999, backgroundColor: '#CBD5E1', marginTop: 9 },
  panelProduct: {
    width: 74,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#0E325D',
    borderWidth: 2,
    borderColor: '#DDEBFF',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
    gap: 4,
    transform: [{ rotate: '-5deg' }]
  },
  panelProductCell: { width: 18, height: 16, borderRadius: 2, backgroundColor: 'rgba(111,166,216,0.52)' },
  heroBadges: {
    position: 'absolute',
    left: 15,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    zIndex: 4
  },
  heroBadge: {
    flex: 1,
    minHeight: 29,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    gap: 4
  },
  heroBadgeIcon: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroBadgeText: { flex: 1, color: '#172031', fontSize: 7.5, lineHeight: 9, fontWeight: '900' },
  searchWrap: {
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9BE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 9,
    marginBottom: 12
  },
  searchInput: { flex: 1, color: '#172031', fontSize: 12.5, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  chip: {
    height: 32,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9BE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipActive: { backgroundColor: '#FDB813', borderColor: '#FDB813' },
  chipText: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  chipTextActive: { color: '#111827' },
  list: { gap: 10 },
  brandCard: {
    minHeight: 82,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  brandCardSelected: {
    borderLeftWidth: 5,
    borderLeftColor: '#FDB813',
    paddingLeft: 7
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: '#FFF7E2',
    borderWidth: 1,
    borderColor: '#F5D482',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11
  },
  logoImage: {
    width: 38,
    height: 30
  },
  logoText: { color: '#0F1E33', fontSize: 13, fontWeight: '900' },
  brandCopy: { flex: 1, minWidth: 0 },
  brandNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  brandName: { color: '#111827', fontSize: 14, fontWeight: '900' },
  badge: { borderRadius: 999, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2 },
  premiumBadge: { backgroundColor: '#FFF1CC' },
  gridBadge: { backgroundColor: '#E0F2FE' },
  popularBadge: { backgroundColor: '#FDECC8' },
  badgeText: { color: '#0F1E33', fontSize: 7.5, fontWeight: '900' },
  brandTitle: { color: '#172031', fontSize: 11.3, fontWeight: '900', marginBottom: 3 },
  brandDescription: { color: '#64748B', fontSize: 10.2, fontWeight: '700' },
  trustStrip: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 7
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { color: '#334155', fontSize: 9.3, fontWeight: '800' },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,211,203,0.78)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navText: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  navTextActive: { color: '#F5A400' }
});
