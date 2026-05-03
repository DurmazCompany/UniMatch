import { Tabs } from "expo-router";
import { Home, MessageCircle, User, CalendarDays } from "lucide-react-native";
import { View, Platform } from "react-native";
import { theme } from "@/lib/theme";
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0EAF0",
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 0 : 14,
          paddingHorizontal: 0,
          height: Platform.OS === "ios" ? 83 : 60,
        },
        tabBarActiveTintColor: "#E8436A",
        tabBarInactiveTintColor: "#C4A8B4",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focused ? 1.18 : 1 }],
              }}
            >
              {focused ? (
                <View
                  style={{
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                  }}
                >
                  <Home size={26} color={color} strokeWidth={2.5} fill={color} />
                </View>
              ) : (
                <Home size={24} color={color} strokeWidth={2} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="this-week"
        options={{
          title: "Bu Hafta",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focused ? 1.18 : 1 }],
              }}
            >
              {focused ? (
                <View
                  style={{
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                  }}
                >
                  <CalendarDays size={26} color={color} strokeWidth={2.5} />
                </View>
              ) : (
                <CalendarDays size={24} color={color} strokeWidth={2} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transform: [{ scale: focused ? 1.18 : 1 }],
              }}
            >
              {focused ? (
                <View
                  style={{
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                  }}
                >
                  <MessageCircle size={26} color={color} strokeWidth={2.5} fill={`${color}30`} />
                </View>
              ) : (
                <MessageCircle size={24} color={color} strokeWidth={2} />
              )}
              {/* Notification badge */}
              {hasUnread && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -7,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: theme.primary,
                    borderWidth: 1.5,
                    borderColor: "#FFFFFF",
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 4,
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
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: focused ? 1.18 : 1 }],
              }}
            >
              {focused ? (
                <View
                  style={{
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                  }}
                >
                  <User size={26} color={color} strokeWidth={2.5} fill={`${color}40`} />
                </View>
              ) : (
                <User size={24} color={color} strokeWidth={2} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen name="chat/[matchId]" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="settings/notifications" options={{ href: null }} />
    </Tabs>
  );
}
