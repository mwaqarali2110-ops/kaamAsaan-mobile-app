import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, Home, PanelsTopLeft, ShoppingBag, User } from 'lucide-react-native';
import { getSafeBottomPadding } from './SafeAreaLayout';
import { colors } from '@/constants/colors';
import type { MainTabParamList } from '@/types/navigation.types';

const TAB_BAR_CONTENT_HEIGHT = 64;

const tabs: { key: keyof MainTabParamList; label: string; Icon: typeof Home }[] = [
  { key: 'Home', label: 'Home', Icon: Home },
  { key: 'Marketplace', label: 'Marketplace', Icon: ShoppingBag },
  { key: 'MySystem', label: 'My System', Icon: PanelsTopLeft },
  { key: 'MyProject', label: 'My Project', Icon: ClipboardList },
  { key: 'Profile', label: 'Profile', Icon: User }
];

// MarketplaceFlowScreen, SolarAccessoriesScreen, and EvChargersScreen are
// root-level Stack screens (siblings of MainTabs in RootNavigator, not
// nested inside its Tab.Navigator — see RootNavigator.tsx), so React
// Navigation's real bottom tab bar simply does not render on them. This
// visually replicates MainTabs' tab bar exactly (same icons, colors,
// height, no ripple — see RootNavigator's tabBarButton override) so
// marketplace browsing looks consistent with Home. Tapping a tab jumps back
// into MainTabs at that tab, same as the real bar would.
export const AppBottomTabBar = ({ navigation, activeTab = 'Marketplace' }: { navigation: any; activeTab?: keyof MainTabParamList }) => {
  const insets = useSafeAreaInsets();
  const safeBottom = getSafeBottomPadding(insets.bottom, 10);

  return (
    <View style={[styles.bar, { height: TAB_BAR_CONTENT_HEIGHT + safeBottom, paddingBottom: safeBottom }]}>
      {tabs.map(({ key, label, Icon }) => {
        const focused = key === activeTab;
        const tint = focused ? colors.amber : colors.muted;
        return (
          <Pressable
            key={key}
            style={styles.item}
            onPress={() => navigation.navigate('MainTabs', { screen: key })}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
          >
            <Icon color={tint} size={20} />
            <Text style={[styles.label, { color: tint }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// Reserve the same amount of space AppBottomTabBar occupies, for screens
// that need to pad their scrollable content so the fixed bar never covers
// the last item. Height must stay in sync with `styles.bar` above.
export const useAppBottomTabBarHeight = () => {
  const insets = useSafeAreaInsets();
  return TAB_BAR_CONTENT_HEIGHT + getSafeBottomPadding(insets.bottom, 10);
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 5
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 2
  },
  label: {
    fontSize: 10,
    fontWeight: '800'
  }
});
