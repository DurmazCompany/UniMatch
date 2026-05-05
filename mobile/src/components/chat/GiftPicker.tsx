import { Modal, View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Colors, Spacing, Radius } from "@/lib/theme";
import { useGiftCatalog } from "@/lib/hooks/useGiftCatalog";
import { useSendGift } from "@/lib/hooks/useSendGift";
import { useWallet, formatCoinBalance } from "@/lib/hooks/useWallet";
import { openPaywallOnError } from "@/lib/hooks/usePaywallOnError";
import { GiftCatalogItem } from "@/lib/types";
import { CoinIcon, GIFT_ICONS, GiftId } from "@/components/icons/UnimatchIcons";

interface Props {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  matchId: string;
  onSent?: (gift: GiftCatalogItem) => void;
}

export function GiftPicker({ visible, onClose, receiverId, matchId, onSent }: Props) {
  const { data: catalog, isLoading } = useGiftCatalog();
  const { data: wallet } = useWallet();
  const sendGift = useSendGift();
  const balance = wallet?.coin_balance ?? 0;

  const handleSend = async (gift: GiftCatalogItem) => {
    if (balance < gift.coinCost) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onClose();
      router.push("/paywall");
      return;
    }
    try {
      await sendGift.mutateAsync({ receiver_id: receiverId, gift_id: gift.id, match_id: matchId });
      onSent?.(gift);
      onClose();
    } catch (err) {
      if (!openPaywallOnError(err)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        testID="gift-picker-backdrop"
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: Colors.surfaceDark,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: Spacing.xl,
            paddingBottom: Spacing.xxxl,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 2,
              marginBottom: Spacing.lg,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: Spacing.lg,
            }}
          >
            <Text style={{ color: Colors.textOnDark, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
              Hediye Gönder
            </Text>
            <Pressable onPress={onClose} testID="gift-picker-close">
              <Ionicons name="close-outline" size={24} color={Colors.textOnDark} />
            </Pressable>
          </View>

          {/* Balance */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: Spacing.lg,
            }}
          >
            <CoinIcon size={18} />
            <Text style={{ color: Colors.textOnDark, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
              {formatCoinBalance(balance)} coin
            </Text>
            <Pressable
              onPress={() => {
                onClose();
                router.push("/paywall");
              }}
              style={{ marginLeft: "auto" }}
              testID="gift-picker-topup"
            >
              <Text style={{ color: Colors.primary, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                + Coin Yükle
              </Text>
            </Pressable>
          </View>

          {/* Grid */}
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <FlatList
              data={catalog ?? []}
              numColumns={3}
              keyExtractor={(g) => g.id}
              columnWrapperStyle={{ gap: 8 }}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const canAfford = balance >= item.coinCost;
                return (
                  <Pressable
                    testID={`gift-card-${item.id}`}
                    onPress={() => handleSend(item)}
                    disabled={sendGift.isPending}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: Colors.cardDark,
                      borderRadius: Radius.card,
                      paddingVertical: 16,
                      paddingHorizontal: 8,
                      alignItems: "center",
                      gap: 6,
                      opacity: pressed ? 0.7 : canAfford ? 1 : 0.55,
                      borderWidth: 1,
                      borderColor: canAfford
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.03)",
                    })}
                  >
                    {(() => {
                      const Icon = (item.id in GIFT_ICONS) ? GIFT_ICONS[item.id as GiftId] : null;
                      return Icon ? <Icon size={44} /> : <Text style={{ fontSize: 36 }}>{item.emoji}</Text>;
                    })()}
                    <Text
                      style={{
                        color: Colors.textOnDark,
                        fontSize: 12,
                        fontFamily: "DMSans_600SemiBold",
                        textAlign: "center",
                      }}
                    >
                      {item.nameTr}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <CoinIcon size={12} />
                      <Text
                        style={{
                          color: canAfford ? Colors.textOnDarkMuted : "#FF6B6B",
                          fontSize: 11,
                          fontFamily: "DMSans_500Medium",
                        }}
                      >
                        {item.coinCost}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
