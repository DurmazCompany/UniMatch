import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Radius } from "@/lib/theme";
import { UMButton } from "@/components/ui";
import { OnboardingHeader } from "./step1";

type IoniconName = keyof typeof Ionicons.glyphMap;

const HOBBIES: { value: string; label: string; icon: IoniconName }[] = [
  { value: "music", label: "Müzik", icon: "musical-notes-outline" },
  { value: "sports", label: "Spor", icon: "football-outline" },
  { value: "gaming", label: "Oyun", icon: "game-controller-outline" },
  { value: "movies", label: "Film/Dizi", icon: "film-outline" },
  { value: "reading", label: "Kitap", icon: "book-outline" },
  { value: "travel", label: "Seyahat", icon: "airplane-outline" },
  { value: "photography", label: "Fotoğraf", icon: "camera-outline" },
  { value: "cooking", label: "Yemek", icon: "restaurant-outline" },
  { value: "art", label: "Sanat", icon: "color-palette-outline" },
  { value: "fitness", label: "Fitness", icon: "barbell-outline" },
  { value: "coding", label: "Kodlama", icon: "code-slash-outline" },
  { value: "dance", label: "Dans", icon: "body-outline" },
  { value: "cafe", label: "Kafe Takılma", icon: "cafe-outline" },
  { value: "yoga", label: "Yoga", icon: "leaf-outline" },
  { value: "hiking", label: "Doğa Yürüyüşü", icon: "trail-sign-outline" },
  { value: "concerts", label: "Konser", icon: "musical-note" },
  { value: "volunteering", label: "Gönüllülük", icon: "heart-outline" },
  { value: "languages", label: "Yabancı Dil", icon: "globe-outline" },
  { value: "fashion", label: "Moda", icon: "bag-outline" },
  { value: "astrology", label: "Astroloji", icon: "star-outline" },
  { value: "podcast", label: "Podcast", icon: "mic-outline" },
  { value: "anime", label: "Anime/Manga", icon: "tv-outline" },
  { value: "board_games", label: "Kutu Oyunları", icon: "dice-outline" },
  { value: "theater", label: "Tiyatro/Sanat", icon: "ticket-outline" },
];

export default function Step4Screen() {
  const onboarding = useAppStore((s) => s.onboarding);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleHobby = (value: string) => {
    setError("");
    if (selectedHobbies.includes(value)) {
      setSelectedHobbies((prev) => prev.filter((h) => h !== value));
    } else if (selectedHobbies.length < 5) {
      setSelectedHobbies((prev) => [...prev, value]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = async () => {
    if (selectedHobbies.length < 1) {
      setError("En az 1 hobi seç");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        ...onboarding,
        hobbies: selectedHobbies,
        photos: onboarding.photos ?? [],
      };
      const result = await api.post("/api/profile", payload);
      if (!result) {
        setError("Profil kaydedilemedi. Lütfen tekrar dene.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onboarding.referralCode) {
        try {
          await api.post("/api/referrals/use", { code: onboarding.referralCode });
        } catch {
          // Ignore referral errors — profile was created successfully
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      resetOnboarding();
      router.replace("/(app)");
    } catch {
      setError("Profil kaydedilemedi. Lütfen tekrar dene.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader step={4} />

        <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, color: Colors.textDark, marginTop: 16 }}>
          Hobilerin
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginTop: 6 }}>
          İlgi alanlarından en fazla 5 tane seç
        </Text>
        <Text style={{ color: Colors.primary, fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: "DMSans_500Medium" }}>
          {selectedHobbies.length}/5 seçildi
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          {HOBBIES.map((hobby) => {
            const isSelected = selectedHobbies.includes(hobby.value);
            const isDisabled = !isSelected && selectedHobbies.length >= 5;
            return (
              <Pressable
                key={hobby.value}
                onPress={() => toggleHobby(hobby.value)}
                disabled={isDisabled}
                testID={`hobby-${hobby.value}`}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: Radius.pill,
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: "rgba(0,0,0,0.1)",
                  backgroundColor: isSelected ? Colors.primary : Colors.white,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <Ionicons name={hobby.icon} size={16} color={isSelected ? Colors.white : Colors.textDark} />
                <Text style={{ color: isSelected ? Colors.white : Colors.textDark, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                  {hobby.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, marginBottom: 12, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ marginTop: 32 }}>
          <UMButton variant="primary" label="Tamamla" loading={loading} disabled={selectedHobbies.length < 1} onPress={handleNext} />
        </View>
      </ScrollView>
    </View>
  );
}
