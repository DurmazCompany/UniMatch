import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft, Music, Dribbble, Gamepad2, Film, BookOpen, Plane, Camera, UtensilsCrossed, Palette, Dumbbell, Code, PersonStanding, Coffee, TreePine, Music2, Heart, Globe, ShoppingBag, Star, Mic, Tv, Hash, Mic2 } from "lucide-react-native";

const HOBBIES = [
  { value: "music", label: "Muzik", icon: Music },
  { value: "sports", label: "Spor", icon: Dribbble },
  { value: "gaming", label: "Oyun", icon: Gamepad2 },
  { value: "movies", label: "Film/Dizi", icon: Film },
  { value: "reading", label: "Kitap", icon: BookOpen },
  { value: "travel", label: "Seyahat", icon: Plane },
  { value: "photography", label: "Fotograf", icon: Camera },
  { value: "cooking", label: "Yemek", icon: UtensilsCrossed },
  { value: "art", label: "Sanat", icon: Palette },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "coding", label: "Kodlama", icon: Code },
  { value: "dance", label: "Dans", icon: PersonStanding },
  { value: "cafe", label: "Kafe Takilma", icon: Coffee },
  { value: "yoga", label: "Yoga", icon: PersonStanding },
  { value: "hiking", label: "Doga Yuruyusu", icon: TreePine },
  { value: "concerts", label: "Konser", icon: Music2 },
  { value: "volunteering", label: "Gonulluluk", icon: Heart },
  { value: "languages", label: "Yabanci Dil", icon: Globe },
  { value: "fashion", label: "Moda", icon: ShoppingBag },
  { value: "astrology", label: "Astroloji", icon: Star },
  { value: "podcast", label: "Podcast", icon: Mic },
  { value: "anime", label: "Anime/Manga", icon: Tv },
  { value: "board_games", label: "Kutu Oyunlari", icon: Hash },
  { value: "theater", label: "Tiyatro/Sanat", icon: Mic2 },
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
      // Send arrays directly - backend will convert to JSON for storage
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
      // Apply referral code if provided during sign-up
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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={gradients.background}
        style={{
          flex: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Progress */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 36 }}>
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: theme.primary,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <ChevronLeft size={24} color={theme.textPrimary} />
        </Pressable>

        <Text style={{ color: theme.textPrimary, fontSize: 28, fontFamily: "Syne_700Bold", marginBottom: 8 }}>
          Hobilerin
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 8 }}>
          İlgi alanlarından en fazla 5 tane seç
        </Text>
        <Text style={{ color: theme.accent, fontSize: 13, marginBottom: 28 }}>
          {selectedHobbies.length}/5 seçildi
        </Text>

        {/* Hobbies grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
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
                  paddingVertical: 12,
                  borderRadius: 100,
                  borderWidth: 1.5,
                  borderColor: isSelected ? theme.primary : theme.borderDefault,
                  backgroundColor: isSelected ? "rgba(225,29,72,0.15)" : theme.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <hobby.icon size={18} color={isSelected ? theme.accent : theme.textSecondary} />
                <Text
                  style={{
                    color: isSelected ? theme.accent : theme.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {hobby.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Text style={{ color: theme.error, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleNext}
          disabled={loading}
          testID="next-button"
          style={({ pressed }) => ({ opacity: pressed || loading ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, borderRadius: 14, alignItems: "center" }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Tamamla →</Text>
            )}
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );
}
