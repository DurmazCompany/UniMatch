import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MatchModal } from "@/components/match/MatchModal";
import { SwipeStack, SwipeStackRef } from "@/components/swipe/SwipeStack";
import { api } from "@/lib/api/api";
import { Profile, Match, SwipeResponse } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { theme, gradients } from "@/lib/theme";
import { Heart, X, Star, RotateCcw, SlidersHorizontal } from "lucide-react-native";
import { getZodiacSign, ZodiacSign } from "@/lib/astrology";

const SWIPE_LIMIT = 10;

// Zodiac filter chips: English sign name paired with display label
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

interface ActiveFilters {
  zodiacSigns: ZodiacSign[];
  years: number[];
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

  // Sync when modal opens
  useEffect(() => {
    if (visible) {
      setLocalZodiac(initialFilters.zodiacSigns);
      setLocalYears(initialFilters.years);
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
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply({ zodiacSigns: localZodiac, years: localYears });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: theme.borderDefault,
          }}
        >
          <Pressable
            onPress={onClose}
            testID="filter-close-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 16 }}>İptal</Text>
          </Pressable>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 17,
              fontWeight: "700",
            }}
          >
            Filtrele
          </Text>
          <Pressable
            onPress={handleClear}
            testID="filter-clear-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: theme.primary, fontSize: 16 }}>Temizle</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Zodiac filter section */}
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 14,
            }}
          >
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
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: selected ? theme.primary : theme.borderDefault,
                    backgroundColor: selected
                      ? theme.primary + "22"
                      : theme.surface,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: selected ? theme.primary : theme.textSecondary,
                      fontSize: 14,
                      fontWeight: selected ? "700" : "400",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Year filter section */}
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 14,
            }}
          >
            Sınıf
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {YEAR_FILTERS.map(({ value, label }) => {
              const selected = localYears.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleYear(value)}
                  testID={`year-chip-${value}`}
                  style={({ pressed }) => ({
                    paddingHorizontal: 18,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: selected ? theme.primary : theme.borderDefault,
                    backgroundColor: selected
                      ? theme.primary + "22"
                      : theme.surface,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: selected ? theme.primary : theme.textSecondary,
                      fontSize: 14,
                      fontWeight: selected ? "700" : "400",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Apply button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            paddingTop: 12,
            borderTopWidth: 0.5,
            borderTopColor: theme.borderDefault,
          }}
        >
          <Pressable
            onPress={handleApply}
            testID="filter-apply-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Uygula
              </Text>
            </LinearGradient>
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ zodiacSigns: [], years: [] });

  const isMounted = useRef<boolean>(true);
  const swipeStackRef = useRef<SwipeStackRef>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { data: myProfile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        const result = await api.get<Profile>("/api/profile");
        return result ?? null;
      } catch {
        return null;
      }
    },
  });

  const profileSettled = !profileLoading;
  useEffect(() => {
    if (!isMounted.current) return;
    if (profileSettled && myProfile === null) {
      setProfileLoaded(true);
      router.replace("/onboarding/welcome");
    } else if (profileSettled && myProfile) {
      setProfileLoaded(true);
    }
  }, [profileSettled, myProfile]);

  const { isLoading: discoverLoading, refetch } = useQuery<Profile[] | null>({
    queryKey: ["discover"],
    queryFn: async () => {
      try {
        const data = await api.get<Profile[]>("/api/discover");
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

  // Client-side filter application
  const filteredProfiles = profiles.filter((profile) => {
    const hasZodiacFilter = activeFilters.zodiacSigns.length > 0;
    const hasYearFilter = activeFilters.years.length > 0;

    if (hasZodiacFilter) {
      const sign = profile.birthDate ? getZodiacSign(profile.birthDate) : null;
      if (!sign || !activeFilters.zodiacSigns.includes(sign)) return false;
    }

    if (hasYearFilter) {
      // Year 4 filter covers 4th year and above
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
    activeFilters.zodiacSigns.length > 0 || activeFilters.years.length > 0;

  if (profileLoading || (!profileLoaded && discoverLoading)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const limitReached = swipesLeft <= 0;
  const hasProfiles = filteredProfiles.length > 0 && !limitReached;

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.background }}
      testID="discover-screen"
    >
      {hasProfiles ? (
        <>
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 8,
              paddingHorizontal: 20,
              paddingBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: theme.primary,
                fontSize: 26,
                fontWeight: "900",
                letterSpacing: -0.5,
              }}
            >
              UniMatch
            </Text>
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
                backgroundColor: hasActiveFilters ? theme.primary + "22" : theme.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
                borderWidth: 1,
                borderColor: hasActiveFilters ? theme.primary : theme.borderDefault,
              })}
            >
              <SlidersHorizontal
                size={18}
                color={hasActiveFilters ? theme.primary : theme.textSecondary}
              />
              {/* Active filter dot */}
              {hasActiveFilters ? (
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.primary,
                    borderWidth: 1.5,
                    borderColor: theme.surface,
                  }}
                />
              ) : null}
            </Pressable>
          </View>

          {/* Card area */}
          <View
            style={{
              flex: 1,
              marginHorizontal: 12,
              marginBottom: 8,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <SwipeStack ref={swipeStackRef} profiles={filteredProfiles} onSwipe={handleSwipe} />
          </View>

          {/* Swipes left counter */}
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 12,
              textAlign: "center",
              marginBottom: 6,
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
              gap: 14,
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 16,
              paddingTop: 4,
              backgroundColor: theme.background,
            }}
          >
            {/* Rewind */}
            <Pressable
              onPress={handleRewind}
              disabled={!lastSwipedProfile}
              testID="rewind-button"
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: lastSwipedProfile ? "#FFFFFF" : theme.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: !lastSwipedProfile ? 0.35 : pressed ? 0.7 : 1,
                shadowColor: lastSwipedProfile ? "#FFD700" : "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: lastSwipedProfile ? 0.4 : 0.15,
                shadowRadius: 6,
                elevation: lastSwipedProfile ? 6 : 2,
              })}
            >
              <RotateCcw
                size={22}
                color={lastSwipedProfile ? "#FFD700" : theme.textPlaceholder}
                strokeWidth={2.5}
              />
            </Pressable>

            {/* Pass (X) */}
            <Pressable
              onPress={() => handleActionButton("pass")}
              testID="pass-button"
              style={({ pressed }) => ({
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              })}
            >
              <X size={28} color="#1A1A1A" strokeWidth={2.5} />
            </Pressable>

            {/* Like (Heart) - largest */}
            <Pressable
              onPress={() => handleActionButton("like")}
              testID="like-button"
              style={({ pressed }) => ({
                width: 70,
                height: 70,
                borderRadius: 35,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 8,
                overflow: "hidden",
              })}
            >
              <LinearGradient
                colors={["#FF5E73", "#E8445A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={32} color="#fff" fill="#fff" />
              </LinearGradient>
            </Pressable>

            {/* Super Like (Star) */}
            <Pressable
              onPress={() => handleActionButton("super")}
              testID="super-button"
              style={({ pressed }) => ({
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              })}
            >
              <Star size={26} color="#FFD700" fill="#FFD700" />
            </Pressable>

            {/* Spacer to balance rewind */}
            <View style={{ width: 52 }} />
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
                  backgroundColor: theme.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 36 }}>⏰</Text>
              </View>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Günlük hakkın bitti
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 28,
                  lineHeight: 22,
                }}
              >
                Yarın {SWIPE_LIMIT} yeni swipe hakkın olacak ya da Premium ile sınırsız swipe yap
              </Text>
              <Pressable
                onPress={() => router.push("/paywall" as never)}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <LinearGradient
                  colors={gradients.button}
                  style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    Premium'a Yükselt
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : discoverLoading ? (
            <ActivityIndicator color={theme.primary} size="large" />
          ) : hasActiveFilters ? (
            <>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <SlidersHorizontal size={36} color={theme.textSecondary} />
              </View>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Filtrene uyan profil yok
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 28,
                  lineHeight: 22,
                }}
              >
                Filtrelerini değiştirerek daha fazla kişiyi keşfet.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterVisible(true);
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <LinearGradient
                  colors={gradients.button}
                  style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    Filtreleri Düzenle
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Heart size={36} color={theme.primary} />
              </View>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Hepsi bu kadar!
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 28,
                  lineHeight: 22,
                }}
              >
                Yakınındaki herkesi gördün. Daha sonra tekrar kontrol et.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <LinearGradient
                  colors={gradients.button}
                  style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Yenile</Text>
                </LinearGradient>
              </Pressable>
            </>
          )}

          {/* Show filter button in empty state header too */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterVisible(true);
            }}
            testID="filter-button-empty"
            style={({ pressed }) => ({
              position: "absolute",
              top: insets.top + 8,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: hasActiveFilters ? theme.primary + "22" : theme.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
              borderWidth: 1,
              borderColor: hasActiveFilters ? theme.primary : theme.borderDefault,
            })}
          >
            <SlidersHorizontal
              size={18}
              color={hasActiveFilters ? theme.primary : theme.textSecondary}
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
                  backgroundColor: theme.primary,
                  borderWidth: 1.5,
                  borderColor: theme.surface,
                }}
              />
            ) : null}
          </Pressable>
        </View>
      )}

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
