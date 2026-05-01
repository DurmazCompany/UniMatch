import * as ScreenCapture from "expo-screen-capture";
import { useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "expo-router";

export interface ScreenProtectionOptions {
  /** Ekran görüntüsü alındığında çağrılır (sadece Android'de desteklenir) */
  onScreenshot?: () => void;
}

/**
 * useScreenProtection — Ekran görüntüsü / kayıt koruması sağlar.
 *
 * - `preventScreenCaptureAsync()` çağrısı ekrana yazılmasını engeller
 *   (iOS: siyah kare, Android: içerik gizlenir).
 * - `addScreenshotListener` Android'de ekran görüntüsü alındığında alert gösterir.
 * - Ekran unmount'ta veya blur'da `allowScreenCaptureAsync()` çağrılır.
 *
 * @example
 * // Basit kullanım (useEffect tabanlı)
 * useScreenProtection();
 *
 * // Callback ile
 * useScreenProtection({ onScreenshot: () => logEvent("screenshot_attempt") });
 */
export function useScreenProtection(options?: ScreenProtectionOptions) {
  useEffect(() => {
    // Ekran kaydı ve görüntüsünü engelle
    ScreenCapture.preventScreenCaptureAsync();

    // Android'de ekran görüntüsü listener'ı
    const sub = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        "🔒 Gizlilik Koruması",
        "Bu içerik gizlilik politikası gereği kaydedilemez.",
        [{ text: "Tamam", style: "default" }]
      );
      options?.onScreenshot?.();
    });

    return () => {
      // Ekranı terk ederken korumayı kaldır
      ScreenCapture.allowScreenCaptureAsync();
      sub.remove();
    };
    // options değiştiğinde re-register etme — sadece mount/unmount'ta çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * useScreenProtectionOnFocus — Tab navigation için tasarlanmış versiyon.
 *
 * `useFocusEffect` kullanır: ekran focus aldığında koruma başlar,
 * blur olduğunda (başka tab'a geçildiğinde) koruma kalkar.
 * Chat ekranı gibi tab navigation içindeki ekranlarda kullan.
 *
 * @example
 * useScreenProtectionOnFocus();
 * useScreenProtectionOnFocus({ onScreenshot: () => reportAttempt() });
 */
export function useScreenProtectionOnFocus(options?: ScreenProtectionOptions) {
  useFocusEffect(
    useCallback(() => {
      // Ekran focus'a geldiğinde korumayı etkinleştir
      ScreenCapture.preventScreenCaptureAsync();

      const sub = ScreenCapture.addScreenshotListener(() => {
        Alert.alert(
          "🔒 Gizlilik Koruması",
          "Bu içerik gizlilik politikası gereği kaydedilemez.",
          [{ text: "Tamam", style: "default" }]
        );
        options?.onScreenshot?.();
      });

      return () => {
        // Ekran blur'a gittiğinde (tab değişimi vb.) korumayı kaldır
        ScreenCapture.allowScreenCaptureAsync();
        sub.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );
}
