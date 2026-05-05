import { useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, useColorScheme } from "react-native";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
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
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { Component, ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";
import { initRevenueCat } from "@/lib/revenue-cat";
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  addNotificationListener,
  clearBadgeCount,
  handleAdminNotification,
} from "@/lib/notifications";
import type { Subscription } from "expo-notifications";
import { theme } from "@/lib/theme";
import { usePrivacyStore } from "@/lib/state/privacyStore";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

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
        <View style={{ flex: 1, backgroundColor: theme.base.bg, alignItems: "center", justifyContent: "center", padding: 40 }}>
          <Text style={{ color: theme.base.text, fontSize: 24, fontWeight: "700", marginBottom: 12 }}>Bir şeyler ters gitti.</Text>
          <Text style={{ color: theme.base.muted, textAlign: "center", marginBottom: 24 }}>Uygulama beklenmedik bir hata ile karşılaştı.</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.primary, borderRadius: 8 }}>
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
  const queryClientInstance = useQueryClient();
  const notificationResponseListener = useRef<Subscription | null>(null);

  // Initialize RevenueCat and sync blocks when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      initRevenueCat(session.user.id);
      usePrivacyStore.getState().syncBlocks();
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
        // Admin-driven notifications (ban, premium, role, ambassador, etc.)
        handleAdminNotification(data, queryClientInstance);
      });

      return () => {
        if (notificationResponseListener.current) {
          notificationResponseListener.current.remove();
        }
        foregroundListener.remove();
      };
    }
  }, [session?.user?.id, router, queryClientInstance]);

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

  const bg = "#F8F4F6";

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bg },
            animation: "fade",
          }}
        >
          {session?.user ? (
            <>
              <Stack.Screen name="(app)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen
                name="paywall"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="create-event"
                options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }}
              />
              <Stack.Screen
                name="ambassador"
                options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }}
              />
              <Stack.Screen name="ambassador/apply" options={{ headerShown: false }} />
              <Stack.Screen name="events/index" options={{ headerShown: false }} />
              <Stack.Screen name="events/create" options={{ headerShown: false }} />
              <Stack.Screen name="profile/[userId]" options={{ headerShown: false, animation: "slide_from_right" }} />
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

      {/* Loading overlay — shown while session check is in flight */}
      {isLoading ? (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "#F8F4F6", alignItems: "center", justifyContent: "center",
        }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
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
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
  });

  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

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
