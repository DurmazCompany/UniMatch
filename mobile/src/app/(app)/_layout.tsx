import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { Match } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";

function useHasUnreadMessages() {
  const { data: session } = useSession();
  const myUserId = session?.user?.id;

  const { data: matches } = useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      try {
        const result = await api.get<Match[]>("/api/matches");
        return result ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!myUserId,
    staleTime: 30_000,
  });

  if (!matches || !myUserId) return false;
  return matches.some((m) => {
    const last = m.messages[0];
    return last && last.senderId !== myUserId;
  });
}

export default function AppLayout() {
  const hasUnread = useHasUnreadMessages();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
        tabBarStyle: {
          position: "absolute",
          marginHorizontal: 20,
          bottom: insets.bottom + 8,
          left: 0,
          right: 0,
          backgroundColor: Colors.primary,
          borderRadius: 30,
          height: 64,
          paddingTop: 8,
          paddingHorizontal: 12,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="this-week"
        options={{
          title: "Bu Hafta",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={26} color={color} />
              {hasUnread && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -7,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: Colors.coral,
                    borderWidth: 1.5,
                    borderColor: Colors.white,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat/[matchId]"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen
        name="settings/notifications"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
    </Tabs>
  );
}
