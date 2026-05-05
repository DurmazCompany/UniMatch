import { useState, useEffect } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Colors, Radius } from "@/lib/theme";
import { UMButton } from "@/components/ui";
import { CoinIcon, BoostIcon } from "@/components/icons/UnimatchIcons";
import { purchasePackageById, restorePurchases } from "@/lib/revenue-cat";
import {
  TIER_DEFINITIONS,
  COIN_PACKAGES,
  type TierDefinition,
  type TierId,
  type TierFeature,
  type CoinPackage,
} from "@/constants/tiers";

function FeatureRow({ feature, accentColor }: { feature: TierFeature; accentColor: string }) {
  const iconColor = feature.included ? accentColor : Colors.textMuted;
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

function TierCard({
  tier,
  isSelected,
  onSelect,
}: {
  tier: TierDefinition;
  isSelected: boolean;
  onSelect: (id: TierId) => void;
}) {
  const isRecommended = tier.isRecommended;
  const isAsk = tier.id === "ask";
  const accentGlow = tier.accentColor;

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
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isSelected]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowRadius.value,
  }));

  return (
    <View style={{ marginBottom: 14 }}>
      <Pressable
        testID={`package-card-${tier.id}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(tier.id);
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
              borderColor: isSelected
                ? accentGlow
                : isRecommended
                  ? Colors.primary
                  : "rgba(0,0,0,0.06)",
              shadowColor: isSelected ? accentGlow : "#000",
              shadowOffset: { width: 0, height: 2 },
              elevation: isSelected ? 8 : 2,
            },
            glowStyle,
          ]}
        >
          {isAsk ? (
            <LinearGradient
              colors={["#FFD700", "#FF8C00"]}
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
              <Ionicons name="diamond" size={14} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "DMSans_700Bold",
                  letterSpacing: 1,
                }}
              >
                EN POPÜLER
              </Text>
            </LinearGradient>
          ) : isRecommended ? (
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
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "DMSans_700Bold",
                  letterSpacing: 1,
                }}
              >
                ÖNERİLEN
              </Text>
            </LinearGradient>
          ) : null}

          <View style={{ padding: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <Text style={{ color: Colors.textDark, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
                {tier.name}
              </Text>
              <View style={{ alignItems: "flex-end" }}>
                {tier.isFree ? (
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: 16,
                      fontFamily: "DMSans_600SemiBold",
                    }}
                  >
                    {tier.price}
                  </Text>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text
                      style={{
                        color: tier.accentColor,
                        fontSize: 24,
                        fontFamily: "DMSans_700Bold",
                      }}
                    >
                      {tier.price}
                    </Text>
                    <Text
                      style={{
                        color: Colors.textMuted,
                        fontSize: 14,
                        fontFamily: "DMSans_400Regular",
                        marginLeft: 2,
                      }}
                    >
                      {tier.period}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!tier.isFree && (tier.perMonthHint || tier.savings) ? (
              <View style={{ marginTop: -8, marginBottom: 12, alignItems: "flex-end" }}>
                {tier.perMonthHint ? (
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: 12,
                      fontFamily: "DMSans_400Regular",
                    }}
                  >
                    {tier.perMonthHint}
                  </Text>
                ) : null}
                {tier.savings ? (
                  <Text
                    style={{
                      color: "#4CD964",
                      fontSize: 12,
                      marginTop: 2,
                      fontFamily: "DMSans_600SemiBold",
                    }}
                  >
                    {tier.savings}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginBottom: 8 }} />

            <View>
              {tier.features.map((feature, idx) => (
                <FeatureRow key={idx} feature={feature} accentColor={tier.accentColor} />
              ))}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function CoinPackageCard({
  pkg,
  onPurchase,
  loading,
}: {
  pkg: CoinPackage;
  onPurchase: (pkg: CoinPackage) => void;
  loading: boolean;
}) {
  return (
    <View
      testID={`coin-package-${pkg.id}`}
      style={{
        backgroundColor: Colors.white,
        borderRadius: Radius.card,
        padding: 18,
        marginBottom: 12,
        borderWidth: pkg.bestValue ? 2 : 1,
        borderColor: pkg.bestValue ? Colors.primary : "rgba(0,0,0,0.06)",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      {pkg.bestValue ? (
        <View
          style={{
            position: "absolute",
            top: -10,
            right: 16,
            backgroundColor: Colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            zIndex: 2,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontFamily: "DMSans_700Bold", letterSpacing: 0.6 }}>
            EN İYİ
          </Text>
        </View>
      ) : null}

      {pkg.badge ? (
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            backgroundColor: "#FFD66B",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            transform: [{ rotate: "-8deg" }],
            zIndex: 2,
          }}
        >
          <Text style={{ color: "#7A4F00", fontSize: 10, fontFamily: "DMSans_700Bold" }}>
            {pkg.badge}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#FFF6D6",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CoinIcon size={36} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.textDark, fontSize: 24, fontFamily: "DMSans_700Bold" }}>
          {pkg.label ?? `${pkg.coins.toLocaleString("tr-TR")} coin`}
        </Text>
        <Text
          style={{
            color: Colors.textMuted,
            fontSize: 14,
            fontFamily: "DMSans_500Medium",
            marginTop: 2,
          }}
        >
          {pkg.price}
        </Text>
      </View>

      <Pressable
        testID={`coin-buy-${pkg.id}`}
        onPress={() => onPurchase(pkg)}
        disabled={loading}
        style={({ pressed }) => ({
          backgroundColor: Colors.primary,
          paddingHorizontal: 18,
          height: 40,
          borderRadius: Radius.pill,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed || loading ? 0.7 : 1,
          minWidth: 90,
        })}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={{ color: Colors.white, fontFamily: "DMSans_700Bold", fontSize: 14 }}>
            Satın Al
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<TierId>("ask");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasingCoinId, setPurchasingCoinId] = useState<string | null>(null);

  const purchaseTierMutation = useMutation({
    mutationFn: (storeId: string) => purchasePackageById(storeId),
    onSuccess: (customerInfo) => {
      if (customerInfo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
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
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
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

  const coinMutation = useMutation({
    mutationFn: (storeId: string) => purchasePackageById(storeId),
    onSuccess: (customerInfo) => {
      setPurchasingCoinId(null);
      if (customerInfo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError("Coin satın alma başarısız oldu.");
      setPurchasingCoinId(null);
    },
  });

  const selectedTier = TIER_DEFINITIONS.find((t) => t.id === selectedId) ?? TIER_DEFINITIONS[0];

  const handleSelectTier = (id: TierId) => {
    setPurchaseError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
  };

  const handleContinue = () => {
    if (!selectedTier) return;
    if (selectedTier.isFree || !selectedTier.storeId) {
      router.back();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchaseError(null);
    purchaseTierMutation.mutate(selectedTier.storeId);
  };

  const handleCoinPurchase = (pkg: CoinPackage) => {
    setPurchaseError(null);
    setPurchasingCoinId(pkg.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    coinMutation.mutate(pkg.storeId);
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchaseError(null);
    restoreMutation.mutate();
  };

  const ctaLabel = selectedTier?.isFree
    ? "Ücretsiz Devam Et"
    : `Şimdi Başla · ${selectedTier.price}${selectedTier.period}`;

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
          <Text
            style={{
              color: Colors.textDark,
              fontSize: 32,
              fontFamily: "DMSerifDisplay_400Regular",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Premium&apos;a Yükselt
          </Text>
          <Text
            style={{
              color: Colors.textMuted,
              fontSize: 15,
              textAlign: "center",
              lineHeight: 22,
              fontFamily: "DMSans_400Regular",
            }}
          >
            Daha fazla eşleşme ve ayrıcalık için
          </Text>
        </View>

        {TIER_DEFINITIONS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isSelected={selectedId === tier.id}
            onSelect={handleSelectTier}
          />
        ))}

        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <UMButton
            variant="primary"
            label={ctaLabel}
            loading={purchaseTierMutation.isPending}
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
            <Text
              style={{
                color: "#FF3B30",
                fontSize: 14,
                textAlign: "center",
                fontFamily: "DMSans_400Regular",
              }}
            >
              {purchaseError}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 28, marginBottom: 4 }}>
          <Text
            style={{
              color: Colors.textDark,
              fontSize: 20,
              fontFamily: "DMSans_700Bold",
            }}
          >
            💰 Coin Yükle
          </Text>
          <Text
            style={{
              color: Colors.textMuted,
              fontSize: 14,
              fontFamily: "DMSans_400Regular",
              marginTop: 4,
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            Hediye gönder, boost al
          </Text>
        </View>

        {COIN_PACKAGES.map((pkg) => (
          <CoinPackageCard
            key={pkg.id}
            pkg={pkg}
            onPurchase={handleCoinPurchase}
            loading={purchasingCoinId === pkg.id}
          />
        ))}

        {/* Boost à la carte — info card pointing to /boost */}
        <View style={{ marginTop: 28, marginBottom: 4 }}>
          <Text style={{ color: Colors.textDark, fontSize: 20, fontFamily: "DMSans_700Bold" }}>
            ⚡ Boost Al
          </Text>
          <Text style={{ color: Colors.textMuted, fontSize: 14, fontFamily: "DMSans_400Regular", marginTop: 4, marginBottom: 16, lineHeight: 20 }}>
            30 dakika için profilini 3x daha fazla kişiye göster
          </Text>
        </View>

        {[
          { id: "boost_1", label: "1× Boost (30 dk)", coinCost: 750, badge: null },
          { id: "boost_3", label: "3× Boost paketi", coinCost: 2000, badge: "fırsat" },
          { id: "boost_10", label: "10× Boost paketi", coinCost: 6000, badge: "en iyi" },
        ].map((b) => (
          <Pressable
            key={b.id}
            onPress={() => { router.push("/boost"); }}
            style={({ pressed }) => ({
              backgroundColor: Colors.white,
              borderRadius: Radius.card,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              padding: 16,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryPale, alignItems: "center", justifyContent: "center" }}>
              <BoostIcon size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: Colors.textDark, fontSize: 15, fontFamily: "DMSans_600SemiBold" }}>{b.label}</Text>
                {b.badge ? (
                  <View style={{ backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: Colors.white, fontSize: 9, fontFamily: "DMSans_700Bold", textTransform: "uppercase" }}>{b.badge}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <CoinIcon size={12} />
                <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" }}>{b.coinCost.toLocaleString("tr-TR")} coin</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        ))}

        <Pressable
          onPress={handleRestore}
          disabled={restoreMutation.isPending}
          testID="restore-purchases-button"
          style={({ pressed }) => ({
            alignItems: "center",
            opacity: pressed || restoreMutation.isPending ? 0.7 : 1,
            paddingVertical: 14,
            marginTop: 12,
          })}
        >
          {restoreMutation.isPending ? (
            <ActivityIndicator color={Colors.textMuted} size="small" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="refresh-outline" size={16} color={Colors.textMuted} />
              <Text
                style={{
                  color: Colors.textMuted,
                  fontSize: 13,
                  fontFamily: "DMSans_400Regular",
                }}
              >
                Satın almaları geri yükle
              </Text>
            </View>
          )}
        </Pressable>

        <View
          style={{
            marginTop: 12,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Text
            style={{
              color: Colors.textMuted,
              fontSize: 11,
              textAlign: "center",
              marginTop: 4,
              lineHeight: 16,
              fontFamily: "DMSans_400Regular",
            }}
          >
            Abonelik otomatik olarak yenilenir. Mevcut dönem bitmeden en az 24 saat önce iptal etmezseniz otomatik olarak yenilenir. Ödeme Apple ID hesabınızdan alınır.
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 10 }}>
            <Pressable
              onPress={() => Linking.openURL("https://example.com/terms")}
              testID="terms-link"
            >
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: 12,
                  textDecorationLine: "underline",
                  fontFamily: "DMSans_400Regular",
                }}
              >
                Kullanım Koşulları
              </Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL("https://example.com/privacy")}
              testID="privacy-link"
            >
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: 12,
                  textDecorationLine: "underline",
                  fontFamily: "DMSans_400Regular",
                }}
              >
                Gizlilik Politikası
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
