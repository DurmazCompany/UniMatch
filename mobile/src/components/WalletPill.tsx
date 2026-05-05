import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Radius } from "@/lib/theme";
import { useWallet, formatCoinBalance } from "@/lib/hooks/useWallet";
import { CoinIcon } from "@/components/icons/UnimatchIcons";

export function WalletPill() {
  const { data: wallet } = useWallet();
  const balance = wallet?.coin_balance ?? 0;

  return (
    <Pressable
      testID="wallet-pill"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/paywall");
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Radius.pill,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <CoinIcon size={18} />
      <Text style={{ color: Colors.textOnDark, fontFamily: "DMSans_700Bold", fontSize: 14 }}>
        {formatCoinBalance(balance)}
      </Text>
      <View
        style={{
          backgroundColor: Colors.primary,
          width: 18,
          height: 18,
          borderRadius: 9,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 2,
        }}
      >
        <Ionicons name="add" size={14} color={Colors.white} />
      </View>
    </Pressable>
  );
}
