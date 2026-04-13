import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ProfilePowerBarProps {
  power: number; // 0-100
}

export function ProfilePowerBar({ power }: ProfilePowerBarProps) {
  const getColor = () => {
    if (power < 40) return ["#EF4444", "#F97316"] as const;
    if (power < 70) return ["#F97316", "#F59E0B"] as const;
    return ["#10B981", "#34D399"] as const;
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
        <Text style={{ color: "#F9FAFB", fontSize: 15, fontWeight: "700" }}>Profil Gücü</Text>
        <Text style={{ color: "#FF5E73", fontSize: 15, fontWeight: "700" }}>{power}%</Text>
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
      <Text style={{ color: "#6B7280", fontSize: 13 }}>{getMessage()}</Text>
      {power < 80 ? (
        <Text style={{ color: "#FF5E73", fontSize: 12, fontStyle: "italic" }}>
          Profilini %80'e tamamlarsan 3x daha fazla kişiye gösterilirsin!
        </Text>
      ) : null}
    </View>
  );
}
