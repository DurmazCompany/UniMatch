import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { UMButton, UMInput } from "@/components/ui";
import { useCreateEvent } from "@/lib/hooks/useEvents";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";

function combineDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, y, m, d] = dateMatch;
  const [, hh, mm] = timeMatch;
  const dt = new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm)
  );
  if (isNaN(dt.getTime())) return null;
  return dt;
}

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const create = useCreateEvent();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        return (await api.get<Profile>("/api/profile")) ?? null;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (profileLoading) return;
    if (!profile) return;
    if (profile.role !== "ambassador" && profile.role !== "admin") {
      router.replace("/events");
    }
  }, [profile, profileLoading]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim() || !location.trim() || !date.trim() || !time.trim()) {
      setError("Başlık, konum, tarih ve saat zorunlu.");
      return;
    }
    const dt = combineDateTime(date, time);
    if (!dt) {
      setError("Tarih ve saat formatı geçersiz. Örn: 2026-05-20  19:30");
      return;
    }
    const cap = capacity.trim() ? parseInt(capacity, 10) : undefined;
    if (capacity.trim() && (isNaN(cap as number) || (cap as number) <= 0)) {
      setError("Kapasite sayısı geçersiz.");
      return;
    }

    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        date: dt.toISOString(),
        location: location.trim(),
        capacity: cap,
        coverUrl: coverUrl.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/events");
    } catch (e: any) {
      setError(e?.message ?? "Etkinlik oluşturulamadı.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bgLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="create-event-screen">
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="back-button"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
          })}
        >
          <Ionicons name="chevron-back-outline" size={22} color={Colors.textDark} />
        </Pressable>
        <Text style={[Typography.h2, { flex: 1 }]}>Etkinlik Oluştur</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 32,
            gap: 14,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <UMInput
            label="Başlık"
            value={title}
            onChangeText={setTitle}
            placeholder="Etkinliğin adı"
            testID="title-input"
          />

          <View style={{ gap: 6 }}>
            <Text style={[Typography.bodyBold, { color: Colors.textDark }]}>
              Açıklama
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Kısa açıklama"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              testID="description-input"
              style={{
                backgroundColor: Colors.white,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: "rgba(0,0,0,0.1)",
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 12,
                minHeight: 110,
                fontFamily: "DMSans_400Regular",
                fontSize: 15,
                color: Colors.textDark,
                textAlignVertical: "top",
              }}
            />
          </View>

          <UMInput
            label="Konum"
            value={location}
            onChangeText={setLocation}
            placeholder="Örn. Kütüphane 2. Kat"
            testID="location-input"
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <UMInput
                label="Tarih"
                value={date}
                onChangeText={setDate}
                placeholder="2026-05-20"
                autoCapitalize="none"
                testID="date-input"
              />
            </View>
            <View style={{ flex: 0.7 }}>
              <UMInput
                label="Saat"
                value={time}
                onChangeText={setTime}
                placeholder="19:30"
                autoCapitalize="none"
                testID="time-input"
              />
            </View>
          </View>
          <Text style={Typography.caption}>Örn: 2026-05-20  19:30</Text>

          <UMInput
            label="Kapasite (isteğe bağlı)"
            value={capacity}
            onChangeText={(t) => setCapacity(t.replace(/[^0-9]/g, ""))}
            placeholder="Sınırsız"
            keyboardType="number-pad"
            testID="capacity-input"
          />

          <UMInput
            label="Kapak URL (isteğe bağlı)"
            value={coverUrl}
            onChangeText={setCoverUrl}
            placeholder="https://..."
            autoCapitalize="none"
            testID="cover-url-input"
          />

          {error ? (
            <Text style={{ color: "#FF3B30", fontSize: 13, fontFamily: "DMSans_500Medium" }}>
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: Spacing.sm }}>
            <UMButton
              variant="primary"
              label="Etkinlik Oluştur"
              loading={create.isPending}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
