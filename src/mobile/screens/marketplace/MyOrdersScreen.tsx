import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, PackageSearch } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyOrders } from '@/hooks/useProducts';
import { PRODUCT_ORDER_JOURNEY_MILESTONE_KEYS, productOrderJourneyKeys } from '@/contracts/solarJourneyMilestones';
import type { ProductOrder, ProductOrderStatus } from '@/types/product.types';

const NAVY = '#0F2744';
const GOLD = '#FDBB0A';
const CREAM = '#FBF7EC';

const statusMeta: Record<ProductOrderStatus, { label: string; color: string; bg: string }> = {
  order_received: { label: 'Order Received', color: '#B45309', bg: '#FEF3C7' },
  order_confirmed: { label: 'Order Confirmed', color: '#1D4ED8', bg: '#DBEAFE' },
  payment_received: { label: 'Payment Received', color: '#1D4ED8', bg: '#DBEAFE' },
  in_transit: { label: 'In-Transit', color: '#B45309', bg: '#FEF3C7' },
  product_received: { label: 'Delivered', color: '#15803D', bg: '#DCFCE7' },
  product_installed: { label: 'Installed', color: '#15803D', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelled', color: '#B91C1C', bg: '#FEE2E2' },
  on_hold: { label: 'On Hold', color: '#667085', bg: '#F1F5F9' }
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

const OrderProgressDots = ({ order }: { order: ProductOrder }) => {
  const keys = productOrderJourneyKeys(order.serviceOption === 'product_installation');
  const currentKey = order.currentMilestone ?? order.status;
  const currentIndex = keys.indexOf(currentKey as (typeof PRODUCT_ORDER_JOURNEY_MILESTONE_KEYS)[number]);

  return (
    <View style={styles.progressRow}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <View style={[styles.progressDot, index <= currentIndex && styles.progressDotDone]} />
          {index < keys.length - 1 ? <View style={[styles.progressLine, index < currentIndex && styles.progressLineDone]} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
};

const OrderCard = ({ order, onPress }: { order: ProductOrder; onPress: () => void }) => {
  const meta = statusMeta[order.status] ?? statusMeta.order_received;
  const showProgress = order.status !== 'cancelled' && order.status !== 'on_hold';

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardTop}>
        {order.productImageUrl ? (
          <Image source={{ uri: order.productImageUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <PackageSearch color={NAVY} size={22} />
          </View>
        )}
        <View style={styles.cardCopy}>
          <Text style={styles.productName} numberOfLines={1}>{order.productName}</Text>
          {order.productBrand ? <Text style={styles.productBrand} numberOfLines={1}>{order.productBrand}</Text> : null}
          <Text style={styles.orderMeta}>Qty {order.quantity} · {formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {showProgress ? <OrderProgressDots order={order} /> : null}

      <View style={styles.cardFooter}>
        <Text style={styles.referenceText}>{order.referenceCode}</Text>
        <View style={styles.footerRight}>
          <Text style={styles.totalText}>Rs {order.total.toLocaleString('en-PK')}</Text>
          <ChevronRight color="#94A3B8" size={18} strokeWidth={2.3} />
        </View>
      </View>
    </Pressable>
  );
};

export const MyOrdersScreen = ({ navigation }: any) => {
  const userId = useAuthStore((state) => state.session?.user.id);
  const ordersQuery = useMyOrders(userId);
  const orders = ordersQuery.data ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color={NAVY} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>Track the products you've ordered</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <OrderCard order={item} onPress={() => navigation.navigate('OrderDetail', { order: item })} />}
        refreshControl={<RefreshControl refreshing={ordersQuery.isRefetching} onRefresh={() => void ordersQuery.refetch()} tintColor={GOLD} />}
        ListEmptyComponent={
          ordersQuery.isLoading ? null : (
            <View style={styles.stateBox}>
              <PackageSearch color="#94A3B8" size={32} />
              <Text style={styles.stateTitle}>
                {ordersQuery.isError ? 'Unable to load your orders.' : "You haven't placed any orders yet."}
              </Text>
              <Text style={styles.stateText}>
                {ordersQuery.isError ? 'Please check your connection and try again.' : 'Orders you place from the marketplace will show up here.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  header: { minHeight: 66, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6A5738',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: NAVY },
  headerSubtitle: { fontSize: 13, fontWeight: '600', color: '#667085', marginTop: 2 },
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 24, flexGrow: 1 },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 14,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  cardPressed: { opacity: 0.92 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  thumbFallback: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, minWidth: 0 },
  productName: { fontSize: 14, fontWeight: '800', color: NAVY },
  productBrand: { fontSize: 11.5, fontWeight: '600', color: '#667085', marginTop: 1 },
  orderMeta: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 3 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingHorizontal: 2 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  progressDotDone: { backgroundColor: colors.amber },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 3 },
  progressLineDone: { backgroundColor: colors.amber },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1EAD9' },
  referenceText: { fontSize: 11.5, fontWeight: '700', color: '#94A3B8' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalText: { fontSize: 14, fontWeight: '900', color: NAVY },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 24, gap: 8 },
  stateTitle: { color: NAVY, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  stateText: { color: '#667085', fontSize: 12, textAlign: 'center' }
});
