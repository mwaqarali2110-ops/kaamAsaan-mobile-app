import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Menu } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { AppMenuDrawer } from './AppMenuDrawer';

const logo = require('../../assets/onboarding/Splash-Screen-Cart-1-transparent.png');

type AppTopBarProps = {
  navigation: any;
  // The current screen/tab name, used only to highlight the matching row in
  // the hamburger drawer (e.g. "Marketplace", "MySystem", "MyProject",
  // "Profile"). Pass the drawer route name, not the tab's display title.
  activeRoute?: string;
};

// Shared topbar: hamburger menu, centered brand wordmark, notifications bell
// with unread dot. Originally only existed on HomeScreen; every tab now
// renders this identical bar so navigation and unread-notification access
// are consistent app-wide. Render as the first child inside the screen's
// own top-edge SafeAreaView — this component has no safe-area handling of
// its own, matching how HomeScreen's original header worked.
export const AppTopBar = ({ navigation, activeRoute }: AppTopBarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const userId = useAuthStore((state) => state.session?.user.id);
  const unreadNotificationsQuery = useUnreadNotificationsCount(userId);
  const unreadNotifications = unreadNotificationsQuery.data ?? 0;

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerBar}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.headerPressed]}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            hitSlop={12}
          >
            <Menu color="#111827" size={22} strokeWidth={2} />
          </Pressable>
          <View pointerEvents="none" style={styles.logoWrap}>
            <Image source={logo} style={styles.logoImg} resizeMode="contain" />
            <Text style={styles.logoText}>
              <Text style={styles.logoTextKaam}>Kaam</Text>
              <Text style={styles.logoTextAsaan}>Asaan</Text>
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, styles.notificationButton, pressed && styles.headerPressed]}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            hitSlop={12}
          >
            <Bell color="#B07800" size={20} strokeWidth={2} />
            {unreadNotifications > 0 ? <View style={styles.notifDot} /> : null}
          </Pressable>
        </View>
      </View>
      <AppMenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} activeRoute={activeRoute} />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#F4F2EE',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 0,
    zIndex: 10
  },
  headerBar: {
    height: 40,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999
  },
  notificationButton: { position: 'relative' },
  headerPressed: { opacity: 0.86, backgroundColor: 'rgba(17,24,39,0.05)' },
  notifDot: {
    position: 'absolute',
    right: 5,
    top: 4,
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  logoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  logoImg: { width: 31, height: 30, opacity: 0.96 },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
    letterSpacing: -0.6
  },
  logoTextKaam: { color: '#08213F' },
  logoTextAsaan: { color: '#E8A000' }
});
