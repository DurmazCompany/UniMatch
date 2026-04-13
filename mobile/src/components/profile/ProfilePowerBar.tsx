import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/lib/theme";

interface ProfilePowerBarProps {
  power: number; // 0-100
}

export function ProfilePowerBar({ power }: ProfilePowerBarProps) {
  const getColor = () => {
    if (power < 40) return ["#FF3B30", "#FF9500"] as const; // Red to Orange
    if (power < 70) return ["#FF9500", "#FFCC00"] as const; // Orange to Yellow
    return ["#4CD964", "#34D399"] as const; // Green
  };

  const getMessage = () => {
    if (power < 40) return "Profilini tamamla, daha fazla eşleşme al!";
    if (power < 70) return "İyi gidiyorsun! Biraz daha ekle.";
    if (power < 90) return "Profil güçlü! Selfie doğrulama ekle.";
    return "Mükemmel profil! Maksimum görünürlük.";
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Profil Gücü</Text>
        <Text style={{ color: theme.primary, fontSize: 15, fontWeight: "700" }}>{power}%</Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={getColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: "100%", width: `${power}%`, borderRadius: 100 }}
        />
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{getMessage()}</Text>
      {power < 80 ? (
        <Text style={{ color: theme.primary, fontSize: 12, fontStyle: "italic" }}>
          Profilini %80'e tamamlarsan 3x daha fazla kişiye gösterilirsin!
        </Text>
      ) : null}
    </View>
  );
}
