import { Tabs } from "expo-router";
import { Home, MessageCircle, User, CalendarDays } from "lucide-react-native";
import { View, Platform } from "react-native";
import { theme } from "@/lib/theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 0.5,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 28 : 14,
          paddingHorizontal: 0,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: "rgba(255,255,255,0.3)",
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
                  borderColor: theme.tabBarBackground,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 4,
                }}
              />
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
