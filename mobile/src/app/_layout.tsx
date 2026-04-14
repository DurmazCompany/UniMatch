import { useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  useFonts,
  Syne_700Bold,
  Syne_600SemiBold,
} from "@expo-google-fonts/syne";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Component, ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";
import { initRevenueCat } from "@/lib/revenue-cat";
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  addNotificationListener,
  clearBadgeCount,
} from "@/lib/notifications";
import type { Subscription } from "expo-notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 12 }}>Bir şeyler ters gitti.</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 24 }}>Uygulama beklenmedik bir hata ile karşılaştı.</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#E8445A", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Tekrar Dene</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootLayoutNav() {
  const { data: session, isLoading } = useSession();
  const router = useRouter();
  const notificationResponseListener = useRef<Subscription | null>(null);

  // Initialize RevenueCat when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      initRevenueCat(session.user.id);
    }
  }, [session?.user?.id]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      // Register for push notifications
      registerForPushNotifications();

      // Clear badge count when app is opened
      clearBadgeCount();

      // Handle notification responses (when user taps notification)
      notificationResponseListener.current = addNotificationResponseListener(
        (response) => {
          const data = response.notification.request.content.data;
          if (data?.type === "match" && data?.matchId) {
            router.push(`/chat/${data.matchId}`);
          } else if (data?.type === "message" && data?.matchId) {
            router.push(`/chat/${data.matchId}`);
          }
        }
      );

      // Handle foreground notifications (update UI in real-time)
      const foregroundListener = addNotificationListener((notification) => {
        const data = notification.request.content.data;
        if (data?.type === "message" || data?.type === "match") {
          queryClient.invalidateQueries({ queryKey: ["messages", data.matchId] });
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["match", data.matchId] });
        }
      });

      return () => {
        if (notificationResponseListener.current) {
          notificationResponseListener.current.remove();
        }
        foregroundListener.remove();
      };
    }
  }, [session?.user?.id, router]);

  // Redirect based on session state
  useEffect(() => {
    if (isLoading) return;

    if (session?.user) {
      // If boarding is needed, could check profile here, but index.tsx handles that.
      // For now, just landing in (app) or onboarding
      // router.replace("/(app)"); // User pattern
    } else {
      router.replace("/");
    }
  }, [session, isLoading, router]);

  if (isLoading) return null;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0D0D0D" }}
      onLayout={() => SplashScreen.hideAsync()}
    >
      <StatusBar style="light" />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0D0D0D" },
              animation: "fade",
            }}
          >

            {session?.user ? (
              <>
                <Stack.Screen name="(app)" />
                <Stack.Screen name="onboarding" />
              </>
            ) : (
              <>
                <Stack.Screen name="index" />
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
                <Stack.Screen name="forgot-password" />
              </>
            )}
          </Stack>
        </ErrorBoundary>
    </View>
  );
}

// Root Layout Component
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Hide splash once fonts are loaded or on error (don't block forever)
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
