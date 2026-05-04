import { useState, useRef } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Radius } from "@/lib/theme";
import { UMButton } from "@/components/ui";
import { OnboardingHeader } from "./step1";
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

  if (permission === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgLight, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderPermissionDenied = () => (
    <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(255,59,48,0.12)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons name="close-outline" size={40} color="#FF3B30" />
      </View>
      <Text style={{ color: Colors.textDark, fontSize: 20, fontFamily: "DMSans_700Bold", marginBottom: 12, textAlign: "center" }}>
        Kamera izni gerekli
      </Text>
      <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24, fontFamily: "DMSans_400Regular" }}>
        Selfie doğrulaması için kamera erişimine izin vermen gerekiyor.
      </Text>
      <UMButton variant="primary" label="Tekrar Dene" onPress={handleRequestPermission} />
    </View>
  );

  const renderCamera = () => (
    <View style={{ width: "100%", height: 320, borderRadius: Radius.card, overflow: "hidden", marginBottom: 20 }}>
      <CameraView
        ref={cameraRef as React.RefObject<CameraView>}
        style={{ flex: 1 }}
        facing="front"
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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

        {!cameraReady ? (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 14, fontFamily: "DMSans_400Regular" }}>Kamera açılıyor...</Text>
          </View>
        ) : null}
      </CameraView>
    </View>
  );

  const renderPreview = () => (
    <View style={{ width: "100%", height: 320, borderRadius: Radius.card, overflow: "hidden", marginBottom: 20, position: "relative" }}>
      <Image source={{ uri: capturedPhoto ?? "" }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      <View
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(76,217,100,0.95)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          gap: 6,
        }}
      >
        <Ionicons name="checkmark-outline" size={16} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>Selfie hazır</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader step={5} />

        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.primaryPale,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="camera-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={{ color: Colors.textDark, fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, marginBottom: 8, textAlign: "center" }}>
            Selfie doğrulaması
          </Text>
          <Text style={{ color: Colors.textMuted, fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
            Yüzünü kameraya göster ve selfie çek.{"\n"}Sahte profillere izin vermiyoruz!
          </Text>
        </View>

        {!permission.granted ? renderPermissionDenied() : capturedPhoto ? renderPreview() : renderCamera()}

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, marginBottom: 12, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            {error}
          </Text>
        ) : null}

        {permission.granted && !capturedPhoto ? (
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Pressable
              onPress={handleCapture}
              disabled={!cameraReady}
              testID="capture-button"
              style={({ pressed }) => ({
                opacity: pressed || !cameraReady ? 0.6 : 1,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
              })}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff", borderWidth: 3, borderColor: Colors.primary }} />
            </Pressable>
            <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 12, fontFamily: "DMSans_400Regular" }}>
              {cameraReady ? "Fotoğraf çekmek için dokun" : "Kamera hazırlanıyor..."}
            </Text>
          </View>
        ) : permission.granted && capturedPhoto ? (
          <View style={{ gap: 12 }}>
            <UMButton variant="secondary" label="Tekrar Çek" icon="refresh-outline" onPress={handleRetake} />
            <UMButton variant="primary" label="Doğrulamayı Tamamla" icon="checkmark-outline" loading={loading} onPress={() => handleComplete(true)} />
            <Pressable onPress={() => handleComplete(false)} disabled={loading} testID="skip-verify-button" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: "center", paddingVertical: 8 })}>
              <Text style={{ color: Colors.textMuted, fontSize: 14, fontFamily: "DMSans_500Medium" }}>Şimdi değil, atla</Text>
            </Pressable>
          </View>
        ) : null}

        {!permission.granted ? (
          <Pressable onPress={() => handleComplete(false)} disabled={loading} testID="skip-verify-button-no-permission" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: "center", paddingVertical: 12, marginTop: 16 })}>
            <Text style={{ color: Colors.textMuted, fontSize: 14, fontFamily: "DMSans_500Medium" }}>Şimdi değil, atla</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
