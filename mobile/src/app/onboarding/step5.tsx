import { useState, useRef } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft, Camera, RotateCcw, Check, X } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

type CameraViewRef = {
  takePictureAsync: (options?: { quality?: number; base64?: boolean }) => Promise<{ uri: string } | undefined>;
};

export default function Step5Screen() {
  const onboarding = useAppStore((s) => s.onboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<CameraViewRef>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        setOnboarding({ selfiePhoto: photo.uri, selfieVerified: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError("Fotoğraf çekilemedi. Lütfen tekrar dene.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setOnboarding({ selfiePhoto: undefined, selfieVerified: false });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = async (selfieVerified: boolean) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...onboarding,
        selfieVerified,
        photos: onboarding.photos ?? [],
        hobbies: onboarding.hobbies ?? [],
      };
      const result = await api.post("/api/profile", payload);
      if (!result) {
        setError("Profil kaydedilemedi. Lütfen tekrar dene.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      resetOnboarding();
      router.replace("/(app)");
    } catch {
      setError("Profil kaydedilemedi. Lütfen tekrar dene.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await requestPermission();
  };

  // Permission not yet determined - show loading
  if (permission === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Permission denied
  const renderPermissionDenied = () => (
    <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "rgba(239,68,68,0.15)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <X size={48} color={theme.error} />
      </View>
      <Text
        style={{
          color: theme.textPrimary,
          fontSize: 20,
          fontFamily: "Syne_700Bold",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Kamera izni gerekli
      </Text>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 15,
          textAlign: "center",
          lineHeight: 24,
          marginBottom: 28,
        }}
      >
        Selfie doğrulaması için kamera erişimine izin vermen gerekiyor. Ayarlardan izin verebilirsin.
      </Text>
      <Pressable
        onPress={handleRequestPermission}
        testID="request-permission-button"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: "100%" })}
      >
        <LinearGradient
          colors={gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Tekrar Dene</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  // Camera view
  const renderCamera = () => (
    <View
      style={{
        width: "100%",
        height: 320,
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      <CameraView
        ref={cameraRef as React.RefObject<CameraView>}
        style={{ flex: 1 }}
        facing="front"
        onCameraReady={() => setCameraReady(true)}
      >
        {/* Overlay for face guide */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 200,
              height: 260,
              borderRadius: 100,
              borderWidth: 3,
              borderColor: "rgba(255,255,255,0.5)",
              borderStyle: "dashed",
            }}
          />
        </View>

        {/* Camera loading overlay */}
        {!cameraReady ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>Kamera açılıyor...</Text>
          </View>
        ) : null}
      </CameraView>
    </View>
  );

  // Preview captured photo
  const renderPreview = () => (
    <View
      style={{
        width: "100%",
        height: 320,
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 24,
        position: "relative",
      }}
    >
      <Image
        source={{ uri: capturedPhoto ?? "" }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
      {/* Success badge */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(16,185,129,0.9)",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          gap: 6,
        }}
      >
        <Check size={16} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Selfie hazır</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={gradients.background}
        style={{
          flex: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Progress */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 36 }}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: theme.primary,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.back()}
          testID="back-button"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <ChevronLeft size={24} color={theme.textPrimary} />
        </Pressable>

        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(225,29,72,0.15)",
              borderWidth: 2,
              borderColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            }}
          >
            <Camera size={36} color={theme.primary} />
          </View>

          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 26,
              fontFamily: "Syne_700Bold",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Selfie doğrulaması
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 15,
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 10,
            }}
          >
            Yüzünü kameraya göster ve selfie çek.{"\n"}Sahte profillere izin vermiyoruz!
          </Text>
        </View>

        {/* Camera or Preview or Permission Denied */}
        {!permission.granted ? (
          renderPermissionDenied()
        ) : capturedPhoto ? (
          renderPreview()
        ) : (
          renderCamera()
        )}

        {error ? (
          <Text style={{ color: theme.error, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        {/* Action buttons */}
        {permission.granted && !capturedPhoto ? (
          // Capture button
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Pressable
              onPress={handleCapture}
              disabled={!cameraReady}
              testID="capture-button"
              style={({ pressed }) => ({
                opacity: pressed || !cameraReady ? 0.6 : 1,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
              })}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#fff",
                  borderWidth: 3,
                  borderColor: theme.primary,
                }}
              />
            </Pressable>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 12 }}>
              {cameraReady ? "Fotoğraf çekmek için dokun" : "Kamera hazırlanıyor..."}
            </Text>
          </View>
        ) : permission.granted && capturedPhoto ? (
          // Retake and complete buttons
          <View style={{ gap: 12 }}>
            {/* Retake button */}
            <Pressable
              onPress={handleRetake}
              testID="retake-button"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.borderDefault,
                gap: 8,
              })}
            >
              <RotateCcw size={18} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "600" }}>
                Tekrar Çek
              </Text>
            </Pressable>

            {/* Complete verification button */}
            <Pressable
              onPress={() => handleComplete(true)}
              disabled={loading}
              testID="verify-complete-button"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                      Doğrulamayı Tamamla
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Skip button */}
            <Pressable
              onPress={() => handleComplete(false)}
              disabled={loading}
              testID="skip-verify-button"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: "center", paddingVertical: 8 })}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 15 }}>Şimdi değil, atla</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Skip button when permission not granted */}
        {!permission.granted ? (
          <View style={{ marginTop: 24 }}>
            <Pressable
              onPress={() => handleComplete(false)}
              disabled={loading}
              testID="skip-verify-button-no-permission"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: "center", paddingVertical: 8 })}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 15 }}>Şimdi değil, atla</Text>
            </Pressable>
          </View>
        ) : null}
      </LinearGradient>
    </ScrollView>
  );
}
