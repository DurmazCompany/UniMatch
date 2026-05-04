import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/lib/theme';

export function UMCard({ children, dark, style }: { children: React.ReactNode; dark?: boolean; style?: ViewStyle }) {
  return (
    <View style={[
      styles.base,
      dark ? styles.dark : styles.light,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.card, padding: Spacing.lg },
  light: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  dark: { backgroundColor: Colors.cardDark },
});
