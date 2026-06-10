import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bookmark, Check } from 'lucide-react-native';
import { SafeImage } from '@/components/ui/SafeImage';
import type { Product } from '@/types/product.types';
import { formatPkr } from '@/utils/formatters';
import { colors } from '@/constants/colors';

type ProductCardProps = {
  product: Product;
  selected?: boolean;
  compared?: boolean;
  onPress: () => void;
  onCompare?: () => void;
};

export const ProductCard = ({ product, selected, compared, onPress, onCompare }: ProductCardProps) => (
  <Pressable className={`flex-row rounded-3xl border bg-white p-3 shadow-sm ${selected ? 'border-kaam-yellow' : 'border-kaam-line'}`} onPress={onPress}>
    <View className="h-28 w-28 items-center justify-center rounded-2xl bg-kaam-surface">
      <SafeImage source={product.image ? { uri: product.image } : undefined} className="h-20 w-20" resizeMode="contain" fallback={<Text className="text-center text-xs font-extrabold text-kaam-navy">{product.brand}</Text>} />
      {product.tag ? <Text className="mt-2 rounded-md bg-kaam-yellow px-2 py-1 text-[9px] font-bold text-kaam-navy">{product.tag}</Text> : null}
    </View>
    <View className="ml-3 flex-1">
      <View className="flex-row items-start">
        <Text className="flex-1 text-sm font-extrabold text-kaam-navy">{product.name}</Text>
        <Bookmark size={17} color={selected ? colors.amber : colors.muted} fill={selected ? colors.amber : 'none'} />
      </View>
      <View className="mt-2 flex-row flex-wrap gap-1">
        {product.specs.slice(0, 3).map((spec) => (
          <Text key={spec} className="rounded-lg bg-kaam-surface px-2 py-1 text-[10px] font-semibold text-kaam-muted">{spec}</Text>
        ))}
      </View>
      <Text className="mt-3 text-sm font-extrabold text-kaam-navy">{formatPkr(product.price)}</Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Pressable className="flex-row items-center gap-1" onPress={onCompare}>
          <View className={`h-4 w-4 items-center justify-center rounded border ${compared ? 'border-kaam-yellow bg-kaam-yellow' : 'border-kaam-line'}`}>
            {compared ? <Check size={10} color={colors.navy} /> : null}
          </View>
          <Text className="text-xs font-bold text-kaam-muted">Compare</Text>
        </Pressable>
        <Text className="rounded-xl bg-kaam-navy px-3 py-2 text-xs font-extrabold text-white">View Details</Text>
      </View>
    </View>
  </Pressable>
);
