import { useState, useEffect, useCallback } from "react";
import { View, Text, Switch, Pressable, ActivityIndicator, StatusBar, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/theme";
import { UMCard } from "@/components/ui";

type IoniconName = keyof typeof Ionicons.glyphMap;

const STORAGE_KEY = "notification_preferences";

interface NotificationPreferences {
  newMatches: boolean;
  messages: boolean;
  superLikes: boolean;
  dailyReminders: boolean;
  promotions: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newMatches: true,
  messages: true,
  superLikes: true,
  dailyReminders: false,
  promotions: false,
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const savePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleToggle = useCallback((key: keyof NotificationPreferences) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferences((prev) => {
      const newPreferences = { ...prev, [key]: !prev[key] };
      savePreferences(newPreferences);
      return newPreferences;
    });
  }, [savePreferences]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgLight, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="notifications-screen">
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          testID="back-button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          })}
        >
          <Ionicons name="chevron-back-outline" size={24} color={Colors.textDark} />
        </Pressable>
        <Text style={{ flex: 1, color: Colors.textDark, fontSize: 24, fontFamily: "DMSans_700Bold" }}>
          Bildirimler
        </Text>
        {isSaving ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
        <UMCard>
          <NotificationRow
            testID="toggle-new-matches"
            icon="heart-outline"
            label="Yeni Eşleşmeler"
            description="Birisi seninle eşleşti"
            value={preferences.newMatches}
            onToggle={() => handleToggle("newMatches")}
          />
          <NotificationRow
            testID="toggle-messages"
            icon="chatbubble-outline"
            label="Mesajlar"
            description="Yeni mesaj aldığında bildirim al"
            value={preferences.messages}
            onToggle={() => handleToggle("messages")}
          />
          <NotificationRow
            testID="toggle-super-likes"
            icon="star-outline"
            label="Süper Beğeniler"
            description="Birisi sana süper beğeni attı"
            value={preferences.superLikes}
            onToggle={() => handleToggle("superLikes")}
          />
          <NotificationRow
            testID="toggle-daily-reminders"
            icon="notifications-outline"
            label="Günlük Hatırlatmalar"
            description="Günlük aktivite hatırlatmaları"
            value={preferences.dailyReminders}
            onToggle={() => handleToggle("dailyReminders")}
          />
          <NotificationRow
            testID="toggle-promotions"
            icon="sparkles-outline"
            label="Promosyonlar"
            description="Özel fırsatlar ve kampanyalar"
            value={preferences.promotions}
            onToggle={() => handleToggle("promotions")}
            isLast
          />
        </UMCard>

        <Text
          style={{
            color: Colors.textMuted,
            fontSize: 12,
            lineHeight: 18,
            marginTop: 16,
            marginHorizontal: 4,
            fontFamily: "DMSans_400Regular",
          }}
        >
          Bildirim tercihlerini istediğin zaman değiştirebilirsin. Bildirimleri tamamen kapatmak için cihaz ayarlarından uygulamanın bildirim izinlerini kaldırabilirsin.
        </Text>
      </ScrollView>
    </View>
  );
}

function NotificationRow({
  testID,
  icon,
  label,
  description,
  value,
  onToggle,
  isLast,
}: {
  testID: string;
  icon: IoniconName;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: Colors.primaryPale,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.textDark, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
          {label}
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2, fontFamily: "DMSans_400Regular" }}>
          {description}
        </Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "rgba(0,0,0,0.1)", true: Colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="rgba(0,0,0,0.1)"
      />
    </View>
  );
}
