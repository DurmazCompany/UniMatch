import { useState, useMemo, ReactElement, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { theme } from "@/lib/theme";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PurchasesPackage,
} from "@/lib/revenue-cat";
import {
  X,
  Crown,
  Heart,
  Eye,
  Star,
  RotateCcw,
  Sparkles,
  Check,
  Filter,
  Zap,
} from "lucide-react-native";

type TierId = "crush" | "flort" | "ask";

// Package tier definitions
interface PackageFeature {
  icon: typeof Heart;
  text: string;
  included: boolean;
}

interface PackageTier {
  id: TierId;
  storeIdentifier: string | null;
  name: string;
  price: string;
  period: string;
  perMonthHint?: string;
  savings?: string;
  isFree?: boolean;
  isRecommended?: boolean;
  accentColor: string;
  features: PackageFeature[];
  _rcPackage?: PurchasesPackage;
}

// Static tier definitions — static prices always shown, RC only used for purchasing
const TIER_DEFINITIONS: PackageTier[] = [
  {
    id: "crush",
    storeIdentifier: null,
    name: "Crush",
    price: "Ücretsiz",
    period: "",
    isFree: true,
    accentColor: "#6B7280",
    features: [
      { icon: Heart, text: "Günlük 5 beğeni hakkı", included: true },
      { icon: RotateCcw, text: "Geri alma yok", included: false },
      { icon: Eye, text: "Seni beğenenleri gör", included: false },
      { icon: Star, text: "Süper beğeni (günlük 1)", included: true },
      { icon: Filter, text: "Gelişmiş filtreler", included: false },
    ],
  },
  {
    id: "flort",
    storeIdentifier: "unimatch_flort_monthly",
    name: "Flört",
    price: "₺119,99",
    period: "/ay",
    isRecommended: true,
    accentColor: "#D4537E",
    features: [
      { icon: Heart, text: "Günlük 30 beğeni hakkı", included: true },
      { icon: RotateCcw, text: "Son beğeniyi geri al", included: true },
      { icon: Eye, text: "Seni beğenenleri gör", included: true },
      { icon: Star, text: "Günlük 3 süper beğeni", included: true },
      { icon: Filter, text: "Gelişmiş filtreler", included: true },
    ],
  },
  {
    id: "ask",
    storeIdentifier: "unimatch_ask_yearly",
    name: "Aşk",
    price: "₺74,99",
    period: "/ay",
    perMonthHint: "Yıllık ödenir · ₺899,99/yıl",
    savings: "%37 tasarruf",
    accentColor: "#FFD700",
    features: [
      { icon: Heart, text: "Sınırsız beğeni", included: true },
      { icon: RotateCcw, text: "Sınırsız geri alma", included: true },
      { icon: Eye, text: "Seni beğenenleri gör", included: true },
      { icon: Star, text: "Günlük 5 süper beğeni", included: true },
      { icon: Filter, text: "Gelişmiş filtreler + Okundu bilgisi", included: true },
    ],
  },
];

interface AddonPackage {
  id: string;
  label: string;
  price: string;
  storeId: string;
  badge?: string;
}

const SUPER_LIKE_PACKAGES: AddonPackage[] = [
  { id: "sl_5", label: "5 Süper Beğeni", price: "₺29,99", storeId: "unimatch_superlikes_5" },
  { id: "sl_15", label: "15 Süper Beğeni", price: "₺74,99", storeId: "unimatch_superlikes_15", badge: "Popüler" },
  { id: "sl_30", label: "30 Süper Beğeni", price: "₺129,99", storeId: "unimatch_superlikes_30" },
];

