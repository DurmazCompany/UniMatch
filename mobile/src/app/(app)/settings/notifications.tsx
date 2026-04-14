import { useState, useEffect, useCallback } from "react";
import { View, Text, Switch, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "@/lib/theme";

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

  // Load preferences from AsyncStorage
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

  // Save preferences to AsyncStorage
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
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="notifications-screen">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 0.5,
          borderBottomColor: theme.borderDefault,
        }}
      >
        <Pressable
          testID="back-button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => ({
            padding: 8,
            marginLeft: -8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronLeft size={28} color={theme.textPrimary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            color: theme.textPrimary,
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
            marginRight: 28,
          }}
        >
          Bildirimler
        </Text>
        {isSaving ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ position: "absolute", right: 16, top: insets.top + 16 }} />
        ) : null}
      </View>

      {/* Preferences List */}
      <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "500", marginBottom: 12, marginLeft: 4 }}>
          BILDIRIM TERCIHLERI
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <NotificationRow
            testID="toggle-new-matches"
            label="Yeni Eslesemeler"
            description="Birisi seninle eslesti"
            value={preferences.newMatches}
            onToggle={() => handleToggle("newMatches")}
          />
          <NotificationRow
            testID="toggle-messages"
            label="Mesajlar"
            description="Yeni mesaj aldığında bildirim al"
            value={preferences.messages}
            onToggle={() => handleToggle("messages")}
          />
          <NotificationRow
            testID="toggle-super-likes"
            label="Super Likeler"
            description="Birisi sana super like atti"
            value={preferences.superLikes}
            onToggle={() => handleToggle("superLikes")}
          />
          <NotificationRow
            testID="toggle-daily-reminders"
            label="Gunluk Hatirlatmalar"
            description="Gunluk aktivite hatirlatmalari"
            value={preferences.dailyReminders}
            onToggle={() => handleToggle("dailyReminders")}
          />
          <NotificationRow
            testID="toggle-promotions"
            label="Promosyonlar"
            description="Ozel firsatlar ve kampanyalar"
            value={preferences.promotions}
            onToggle={() => handleToggle("promotions")}
            isLast
          />
        </View>

        {/* Info text */}
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 13,
            lineHeight: 18,
            marginTop: 16,
            marginHorizontal: 4,
          }}
        >
          Bildirim tercihlerini istedigin zaman degistirebilirsin. Bildirimleri tamamen kapatmak icin cihaz ayarlarindan uygulamanin bildirim izinlerini kaldirabilirsin.
        </Text>
      </View>
    </View>
  );
}

function NotificationRow({
  testID,
  label,
  description,
  value,
  onToggle,
  isLast,
}: {
  testID: string;
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
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: theme.borderDefault,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "500" }}>
          {label}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#3A3A3C", true: theme.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#3A3A3C"
      />
    </View>
  );
}
