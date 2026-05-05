import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { UMButton, UMCard, UMInput, TabSelector } from "@/components/ui";
import {
  useApplyAmbassador,
  useMyAmbassadorApplication,
} from "@/lib/hooks/useAmbassador";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";

const YEAR_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "Lisansüstü", label: "Lisansüstü" },
] as const;

function Header({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
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
      <Text style={[Typography.h2, { flex: 1 }]}>{title}</Text>
    </View>
  );
}

function PendingState() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="ambassador-pending">
      <Header title="Kampüs Elçisi Başvurusu" />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: Colors.primaryPale,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="hourglass-outline" size={44} color={Colors.primary} />
        </View>
        <Text style={[Typography.h1, { textAlign: "center", marginBottom: 8 }]}>
          Başvurun inceleniyor
        </Text>
        <Text style={[Typography.body, { textAlign: "center", marginBottom: 24 }]}>
          Ekibimiz başvurunu en kısa sürede değerlendirecek. Sonuç çıktığında bildirim alacaksın.
        </Text>
      </View>
    </View>
  );
}

function ApprovedState() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="ambassador-approved">
      <Header title="Kampüs Elçisi" />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text style={{ fontSize: 64, marginBottom: 12 }}>🎉</Text>
        <Text style={[Typography.h1, { textAlign: "center", marginBottom: 8 }]}>
          Tebrikler!
        </Text>
        <Text style={[Typography.body, { textAlign: "center", marginBottom: 32 }]}>
          Sen artık kampüs elçisisin. Etkinlik oluşturarak topluluğunu büyütmeye başlayabilirsin.
        </Text>
        <View style={{ alignSelf: "stretch", gap: 12 }}>
          <UMButton
            variant="primary"
            label="Etkinlik Oluştur"
            icon="add-circle-outline"
            onPress={() => router.replace("/events/create")}
          />
          <UMButton
            variant="ghost"
            label="Etkinlikleri Gör"
            onPress={() => router.replace("/events")}
          />
        </View>
      </View>
    </View>
  );
}

export default function AmbassadorApplyScreen() {
  const insets = useSafeAreaInsets();
  const { data: application, isLoading, refetch } = useMyAmbassadorApplication();
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        return (await api.get<Profile>("/api/profile")) ?? null;
      } catch {
        return null;
      }
    },
  });

  const [resetForm, setResetForm] = useState(false);
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState<string>("1");
  const [motivation, setMotivation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !university) {
      setUniversity(profile.university ?? "");
      if (profile.department) setFaculty(profile.department);
    }
  }, [profile, university]);

  const apply = useApplyAmbassador();

  if (isLoading) {
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

  if (application && !resetForm) {
    if (application.status === "pending") return <PendingState />;
    if (application.status === "approved") return <ApprovedState />;
    if (application.status === "rejected") {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="ambassador-rejected">
          <Header title="Kampüs Elçisi Başvurusu" />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 32,
            }}
          >
            <UMCard
              style={{
                backgroundColor: "#FFF1F1",
                borderColor: "rgba(255,107,107,0.4)",
                borderWidth: 1,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
                <Text style={[Typography.bodyBold, { color: "#FF3B30" }]}>Başvurun reddedildi</Text>
              </View>
              {application.rejectionReason ? (
                <Text style={[Typography.body, { color: Colors.textDark }]}>
                  {application.rejectionReason}
                </Text>
              ) : (
                <Text style={[Typography.body]}>
                  Ne yazık ki başvurun şu anda kabul edilmedi. Tekrar deneyebilirsin.
                </Text>
              )}
            </UMCard>
            <UMButton
              variant="primary"
              label="Tekrar Başvur"
              onPress={() => setResetForm(true)}
            />
          </ScrollView>
        </View>
      );
    }
  }

  const motivationLen = motivation.trim().length;
  const motivationOk = motivationLen >= 100;

  const handleSubmit = async () => {
    setError(null);
    if (!university.trim() || !faculty.trim() || !year.trim()) {
      setError("Lütfen üniversite, bölüm ve sınıf alanlarını doldur.");
      return;
    }
    if (!motivationOk) {
      setError("Motivasyon yazın en az 100 karakter olmalı.");
      return;
    }
    try {
      await apply.mutateAsync({
        university: university.trim(),
        faculty: faculty.trim(),
        year,
        motivation: motivation.trim(),
        social_links:
          instagram.trim() || twitter.trim()
            ? {
                instagram: instagram.trim() || undefined,
                twitter: twitter.trim() || undefined,
              }
            : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResetForm(false);
      await refetch();
    } catch (e: any) {
      setError(e?.message ?? "Başvuru gönderilemedi.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="ambassador-apply-screen">
      <Header title="Kampüs Elçisi Başvurusu" />
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
          {/* Banner */}
          <UMCard
            style={{
              backgroundColor: Colors.primaryPale,
              borderColor: Colors.primary,
              borderWidth: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 22 }}>👑</Text>
              <Text style={[Typography.bodyBold, { color: Colors.primaryDark }]}>
                Kampüs Elçisi Olunca
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={[Typography.body, { color: Colors.textDark }]}>
                • Aşk paketinin tüm özellikleri ücretsiz
              </Text>
              <Text style={[Typography.body, { color: Colors.textDark }]}>
                • Etkinlik oluşturma yetkisi
              </Text>
              <Text style={[Typography.body, { color: Colors.textDark }]}>
                • Profilinde özel rozet
              </Text>
            </View>
          </UMCard>

          <UMInput
            label="Üniversite"
            value={university}
            onChangeText={setUniversity}
            placeholder="Üniversiten"
            testID="university-input"
          />
          <UMInput
            label="Bölüm"
            value={faculty}
            onChangeText={setFaculty}
            placeholder="Örn. Bilgisayar Mühendisliği"
            testID="faculty-input"
          />

          <View style={{ gap: 6 }}>
            <Text style={[Typography.bodyBold, { color: Colors.textDark }]}>Sınıf</Text>
            <TabSelector
              value={year}
              onChange={setYear}
              options={YEAR_OPTIONS as unknown as { value: string; label: string }[]}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[Typography.bodyBold, { color: Colors.textDark }]}>Motivasyon</Text>
            <TextInput
              value={motivation}
              onChangeText={setMotivation}
              placeholder="Neden kampüs elçisi olmak istiyorsun?"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={1000}
              testID="motivation-input"
              style={{
                backgroundColor: Colors.white,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: motivationOk
                  ? Colors.primary
                  : motivationLen > 0
                  ? "rgba(255,59,48,0.4)"
                  : "rgba(0,0,0,0.1)",
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 12,
                minHeight: 130,
                fontFamily: "DMSans_400Regular",
                fontSize: 15,
                color: Colors.textDark,
                textAlignVertical: "top",
              }}
            />
            <Text
              style={[
                Typography.caption,
                {
                  textAlign: "right",
                  color: motivationOk ? Colors.primary : Colors.textMuted,
                },
              ]}
            >
              {motivationLen}/100 (min)
            </Text>
          </View>

          <UMInput
            label="Instagram (isteğe bağlı)"
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@username"
            autoCapitalize="none"
            testID="instagram-input"
          />
          <UMInput
            label="Twitter (isteğe bağlı)"
            value={twitter}
            onChangeText={setTwitter}
            placeholder="@username"
            autoCapitalize="none"
            testID="twitter-input"
          />

          {error ? (
            <Text style={{ color: "#FF3B30", fontSize: 13, fontFamily: "DMSans_500Medium" }}>
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: Spacing.sm }}>
            <UMButton
              variant="primary"
              label="Başvuruyu Gönder"
              loading={apply.isPending}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

