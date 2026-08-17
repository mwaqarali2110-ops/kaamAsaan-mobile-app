import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, X } from 'lucide-react-native';
import type { CustomerNotification } from '@/services/notifications.api';
import { useNotificationSessionStore } from '@/store/useNotificationSessionStore';
import { selectLatestEligibleUrgentNotification } from '@/utils/notificationPriority';

const BANNER_VISIBLE_DURATION = 10_000;
const BANNER_ENTER_DURATION = 400;
const BANNER_EXIT_DURATION = 320;
const HIDDEN_TRANSLATE_Y = -120;
const PRESENTED_STORAGE_PREFIX = 'kaamasaan.presented-notifications.';
const DISMISSED_STORAGE_PREFIX = 'kaamasaan.dismissed-notifications.';

type Props = {
  userId?: string;
  notifications: CustomerNotification[];
  notificationsReady: boolean;
  onPress: (notification: CustomerNotification) => void;
  topOffset: number;
};

const getBannerMessage = (notification: CustomerNotification) => {
  if (notification.type !== 'premium_care_visit_scheduled') return notification.message;
  return notification.message.replace(/\s+\(([^)]+)\)\.$/, ', $1.');
};

export const TopNotificationBanner = ({
  userId,
  notifications,
  notificationsReady,
  onPress,
  topOffset
}: Props) => {
  const translateY = useRef(new Animated.Value(HIDDEN_TRANSLATE_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const [storageReady, setStorageReady] = useState(false);
  const [presentedIds, setPresentedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeNotification, setActiveNotification] = useState<CustomerNotification | null>(null);
  const sessionUserId = useNotificationSessionStore((state) => state.userId);
  const hasHandledStartupNotification = useNotificationSessionStore((state) => state.hasHandledStartupNotification);
  const hasShownAutomaticNotification = useNotificationSessionStore((state) => state.hasShownAutomaticNotification);
  const knownNotificationIds = useNotificationSessionStore((state) => state.knownNotificationIds);
  const beginSession = useNotificationSessionStore((state) => state.beginSession);
  const markStartupHandled = useNotificationSessionStore((state) => state.markStartupHandled);
  const markAutomaticNotificationShown = useNotificationSessionStore((state) => state.markAutomaticNotificationShown);
  const rememberNotifications = useNotificationSessionStore((state) => state.rememberNotifications);
  const presentedStorageKey = userId ? `${PRESENTED_STORAGE_PREFIX}${userId}` : null;
  const dismissedStorageKey = userId ? `${DISMISSED_STORAGE_PREFIX}${userId}` : null;

  useEffect(() => () => {
    mounted.current = false;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    translateY.stopAnimation();
    opacity.stopAnimation();
  }, [opacity, translateY]);

  useEffect(() => {
    let cancelled = false;
    setStorageReady(false);
    setActiveNotification(null);
    translateY.setValue(HIDDEN_TRANSLATE_Y);
    opacity.setValue(0);

    if (!userId || !presentedStorageKey || !dismissedStorageKey) {
      setPresentedIds(new Set());
      setDismissedIds(new Set());
      return () => { cancelled = true; };
    }

    beginSession(userId);
    void Promise.all([
      AsyncStorage.getItem(presentedStorageKey),
      AsyncStorage.getItem(dismissedStorageKey)
    ]).then(([storedPresented, storedDismissed]) => {
      if (cancelled) return;
      try {
        const presented = storedPresented ? JSON.parse(storedPresented) : [];
        setPresentedIds(new Set(Array.isArray(presented) ? presented.filter((id): id is string => typeof id === 'string') : []));
      } catch {
        setPresentedIds(new Set());
      }
      try {
        const dismissed = storedDismissed ? JSON.parse(storedDismissed) : [];
        setDismissedIds(new Set(Array.isArray(dismissed) ? dismissed.filter((id): id is string => typeof id === 'string') : []));
      } catch {
        setDismissedIds(new Set());
      }
      setStorageReady(true);
    });

    return () => { cancelled = true; };
  }, [beginSession, dismissedStorageKey, opacity, presentedStorageKey, translateY, userId]);

  const persistPresented = useCallback((notificationIds: string[]) => {
    if (!presentedStorageKey || notificationIds.length === 0) return;
    setPresentedIds((current) => {
      const next = new Set([...current, ...notificationIds]);
      void AsyncStorage.setItem(presentedStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [presentedStorageKey]);

  useEffect(() => {
    if (!userId || sessionUserId !== userId || !storageReady || !notificationsReady) return;
    const currentIds = notifications.map((notification) => notification.id);
    const excludedIds = new Set([...presentedIds, ...dismissedIds]);

    if (!hasHandledStartupNotification) {
      markStartupHandled(currentIds);
      persistPresented(currentIds);
      if (hasShownAutomaticNotification || activeNotification) return;
      const startupNotification = selectLatestEligibleUrgentNotification(notifications, excludedIds);
      if (startupNotification) {
        markAutomaticNotificationShown();
        setActiveNotification(startupNotification);
      }
      return;
    }

    const knownIds = new Set(knownNotificationIds);
    const newlyArrived = notifications.filter((notification) => !knownIds.has(notification.id));
    if (newlyArrived.length === 0) return;

    // Record the whole incoming batch immediately. If a banner is already visible,
    // these items remain in Notification Center and can never become a popup queue.
    rememberNotifications(newlyArrived.map((notification) => notification.id));
    persistPresented(newlyArrived.map((notification) => notification.id));
    if (hasShownAutomaticNotification || activeNotification) return;

    const urgentNotification = selectLatestEligibleUrgentNotification(newlyArrived, excludedIds, true);
    if (urgentNotification) {
      markAutomaticNotificationShown();
      setActiveNotification(urgentNotification);
    }
  }, [
    activeNotification,
    dismissedIds,
    hasHandledStartupNotification,
    hasShownAutomaticNotification,
    knownNotificationIds,
    markAutomaticNotificationShown,
    markStartupHandled,
    notifications,
    notificationsReady,
    persistPresented,
    presentedIds,
    rememberNotifications,
    sessionUserId,
    storageReady,
    userId
  ]);

  const persistDismissal = useCallback((notificationId: string) => {
    if (!dismissedStorageKey) return;
    setDismissedIds((current) => {
      const next = new Set(current).add(notificationId);
      void AsyncStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [dismissedStorageKey]);

  const dismiss = useCallback(() => {
    if (!activeNotification) return;
    persistDismissal(activeNotification.id);
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: HIDDEN_TRANSLATE_Y,
        duration: BANNER_EXIT_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: BANNER_EXIT_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished && mounted.current) setActiveNotification(null);
    });
  }, [activeNotification, opacity, persistDismissal, translateY]);

  useEffect(() => {
    if (!activeNotification) return;
    translateY.setValue(HIDDEN_TRANSLATE_Y);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: BANNER_ENTER_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: BANNER_ENTER_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (!finished || !mounted.current) return;
      AccessibilityInfo.announceForAccessibility(`${activeNotification.title}. ${activeNotification.message}`);
      dismissTimer.current = setTimeout(dismiss, BANNER_VISIBLE_DURATION);
    });

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [activeNotification, dismiss, opacity, translateY]);

  if (!activeNotification) return null;
  const bannerMessage = getBannerMessage(activeNotification);

  return (
    <Animated.View
      style={[styles.banner, { top: topOffset, opacity, transform: [{ translateY }] }]}
      accessibilityRole="alert"
      accessibilityLabel={`${activeNotification.title}. ${bannerMessage}`}
    >
      <Pressable
        style={styles.bannerAction}
        onPress={() => {
          dismiss();
          onPress(activeNotification);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open notification: ${activeNotification.title}`}
      >
        <View style={styles.iconWrap}>
          <Bell color="#A86F00" size={20} strokeWidth={2.3} />
          {!activeNotification.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{activeNotification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{bannerMessage}</Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.closeButton}
        onPress={(event) => {
          event.stopPropagation();
          dismiss();
        }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={8}
      >
        <X color="#64748B" size={18} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 7,
    minHeight: 78,
    maxHeight: 96,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#EBD8A9',
    backgroundColor: '#FFFDF8',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14
  },
  bannerAction: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingLeft: 14,
    paddingVertical: 10
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F0DCA9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B'
  },
  copy: { flex: 1, minWidth: 0 },
  title: { color: '#10213A', fontSize: 15, lineHeight: 20, fontWeight: '700' },
  message: { marginTop: 2, color: '#64748B', fontSize: 13, lineHeight: 17, fontWeight: '500' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginRight: 2 }
});
