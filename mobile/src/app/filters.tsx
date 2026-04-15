import { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { X, RotateCcw } from "lucide-react-native";
import { theme, gradients } from "@/lib/theme";
import { useDiscoverFilters, type DiscoverFiltersState } from "@/lib/store/discover-filters";
import { ZODIAC_SIGNS, YEAR_OPTIONS, GENDER_OPTIONS, HOBBY_OPTIONS } from "@/lib/discover-filter-options";

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const {
    zodiacSigns,
    years,
    gender,
    hobbies,
    toggleZodiac,
    toggleYear,
    setGender,
    toggleHobby,
    reset,
  } = useDiscoverFilters((s: DiscoverFiltersState) => ({
    zodiacSigns: s.zodiacSigns,
    years: s.years,
    gender: s.gender,
    hobbies: s.hobbies,
    toggleZodiac: s.toggleZodiac,
    toggleYear: s.toggleYear,
    setGender: s.setGender,
    toggleHobby: s.toggleHobby,
    reset: s.reset,
  }));

  const hasActiveFilters =
    zodiacSigns.length > 0 || years.length > 0 || gender !== "all" || hobbies.length > 0;

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reset();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.borderDefault,
          backgroundColor: theme.background,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="filters-close-button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 4,
          })}
        >
          <X size={22} color={theme.textSecondary} />
        </Pressable>

        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 17,
            fontWeight: "700",
            letterSpacing: -0.3,
          }}
        >
          Filtreler
        </Text>

        <Pressable
          onPress={handleReset}
          testID="filters-reset-button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          })}
        >
          <RotateCcw size={15} color={hasActiveFilters ? theme.primary : theme.textPlaceholder} />
          <Text
            style={{
              color: hasActiveFilters ? theme.primary : theme.textPlaceholder,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Sıfırla
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
          gap: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gender */}
        <FilterSection title="Cinsiyet Tercihi">
          <View style={{ flexDirection: "row", gap: 10 }}>
            {GENDER_OPTIONS.map((g) => (
              <ChipButton
                key={g.value}
                label={g.label}
                selected={gender === g.value}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender(g.value as "all" | "male" | "female");
                }}
                testID={`gender-filter-${g.value}`}
              />
            ))}
          </View>
        </FilterSection>

        {/* University Year */}
        <FilterSection title="Üniversite Yılı">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {YEAR_OPTIONS.map((y) => (
              <ChipButton
                key={y.value}
                label={y.label}
                selected={years.includes(y.value)}
                onPress={() => {
                  Haptics.selectionAsync();
                  toggleYear(y.value);
                }}
                testID={`year-filter-${y.value}`}
              />
            ))}
          </View>
        </FilterSection>

        {/* Zodiac Signs */}
        <FilterSection title="Burç">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ZODIAC_SIGNS.map((z) => (
              <ChipButton
                key={z.value}
                label={`${z.symbol} ${z.label}`}
                selected={zodiacSigns.includes(z.value)}
                onPress={() => {
                  Haptics.selectionAsync();
                  toggleZodiac(z.value);
                }}
                testID={`zodiac-filter-${z.value}`}
              />
            ))}
          </View>
        </FilterSection>

        {/* Hobbies */}
        <FilterSection title="İlgi Alanları">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {HOBBY_OPTIONS.map((h) => (
              <ChipButton
                key={h.value}
                label={h.label}
                selected={hobbies.includes(h.value)}
                onPress={() => {
                  Haptics.selectionAsync();
                  toggleHobby(h.value);
                }}
                testID={`hobby-filter-${h.value}`}
              />
            ))}
          </View>
        </FilterSection>
      </ScrollView>

      {/* Done button */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          left: 20,
          right: 20,
        }}
      >
        <Pressable
          onPress={handleDone}
          testID="filters-done-button"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 17,
              borderRadius: 16,
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
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function ChipButton({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? theme.primary : theme.borderDefault,
        backgroundColor: selected ? "rgba(232,68,90,0.15)" : theme.surface,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={{
          color: selected ? theme.primary : theme.textSecondary,
          fontSize: 13,
          fontWeight: selected ? "700" : "400",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
