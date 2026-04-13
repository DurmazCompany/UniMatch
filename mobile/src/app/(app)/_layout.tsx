import { Tabs } from "expo-router";
import { Home, Heart, User, MessageCircle } from "lucide-react-native";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: "#E8445A",
        tabBarInactiveTintColor: "#48484A",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, size }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, size }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="chat/[matchId]" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
  );
}

