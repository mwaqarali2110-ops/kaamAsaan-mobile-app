import { ApiLoaderOverlay } from "@/components/ui/ApiLoaderOverlay";
import { I18nProvider } from "@/i18n/I18nProvider";
import { RootNavigator } from "@/mobile/navigation/RootNavigator";
import { useApiLoaderStore } from "@/store/useApiLoaderStore";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NativeSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

// Every useMutation (booking submits, order placement, etc.) shows the
// themed global loader automatically — no per-screen wiring needed.
// Queries are deliberately excluded: blocking the whole screen on every
// background refetch would be a worse experience than a local spinner.
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onMutate: () => {
      useApiLoaderStore.getState().show();
    },
    onSettled: () => {
      useApiLoaderStore.getState().hide();
    }
  })
});

if (Platform.OS !== "web") {
  void NativeSplashScreen.preventAutoHideAsync().catch(() => undefined);
  NativeSplashScreen.setOptions({ duration: 400, fade: true });
}

// Android's system font IS Roboto, so native screens render it with no
// extra work. Web has no such default, so the webfont has to be injected
// via a <link> tag here — @import in global.css gets stripped by the
// NativeWind CSS pipeline.
if (Platform.OS === "web" && typeof document !== "undefined") {
  const robotoLink = document.createElement("link");
  robotoLink.rel = "stylesheet";
  robotoLink.href =
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap";
  document.head.appendChild(robotoLink);
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
            <ApiLoaderOverlay />
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
