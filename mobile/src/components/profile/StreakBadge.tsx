import { View, Text } from "react-native";

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  if (count === 0) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(245,158,11,0.15)",
        borderWidth: 1,
        borderColor: "rgba(245,158,11,0.3)",
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 16 }}>🔥</Text>
      <Text style={{ color: "#F59E0B", fontSize: 14, fontWeight: "700" }}>{count}</Text>
      <Text style={{ color: "#F59E0B", fontSize: 12 }}>gün</Text>
    </View>
  );
}
