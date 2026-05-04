import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { useState } from 'react';
import { Colors, Radius, Typography } from '@/lib/theme';

interface UMInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function UMInput({ label, error, ...rest }: UMInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={[Typography.bodyBold, { color: Colors.textDark }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        style={[
          styles.input,
          focused && { borderColor: Colors.primary },
          error ? { borderColor: '#FF3B30' } : null,
          rest.style,
        ]}
      />
      {error ? <Text style={[Typography.caption, { color: '#FF3B30' }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.input,
    height: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.textDark,
  },
});
