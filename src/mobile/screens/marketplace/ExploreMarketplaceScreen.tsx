import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { BatteryCharging, Cable, Cpu, PanelsTopLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { AppText } from '@/components/ui/AppText';
import { marketplaceCategories } from '@/constants/products';
import { colors } from '@/constants/colors';
import type { ProductCategory } from '@/types/product.types';

const iconByCategory = {
  inverter: Cpu,
  panel: PanelsTopLeft,
  battery: BatteryCharging,
  accessory: Cable
};

export const ExploreMarketplaceScreen = ({ navigation }: any) => (
  <Screen>
    <Header title="Explore Marketplace" subtitle="Select product category" />
    <AppText className="mt-4" variant="title">Explore Marketplace</AppText>
    <AppText className="mt-2" variant="subtitle">Approved product flows for your solar system.</AppText>
    <FlatList
      className="mt-5"
      scrollEnabled={false}
      data={marketplaceCategories}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item }) => {
        const Icon = iconByCategory[item.id as ProductCategory];
        return (
          <Pressable className="flex-row items-center gap-4 rounded-3xl border border-kaam-line bg-white p-4 shadow-sm" onPress={() => navigation.navigate('MarketplaceFlow', { category: item.id })}>
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-kaam-yellow/30">
              <Icon size={24} color={colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-kaam-navy">{item.title}</Text>
              <Text className="text-xs font-semibold text-kaam-muted">{item.subtitle}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  </Screen>
);
