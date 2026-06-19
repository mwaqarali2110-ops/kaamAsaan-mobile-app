import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, BatteryCharging, Cable, Cpu, Grid2X2 } from 'lucide-react-native';
import type { ProductCategory } from '@/types/product.types';

type MarketplaceCategory = {
  id: ProductCategory;
  title: string;
  subtitle: string;
  icon: typeof Cpu;
  image: ImageSourcePropType;
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
    image: require('../../../assets/home/inverter.jpg'),
    routeCategory: 'inverter'
  },
  {
    id: 'panel',
    title: 'Solar Panel',
    subtitle: 'Efficient panels for maximum output',
    icon: Grid2X2,
    image: require('../../../../public/solo solar panel.png'),
    routeCategory: 'panel'
  },
  {
    id: 'battery',
    title: 'Batteries',
    subtitle: 'Reliable energy storage solutions',
    icon: BatteryCharging,
    image: require('../../../assets/home/battery.webp'),
    routeCategory: 'battery'
  },
  {
    id: 'accessory',
    title: 'Solar Accessories',
    subtitle: 'Cables, connectors and more',
    icon: Cable,
    image: require('../../../../public/DC wires.jpg'),
    routeCategory: 'accessory'
  }
];

const MarketplaceCategoryCard = ({ category, onPress }: MarketplaceCategoryCardProps) => {
  const Icon = category.icon;

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Icon color="#F59A00" size={28} strokeWidth={2.6} />
      </View>

      <View style={styles.textBlock}>
        <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.title}>
          {category.title}
        </Text>
        <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.subtitle}>
          {category.subtitle}
        </Text>
        <View style={styles.exploreRow}>
          <Text style={styles.exploreText}>Explore</Text>
          <ArrowRight color="#F59A00" size={24} strokeWidth={3} />
        </View>
      </View>

      <View style={styles.productStage}>
        <View style={styles.imageBackgroundCircle} />
        <Image source={category.image} style={[styles.productImage, category.id === 'accessory' && styles.accessoryImage]} />
      </View>

      <Pressable
        accessibilityLabel={category.title}
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(245, 164, 0, 0.08)' }}
        onPress={() => onPress(category.routeCategory)}
        style={styles.cardHitArea}
      />
    </View>
  );
};

export const ExploreMarketplaceScreen = ({ navigation }: any) => {
  const handleCategoryPress = (category: ProductCategory) => {
    navigation.navigate('MarketplaceFlow', { category });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.headerTitle}>Explore Marketplace</Text>
          <Text style={styles.headerSubtitle}>Select Product</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {marketplaceCategories.map((category) => (
          <MarketplaceCategoryCard
            key={category.id}
            category={category}
            onPress={handleCategoryPress}
          />
        ))}
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
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 34,
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#071B33',
    lineHeight: 34
  },
  headerCopy: {
    flex: 1,
    minWidth: 0
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#737B86',
    marginTop: 8
  },
  content: {
    paddingTop: 6,
    paddingBottom: 120
  },
  card: {
    height: 128,
    marginHorizontal: 24,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E8DE',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3
  },
  cardHitArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10
  },
  iconCircle: {
    position: 'absolute',
    left: 30,
    top: 38,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textBlock: {
    position: 'absolute',
    left: 88,
    right: 100,
    top: 32
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: '#071B33',
    marginBottom: 7
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#68717C',
    marginBottom: 18
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  exploreText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: '#F59A00'
  },
  productStage: {
    position: 'absolute',
    right: 14,
    top: 18,
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  imageBackgroundCircle: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#F8F8F7'
  },
  productImage: {
    width: 76,
    height: 82,
    resizeMode: 'contain'
  },
  accessoryImage: {
    width: 92,
    height: 88
  }
});
