import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X,
  Crown,
  Heart,
  Eye,
  Zap,
  Star,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  Filter,
} from "lucide-react-native";
import { theme, gradients } from "@/lib/theme";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PurchasesPackage,
} from "@/lib/revenue-cat";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

// Product identifiers
const PRODUCT_IDS = {
  platonic: "platonic_weekly",
  crush: "crush_monthly",
  lover: "lover_yearly",
};

// Tier configurations
const TIERS = [
  {
    id: "platonic",
    name: "Platonic",
    priceHint: "29.99/hafta",
    badge: null,
    gradientColors: ["#374151", "#1F2937"] as [string, string],
    borderColor: "#4B5563",
    features: [
      { icon: Heart, text: "Sinirsiz begeni", included: true },
      { icon: Star, text: "Gunluk 3 super begeni", included: true },
      { icon: Eye, text: "Begenileri gor", included: true },
      { icon: Zap, text: "Oncelikli gorunurluk", included: false },
      { icon: Sparkles, text: "Boost", included: false },
      { icon: Shield, text: "VIP rozet", included: false },
      { icon: Filter, text: "Ozel filtreler", included: false },
    ],
  },
  {
    id: "crush",
    name: "Crush",
    priceHint: "79.99/ay",
    badge: "POPULER",
    badgeColor: "#E11D48",
    gradientColors: ["#7F1D1D", "#450A0A"] as [string, string],
    borderColor: "#E11D48",
    features: [
      { icon: Heart, text: "Sinirsiz begeni", included: true },
      { icon: Star, text: "Gunluk 5 super begeni", included: true },
      { icon: Eye, text: "Begenileri gor", included: true },
      { icon: Zap, text: "Oncelikli gorunurluk", included: true },
      { icon: Sparkles, text: "Boost", included: true },
      { icon: Shield, text: "VIP rozet", included: false },
      { icon: Filter, text: "Ozel filtreler", included: false },
    ],
  },
  {
    id: "lover",
    name: "Lover",
    priceHint: "499.99/yil",
    badge: "EN AVANTAJLI",
    badgeColor: "#F59E0B",
    gradientColors: ["#78350F", "#451A03"] as [string, string],
    borderColor: "#F59E0B",
    features: [
      { icon: Heart, text: "Sinirsiz begeni", included: true },
      { icon: Star, text: "Sinirsiz super begeni", included: true },
      { icon: Eye, text: "Begenileri gor", included: true },
      { icon: Zap, text: "Oncelikli gorunurluk", included: true },
      { icon: Sparkles, text: "Boost", included: true },
      { icon: Shield, text: "VIP rozet", included: true },
      { icon: Filter, text: "Ozel filtreler", included: true },
    ],
  },
];

