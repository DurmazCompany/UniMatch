import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft } from "lucide-react-native";
import { authClient } from "@/lib/auth/auth-client";
import * as FileSystem from "expo-file-system";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

const uploadPhoto = async (uri: string): Promise<string | null> => {
  const filename = uri.split("/").pop() || "photo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const cookieHeader =
    typeof authClient.getCookie === "function" ? authClient.getCookie() : "";

  try {
    // For web platform, fetch the blob and create a proper File
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });

      const formData = new FormData();
      formData.append("photo", file);

      const uploadResponse = await fetch(`${BACKEND_URL}/api/uploads/photo`, {
        method: "POST",
        credentials: "include",
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
        body: formData,
      });

      if (!uploadResponse.ok) {
        console.error("Upload failed:", uploadResponse.status, await uploadResponse.text());
        return null;
      }

      const json = await uploadResponse.json();
      return (json as { data?: { url?: string } })?.data?.url ?? null;
    }

    // For native platforms, use the standard RN FormData approach
    const formData = new FormData();
    formData.append("photo", {
      uri,
      type: mimeType,
      name: filename,
    } as unknown as Blob);

    const uploadResponse = await global.fetch(`${BACKEND_URL}/api/uploads/photo`, {
      method: "POST",
      credentials: "include",
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      body: formData,
    });

    if (!uploadResponse.ok) {
      console.error("Upload failed:", uploadResponse.status, await uploadResponse.text());
      return null;
    }

    const json = await uploadResponse.json();
    return (json as { data?: { url?: string } })?.data?.url ?? null;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
};

export default function Step3Screen() {
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const asset of assets) {
        const url = await uploadPhoto(asset.uri);
        if (url) urls.push(url);
      }
      if (urls.length > 0) {
        setPhotos((prev) => [...prev, ...urls].slice(0, 6));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setError("Fotoğraf yüklenemedi. Lütfen tekrar dene.");
      }
    } catch (e) {
      console.error("Upload error:", e);
      setError("Fotoğraf yüklenemedi. Lütfen tekrar dene.");
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const remaining = 6 - photos.length;
    if (remaining <= 0) return;

    // Sequential permission and launch pattern (P0 Fix)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Fotoğraflarına erişmek için galeri izni vermelisin.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await uploadAssets(result.assets);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Kamera izni gerekli.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAssets([result.assets[0]]);
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= 6 || uploading) return;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["İptal", "Kamera", "Galeri"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) pickFromGallery();
        }
      );
    } else {
      pickFromGallery();
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (photos.length < 2) {
      setError("En az 2 fotoğraf eklemelisin");
      return;
    }
    setOnboarding({ photos });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/step4");
  };

  const slots = Array.from({ length: 6 });
  const slotSize = (350 - 12) / 3;

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
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor:
                  step <= 3 ? theme.primary : theme.borderDefault,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.back()}
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

        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 28,
            fontFamily: "Syne_700Bold",
            marginBottom: 8,
          }}
        >
          Fotoğraflarını ekle
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 28 }}>
          En az 2 fotoğraf gerekli • {photos.length}/6
        </Text>

        {/* Photo grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {slots.map((_, i) => {
            const photo = photos[i];
            const isNextSlot = i === photos.length;
            return (
              <View
                key={i}
                style={{
                  width: slotSize,
                  height: slotSize * 1.3,
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: theme.surface,
                  borderWidth: 1.5,
                  borderStyle: photo ? "solid" : "dashed",
                  borderColor: photo
                    ? theme.primary
                    : isNextSlot
                    ? theme.primary
                    : theme.borderDefault,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {photo ? (
                  <>
                    <Pressable
                      onPress={() => handleRemovePhoto(i)}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        zIndex: 10,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                      >
                        ×
                      </Text>
                    </Pressable>
                    <Image
                      source={{ uri: photo }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </>
                ) : (
                  <Pressable
                    onPress={isNextSlot && !uploading ? handleAddPhoto : undefined}
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                    }}
                    testID={isNextSlot ? "add-photo-button" : undefined}
                  >
                    {isNextSlot && uploading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text
                        style={{
                          color: isNextSlot ? theme.primary : "#3A3A4A",
                          fontSize: 28,
                          fontWeight: "300",
                        }}
                      >
                        {isNextSlot ? "+" : null}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {uploading ? (
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Fotoğraflar yükleniyor...
          </Text>
        ) : null}

        {error ? (
          <Text
            style={{
              color: theme.error,
              fontSize: 13,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleNext}
          testID="next-button"
          disabled={uploading}
          style={({ pressed }) => ({
            opacity: pressed || uploading ? 0.8 : 1,
          })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
              Devam →
            </Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );
}
