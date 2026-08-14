import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ClipboardCheck, CreditCard, Package, Truck, Wrench } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { productOrderJourneyMilestones, type ProductOrderJourneyMilestone } from '@/contracts/solarJourneyMilestones';

const timelineIcons: Record<ProductOrderJourneyMilestone, typeof ClipboardCheck> = {
  order_received: ClipboardCheck,
  order_confirmed: CheckCircle2,
  payment_received: CreditCard,
  in_transit: Truck,
  product_received: Package,
  product_installed: Wrench,
};

export const OrderPlacedScreen = ({ navigation, route }: any) => {
  const { referenceCode, serviceOption } = route.params as {
    orderId: string;
    referenceCode: string;
    serviceOption: 'product-only' | 'product-installation';
  };
  const milestones = productOrderJourneyMilestones(serviceOption === 'product-installation');

  return (
    <SafeAreaView className="flex-1 bg-kaam-cream" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1 px-4 pb-8 pt-6">
        <View className="items-center rounded-3xl border border-kaam-line bg-white p-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 color="#15803D" size={34} strokeWidth={2.2} />
          </View>
          <AppText variant="title" className="mt-4 text-center text-2xl">Order Placed!</AppText>
          <AppText variant="subtitle" className="mt-1 text-center">Thank you — we've received your order.</AppText>
          <View className="mt-4 rounded-2xl bg-kaam-cream px-4 py-2">
            <AppText variant="caption" className="text-center">Reference Number</AppText>
            <AppText variant="body" className="text-center font-extrabold">{referenceCode}</AppText>
          </View>
        </View>

        <AppText variant="label" className="mb-3 mt-6">Order Progress</AppText>
        <View className="rounded-3xl border border-kaam-line bg-white p-4">
          {milestones.map((item, index) => {
            const Icon = timelineIcons[item.key];
            const isFirst = index === 0;
            return (
              <View key={item.key} className="flex-row gap-3">
                <View className="items-center">
                  <View className={`h-8 w-8 items-center justify-center rounded-full ${isFirst ? 'bg-amber-400' : 'bg-slate-200'}`}>
                    <Icon color={isFirst ? '#111827' : '#64748B'} size={16} strokeWidth={2.3} />
                  </View>
                  {index < milestones.length - 1 ? <View className="my-1 w-0.5 flex-1 bg-slate-200" /> : null}
                </View>
                <View className="flex-1 pb-5">
                  <AppText variant="body" className={isFirst ? 'font-extrabold' : ''}>{item.label}</AppText>
                  <AppText variant="caption" className="mt-0.5">{item.customerDescription}</AppText>
                </View>
              </View>
            );
          })}
        </View>

        <Pressable
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-kaam-yellow"
          onPress={() => navigation.navigate('MainTabs', { screen: 'MySystem' })}
        >
          <AppText variant="body" className="font-extrabold text-kaam-navy">Done</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
