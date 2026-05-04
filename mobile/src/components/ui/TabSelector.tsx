import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '@/lib/theme';

export function TabSelector<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <View style={styles.container}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[Typography.bodyBold, { color: active ? Colors.white : Colors.textMuted }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: Colors.primaryPale, borderRadius: Radius.pill, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.pill },
  tabActive: { backgroundColor: Colors.primary },
});
