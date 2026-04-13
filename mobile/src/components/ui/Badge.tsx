import { useState } from "react";
import { TextInput, View, Text, TextInputProps, ViewStyle } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={{
            color: "#9CA3AF",
            fontSize: 13,
            fontWeight: "600",
            marginBottom: 8,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#4B4B6B"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          {
            backgroundColor: "#1A1A1A",
            borderWidth: 1.5,
            borderColor: focused ? "#E8445A" : error ? "#EF4444" : "rgba(255,255,255,0.08)",
            borderRadius: 14,
            paddingHorizontal: 18,
            paddingVertical: 16,
            color: "#F9FAFB",
            fontSize: 16,
          },
          focused && {
            shadowColor: "#E8445A",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          props.style as object,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>{error}</Text>
      ) : null}
    </View>
  );
}
