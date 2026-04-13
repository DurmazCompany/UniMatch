import { useState } from "react";
import { TextInput, View, Text, TextInputProps, ViewStyle } from "react-native";

import { theme } from "@/lib/theme";

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
            color: theme.textSecondary,
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
        placeholderTextColor={theme.textPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          {
            backgroundColor: theme.inputBackground,
            borderWidth: 1.5,
            borderColor: focused
              ? theme.primary
              : error
                ? theme.error
                : theme.borderDefault,
            borderRadius: 14,
            paddingHorizontal: 18,
            paddingVertical: 16,
            color: theme.textPrimary,
            fontSize: 16,
          },
            focused && {
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
          props.style as object,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ color: theme.error, fontSize: 12, marginTop: 6 }}>{error}</Text>
      ) : null}
    </View>
  );
}
