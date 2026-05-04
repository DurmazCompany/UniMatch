import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
import { Colors, Radius } from "@/lib/theme";
import { UMCard, UMButton } from "@/components/ui";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PurchasesPackage,
} from "@/lib/revenue-cat";

type IoniconName = keyof typeof Ionicons.glyphMap;
type TierId = "crush" | "flort" | "ask";

interface PackageFeature {
  icon: IoniconName;
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

const TIER_DEFINITIONS: PackageTier[] = [
  {
    id: "crush",
    storeIdentifier: null,
    name: "Crush",
    price: "Ücretsiz",
    period: "",
    isFree: true,
    accentColor: Colors.textMuted,
    features: [
      { icon: "heart-outline", text: "Günlük 5 beğeni hakkı", included: true },
      { icon: "refresh-outline", text: "Geri alma yok", included: false },
      { icon: "eye-outline", text: "Seni beğenenleri gör", included: false },
      { icon: "star-outline", text: "Süper beğeni (günlük 1)", included: true },
      { icon: "options-outline", text: "Gelişmiş filtreler", included: false },
    ],
  },
  {
    id: "flort",
    storeIdentifier: "unimatch_flort_monthly",
    name: "Flört",
    price: "₺119,99",
    period: "/ay",
    isRecommended: true,
    accentColor: Colors.primary,
    features: [
      { icon: "heart-outline", text: "Günlük 30 beğeni hakkı", included: true },
      { icon: "refresh-outline", text: "Son beğeniyi geri al", included: true },
      { icon: "eye-outline", text: "Seni beğenenleri gör", included: true },
      { icon: "star-outline", text: "Günlük 3 süper beğeni", included: true },
      { icon: "options-outline", text: "Gelişmiş filtreler", included: true },
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
    accentColor: "#D4AC0D",
    features: [
      { icon: "heart-outline", text: "Sınırsız beğeni", included: true },
      { icon: "refresh-outline", text: "Sınırsız geri alma", included: true },
      { icon: "eye-outline", text: "Seni beğenenleri gör", included: true },
      { icon: "star-outline", text: "Günlük 5 süper beğeni", included: true },
      { icon: "options-outline", text: "Gelişmiş filtreler + Okundu bilgisi", included: true },
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

function FeatureRow({ feature, accentColor }: { feature: PackageFeature; accentColor: string }) {
  const iconColor = feature.included ? accentColor : "#C4A8B4";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
      <View style={{ width: 24, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
        <Ionicons name={feature.icon} size={16} color={iconColor} />
      </View>
      <Text
        style={{
          flex: 1,
          color: feature.included ? Colors.textDark : "#C4A8B4",
          fontSize: 14,
          fontFamily: "DMSans_400Regular",
        }}
      >
        {feature.text}
      </Text>
      <Ionicons
        name={feature.included ? "checkmark-circle" : "close-circle"}
        size={18}
        color={feature.included ? "#4CD964" : "#C4A8B4"}
      />
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
  icon: IoniconName;
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
          backgroundColor: Colors.white,
          borderRadius: Radius.card,
          padding: 14,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          alignItems: "center",
          minWidth: 110,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        {addon.badge ? (
          <View
            style={{
              position: "absolute",
              top: -10,
              backgroundColor: Colors.primary,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontFamily: "DMSans_700Bold" }}>
              {addon.badge}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.primaryPale,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Ionicons name={icon} size={20} color={Colors.primary} />
          )}
        </View>
        <Text style={{ color: Colors.textDark, fontSize: 13, fontFamily: "DMSans_600SemiBold", marginTop: 8, textAlign: "center" }}>
          {addon.label}
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 4 }}>
          {addon.price}
        </Text>
      </View>
    </Pressable>
  );
}

function getPackageIcon(pkg: PackageTier): IoniconName {
  switch (pkg.id) {
    case "ask":
      return "diamond-outline";
    case "flort":
      return "heart-outline";
    default:
      return "star-outline";
  }
}

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

  const accentGlow = pkg.accentColor;

  return (
    <View style={{ marginBottom: 14 }}>
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
              backgroundColor: isRecommended ? Colors.primaryPale : Colors.white,
              borderRadius: Radius.card,
              overflow: "hidden",
              borderWidth: isSelected ? 2 : isRecommended ? 2 : 1,
              borderColor: isSelected ? accentGlow : isRecommended ? Colors.primary : "rgba(0,0,0,0.06)",
              shadowColor: isSelected ? accentGlow : "#000",
              shadowOffset: { width: 0, height: 2 },
              elevation: isSelected ? 8 : 2,
            },
            glowStyle,
          ]}
        >
          {isRecommended ? (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="sparkles-outline" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontFamily: "DMSans_700Bold", letterSpacing: 1 }}>
                ÖNERİLEN
              </Text>
            </LinearGradient>
          ) : null}

          <View style={{ padding: 18 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name={getPackageIcon(pkg)} size={22} color={pkg.accentColor} />
                <Text style={{ color: Colors.textDark, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
                  {pkg.name}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {pkg.isFree ? (
                  <Text style={{ color: Colors.textMuted, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                    {pkg.price}
                  </Text>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ color: pkg.accentColor, fontSize: 24, fontFamily: "DMSans_700Bold" }}>
                      {pkg.price}
                    </Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 14, fontFamily: "DMSans_400Regular", marginLeft: 2 }}>
                      {pkg.period}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginBottom: 8 }} />

            <View>
              {pkg.features.map((feature, idx) => (
                <FeatureRow key={idx} feature={feature} accentColor={pkg.accentColor} />
              ))}
            </View>

            {!pkg.isFree && (pkg.perMonthHint || pkg.savings) ? (
              <View style={{ marginTop: 10 }}>
                {pkg.perMonthHint ? (
                  <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" }}>
                    {pkg.perMonthHint}
                  </Text>
                ) : null}
                {pkg.savings ? (
                  <Text style={{ color: "#4CD964", fontSize: 12, marginTop: 2, fontFamily: "DMSans_600SemiBold" }}>
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

  const { data: rcPackages } = useQuery({
    queryKey: ["revenuecat-offerings"],
    queryFn: getOfferings,
  });

  const packages: PackageTier[] = useMemo(
    () =>
      TIER_DEFINITIONS.map((tier) => {
        if (tier.isFree || tier.storeIdentifier === null) return tier;
        const rcPkg = rcPackages?.find(
          (p: PurchasesPackage) => p.product.identifier === tier.storeIdentifier
        );
        return rcPkg ? { ...tier, _rcPackage: rcPkg } : tier;
      }),
    [rcPackages]
  );

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
      setPurchaseError("Satın alma başarısız oldu. Lütfen tekrar deneyin.");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (isPremium) => {
      if (isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setPurchaseError("Geri yüklenecek satın alma bulunamadı.");
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError("Geri yükleme başarısız oldu.");
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
      setPurchaseError("Satın alma başarısız oldu. Lütfen tekrar deneyin.");
      setPurchasingAddonId(null);
    },
  });

  const handlePurchaseAddon = (addon: AddonPackage) => {
    const rcPkg = rcPackages?.find(
      (p: PurchasesPackage) => p.product.identifier === addon.storeId
    );
    if (!rcPkg) {
      setPurchaseError("Bu paket şu an mevcut değil.");
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
      setPurchaseError("Bu paket şu an mevcut değil. Lütfen daha sonra tekrar deneyin.");
    }
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchaseError(null);
    restoreMutation.mutate();
  };

  const isPurchasing = purchaseMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }}>
      <StatusBar barStyle="dark-content" />
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
          backgroundColor: Colors.white,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        <Ionicons name="close-outline" size={20} color={Colors.textDark} />
      </Pressable>

      <Text
        style={{
          color: Colors.textMuted,
          fontSize: 12,
          textAlign: "center",
          marginTop: insets.top + 18,
          marginHorizontal: 20,
          fontFamily: "DMSans_400Regular",
        }}
      >
        İstediğin zaman iptal edebilirsin
      </Text>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 14,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.primaryPale,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
            }}
          >
            <Ionicons name="sparkles-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={{ color: Colors.textDark, fontSize: 32, fontFamily: "DMSerifDisplay_400Regular", textAlign: "center", marginBottom: 6 }}>
            Premium'a Yükselt
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22, fontFamily: "DMSans_400Regular" }}>
            Daha fazla eşleşme için premium özelliklerin keyfini çıkar
          </Text>
        </View>

        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} selectedId={selectedId} />
        ))}

        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <UMButton
            variant="primary"
            label={
              selectedTier?.isFree
                ? "Ücretsiz devam et"
                : `Şimdi başla · ${selectedTier.price}${selectedTier.period}`
            }
            loading={isPurchasing}
            onPress={handleContinue}
          />
        </View>

        {purchaseError !== null ? (
          <View
            style={{
              backgroundColor: "#FFEAEA",
              borderRadius: Radius.card,
              padding: 12,
              marginBottom: 12,
            }}
            testID="purchase-error"
          >
            <Text style={{ color: "#FF3B30", fontSize: 14, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
              {purchaseError}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <Text style={{ color: Colors.textDark, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
              Tek seferlik ekstralar
            </Text>
          </View>

          <UMCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="flash-outline" size={16} color={Colors.primary} />
              <Text style={{ color: Colors.textDark, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>Boost</Text>
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
                  icon="flash-outline"
                  onPress={() => handlePurchaseAddon(addon)}
                  loading={purchasingAddonId === addon.id}
                />
              ))}
            </ScrollView>
          </UMCard>

          <UMCard style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="star" size={16} color={Colors.primary} />
              <Text style={{ color: Colors.textDark, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>Süper Beğeni</Text>
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
                  icon="star"
                  onPress={() => handlePurchaseAddon(addon)}
                  loading={purchasingAddonId === addon.id}
                />
              ))}
            </ScrollView>
          </UMCard>
        </View>

        <Pressable
          onPress={handleRestore}
          disabled={restoreMutation.isPending}
          testID="restore-purchases-button"
          style={({ pressed }) => ({
            alignItems: "center",
            opacity: pressed || restoreMutation.isPending ? 0.7 : 1,
            paddingVertical: 14,
            marginTop: 8,
          })}
        >
          {restoreMutation.isPending ? (
            <ActivityIndicator color={Colors.textMuted} size="small" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="refresh-outline" size={16} color={Colors.textMuted} />
              <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular" }}>
                Satın almaları geri yükle
              </Text>
            </View>
          )}
        </Pressable>

        <View style={{ marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" }}>
          <Text style={{ color: Colors.textMuted, fontSize: 11, textAlign: "center", marginTop: 4, lineHeight: 16, fontFamily: "DMSans_400Regular" }}>
            Abonelik otomatik olarak yenilenir. Mevcut dönem bitmeden en az 24 saat önce iptal etmezseniz otomatik olarak yenilenir. Ödeme Apple ID hesabınızdan alınır.
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 10 }}>
            <Pressable onPress={() => Linking.openURL("https://example.com/terms")} testID="terms-link">
              <Text style={{ color: Colors.primary, fontSize: 12, textDecorationLine: "underline", fontFamily: "DMSans_400Regular" }}>
                Kullanım Koşulları
              </Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL("https://example.com/privacy")} testID="privacy-link">
              <Text style={{ color: Colors.primary, fontSize: 12, textDecorationLine: "underline", fontFamily: "DMSans_400Regular" }}>
                Gizlilik Politikası
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
