import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
}

const sizeStyles: Record<string, { padding: number; borderRadius: number; fontSize: number }> = {
  sm: { padding: 8, borderRadius: 28, fontSize: 13 },
  md: { padding: 14, borderRadius: 28, fontSize: 16 },
  lg: { padding: 18, borderRadius: 28, fontSize: 18 },
};

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  testID,
  style,
}: ButtonProps) {
  const sz = sizeStyles[size];

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        testID={testID}
        style={({ pressed }) => [{ opacity: pressed || disabled ? 0.7 : 1 }, style]}
      >
        <LinearGradient
          colors={["#E8445A", "#FF5E73"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: sz.padding,
            paddingHorizontal: sz.padding * 2,
            borderRadius: sz.borderRadius,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontSize: sz.fontSize,
                fontWeight: "700",
                letterSpacing: 0.3,
              }}
            >
              {children}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
    secondary: { bg: "transparent", border: "rgba(255,255,255,0.2)", text: "#FFFFFF" },
    danger: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#EF4444" },
    ghost: { bg: "transparent", border: "transparent", text: "#E8445A" },
  };

  const vs = variantStyles[variant] ?? variantStyles.secondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        {
          opacity: pressed || disabled ? 0.7 : 1,
          backgroundColor: vs.bg,
          borderWidth: vs.border !== "transparent" ? 1 : 0,
          borderColor: vs.border,
          paddingVertical: sz.padding,
          paddingHorizontal: sz.padding * 2,
          borderRadius: sz.borderRadius,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} />
      ) : (
        <Text style={{ color: vs.text, fontSize: sz.fontSize, fontWeight: "600" } as TextStyle}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
