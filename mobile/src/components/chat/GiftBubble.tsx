import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Radius, Spacing } from "@/lib/theme";
import { GIFT_ICONS, GiftId } from "@/components/icons/UnimatchIcons";

interface Props {
  giftId?: string;
  emoji?: string;
  giftName: string;
  senderName?: string;
  isMine?: boolean;
}

export function GiftBubble({ giftId, emoji, giftName, senderName, isMine }: Props) {
  const Icon = giftId && (giftId in GIFT_ICONS) ? GIFT_ICONS[giftId as GiftId] : null;

  return (
    <View
      style={{ alignItems: "center", marginVertical: Spacing.md, alignSelf: "stretch" }}
      testID="gift-bubble"
    >
      <LinearGradient
        colors={isMine ? [Colors.primary, Colors.primaryLight] : [Colors.coral, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 2,
          borderRadius: Radius.card,
          maxWidth: "80%",
        }}
      >
        <View
          style={{
            backgroundColor: Colors.cardDark,
            borderRadius: Radius.card - 2,
            paddingVertical: 16,
            paddingHorizontal: 24,
            alignItems: "center",
            gap: 4,
          }}
        >
          {Icon ? (
            <Icon size={64} />
          ) : (
            <Text style={{ fontSize: 56 }}>{emoji ?? "🎁"}</Text>
          )}
          <Text style={{ color: Colors.textOnDark, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
            {giftName}
          </Text>
          {senderName ? (
            <Text style={{ color: Colors.textOnDarkMuted, fontSize: 11, fontFamily: "DMSans_400Regular" }}>
              {isMine ? "Sen gönderdin" : `${senderName} gönderdi`}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}
