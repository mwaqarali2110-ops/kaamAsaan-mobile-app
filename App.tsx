import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/mobile/navigation/RootNavigator';

const queryClient = new QueryClient();

export default function App() {
  const { width } = useWindowDimensions();
  const app = (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );

  if (Platform.OS !== 'web') return app;

  const compactWeb = width <= 430;

  return (
    <View style={[styles.webStage, compactWeb && styles.webStageCompact]}>
      <View style={[styles.webPhone, compactWeb && styles.webPhoneCompact]}>{app}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webStage: {
    minHeight: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDE8E9'
  },
  webPhone: {
    width: '100%',
    maxWidth: 390,
    height: '100%',
    maxHeight: 844,
    overflow: 'hidden',
    backgroundColor: '#FFF7E6'
  },
  webStageCompact: {
    alignItems: 'stretch'
  },
  webPhoneCompact: {
    maxWidth: '100%'
  }
});
