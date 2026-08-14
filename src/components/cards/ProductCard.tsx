import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bookmark, Check, CheckCircle2, ChevronRight, Package, Sparkles, Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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
  variant?: 'standard' | 'accessory';
  onAdd?: () => void;
};

const stockInfo = (status?: string | null) => {
  const value = (status ?? '').toLowerCase().replace(/[\s-]+/g, '_').trim();
  if (value === 'out_of_stock') return { label: 'Out of Stock', kind: 'out' as const };
  if (value === 'on_request' || value === 'booking_open' || value === 'eta' || value === 'preorder') return { label: 'On Request', kind: 'request' as const };
  return { label: 'In Stock', kind: 'in' as const };
};

export const ProductCard = ({ product, selected, compared, onPress, onCompare, variant = 'standard', onAdd }: ProductCardProps) => {
  const { t } = useTranslation();
  const isAccessory = variant === 'accessory';
  const stock = stockInfo(product.stockStatus);
  return (
    <Pressable className={`flex-row rounded-3xl border bg-white p-3 shadow-sm ${selected ? 'border-kaam-yellow' : 'border-kaam-line'}`} onPress={onPress}>
      <View className="h-28 w-28 items-center justify-center rounded-2xl bg-kaam-surface">
        <SafeImage source={product.image ? { uri: product.image } : undefined} className="h-20 w-20" resizeMode="contain" fallback={<Text className="text-center text-xs font-extrabold text-kaam-navy">{product.brand}</Text>} />
        {!isAccessory && product.tag ? <Text className="mt-2 rounded-md bg-kaam-yellow px-2 py-1 text-[9px] font-bold text-kaam-navy">{product.tag}</Text> : null}
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-start">
          <View className="flex-1">
            {isAccessory ? <Text className="text-xs font-semibold text-kaam-muted" numberOfLines={1}>{product.brand || 'KaamAsaan'}</Text> : null}
            <Text className="text-sm font-extrabold text-kaam-navy" numberOfLines={2} ellipsizeMode="tail">{product.name}</Text>
          </View>
          {!isAccessory ? <Bookmark size={17} color={selected ? colors.amber : colors.muted} fill={selected ? colors.amber : 'none'} /> : null}
        </View>
        {isAccessory ? (
          <>
            <View className="mt-1 flex-row items-center gap-1">
              <Wrench color={colors.muted} size={13} />
              <Text className="flex-1 text-[10px] font-semibold text-kaam-muted" numberOfLines={1} ellipsizeMode="tail">{product.shortSpec || product.specs[0] || 'Solar installation accessory'}</Text>
            </View>
            {product.secondarySpec ? <View className="mt-1 flex-row items-center gap-1"><Sparkles color={colors.muted} size={13} /><Text className="flex-1 text-[10px] font-semibold text-kaam-muted" numberOfLines={1} ellipsizeMode="tail">{product.secondarySpec}</Text></View> : null}
            <View className={`mt-1 self-start flex-row items-center gap-1 rounded-xl px-2 py-1 ${stock.kind === 'in' ? 'bg-[#E8F7E9]' : stock.kind === 'out' ? 'bg-[#FEECEB]' : 'bg-[#FFF4D6]'}`}><CheckCircle2 color={stock.kind === 'in' ? '#15803D' : stock.kind === 'out' ? '#B42318' : '#9A6700'} size={13} /><Text className={`text-[10px] font-extrabold ${stock.kind === 'in' ? 'text-[#15803D]' : stock.kind === 'out' ? 'text-[#B42318]' : 'text-[#9A6700]'}`}>{stock.label}</Text></View>
            <Text className="mt-1 text-sm font-extrabold text-kaam-navy" numberOfLines={1}>{product.price == null ? 'Price on request' : formatPkr(product.price)}</Text>
          </>
        ) : (
          <>
            <View className="mt-2 flex-row flex-wrap gap-1">
              {product.specs.slice(0, 3).map((spec) => <Text key={spec} className="rounded-lg bg-kaam-surface px-2 py-1 text-[10px] font-semibold text-kaam-muted">{spec}</Text>)}
            </View>
            <Text className="mt-3 text-sm font-extrabold text-kaam-navy">{formatPkr(product.price)}</Text>
          </>
        )}
        <View className="mt-3 flex-row items-center justify-between gap-2">
          {isAccessory ? (
            <>
              <Pressable className="flex-1 flex-row items-center justify-center gap-1" onPress={onPress}><Text className="text-xs font-extrabold text-[#173A86]">View Details</Text><ChevronRight color="#173A86" size={15} /></Pressable>
              <Pressable disabled={stock.kind === 'out'} className={`h-11 flex-row items-center justify-center gap-1 rounded-xl px-3 ${stock.kind === 'out' ? 'opacity-40' : 'bg-kaam-yellow'}`} onPress={onAdd}><Package color={colors.navy} size={16} /><Text className="text-[10px] font-extrabold text-kaam-navy">{stock.kind === 'request' ? 'Request' : 'Order'}</Text></Pressable>
            </>
          ) : (
            <>
              <Pressable className="flex-row items-center gap-1" onPress={onCompare}>
                <View className={`h-4 w-4 items-center justify-center rounded border ${compared ? 'border-kaam-yellow bg-kaam-yellow' : 'border-kaam-line'}`}>
                  {compared ? <Check size={10} color={colors.navy} /> : null}
                </View>
                <Text className="text-xs font-bold text-kaam-muted">{t('marketplace.compare')}</Text>
              </Pressable>
              <Text className="rounded-xl bg-kaam-navy px-3 py-2 text-xs font-extrabold text-white">{t('marketplace.viewDetails')}</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
};
