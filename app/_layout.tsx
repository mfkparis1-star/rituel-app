import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    // Tapping the evening reminder should open the guided ritual, not
    // just the app. Lazy require so a missing native module (older
    // binary) can't crash startup.
    let sub: any = null;
    try {
      const N = require('expo-notifications');
      sub = N.addNotificationResponseReceivedListener((response: any) => {
        const route = response?.notification?.request?.content?.data?.route;
        if (route) { router.push(route as any); }
      });
    } catch {
      // notifications module unavailable — no-op
    }
    return () => { try { sub?.remove?.(); } catch {} };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="add-product" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
