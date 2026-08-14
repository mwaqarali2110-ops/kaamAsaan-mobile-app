import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { useApiLoaderStore } from '@/store/useApiLoaderStore';

// Mounted once at the app root. Shows automatically for every react-query
// mutation (wired via the MutationCache in App.tsx) and for any manual call
// wrapped in useApiLoader()'s withApiLoader(). Styled to match the app's
// card language: white card, warm cream/navy palette, amber accent.
export const ApiLoaderOverlay = () => {
  const visible = useApiLoaderStore((state) => state.activeCount > 0);
  const label = useApiLoaderStore((state) => state.label);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true
    }).start();
  }, [opacity, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity }]} accessibilityViewIsModal accessibilityLiveRegion="polite">
        <View style={styles.card}>
          <ActivityIndicator color="#F5B400" size="large" />
          <Text style={styles.label}>{label ?? 'Please wait…'}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    minWidth: 140,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3CF',
    paddingVertical: 22,
    paddingHorizontal: 26,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#403622',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6
  },
  label: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  }
});
