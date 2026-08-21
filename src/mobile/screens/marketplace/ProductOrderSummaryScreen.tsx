import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { AppText } from '@/components/ui/AppText';
import { InfoCard } from '@/components/cards/InfoCard';
import { useProduct, useServicePricing } from '@/hooks/useProducts';
import { useAuthStore } from '@/store/useAuthStore';
import { marketplaceApi } from '@/services/marketplace.api';
import { formatPkr } from '@/utils/formatters';

const SummaryRow = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
  <View className="flex-row items-center justify-between py-2">
    <AppText variant={emphasis ? 'body' : 'caption'} className={emphasis ? 'font-extrabold' : ''}>{label}</AppText>
    <AppText variant={emphasis ? 'body' : 'caption'} className={emphasis ? 'font-extrabold' : ''}>{value}</AppText>
  </View>
);

export const ProductOrderSummaryScreen = ({ navigation, route }: any) => {
  const { productId, quantity, serviceOption, city, address, phone } = route.params as {
    productId: string;
    quantity: number;
    serviceOption: 'product-only' | 'product-installation';
    city: string;
    address: string;
    phone: string;
  };
  const productQuery = useProduct(productId);
  const product = productQuery.data;
  const pricingQuery = useServicePricing();
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasInstallation = serviceOption === 'product-installation';
  const transportationCharge = pricingQuery.data?.transportationCharge ?? 0;
  const installationCharge = hasInstallation ? (pricingQuery.data?.productInstallationCharge ?? 0) : 0;
  const productTotal = (product?.price ?? 0) * quantity;
  const total = productTotal + transportationCharge + installationCharge;

  const placeOrder = async () => {
    if (!product) return;
    if (!session?.user.id) {
      setError('Please sign in to place an order.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const order = await marketplaceApi.placeProductOrder({
        userId: session.user.id,
        product,
        quantity,
        serviceOption,
        fullName: profile?.full_name || 'Customer',
        phone,
        city,
        deliveryAddress: address,
        transportationCharge,
        installationCharge
      });
      navigation.navigate('OrderPlaced', { orderId: order.id, referenceCode: order.referenceCode, serviceOption });
    } catch (reason) {
      setError('Unable to place your order right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <Screen>
        <Header title="Order Summary" onBack={() => navigation.goBack()} />
        <InfoCard title={productQuery.isError ? 'Unable to load product' : 'Loading product...'} subtitle={productQuery.isError ? 'Please go back and try again.' : 'Fetching order details.'} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Order Summary" subtitle={product.name} onBack={() => navigation.goBack()} />
      <View className="gap-4">
        <View className="rounded-3xl border border-kaam-line bg-white p-4">
          <AppText variant="label">Product</AppText>
          <AppText variant="body" className="mt-1 font-extrabold">{product.name}</AppText>
          <AppText variant="caption" className="mt-0.5">{product.brand} · Qty {quantity}</AppText>
        </View>

        <View className="rounded-3xl border border-kaam-line bg-white p-4">
          <AppText variant="label" className="mb-1">Delivery Details</AppText>
          <SummaryRow label="Address" value={address} />
          <SummaryRow label="City" value={city} />
          <SummaryRow label="Phone" value={phone} />
          <SummaryRow label="Service" value={hasInstallation ? 'Product + Installation' : 'Product only'} />
        </View>

        <View className="rounded-3xl border border-kaam-line bg-white p-4">
          <AppText variant="label" className="mb-1">Price Summary</AppText>
          <SummaryRow label={`Product (${quantity} × ${formatPkr(product.price)})`} value={formatPkr(productTotal)} />
          <SummaryRow label="Transportation" value={formatPkr(transportationCharge)} />
          {hasInstallation ? <SummaryRow label="Installation" value={formatPkr(installationCharge)} /> : null}
          <View className="my-2 h-px bg-kaam-line" />
          <SummaryRow label="Total" value={formatPkr(total)} emphasis />
        </View>

        {error ? <AppText className="text-red-600">{error}</AppText> : null}

        <Pressable
          disabled={submitting}
          className="mt-2 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-kaam-yellow"
          onPress={placeOrder}
        >
          {submitting ? <ActivityIndicator color="#111827" /> : <AppText variant="body" className="font-extrabold text-kaam-navy">Place Order</AppText>}
        </Pressable>
      </View>
    </Screen>
  );
};