export function PaywallModal({
  visible,
  onClose,
  onPurchaseComplete,
}: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedTier, setSelectedTier] = useState<string>("crush");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const crownRotate = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // Fetch offerings from RevenueCat
  const {
    data: packages,
    isLoading: loadingOfferings,
    refetch: refetchOfferings,
  } = useQuery({
    queryKey: ["revenuecat-offerings"],
    queryFn: getOfferings,
    enabled: visible,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    onSuccess: (customerInfo) => {
      if (customerInfo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPurchaseComplete?.();
        onClose();
      }
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError("Satin alma basarisiz oldu. Lutfen tekrar deneyin.");
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (isPremium) => {
      if (isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPurchaseComplete?.();
        onClose();
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

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 250 });
      crownRotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 400 }),
          withTiming(5, { duration: 400 })
        ),
        -1,
        true
      );
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );
      setPurchaseError(null);
    } else {
      scale.value = 0.9;
      opacity.value = 0;
    }
  }, [visible]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotate.value}deg` }],
  }));

  const getPackageForTier = (tierId: string): PurchasesPackage | undefined => {
    if (!packages) return undefined;
    const productId = PRODUCT_IDS[tierId as keyof typeof PRODUCT_IDS];
    return packages.find((pkg) => pkg.product.identifier === productId);
  };

  const handlePurchase = () => {
    const pkg = getPackageForTier(selectedTier);
    if (pkg) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPurchaseError(null);
      purchaseMutation.mutate(pkg);
    }
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchaseError(null);
    restoreMutation.mutate();
  };

  const handleSelectTier = (tierId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTier(tierId);
    setPurchaseError(null);
  };

  const formatPrice = (tierId: string): string => {
    const pkg = getPackageForTier(tierId);
    if (pkg) {
      return pkg.product.priceString;
    }
    const tier = TIERS.find((t) => t.id === tierId);
    return tier?.priceHint || "";
  };

  const formatPeriod = (tierId: string): string => {
    switch (tierId) {
      case "platonic":
        return "/ hafta";
      case "crush":
        return "/ ay";
      case "lover":
        return "/ yil";
      default:
        return "";
    }
  };

  const selectedTierData = TIERS.find((t) => t.id === selectedTier);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      testID="paywall-modal"
    >
      <View style={{ flex: 1, backgroundColor: "rgba(10,10,15,0.97)" }}>
        <Animated.View style={[{ flex: 1 }, contentStyle]}>
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 12,
              paddingHorizontal: 20,
              paddingBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ width: 40 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Animated.View style={crownStyle}>
                <Crown size={24} color="#F59E0B" fill="#F59E0B" />
              </Animated.View>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 20,
                  fontFamily: "Syne_700Bold",
                  letterSpacing: -0.5,
                }}
              >
                Premium
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              testID="paywall-close-button"
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <X size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero section */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 26,
                  fontFamily: "Syne_700Bold",
                  textAlign: "center",
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}
              >
                Daha Fazla Eslesme
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                Sana en uygun plani sec
              </Text>
            </View>

            {/* Tier Cards - from top (Lover) to bottom (Platonic) */}
            {loadingOfferings ? (
              <View style={{ alignItems: "center", padding: 32 }}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    marginTop: 12,
                  }}
                >
                  Fiyatlar yukleniyor...
                </Text>
              </View>
            ) : (
              <View style={{ gap: 16, marginBottom: 20 }}>
                {/* Reverse order: Lover, Crush, Platonic */}
                {[...TIERS].reverse().map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <Pressable
                      key={tier.id}
                      onPress={() => handleSelectTier(tier.id)}
                      testID={`tier-${tier.id}`}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <LinearGradient
                        colors={tier.gradientColors}
                        style={{
                          borderRadius: 20,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? tier.borderColor : "rgba(255,255,255,0.1)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Badge */}
                        {tier.badge ? (
                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              backgroundColor: tier.badgeColor,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderBottomLeftRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: "800",
                                letterSpacing: 0.5,
                              }}
                            >
                              {tier.badge}
                            </Text>
                          </View>
                        ) : null}

                        <View style={{ padding: 20 }}>
                          {/* Tier header */}
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 16,
                            }}
                          >
                            <View>
                              <Text
                                style={{
                                  color: theme.textPrimary,
                                  fontSize: 22,
                                  fontFamily: "Syne_700Bold",
                                  marginBottom: 4,
                                }}
                              >
                                {tier.name}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                                <Text
                                  style={{
                                    color: theme.textPrimary,
                                    fontSize: 28,
                                    fontWeight: "800",
                                  }}
                                >
                                  {formatPrice(tier.id)}
                                </Text>
                                <Text
                                  style={{
                                    color: theme.textSecondary,
                                    fontSize: 14,
                                    marginLeft: 4,
                                  }}
                                >
                                  {formatPeriod(tier.id)}
                                </Text>
                              </View>
                            </View>
                            {/* Selection indicator */}
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                borderWidth: 2,
                                borderColor: isSelected ? tier.borderColor : "rgba(255,255,255,0.3)",
                                backgroundColor: isSelected ? tier.borderColor : "transparent",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {isSelected ? (
                                <Check size={16} color="#fff" strokeWidth={3} />
                              ) : null}
                            </View>
                          </View>

                          {/* Features */}
                          <View style={{ gap: 10 }}>
                            {tier.features.map((feature, index) => (
                              <View
                                key={index}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 10,
                                  opacity: feature.included ? 1 : 0.4,
                                }}
                              >
                                <feature.icon
                                  size={18}
                                  color={feature.included ? tier.borderColor : theme.textSecondary}
                                />
                                <Text
                                  style={{
                                    color: feature.included ? theme.textPrimary : theme.textSecondary,
                                    fontSize: 14,
                                    textDecorationLine: feature.included ? "none" : "line-through",
                                  }}
                                >
                                  {feature.text}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Error message */}
            {purchaseError ? (
              <View
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: theme.error,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  {purchaseError}
                </Text>
              </View>
            ) : null}

            {/* Purchase Button */}
            <Pressable
              onPress={handlePurchase}
              disabled={purchaseMutation.isPending || loadingOfferings}
              testID="purchase-button"
              style={({ pressed }) => ({
                opacity: pressed || purchaseMutation.isPending ? 0.8 : 1,
                marginBottom: 16,
              })}
            >
              <LinearGradient
                colors={
                  selectedTierData
                    ? [selectedTierData.borderColor, selectedTierData.borderColor + "CC"]
                    : gradients.button
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                {purchaseMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    {selectedTierData?.name} ile Devam Et
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Restore purchases */}
            <Pressable
              onPress={handleRestore}
              disabled={restoreMutation.isPending}
              testID="restore-purchases-button"
              style={({ pressed }) => ({
                alignItems: "center",
                opacity: pressed || restoreMutation.isPending ? 0.7 : 1,
                paddingVertical: 12,
              })}
            >
              {restoreMutation.isPending ? (
                <ActivityIndicator color={theme.textSecondary} size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <RotateCcw size={16} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                    Satin almalari geri yukle
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Subscription Terms - App Store Compliance */}
            <View
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 11,
                  textAlign: "center",
                  lineHeight: 18,
                  marginBottom: 12,
                }}
              >
                Abonelik otomatik olarak yenilenir. Mevcut donem bitmeden en az 24 saat once aboneligi iptal etmezseniz otomatik olarak yenilenir. Odeme Apple ID hesabinizdan alinir. Aboneligi ayarlardan istediginiz zaman iptal edebilirsiniz.
              </Text>

              {/* Links */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 16,
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
                    }}
                  >
                    Gizlilik Politikasi
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
