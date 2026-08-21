import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, ClipboardCheck, CreditCard, MapPin, Package, PackageSearch, Phone, Truck, User, Wrench } from 'lucide-react-native';
import { productOrderJourneyKeys, productOrderJourneyMilestones, type ProductOrderJourneyMilestone } from '@/contracts/solarJourneyMilestones';
import type { ProductOrder, ProductOrderStatus } from '@/types/product.types';

const NAVY = '#0F2744';
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

const timelineIcons: Record<ProductOrderJourneyMilestone, typeof ClipboardCheck> = {
  order_received: ClipboardCheck,
  order_confirmed: CheckCircle2,
  payment_received: CreditCard,
  in_transit: Truck,
  product_received: Package,
  product_installed: Wrench
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
const formatMoney = (value: number) => `Rs ${value.toLocaleString('en-PK')}`;

export const OrderDetailScreen = ({ navigation, route }: any) => {
  const order = route.params.order as ProductOrder;
  const meta = statusMeta[order.status] ?? statusMeta.order_received;
  const hasInstallation = order.serviceOption === 'product_installation';
  const isHalted = order.status === 'cancelled' || order.status === 'on_hold';
  const milestones = productOrderJourneyMilestones(hasInstallation);
  const keys = productOrderJourneyKeys(hasInstallation);
  const currentKey = (order.currentMilestone ?? order.status) as ProductOrderJourneyMilestone;
  const currentIndex = keys.indexOf(currentKey);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color={NAVY} size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle}>{order.referenceCode}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.productRow}>
            {order.productImageUrl ? (
              <Image source={{ uri: order.productImageUrl }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]}>
                <PackageSearch color={NAVY} size={24} />
              </View>
            )}
            <View style={styles.productCopy}>
              <Text style={styles.productName}>{order.productName}</Text>
              {order.productBrand ? <Text style={styles.productBrand}>{order.productBrand}</Text> : null}
              <Text style={styles.productMeta}>Qty {order.quantity} · Ordered {formatDate(order.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Order Progress</Text>
        <View style={styles.card}>
          {isHalted ? (
            <View style={styles.haltedRow}>
              <View style={[styles.haltedIcon, { backgroundColor: meta.bg }]}>
                <PackageSearch color={meta.color} size={18} />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.haltedTitle, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.haltedText}>
                  {order.status === 'cancelled' ? 'This order has been cancelled.' : 'This order is currently on hold. We will update you soon.'}
                </Text>
              </View>
            </View>
          ) : (
            milestones.map((item, index) => {
              const Icon = timelineIcons[item.key];
              const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending';
              return (
                <View key={item.key} style={styles.timelineRow}>
                  <View style={styles.timelineIconCol}>
                    <View style={[styles.timelineIcon, state !== 'pending' && styles.timelineIconActive]}>
                      <Icon color={state !== 'pending' ? NAVY : '#94A3B8'} size={16} strokeWidth={2.3} />
                    </View>
                    {index < milestones.length - 1 ? <View style={[styles.timelineLine, state === 'done' && styles.timelineLineDone]} /> : null}
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text style={[styles.timelineTitle, state === 'active' && styles.timelineTitleActive]}>{item.label}</Text>
                    <Text style={styles.timelineDescription}>{item.customerDescription}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.sectionLabel}>Price Details</Text>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Unit Price × {order.quantity}</Text>
            <Text style={styles.priceValue}>{formatMoney(order.unitPrice * order.quantity)}</Text>
          </View>
          {order.transportationCharge > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Transportation</Text>
              <Text style={styles.priceValue}>{formatMoney(order.transportationCharge)}</Text>
            </View>
          ) : null}
          {hasInstallation && order.installationCharge > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Installation</Text>
              <Text style={styles.priceValue}>{formatMoney(order.installationCharge)}</Text>
            </View>
          ) : null}
          {order.discountAmount > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.discountLabel}>Discount</Text>
              <Text style={styles.discountValue}>-{formatMoney(order.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatMoney(order.total)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Delivery Details</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <User color="#94A3B8" size={16} strokeWidth={2.2} />
            <Text style={styles.infoText}>{order.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone color="#94A3B8" size={16} strokeWidth={2.2} />
            <Text style={styles.infoText}>{order.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin color="#94A3B8" size={16} strokeWidth={2.2} />
            <Text style={styles.infoText}>{order.deliveryAddress ? `${order.deliveryAddress}, ` : ''}{order.city}</Text>
          </View>
        </View>
      </ScrollView>
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
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 32, gap: 14 },
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
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 60, height: 60, borderRadius: 14 },
  thumbFallback: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  productCopy: { flex: 1, minWidth: 0 },
  productName: { fontSize: 16, fontWeight: '900', color: NAVY },
  productBrand: { fontSize: 12.5, fontWeight: '600', color: '#667085', marginTop: 1 },
  productMeta: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, marginTop: 12 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineIconCol: { alignItems: 'center' },
  timelineIcon: { width: 32, height: 32, borderRadius: 999, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  timelineIconActive: { backgroundColor: '#FDE9B6' },
  timelineLine: { width: 2, flex: 1, minHeight: 24, backgroundColor: '#E2E8F0', marginVertical: 4 },
  timelineLineDone: { backgroundColor: '#FDBB0A' },
  timelineCopy: { flex: 1, paddingBottom: 18 },
  timelineTitle: { fontSize: 13.5, fontWeight: '700', color: '#667085' },
  timelineTitleActive: { color: NAVY, fontWeight: '900' },
  timelineDescription: { fontSize: 11.5, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  haltedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  haltedIcon: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  haltedTitle: { fontSize: 14, fontWeight: '900' },
  haltedText: { fontSize: 12, fontWeight: '600', color: '#667085', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { fontSize: 13, fontWeight: '600', color: '#667085' },
  priceValue: { fontSize: 13, fontWeight: '700', color: NAVY },
  discountLabel: { fontSize: 13, fontWeight: '600', color: '#15803D' },
  discountValue: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  priceDivider: { height: 1, backgroundColor: '#F1EAD9', marginVertical: 8 },
  totalLabel: { fontSize: 14, fontWeight: '900', color: NAVY },
  totalValue: { fontSize: 16, fontWeight: '900', color: NAVY },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  infoText: { fontSize: 13, fontWeight: '600', color: NAVY, flex: 1 }
});
