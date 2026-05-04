import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '@/lib/theme';

type Variant = 'purple' | 'pink' | 'blue' | 'overlay';

export function UMTag({ variant = 'purple', label, emoji }: { variant?: Variant; label: string; emoji?: string }) {
  const map = {
    purple: { bg: 'rgba(124,111,247,0.12)', color: Colors.primaryDark, border: 'transparent' },
    pink: { bg: 'rgba(212,83,126,0.12)', color: Colors.female, border: 'transparent' },
    blue: { bg: 'rgba(24,95,165,0.12)', color: Colors.male, border: 'transparent' },
    overlay: { bg: 'rgba(255,255,255,0.15)', color: Colors.white, border: 'rgba(255,255,255,0.3)' },
  };
  const s = map[variant];

  return (
    <View style={[styles.tag, { backgroundColor: s.bg, borderColor: s.border, borderWidth: variant === 'overlay' ? 1 : 0 }]}>
      <Text style={[Typography.tag, { color: s.color }]}>
        {emoji ? `${emoji} ` : ''}{label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.tag, alignSelf: 'flex-start' },
});