const BOOST_PACKAGES: AddonPackage[] = [
  { id: "boost_1", label: "1 Boost (30 dk)", price: "₺44,99", storeId: "unimatch_boost_1" },
  { id: "boost_3", label: "3 Boost", price: "₺109,99", storeId: "unimatch_boost_3", badge: "Fırsat" },
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
          color: feature.included ? "#1A0D14" : "#C4A8B4",
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

function AddonCard({
  addon,
  icon,
  onPress,
  loading,
}: {
  addon: AddonPackage;
  icon: ReactElement;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      testID={`addon-${addon.id}`}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: "#F0EAF0",
          alignItems: "center",
          minWidth: 100,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        {addon.badge ? (
          <View
            style={{
              position: "absolute",
              top: -9,
              backgroundColor: theme.primary,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 10,
                fontFamily: "PlusJakartaSans_600SemiBold",
              }}
            >
              {addon.badge}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          icon
        )}

        <Text
          style={{
            color: "#1A0D14",
            fontSize: 13,
            fontFamily: "PlusJakartaSans_600SemiBold",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {addon.label}
        </Text>
        <Text
          style={{
            color: "#8A6F78",
            fontSize: 12,
            fontFamily: "PlusJakartaSans_400Regular",
            marginTop: 4,
          }}
        >
          {addon.price}
        </Text>
      </View>
    </Pressable>
  );
}

function getPackageIcon(pkg: PackageTier) {
  switch (pkg.id) {
    case "ask":
      return <Crown size={24} color={pkg.accentColor} />;
    case "flort":
      return <Heart size={24} color={pkg.accentColor} />;
    default:
      return <Star size={24} color={pkg.accentColor} />;
  }
}

// Package card component
function PackageCard({
  pkg,
  onSelect,
  selectedId,
}: {
  pkg: PackageTier;
  onSelect: (id: TierId) => void;
  selectedId: TierId | null;
}) {
  const isSelected = selectedId === pkg.id;
  const isRecommended = pkg.isRecommended;

  // Glow animation when selected
  const glowRadius = useSharedValue(isSelected ? 16 : 6);
  const glowOpacity = useSharedValue(isSelected ? 0.35 : 0.06);
  const pulse = useSharedValue(1);

  useEffect(() => {
    glowRadius.value = withTiming(isSelected ? 20 : 6, { duration: 280 });
    glowOpacity.value = withTiming(isSelected ? 0.4 : 0.06, { duration: 280 });
    if (isSelected) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.35, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isSelected]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowRadius.value,
  }));

  const accentGlow = pkg.accentColor ?? theme.primary;

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
        <Animated.View
          style={[
            {
              backgroundColor: isRecommended ? "#FFF0F3" : "#FFFFFF",
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: isSelected ? 2 : isRecommended ? 2 : 1,
              borderColor: isSelected ? accentGlow : isRecommended ? "#E8436A" : "#F0EAF0",
              shadowColor: isSelected ? accentGlow : "#000",
              shadowOffset: { width: 0, height: 2 },
              elevation: isSelected ? 8 : 2,
            },
            glowStyle,
          ]}
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
                {getPackageIcon(pkg)}
                <Text
                  style={{
                    color: "#1A0D14",
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
                      color: "#8A6F78",
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
                backgroundColor: "#F0EAF0",
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

            {!pkg.isFree && (pkg.perMonthHint || pkg.savings) ? (
              <View style={{ marginTop: 12 }}>
                {pkg.perMonthHint ? (
                  <Text
                    style={{
                      color: "#8A6F78",
                      fontSize: 12,
                      fontFamily: "PlusJakartaSans_400Regular",
                    }}
                  >
                    {pkg.perMonthHint}
                  </Text>
                ) : null}
                {pkg.savings ? (
                  <Text
                    style={{
                      color: theme.success,
                      fontSize: 12,
                      marginTop: 2,
                      fontFamily: "PlusJakartaSans_600SemiBold",
                    }}
                  >
                    {pkg.savings}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<TierId>("crush");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasingAddonId, setPurchasingAddonId] = useState<string | null>(null);

  // Fetch live offerings from RevenueCat
  const { data: rcPackages, isLoading: loadingOfferings } = useQuery({
    queryKey: ["revenuecat-offerings"],
    queryFn: getOfferings,
  });

  // Build display tiers — static prices always shown, RC package only attached for purchasing
  const packages: PackageTier[] = useMemo(
    () =>
      TIER_DEFINITIONS.map((tier) => {
        if (tier.isFree || tier.storeIdentifier === null) return tier;
        const rcPkg = rcPackages?.find(
          (p: PurchasesPackage) => p.product.identifier === tier.storeIdentifier
        );
        // Only attach RC package for purchasing — don't override static prices
        return rcPkg ? { ...tier, _rcPackage: rcPkg } : tier;
      }),
    [rcPackages]
  );

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    onSuccess: (customerInfo) => {
      if (customerInfo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError("Satin alma basarisiz oldu. Lutfen tekrar deneyin.");
    },
  });

  // Restore purchases mutation
  const restoreMutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (isPremium) => {
      if (isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setPurchaseError("Geri yuklenecek satin alma bulunamadi.");
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError("Geri yukleme basarisiz oldu.");
    },
  });

  const addonMutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPurchasingAddonId(null);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError("Satin alma basarisiz oldu. Lutfen tekrar deneyin.");
      setPurchasingAddonId(null);
    },
  });

  const handlePurchaseAddon = (addon: AddonPackage) => {
    const rcPkg = rcPackages?.find(
      (p: PurchasesPackage) => p.product.identifier === addon.storeId
    );
    if (!rcPkg) {
      setPurchaseError("Bu paket su an mevcut degil.");
      return;
    }
    setPurchaseError(null);
    setPurchasingAddonId(addon.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addonMutation.mutate(rcPkg);
  };

  const selectedTier = packages.find((tier) => tier.id === selectedId) ?? packages[0];

  const handleSelectPackage = (packageId: TierId) => {
    setPurchaseError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(packageId);
  };

  const handleContinue = () => {
    if (!selectedTier) return;

    if (selectedTier.isFree) {
      router.back();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const rcPkg = selectedTier._rcPackage;
    if (rcPkg) {
      purchaseMutation.mutate(rcPkg);
    } else {
      setPurchaseError("Bu paket su an mevcut degil. Lutfen daha sonra tekrar deneyin.");
    }
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchaseError(null);
    restoreMutation.mutate();
  };

  const isPurchasing = purchaseMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F6" }}>
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
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        <X size={20} color="#1A0D14" />
      </Pressable>

      <Text
        style={{
          color: "#8A6F78",
          fontSize: 12,
          textAlign: "center",
          marginTop: insets.top + 18,
          marginHorizontal: 20,
          fontFamily: "PlusJakartaSans_400Regular",
        }}
      >
        İstediğin zaman iptal edebilirsin
      </Text>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
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
              backgroundColor: "#FFF0F3",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: "#E8436A",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
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

        {/* Package cards — always shown with static prices */}
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            onSelect={handleSelectPackage}
            selectedId={selectedId}
          />
        ))}

        <Pressable
          onPress={handleContinue}
          disabled={isPurchasing}
          testID="paywall-continue-button"
          style={({ pressed }) => ({
            opacity: pressed || isPurchasing ? 0.8 : 1,
            marginTop: 8,
            marginBottom: 12,
          })}
        >
          <LinearGradient
            colors={[theme.primary, "#FF5E73"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                }}
              >
                {selectedTier?.isFree
                  ? "Ücretsiz devam et"
                  : `Şimdi başla · ${selectedTier.price}${selectedTier.period}`}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Error message */}
        {purchaseError !== null ? (
          <View
            style={{
              backgroundColor: "#FFF0F0",
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
            testID="purchase-error"
          >
            <Text
              style={{
                color: theme.error ?? "#EF4444",
                fontSize: 14,
                textAlign: "center",
                fontFamily: "PlusJakartaSans_400Regular",
              }}
            >
              {purchaseError}
            </Text>
          </View>
        ) : null}

        {/* À la carte section */}
        <View
          style={{
            marginTop: 8,
            marginBottom: 8,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: "#F0EAF0",
          }}
        >
          {/* Section header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Sparkles size={18} color={theme.primary} />
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 16,
                fontFamily: "Syne_700Bold",
              }}
            >
              Tek seferlik ekstralar
            </Text>
          </View>

          {/* Boost subsection */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
              borderWidth: 1,
              borderColor: "#F0EAF0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Zap size={15} color="#E8436A" />
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 14,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                }}
              >
                Boost
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 4 }}
            >
              {BOOST_PACKAGES.map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  icon={<Zap size={20} color="#E8436A" />}
                  onPress={() => handlePurchaseAddon(addon)}
                  loading={purchasingAddonId === addon.id}
                />
              ))}
            </ScrollView>
          </View>

          {/* Super Like subsection */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 4,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
              borderWidth: 1,
              borderColor: "#F0EAF0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Star size={15} color="#FFD700" />
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 14,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                }}
              >
                Süper Beğeni
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 4 }}
            >
              {SUPER_LIKE_PACKAGES.map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  icon={<Star size={20} color="#FFD700" />}
                  onPress={() => handlePurchaseAddon(addon)}
                  loading={purchasingAddonId === addon.id}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Restore purchases */}
        <Pressable
          onPress={handleRestore}
          disabled={restoreMutation.isPending}
          testID="restore-purchases-button"
          style={({ pressed }) => ({
            alignItems: "center",
            opacity: pressed || restoreMutation.isPending ? 0.7 : 1,
            paddingVertical: 12,
            marginTop: 4,
          })}
        >
          {restoreMutation.isPending ? (
            <ActivityIndicator color={theme.textSecondary} size="small" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <RotateCcw size={16} color={theme.textSecondary} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontFamily: "PlusJakartaSans_400Regular",
                }}
              >
                Satin almalari geri yukle
              </Text>
            </View>
          )}
        </Pressable>

        {/* App Store compliance terms */}
        <View
          style={{
            marginTop: 12,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: "#F0EAF0",
          }}
        >
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
            Abonelik otomatik olarak yenilenir. Mevcut donem bitmeden en az 24 saat once iptal etmezseniz otomatik olarak yenilenir. Odeme Apple ID hesabinizdan alinir.
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 16,
              marginTop: 10,
            }}
          >
            <Pressable
              onPress={() => Linking.openURL("https://example.com/terms")}
              testID="terms-link"
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 12,
                  textDecorationLine: "underline",
                  fontFamily: "PlusJakartaSans_400Regular",
                }}
              >
                Kullanim Kosullari
              </Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL("https://example.com/privacy")}
              testID="privacy-link"
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 12,
                  textDecorationLine: "underline",
                  fontFamily: "PlusJakartaSans_400Regular",
                }}
              >
                Gizlilik Politikasi
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
