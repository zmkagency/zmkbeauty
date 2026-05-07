import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/query";
import { useAuthStore } from "@/lib/auth";
import { setupNotificationHandler } from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();
setupNotificationHandler();

export default function RootLayout() {
  const { bootstrap, isLoading, isAuthenticated, hasOnboarded } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync();

    const firstSeg = segments[0];
    const inAuthGroup = firstSeg === "(auth)";
    const inTabs = firstSeg === "(tabs)";
    const inOnboarding = firstSeg === "onboarding";

    if (!hasOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasOnboarded && !isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)/home");
    }
  }, [isLoading, isAuthenticated, hasOnboarded, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="store/[slug]" options={{ presentation: "card" }} />
            <Stack.Screen name="booking/[slug]" options={{ presentation: "modal" }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
