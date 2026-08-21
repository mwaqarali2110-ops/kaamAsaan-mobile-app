import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

const logo = require('../../assets/onboarding/Splash-Screen-Cart-1-transparent.png');

const drawerItems = [
  { label: 'Home', route: 'Home' },
  { label: 'How it works', route: 'HowItWorks' },
  { label: 'Marketplace', route: 'Marketplace' },
  { label: 'My Orders', route: 'MyOrders' },
  { label: 'Design System', route: 'DesignSystem' },
  { label: 'My Project', route: 'MyProject' },
  { label: 'Complaint', route: 'Complaint' },
  { label: 'Help Center', route: 'HelpCenter' },
  { label: 'Profile', route: 'Profile' }
];

const secondaryItems = [
  { label: 'Settings', route: 'Settings' },
  { label: 'Solar Care', route: 'SolarCare' }
];

type AppMenuDrawerProps = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  // Which drawer row is highlighted as "you are here". Pass the current
  // screen/tab's own name (e.g. "Marketplace", "MyProject") — falls back to
  // no highlight if it doesn't match a drawer row.
  activeRoute?: string;
};

// Shared app-wide navigation drawer, opened from AppTopBar's hamburger
// button. Originally lived only inside HomeScreen (as HomeMenuModal) with
// "Home" hardcoded as the always-highlighted row; extracted here so every
// tab's topbar opens the identical drawer, correctly highlighting whichever
// tab is actually active.
export const AppMenuDrawer = ({ visible, onClose, navigation, activeRoute }: AppMenuDrawerProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.round(width * 0.8);

  const navigateToCorrectRoute = (route: string) => {
    const routeMap: Record<string, () => void> = {
      Home: () => navigation.navigate('Home'),
      HowItWorks: () => navigation.navigate('HowItWorks'),
      Marketplace: () => navigation.navigate('Marketplace'),
      MyOrders: () => navigation.navigate('MyOrders'),
      DesignSystem: () => navigation.navigate('DesignFlow'),
      MyProject: () => navigation.navigate('MyProject'),
      Complaint: () => navigation.navigate('Complaint'),
      HelpCenter: () => navigation.navigate('HelpCenter'),
      Profile: () => navigation.navigate('Profile'),
      Settings: () => navigation.navigate('Profile'),
      SolarCare: () => navigation.navigate('PreventiveMaintenance')
    };

    onClose();
    routeMap[route]?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.drawerBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: insets.top + 14,
              paddingBottom: insets.bottom + 12
            }
          ]}
        >
          <View style={styles.drawerPanelHeader}>
            <View style={styles.drawerBrand}>
              <Image source={logo} style={styles.drawerBrandLogo} resizeMode="contain" />
              <Text style={styles.drawerBrandText} numberOfLines={1}>
                <Text style={styles.drawerBrandKaam}>Kaam</Text>
                <Text style={styles.drawerBrandAsaan}>Asaan</Text>
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.drawerClose, pressed && styles.headerPressed]}
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            >
              <X color="#334155" size={24} strokeWidth={2.4} />
            </Pressable>
          </View>
          <View style={styles.divider} />
          <View style={styles.menuSection}>
            {drawerItems.map((item) => {
              const active = item.route === activeRoute;
              return (
                <Pressable
                  key={item.label}
                  style={[styles.drawerRow, active && styles.activeDrawerRow]}
                  onPress={() => navigateToCorrectRoute(item.route)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.drawerLabel, active && styles.activeDrawerLabel]}>{item.label}</Text>
                  <Text style={[styles.drawerChevron, active && styles.activeDrawerChevron]}>›</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.divider} />
          <View style={styles.menuSection}>
            {secondaryItems.map((item) => (
              <Pressable key={item.label} style={styles.drawerRow} onPress={() => navigateToCorrectRoute(item.route)} accessibilityRole="button">
                <Text style={styles.drawerLabel}>{item.label}</Text>
                <Text style={styles.drawerChevron}>›</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.footer}>
            <Text style={styles.drawerFooterBrand}>KaamAsaan</Text>
            <Text style={styles.drawerFooterText}>Pakistan's Smart Solar Marketplace</Text>
            <Text style={styles.drawerFooterVersion}>v1.0</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  headerPressed: { opacity: 0.86, backgroundColor: 'rgba(17,24,39,0.05)' },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.32)',
    justifyContent: 'flex-start'
  },
  drawer: {
    height: '100%',
    backgroundColor: '#FFFBF2',
    paddingHorizontal: 22,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#111827',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8
  },
  drawerPanelHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  drawerBrand: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  drawerBrandLogo: { width: 36, height: 34 },
  drawerBrandText: {
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  drawerBrandKaam: { color: '#08213F' },
  drawerBrandAsaan: { color: '#E8A000' },
  drawerClose: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.12)',
    marginVertical: 10
  },
  menuSection: { width: '100%' },
  drawerRow: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 2
  },
  activeDrawerRow: {
    backgroundColor: '#FFF2C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F5B400',
    paddingLeft: 10
  },
  drawerLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#101828'
  },
  activeDrawerLabel: { color: '#D99A00' },
  drawerChevron: {
    fontSize: 24,
    lineHeight: 24,
    color: '#344054',
    marginLeft: 12
  },
  activeDrawerChevron: { color: '#D99A00' },
  footer: {
    marginTop: 'auto',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 24, 40, 0.12)'
  },
  drawerFooterBrand: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800'
  },
  drawerFooterText: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600'
  },
  drawerFooterVersion: {
    marginTop: 10,
    color: '#D99A00',
    fontSize: 12,
    fontWeight: '800'
  }
});
