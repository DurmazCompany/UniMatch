import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Radius, Typography } from '@/lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'swipe-no' | 'swipe-yes';

interface UMButtonProps {
  variant?: Variant;
  label?: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export function UMButton({ variant = 'primary', label, onPress, loading, disabled, icon, fullWidth = true }: UMButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isCircle = variant === 'swipe-no' || variant === 'swipe-yes';

  const styleMap = {
    primary: { bg: Colors.primary, text: Colors.white, border: 'transparent' as const },
    dark: { bg: Colors.textDark, text: Colors.white, border: 'transparent' as const },
    secondary: { bg: Colors.white, text: Colors.textDark, border: 'rgba(0,0,0,0.1)' },
    ghost: { bg: Colors.primaryPale, text: Colors.primaryDark, border: 'transparent' as const },
    'swipe-no': { bg: Colors.white, text: Colors.textDark, border: 'rgba(0,0,0,0.08)' },
    'swipe-yes': { bg: Colors.primary, text: Colors.white, border: 'transparent' as const },
  };
  const s = styleMap[variant];

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.base,
        isCircle ? styles.circle : styles.pill,
        fullWidth && !isCircle && { alignSelf: 'stretch' },
        { backgroundColor: s.bg, borderColor: s.border, borderWidth: variant === 'secondary' || variant === 'swipe-no' ? 1.5 : 0 },
        (disabled || loading) && { opacity: 0.6 },
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.text} />
      ) : isCircle ? (
        <Ionicons
          name={variant === 'swipe-no' ? 'close-outline' : 'heart'}
          size={variant === 'swipe-no' ? 28 : 28}
          color={s.text}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Ionicons name={icon} size={18} color={s.text} /> : null}
          {label ? <Text style={[Typography.bodyBold, { color: s.text, fontSize: 16 }]}>{label}</Text> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  pill: { height: 54, borderRadius: Radius.pill, paddingHorizontal: 24 },
  circle: { width: 64, height: 64, borderRadius: 32 },
});
