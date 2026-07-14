import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/mobile/navigation/RootNavigator';
import { I18nProvider } from '@/i18n/I18nProvider';

const queryClient = new QueryClient();

// The Roboto webfont has to be loaded via a <link> tag: @import in
// global.css gets stripped by the NativeWind CSS pipeline.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const robotoLink = document.createElement('link');
  robotoLink.rel = 'stylesheet';
  robotoLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
  document.head.appendChild(robotoLink);
}

export default function App() {
  const { width } = useWindowDimensions();
  const app = (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SafeAreaProvider>
      </I18nProvider>
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
