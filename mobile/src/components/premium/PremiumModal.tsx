import { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
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
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X,
  Crown,
  Infinity,
  Eye,
  Zap,
  Star,
  Check,
  RotateCcw,
} from "lucide-react-native";
import { theme, gradients } from "@/lib/theme";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PurchasesPackage,
} from "@/lib/revenue-cat";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

const PREMIUM_BENEFITS = [
  {
    icon: Infinity,
    title: "Sinirsiz Swipe",
    description: "Gunluk limit olmadan istedigin kadar profil gor",
  },
  {
    icon: Eye,
    title: "Seni Begenenleri Gor",
    description: "Kimin seni begendugini aninda ogren",
  },
  {
    icon: Zap,
    title: "Super Like x5",
    description: "Her gun 5 super like hakki kazan",
  },
  {
    icon: Star,
    title: "Oncelikli Gosterim",
    description: "Profilin daha fazla kisiye gosterilsin",
  },
];

export function PremiumModal({
  visible,
  onClose,
  onPurchaseComplete,
}: PremiumModalProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const crownRotate = useSharedValue(0);

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
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Purchase failed:", error);
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
      }
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Restore failed:", error);
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

  const handlePurchase = (pkg: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    purchaseMutation.mutate(pkg);
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restoreMutation.mutate();
  };

  const formatPrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const formatPeriod = (pkg: PurchasesPackage) => {
    const identifier = pkg.packageType;
    switch (identifier) {
      case "WEEKLY":
        return "/ hafta";
      case "MONTHLY":
        return "/ ay";
      case "ANNUAL":
        return "/ yil";
      case "LIFETIME":
        return "omur boyu";
      default:
        return "";
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      testID="premium-modal"
    >
      <View style={{ flex: 1, backgroundColor: "rgba(10,10,15,0.95)" }}>
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
              testID="premium-close-button"
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
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <LinearGradient
                colors={["rgba(245,158,11,0.2)", "rgba(245,158,11,0.05)"]}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Crown size={48} color="#F59E0B" fill="#F59E0B" />
              </LinearGradient>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontSize: 28,
                  fontFamily: "Syne_700Bold",
                  textAlign: "center",
                  marginBottom: 8,
                  letterSpacing: -0.5,
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
                }}
              >
                Daha fazla eslesme, daha fazla sans
              </Text>
            </View>

            {/* Benefits */}
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.borderDefault,
                padding: 20,
                marginBottom: 24,
              }}
            >
              {PREMIUM_BENEFITS.map((benefit, index) => (
                <View
                  key={benefit.title}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 14,
                    marginBottom: index < PREMIUM_BENEFITS.length - 1 ? 20 : 0,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: "rgba(225,29,72,0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <benefit.icon size={22} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.textPrimary,
                        fontSize: 16,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      {benefit.title}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {benefit.description}
                    </Text>
                  </View>
                  <Check size={20} color={theme.success} />
                </View>
              ))}
            </View>

            {/* Pricing packages */}
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
            ) : packages && packages.length > 0 ? (
              <View style={{ gap: 12, marginBottom: 24 }}>
                {packages.map((pkg, index) => {
                  const isPopular = pkg.packageType === "MONTHLY";
                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => handlePurchase(pkg)}
                      disabled={purchaseMutation.isPending}
                      testID={`premium-package-${index}`}
                      style={({ pressed }) => ({
                        opacity: pressed || purchaseMutation.isPending ? 0.8 : 1,
                      })}
                    >
                      <View
                        style={{
                          backgroundColor: isPopular
                            ? "rgba(225,29,72,0.1)"
                            : theme.surface,
                          borderRadius: 14,
                          borderWidth: isPopular ? 2 : 1,
                          borderColor: isPopular
                            ? theme.primary
                            : theme.borderDefault,
                          padding: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: theme.textPrimary,
                                fontSize: 16,
                                fontWeight: "700",
                              }}
                            >
                              {pkg.product.title}
                            </Text>
                            {isPopular ? (
                              <View
                                style={{
                                  backgroundColor: theme.primary,
                                  borderRadius: 6,
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#fff",
                                    fontSize: 10,
                                    fontWeight: "700",
                                  }}
                                >
                                  POPULER
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={{
                              color: theme.textSecondary,
                              fontSize: 13,
                            }}
                          >
                            {pkg.product.description}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              color: theme.textPrimary,
                              fontSize: 20,
                              fontWeight: "800",
                            }}
                          >
                            {formatPrice(pkg)}
                          </Text>
                          <Text
                            style={{
                              color: theme.textSecondary,
                              fontSize: 12,
                            }}
                          >
                            {formatPeriod(pkg)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.borderDefault,
                  padding: 24,
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  Paketler su an yuklenemiyor
                </Text>
                <Pressable
                  onPress={() => refetchOfferings()}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  })}
                >
                  <RotateCcw size={16} color={theme.primary} />
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Tekrar Dene
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Restore purchases */}
            <Pressable
              onPress={handleRestore}
              disabled={restoreMutation.isPending}
              testID="premium-restore-button"
              style={({ pressed }) => ({
                alignItems: "center",
                opacity: pressed || restoreMutation.isPending ? 0.7 : 1,
                paddingVertical: 12,
              })}
            >
              {restoreMutation.isPending ? (
                <ActivityIndicator color={theme.textSecondary} size="small" />
              ) : (
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                  Satin almalari geri yukle
                </Text>
              )}
            </Pressable>

            {/* Terms */}
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 11,
                textAlign: "center",
                lineHeight: 16,
                marginTop: 12,
              }}
            >
              Abonelik otomatik olarak yenilenir. Aboneligi istedigin zaman
              uygulama ayarlarindan iptal edebilirsin.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
