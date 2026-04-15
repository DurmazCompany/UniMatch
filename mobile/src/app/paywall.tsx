import { useState } from "react";
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
  storeIdentifier: string | null;
  name: string;
  price: string;
  period: string;
  isFree?: boolean;
  isRecommended?: boolean;
  accentColor: string;
  features: PackageFeature[];
  _rcPackage?: PurchasesPackage;
}

// Static tier definitions — prices are overridden by RevenueCat at runtime
const TIER_DEFINITIONS: PackageTier[] = [
  {
    id: "crush",
    storeIdentifier: null,
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
    storeIdentifier: "crush_monthly",
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
    storeIdentifier: "lover_yearly",
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
                disabled={!!(loading && isSelected)}
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
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Fetch live offerings from RevenueCat
  const { data: rcPackages, isLoading: loadingOfferings } = useQuery({
    queryKey: ["revenuecat-offerings"],
    queryFn: getOfferings,
  });

  // Build display tiers by merging static definitions with live RC prices
  const packages: PackageTier[] = TIER_DEFINITIONS.map((tier) => {
    if (tier.isFree || tier.storeIdentifier === null) return tier;
    const rcPkg = rcPackages?.find(
      (p: PurchasesPackage) => p.product.identifier === tier.storeIdentifier
    );
    if (rcPkg) {
      return { ...tier, price: rcPkg.product.priceString, _rcPackage: rcPkg };
    }
    return tier;
  });

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

  const handleSelectPackage = (packageId: string) => {
    if (packageId === "crush") {
      // Free tier — just close
      router.back();
      return;
    }

    setPurchaseError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPackage(packageId);

    const tier = packages.find((p) => p.id === packageId);
    const rcPkg = tier?._rcPackage;
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

        {/* Loading state for offerings */}
        {loadingOfferings ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }} testID="offerings-loading">
            <ActivityIndicator color={theme.primary} size="large" />
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                marginTop: 12,
                fontFamily: "PlusJakartaSans_400Regular",
              }}
            >
              Fiyatlar yukleniyor...
            </Text>
          </View>
        ) : (
          packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSelect={handleSelectPackage}
              loading={isPurchasing}
              selectedId={selectedPackage}
            />
          ))
        )}

        {/* Error message */}
        {purchaseError !== null ? (
          <View
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
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
            borderTopColor: "rgba(255,255,255,0.08)",
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
