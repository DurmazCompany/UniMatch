import { Tabs } from "expo-router";
import { Home, MessageCircle, User } from "lucide-react-native";
import { View } from "react-native";
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
          height: 70,
          paddingTop: 8,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", position: "relative" }}>
              <MessageCircle size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              {/* Notification badge */}
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -8,
                  backgroundColor: theme.primary,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: theme.tabBarBackground,
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
            <View style={{ alignItems: "center" }}>
              <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
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
