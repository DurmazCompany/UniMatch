import { View, Text, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  style?: ViewStyle;
}

const variantStyles = {
  default: { bg: "rgba(255,255,255,0.1)", text: "#FFFFFF", border: "rgba(255,255,255,0.3)" },
  success: { bg: "rgba(76,217,100,0.15)", text: "#4CD964", border: "rgba(76,217,100,0.3)" },
  warning: { bg: "rgba(255,204,0,0.15)", text: "#FFCC00", border: "rgba(255,204,0,0.3)" },
  danger: { bg: "rgba(255,59,48,0.15)", text: "#FF3B30", border: "rgba(255,59,48,0.3)" },
  info: { bg: "rgba(88,86,214,0.15)", text: "#5856D6", border: "rgba(88,86,214,0.3)" },
};

export function Badge({ label, variant = "default", style }: BadgeProps) {
  const vs = variantStyles[variant];
  return (
    <View
      style={[
        {
          backgroundColor: vs.bg,
          borderWidth: 1,
          borderColor: vs.border,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 6,
        },
        style,
      ]}
    >
      <Text style={{ color: vs.text, fontSize: 13, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}
