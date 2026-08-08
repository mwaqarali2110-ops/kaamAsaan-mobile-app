import { I18nProvider } from "@/i18n/I18nProvider";
import { RootNavigator } from "@/mobile/navigation/RootNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NativeSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

const queryClient = new QueryClient();

if (Platform.OS !== "web") {
  void NativeSplashScreen.preventAutoHideAsync().catch(() => undefined);
  NativeSplashScreen.setOptions({ duration: 400, fade: true });
}

export default function App() {
  const { width } = useWindowDimensions();
  const hasLaidOutRef = useRef(false);
  const startupDestinationReadyRef = useRef(false);
  const hasHiddenNativeSplashRef = useRef(false);

  const hideNativeSplashWhenReady = useCallback(() => {
    if (
      Platform.OS === "web" ||
      hasHiddenNativeSplashRef.current ||
      !hasLaidOutRef.current ||
      !startupDestinationReadyRef.current
    ) {
      return;
    }

    hasHiddenNativeSplashRef.current = true;
    void NativeSplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const handleRootLayout = useCallback(() => {
    hasLaidOutRef.current = true;
    hideNativeSplashWhenReady();
  }, [hideNativeSplashWhenReady]);

  const handleStartupDestinationReady = useCallback(() => {
    startupDestinationReadyRef.current = true;
    hideNativeSplashWhenReady();
  }, [hideNativeSplashWhenReady]);

  const app = (
    <View style={styles.appRoot} onLayout={handleRootLayout}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <RootNavigator onReady={handleStartupDestinationReady} />
          </SafeAreaProvider>
        </I18nProvider>
      </QueryClientProvider>
    </View>
  );

  if (Platform.OS !== "web") return app;

  const compactWeb = width <= 430;

  return (
    <View style={[styles.webStage, compactWeb && styles.webStageCompact]}>
      <View style={[styles.webPhone, compactWeb && styles.webPhoneCompact]}>
        {app}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: "#FFF4DC",
  },
  webStage: {
    minHeight: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDE8E9",
  },
  webPhone: {
    width: "100%",
    maxWidth: 390,
    height: "100%",
    maxHeight: 844,
    overflow: "hidden",
    backgroundColor: "#FFF7E6",
  },
  webStageCompact: {
    alignItems: "stretch",
  },
  webPhoneCompact: {
    maxWidth: "100%",
  },
});
