import { Image, View, Text } from 'react-native';
import { Colors } from '@/lib/theme';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, number> = { sm: 36, md: 44, lg: 64, xl: 96 };

export function UMAvatar({ uri, size = 'md', ring, fallback }: { uri?: string | null; size?: Size; ring?: boolean; fallback?: string }) {
  const dim = SIZES[size];
  return (
    <View style={[
      { width: dim, height: dim, borderRadius: 999, overflow: 'hidden', backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
      ring && { borderWidth: 2.5, borderColor: Colors.primary },
    ]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
      ) : fallback ? (
        <Text style={{ color: Colors.primary, fontSize: dim * 0.4, fontFamily: 'DMSans_700Bold' }}>{fallback[0]?.toUpperCase()}</Text>
      ) : null}
    </View>
  );
}
