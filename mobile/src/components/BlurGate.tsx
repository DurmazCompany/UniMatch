import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

interface BlurGateProps {
  /** true → içerik direkt gösterilir; false → üstüne bulanık overlay eklenir */
  isRevealed: boolean;
  children: ReactNode;
  /** Bulanıklık yoğunluğu (0-100). Varsayılan: 80 */
  intensity?: number;
  /** BlurView tint modu. Varsayılan: "dark" */
  tint?: "light" | "dark" | "default" | "extraLight" | "prominent" | "systemUltraThinMaterial";
}

/**
 * BlurGate — Gizlilik overlay bileşeni.
 *
 * `isRevealed` false olduğunda children'ın üzerine bulanık bir katman uygular.
 * Özellikle swipe kartlarında ve premium özelliklerinde kullanılmak üzere tasarlanmıştır.
 *
 * @example
 * // Eşleşme olmadan fotoğrafı gizle
 * <BlurGate isRevealed={isMatched}>
 *   <Image source={{ uri: photoUrl }} style={styles.photo} />
 * </BlurGate>
 */
export function BlurGate({
  isRevealed,
  children,
  intensity = 80,
  tint = "dark",
}: BlurGateProps) {
  if (isRevealed) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      <BlurView
        intensity={intensity}
        tint={tint}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Position relative so BlurView absoluteFill kaplar
    position: "relative",
  },
});
