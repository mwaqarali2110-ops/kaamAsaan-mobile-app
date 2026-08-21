import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NotificationCard, type NotificationItem } from '@/components/notifications/NotificationCard';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { CustomerNotification } from '@/services/notifications.api';
import { useAuthStore } from '@/store/useAuthStore';
import { performNotificationAction } from '@/utils/notificationActions';

const cartImage = require('../../../assets/onboarding/Splash-Screen-Cart-1-transparent.png');

const toNotificationItem = (notification: CustomerNotification): NotificationItem => ({
  id: notification.id,
  notification_key: notification.notificationKey,
  survey_booking_id: notification.surveyBookingId,
  type: notification.type,
  title: notification.title,
  message: notification.type === 'survey_welcome'
    ? 'Thank you for choosing KaamAsaan for your solar system installation. We look forward to providing you with an excellent service experience. For any questions or assistance, please contact our representative.'
    : notification.message,
  action_type: notification.actionType,
  action_value: notification.actionValue,
  is_read: notification.isRead,
  created_at: notification.surveyBookingCreatedAt ?? notification.createdAt,
});

const getUniqueNotificationItems = (notifications: CustomerNotification[]) => {
  const items = notifications.map(toNotificationItem);
  return Array.from(
    new Map(
      items.map((notification) => [
        notification.notification_key || notification.id,
        notification,
      ])
    ).values()
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const NotificationHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <View style={styles.header}>
    <Pressable
      style={styles.backButton}
      onPress={onBack}
      hitSlop={10}
      accessibilityLabel="Back"
      accessibilityRole="button"
    >
      <ArrowLeft color="#10213A" size={22} strokeWidth={2.4} />
    </Pressable>

    <View style={styles.headerTitleContainer} pointerEvents="none">
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  </View>
);

export const NotificationsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.session?.user.id);
  const notifications = useNotifications(userId);
  const markRead = useMarkNotificationRead(userId);

  const isWeb = Platform.OS === 'web';
  const isSmallMobile = !isWeb && width < 380;
  const screenHorizontalPadding = isWeb ? 24 : isSmallMobile ? 14 : 16;

  const notificationItems = useMemo(
    () => getUniqueNotificationItems(notifications.data ?? []),
    [notifications.data]
  );

  const markNotificationRead = async (notification: NotificationItem) => {
    if (!notification.is_read) await markRead.mutateAsync(notification.id);
  };

  const handleNotificationActionPress = async (notification: NotificationItem) => {
    await markNotificationRead(notification);
    await performNotificationAction({
      type: notification.type,
      actionType: notification.action_type ?? null,
      actionValue: notification.action_value ?? null,
      surveyBookingId: notification.survey_booking_id ?? null,
    }, navigation);
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <NotificationCard
      notification={item}
      cartImage={cartImage}
      onActionPress={(notification) => void handleNotificationActionPress(notification)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <NotificationHeader title={t('notifications.title')} onBack={() => navigation.goBack()} />

      {notifications.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#B07800" />
          <Text style={styles.stateText}>Loading notifications...</Text>
        </View>
      ) : notifications.isError ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Bell color="#B07800" size={30} strokeWidth={2.3} />
          </View>
          <Text style={styles.stateTitle}>Unable to load notifications</Text>
          <Text style={styles.stateText}>Please check your connection and try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => void notifications.refetch()} accessibilityRole="button">
            <RefreshCw color="#10213A" size={16} strokeWidth={2.5} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : notificationItems.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Bell color="#B07800" size={30} strokeWidth={2.3} />
          </View>
          <Text style={styles.stateTitle}>{t('notifications.emptyTitle')}</Text>
          <Text style={styles.stateText}>{t('notifications.emptyText')}</Text>
        </View>
      ) : (
        <FlatList
          data={notificationItems}
          keyExtractor={(item) => item.notification_key || item.id}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContent,
            isWeb && styles.webListContent,
            {
              paddingHorizontal: screenHorizontalPadding,
              paddingBottom: Math.max(80, insets.bottom + 80),
            },
          ]}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF8F1',
  },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E1D4',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF8F1',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 44,
  },
  headerTitle: {
    color: '#10213A',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  listContent: {
    width: '100%',
    paddingTop: 16,
    alignSelf: 'center',
  },
  webListContent: {
    maxWidth: 760,
  },
  cardSeparator: {
    height: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F3DCA8',
  },
  stateTitle: {
    marginTop: 18,
    color: '#10213A',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
  },
  stateText: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#F7B500',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    marginLeft: 8,
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900',
  },
});
