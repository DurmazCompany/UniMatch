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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { theme } from "@/lib/theme";
import {
  X,
  Crown,
  Heart,
  Eye,
  Zap,
  Star,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react-native";

// Package tier definitions
interface PackageFeature {
  icon: typeof Heart;
  text: string;
  included: boolean;
}

interface PackageTier {
  id: string;
  name: string;
  price: string;
  period: string;
  isFree?: boolean;
  isRecommended?: boolean;
  accentColor: string;
  features: PackageFeature[];
}

const PACKAGES: PackageTier[] = [
  {
    id: "crush",
    name: "Crush",
    price: "Ucretsiz",
    period: "",
    isFree: true,
    accentColor: "#6B7280",
    features: [
      { icon: Heart, text: "Gunluk 10 begeni hakki", included: true },
      { icon: Star, text: "Gunluk 1 super begeni", included: true },
      { icon: Zap, text: "Kesif boost", included: false },
      { icon: Eye, text: "Seni begenenleri gor", included: false },
      { icon: RotateCcw, text: "Geri alma", included: false },
    ],
  },
  {
    id: "flort",
    name: "Flort",
    price: "49.99",
    period: "/ay",
    isRecommended: true,
    accentColor: theme.primary,
    features: [
      { icon: Heart, text: "Gunluk 20 begeni hakki", included: true },
      { icon: Star, text: "Gunluk 3 super begeni", included: true },
      { icon: Zap, text: "Haftada 3 gun kesif boost", included: true },
      { icon: Eye, text: "Seni begenenleri gor", included: false },
      { icon: RotateCcw, text: "Geri alma", included: false },
    ],
  },
  {
    id: "ask",
    name: "Ask",
    price: "99.99",
    period: "/ay",
    accentColor: "#FFD700",
    features: [
      { icon: Heart, text: "Sinirsiz begeni", included: true },
      { icon: Star, text: "Gunluk 5 super begeni", included: true },
      { icon: Zap, text: "1 haftalik kesif boost", included: true },
      { icon: Eye, text: "Seni begenenleri gor", included: true },
      { icon: RotateCcw, text: "5 geri alma hakki", included: true },
    ],
  },
];

// Feature row component for package cards
function FeatureRow({
  feature,
  accentColor,
}: {
  feature: PackageFeature;
  accentColor: string;
}) {
  const IconComponent = feature.icon;
  const iconColor = feature.included ? accentColor : theme.textPlaceholder;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <IconComponent size={18} color={iconColor} />
      </View>
      <Text
        style={{
          flex: 1,
          color: feature.included ? theme.textPrimary : theme.textPlaceholder,
          fontSize: 14,
          fontFamily: "PlusJakartaSans_400Regular",
        }}
      >
        {feature.text}
      </Text>
      {feature.included ? (
        <Check size={18} color={theme.success} />
      ) : (
        <X size={18} color={theme.textPlaceholder} />
      )}
    </View>
  );
}

// Package card component
function PackageCard({
  pkg,
  onSelect,
  loading,
  selectedId,
}: {
  pkg: PackageTier;
  onSelect: (id: string) => void;
  loading: boolean;
  selectedId: string | null;
}) {
  const isSelected = selectedId === pkg.id;
  const isRecommended = pkg.isRecommended;

  // Get the right icon for each package
  const getPackageIcon = () => {
    switch (pkg.id) {
      case "ask":
        return <Crown size={24} color={pkg.accentColor} />;
      case "flort":
        return <Heart size={24} color={pkg.accentColor} />;
      default:
        return <Star size={24} color={pkg.accentColor} />;
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        testID={`package-card-${pkg.id}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(pkg.id);
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 20,
            overflow: "hidden",
            borderWidth: isRecommended ? 2 : 1,
            borderColor: isRecommended ? pkg.accentColor : theme.borderDefault,
          }}
        >
          {/* Recommended badge */}
          {isRecommended ? (
            <LinearGradient
              colors={[theme.primary, "#FF5E73"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Sparkles size={14} color="#FFFFFF" />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: "700",
                  marginLeft: 6,
                  letterSpacing: 1,
                }}
              >
                ONERILEN
              </Text>
            </LinearGradient>
          ) : null}

          <View style={{ padding: 20 }}>
            {/* Header with icon and price */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {getPackageIcon()}
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 22,
                    fontFamily: "Syne_700Bold",
                    marginLeft: 10,
                  }}
                >
                  {pkg.name}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {pkg.isFree ? (
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 16,
                      fontFamily: "PlusJakartaSans_600SemiBold",
                    }}
                  >
                    {pkg.price}
                  </Text>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text
                      style={{
                        color: pkg.accentColor,
                        fontSize: 24,
                        fontFamily: "Syne_700Bold",
                      }}
                    >
                      {pkg.price}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 14,
                        fontFamily: "PlusJakartaSans_400Regular",
                        marginLeft: 2,
                      }}
                    >
                      {pkg.period}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: theme.borderDefault,
                marginBottom: 12,
              }}
            />

            {/* Features list */}
            <View>
              {pkg.features.map((feature, idx) => (
                <FeatureRow
                  key={idx}
                  feature={feature}
                  accentColor={pkg.accentColor}
                />
              ))}
            </View>

            {/* Select button (only for paid packages) */}
            {!pkg.isFree && (
              <Pressable
                testID={`select-${pkg.id}-button`}
                onPress={() => onSelect(pkg.id)}
                disabled={loading && isSelected}
                style={{ marginTop: 16 }}
              >
                <LinearGradient
                  colors={
                    isRecommended
                      ? [theme.primary, "#FF5E73"]
                      : [pkg.accentColor, pkg.accentColor]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  {loading && isSelected ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontFamily: "PlusJakartaSans_600SemiBold",
                      }}
                    >
                      {pkg.name} Paketi Sec
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPackage = async (packageId: string) => {
    if (packageId === "crush") {
      // Free tier - just close
      router.back();
      return;
    }

    setSelectedPackage(packageId);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Integrate with RevenueCat for actual purchases
    setTimeout(() => {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#1A0D12", "#0D0D0D"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        testID="close-paywall"
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 16,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.1)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={20} color="#fff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(232, 68, 90, 0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            }}
          >
            <Crown size={36} color={theme.primary} />
          </View>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 26,
              fontFamily: "Syne_700Bold",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Premium'a Yukselt
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 15,
              textAlign: "center",
              lineHeight: 22,
              fontFamily: "PlusJakartaSans_400Regular",
            }}
          >
            Daha fazla eslesme icin premium ozelliklerin keyfini cikar
          </Text>
        </View>

        {/* Package Cards */}
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            onSelect={handleSelectPackage}
            loading={loading}
            selectedId={selectedPackage}
          />
        ))}

        {/* Terms */}
        <Text
          style={{
            color: theme.textPlaceholder,
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            lineHeight: 16,
            fontFamily: "PlusJakartaSans_400Regular",
          }}
        >
          Abonelik otomatik olarak yenilenir. Istediginiz zaman iptal
          edebilirsiniz.{"\n"}Kullanim kosullari ve gizlilik politikasi gecerlidir.
        </Text>
      </ScrollView>
    </View>
  );
}
