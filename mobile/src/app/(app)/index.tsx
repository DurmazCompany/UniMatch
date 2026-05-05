import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { MatchModal } from "@/components/match/MatchModal";
import { SwipeStack, SwipeStackRef } from "@/components/swipe/SwipeStack";
import { api } from "@/lib/api/api";
import { Profile, Match, SwipeResponse } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { Colors, Radius, Spacing } from "@/lib/theme";
import { UMButton } from "@/components/ui";
import { WalletPill } from "@/components/WalletPill";
import { getZodiacSign, ZodiacSign } from "@/lib/astrology";

const SWIPE_LIMIT = 10;

const ZODIAC_FILTERS: { sign: ZodiacSign; label: string }[] = [
  { sign: "Aries", label: "Koç ♈" },
  { sign: "Taurus", label: "Boğa ♉" },
  { sign: "Gemini", label: "İkizler ♊" },
  { sign: "Cancer", label: "Yengeç ♋" },
  { sign: "Leo", label: "Aslan ♌" },
  { sign: "Virgo", label: "Başak ♍" },
  { sign: "Libra", label: "Terazi ♎" },
  { sign: "Scorpio", label: "Akrep ♏" },
  { sign: "Sagittarius", label: "Yay ♐" },
  { sign: "Capricorn", label: "Oğlak ♑" },
  { sign: "Aquarius", label: "Kova ♒" },
  { sign: "Pisces", label: "Balık ♓" },
];

const YEAR_FILTERS: { value: number; label: string }[] = [
  { value: 1, label: "1. Sınıf" },
  { value: 2, label: "2. Sınıf" },
  { value: 3, label: "3. Sınıf" },
  { value: 4, label: "4.+ Sınıf" },
];

const FILTER_HOBBIES = [
  { value: "music", label: "Müzik" },
  { value: "sports", label: "Spor" },
  { value: "gaming", label: "Oyun" },
  { value: "movies", label: "Film" },
  { value: "reading", label: "Kitap" },
  { value: "travel", label: "Seyahat" },
  { value: "photography", label: "Fotoğraf" },
  { value: "cooking", label: "Yemek" },
  { value: "art", label: "Sanat" },
  { value: "fitness", label: "Fitness" },
];

interface ActiveFilters {
  zodiacSigns: ZodiacSign[];
  years: number[];
  hobbies: string[];
  filterYear: number | null;
  lifestyle: "morning" | "night" | null;
}

function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ActiveFilters) => void;
  initialFilters: ActiveFilters;
}) {
  const insets = useSafeAreaInsets();
  const [localZodiac, setLocalZodiac] = useState<ZodiacSign[]>(initialFilters.zodiacSigns);
  const [localYears, setLocalYears] = useState<number[]>(initialFilters.years);
  const [localHobbies, setLocalHobbies] = useState<string[]>(initialFilters.hobbies);
  const [localFilterYear, setLocalFilterYear] = useState<number | null>(initialFilters.filterYear);
  const [localLifestyle, setLocalLifestyle] = useState<"morning" | "night" | null>(initialFilters.lifestyle);

  useEffect(() => {
    if (visible) {
      setLocalZodiac(initialFilters.zodiacSigns);
      setLocalYears(initialFilters.years);
      setLocalHobbies(initialFilters.hobbies);
      setLocalFilterYear(initialFilters.filterYear);
      setLocalLifestyle(initialFilters.lifestyle);
    }
  }, [visible]);

  const toggleZodiac = (sign: ZodiacSign) => {
    Haptics.selectionAsync();
    setLocalZodiac((prev) =>
      prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]
    );
  };

  const toggleYear = (year: number) => {
    Haptics.selectionAsync();
    setLocalYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalZodiac([]);
    setLocalYears([]);
    setLocalHobbies([]);
    setLocalFilterYear(null);
    setLocalLifestyle(null);
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply({ zodiacSigns: localZodiac, years: localYears, hobbies: localHobbies, filterYear: localFilterYear, lifestyle: localLifestyle });
    onClose();
  };

  const chipBase = (selected: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.tag,
    borderWidth: 1.5,
    borderColor: selected ? Colors.primary : "rgba(255,255,255,0.08)",
    backgroundColor: selected ? "rgba(124,111,247,0.18)" : Colors.cardDark,
  });
  const chipText = (selected: boolean) => ({
    color: selected ? Colors.primaryLight : Colors.textOnDarkMuted,
    fontFamily: selected ? "DMSans_700Bold" : "DMSans_500Medium",
    fontSize: 14,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: Colors.surfaceDark }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Pressable
            onPress={onClose}
            testID="filter-close-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 16, fontFamily: "DMSans_500Medium" }}>İptal</Text>
          </Pressable>
          <Text style={{ color: Colors.textOnDark, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
            Filtrele
          </Text>
          <Pressable
            onPress={handleClear}
            testID="filter-clear-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: Colors.primaryLight, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>Temizle</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: Colors.textOnDark, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
            Burç
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            {ZODIAC_FILTERS.map(({ sign, label }) => {
              const selected = localZodiac.includes(sign);
              return (
                <Pressable
                  key={sign}
                  onPress={() => toggleZodiac(sign)}
                  testID={`zodiac-chip-${sign}`}
                  style={({ pressed }) => ({ ...chipBase(selected), opacity: pressed ? 0.75 : 1 })}
                >
                  <Text style={chipText(selected)}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: Colors.textOnDark, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
            Sınıf
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            {YEAR_FILTERS.map(({ value, label }) => {
              const selected = localYears.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleYear(value)}
                  testID={`year-chip-${value}`}
                  style={({ pressed }) => ({ ...chipBase(selected), paddingHorizontal: 18, opacity: pressed ? 0.75 : 1 })}
                >
                  <Text style={chipText(selected)}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: Colors.textOnDark, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
            Yaşam Tarzı
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
            {[
              { value: "morning", label: "☀️ Sabahçı" },
              { value: "night", label: "🌙 Gece Kuşu" },
            ].map(opt => {
              const selected = localLifestyle === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLocalLifestyle(selected ? null : opt.value as "morning" | "night");
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: Radius.tag,
                    backgroundColor: selected ? Colors.primary : Colors.cardDark,
                    borderWidth: 1.5,
                    borderColor: selected ? Colors.primary : "rgba(255,255,255,0.08)",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: selected ? Colors.white : Colors.textOnDarkMuted, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: Colors.textOnDark, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 14 }}>
            Ortak Hobiler
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FILTER_HOBBIES.map(h => {
              const sel = localHobbies.includes(h.value);
              return (
                <Pressable
                  key={h.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (sel) setLocalHobbies(prev => prev.filter(v => v !== h.value));
                    else setLocalHobbies(prev => [...prev, h.value]);
                  }}
                  style={chipBase(sel)}
                >
                  <Text style={chipText(sel)}>{h.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Pressable onPress={handleApply} testID="filter-apply-button">
            <UMButton variant="primary" label="Uygula" onPress={handleApply} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [swipesLeft, setSwipesLeft] = useState<number>(SWIPE_LIMIT);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [lastSwipedProfile, setLastSwipedProfile] = useState<Profile | null>(null);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<"like" | "pass" | "super" | null>(null);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ zodiacSigns: [], years: [], hobbies: [], filterYear: null, lifestyle: null });

  const isMounted = useRef<boolean>(true);
  const swipeStackRef = useRef<SwipeStackRef>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const redirectedToOnboarding = useRef(false);

  const { data: myProfile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 800));
        try {
          const result = await api.get<Profile>("/api/profile");
          return result ?? null;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "";
          if (msg.includes("401") || msg.includes("Unauthorized")) continue;
          return null;
        }
      }
      return null;
    },
    retry: false,
    staleTime: 30_000,
  });

  const profileSettled = !profileLoading;
  useEffect(() => {
    if (!isMounted.current) return;
    if (profileSettled && myProfile === null) {
      if (!redirectedToOnboarding.current) {
        redirectedToOnboarding.current = true;
        setProfileLoaded(true);
        router.replace("/onboarding/welcome");
      }
    } else if (profileSettled && myProfile) {
      redirectedToOnboarding.current = false;
      setProfileLoaded(true);
    }
  }, [profileSettled, myProfile]);

  const { isLoading: discoverLoading, refetch } = useQuery<Profile[] | null>({
    queryKey: ["discover", activeFilters.hobbies, activeFilters.filterYear, activeFilters.lifestyle],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (activeFilters.hobbies.length > 0) params.append("hobbies", activeFilters.hobbies.join(","));
        if (activeFilters.filterYear) params.append("year", String(activeFilters.filterYear));
        if (activeFilters.lifestyle) params.append("lifestyle", activeFilters.lifestyle);
        const queryString = params.toString();
        const url = `/api/discover${queryString ? `?${queryString}` : ""}`;
        const data = await api.get<Profile[]>(url);
        const result = data ?? [];
        if (isMounted.current) setProfiles(result);
        return result;
      } catch {
        if (isMounted.current) setProfiles([]);
        return [];
      }
    },
    enabled: !!myProfile,
  });

  const { mutate: swipeMutate } = useMutation({
    mutationFn: (vars: { targetProfileId: string; direction: "like" | "pass" | "super" }) =>
      api.post<SwipeResponse>("/api/swipe", vars),
    onSuccess: (data) => {
      if (data?.swipesLeft !== undefined) setSwipesLeft(data.swipesLeft);
      if (data?.match) {
        setCurrentMatch(data.match);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const { mutate: undoSwipe } = useMutation({
    mutationFn: (targetProfileId: string) =>
      api.delete<null>(`/api/swipe?targetProfileId=${targetProfileId}`),
  });

  const handleSwipe = useCallback(
    (profileId: string, direction: "like" | "pass" | "super") => {
      setProfiles((prev) => {
        const profile = prev.find((p) => p.id === profileId);
        if (profile) {
          setLastSwipedProfile(profile);
          setLastSwipeDirection(direction);
        }
        return prev.filter((p) => p.id !== profileId);
      });
      swipeMutate({ targetProfileId: profileId, direction });
    },
    [swipeMutate]
  );

  const handleActionButton = useCallback(
    (direction: "like" | "pass" | "super") => {
      if (filteredProfiles.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (direction === "pass") {
        swipeStackRef.current?.swipeLeft();
      } else if (direction === "like") {
        swipeStackRef.current?.swipeRight();
      } else if (direction === "super") {
        swipeStackRef.current?.swipeUp();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profiles, activeFilters]
  );

  const handleRewind = useCallback(() => {
    if (!lastSwipedProfile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const restored = lastSwipedProfile;
    setProfiles((prev) => [restored, ...prev]);
    undoSwipe(restored.id);
    setLastSwipedProfile(null);
    setLastSwipeDirection(null);
  }, [lastSwipedProfile, undoSwipe]);

  const filteredProfiles = profiles.filter((profile) => {
    const hasZodiacFilter = activeFilters.zodiacSigns.length > 0;
    const hasYearFilter = activeFilters.years.length > 0;

    if (hasZodiacFilter) {
      const sign = profile.birthDate ? getZodiacSign(profile.birthDate) : null;
      if (!sign || !activeFilters.zodiacSigns.includes(sign)) return false;
    }

    if (hasYearFilter) {
      const profileYear = profile.year;
      if (activeFilters.years.includes(4)) {
        const matchesFourPlus = profileYear >= 4;
        const matchesOtherYears = activeFilters.years
          .filter((y) => y !== 4)
          .includes(profileYear);
        if (!matchesFourPlus && !matchesOtherYears) return false;
      } else {
        if (!activeFilters.years.includes(profileYear)) return false;
      }
    }

    return true;
  });

  const hasActiveFilters =
    activeFilters.zodiacSigns.length > 0 ||
    activeFilters.years.length > 0 ||
    activeFilters.hobbies.length > 0 ||
    activeFilters.filterYear !== null ||
    activeFilters.lifestyle !== null;

  if (profileLoading || (!profileLoaded && discoverLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const limitReached = swipesLeft <= 0;
  const hasProfiles = filteredProfiles.length > 0 && !limitReached;

  const filterButton = (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFilterVisible(true);
      }}
      testID="filter-button"
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceDark,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
        borderWidth: hasActiveFilters ? 1.5 : 0,
        borderColor: Colors.primary,
      })}
    >
      <Ionicons
        name="options-outline"
        size={20}
        color={hasActiveFilters ? Colors.primaryLight : Colors.textOnDark}
      />
      {hasActiveFilters ? (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: Colors.primary,
            borderWidth: 1.5,
            borderColor: Colors.surfaceDark,
          }}
        />
      ) : null}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="discover-screen">
      <StatusBar barStyle="light-content" />
      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
        {hasProfiles ? (
          <>
            {/* Header */}
            <View
              style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: 20,
                paddingBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ flex: 1, color: Colors.textOnDark, fontSize: 28, fontFamily: "DMSerifDisplay_400Regular" }}>
                Keşfet
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <WalletPill />
                {filterButton}
              </View>
            </View>

            {/* Card area */}
            <View
              style={{
                flex: 1,
                marginHorizontal: 16,
                marginBottom: Spacing.sm,
                borderRadius: Radius.card,
                overflow: "hidden",
              }}
            >
              <SwipeStack ref={swipeStackRef} profiles={filteredProfiles} onSwipe={handleSwipe} />
            </View>

            {/* Swipes left counter */}
            <Text
              style={{
                color: Colors.textOnDarkMuted,
                fontSize: 12,
                fontFamily: "DMSans_500Medium",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {swipesLeft} swipe kaldı
            </Text>

            {/* Action bar */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
                paddingHorizontal: 20,
                paddingBottom: 100,
                paddingTop: 8,
              }}
            >
              {/* Rewind */}
              <Pressable
                onPress={handleRewind}
                disabled={!lastSwipedProfile}
                testID="rewind-button"
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: Colors.cardDark,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: !lastSwipedProfile ? 0.4 : pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="refresh-outline" size={22} color={Colors.textOnDark} />
              </Pressable>

              {/* Pass */}
              <UMButton variant="swipe-no" onPress={() => handleActionButton("pass")} fullWidth={false} />

              {/* Super-like */}
              <Pressable
                onPress={() => handleActionButton("super")}
                testID="super-button"
                style={({ pressed }) => ({
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: Colors.primaryPale,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons name="star" size={24} color={Colors.primary} />
              </Pressable>

              {/* Like */}
              <View testID="like-button-wrap">
                <UMButton variant="swipe-yes" onPress={() => handleActionButton("like")} fullWidth={false} />
              </View>
            </View>
          </>
        ) : (
          /* Empty / limit reached state */
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
              paddingTop: insets.top,
            }}
          >
            {limitReached ? (
              <>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: Colors.cardDark,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <Ionicons name="time-outline" size={40} color={Colors.primaryLight} />
                </View>
                <Text style={{ color: Colors.textOnDark, fontSize: 24, fontFamily: "DMSerifDisplay_400Regular", textAlign: "center", marginBottom: 8 }}>
                  Günlük hakkın bitti
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
                  Yarın {SWIPE_LIMIT} yeni swipe hakkın olacak ya da Premium ile sınırsız swipe yap
                </Text>
                <View style={{ width: "100%" }}>
                  <UMButton variant="primary" label="Premium'a Yükselt" onPress={() => router.push("/paywall" as never)} />
                </View>
              </>
            ) : discoverLoading ? (
              <ActivityIndicator color={Colors.primary} size="large" />
            ) : hasActiveFilters ? (
              <>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: Colors.cardDark,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <Ionicons name="options-outline" size={40} color={Colors.primaryLight} />
                </View>
                <Text style={{ color: Colors.textOnDark, fontSize: 24, fontFamily: "DMSerifDisplay_400Regular", textAlign: "center", marginBottom: 8 }}>
                  Filtrene uyan profil yok
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
                  Filtrelerini değiştirerek daha fazla kişiyi keşfet.
                </Text>
                <View style={{ width: "100%" }}>
                  <UMButton variant="primary" label="Filtreleri Düzenle" onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterVisible(true);
                  }} />
                </View>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: Colors.cardDark,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <Ionicons name="heart-outline" size={40} color={Colors.primaryLight} />
                </View>
                <Text style={{ color: Colors.textOnDark, fontSize: 24, fontFamily: "DMSerifDisplay_400Regular", textAlign: "center", marginBottom: 8 }}>
                  Şimdilik yeni profil yok
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
                  Yakınındaki herkesi gördün. Daha sonra tekrar kontrol et.
                </Text>
                <View style={{ width: "100%" }}>
                  <UMButton variant="primary" label="Yenile" onPress={() => refetch()} />
                </View>
              </>
            )}

            <View style={{ position: "absolute", top: insets.top + 8, right: 20 }} testID="filter-button-empty-wrap">
              {filterButton}
            </View>
          </View>
        )}
      </Animated.View>

      {/* Filter modal */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(filters) => setActiveFilters(filters)}
        initialFilters={activeFilters}
      />

      {/* Match modal */}
      <MatchModal
        match={currentMatch}
        currentUserId={session?.user?.id ?? ""}
        onDismiss={() => {
          setCurrentMatch(null);
          queryClient.invalidateQueries({ queryKey: ["matches"] });
        }}
      />
    </View>
  );
}
