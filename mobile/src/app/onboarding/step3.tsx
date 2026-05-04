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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppStore } from "@/lib/store/app-store";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/lib/theme";
import { UMButton } from "@/components/ui";
import { OnboardingHeader } from "./step1";
import { authClient } from "@/lib/auth/auth-client";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

const uploadPhoto = async (uri: string): Promise<string | null> => {
  const filename = uri.split("/").pop() || "photo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const cookieHeader =
    typeof authClient.getCookie === "function" ? authClient.getCookie() : "";

  try {
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
  const slotSize = (350 - 12 - 48) / 3 + 4;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader step={3} />

        <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, color: Colors.textDark, marginTop: 16 }}>
          Fotoğraflarını ekle
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginTop: 6, marginBottom: 24 }}>
          En az 2 fotoğraf gerekli • {photos.length}/6
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          {slots.map((_, i) => {
            const photo = photos[i];
            const isNextSlot = i === photos.length;
            return (
              <View
                key={i}
                style={{
                  width: slotSize,
                  height: slotSize * 1.3,
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: Colors.white,
                  borderWidth: 1.5,
                  borderStyle: photo ? "solid" : "dashed",
                  borderColor: photo
                    ? Colors.primary
                    : isNextSlot
                    ? Colors.primary
                    : "rgba(0,0,0,0.1)",
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
                      <Ionicons name="close-outline" size={16} color="#fff" />
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
                    style={{ alignItems: "center", justifyContent: "center", flex: 1, alignSelf: "stretch" }}
                    testID={isNextSlot ? "add-photo-button" : undefined}
                  >
                    {isNextSlot && uploading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : isNextSlot ? (
                      <Ionicons name="add-outline" size={32} color={Colors.primary} />
                    ) : null}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {uploading ? (
          <Text style={{ color: Colors.textMuted, fontSize: 13, marginBottom: 12, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            Fotoğraflar yükleniyor...
          </Text>
        ) : null}

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, marginBottom: 12, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ marginTop: 32 }}>
          <UMButton variant="primary" label="Devam" disabled={uploading || photos.length < 2} onPress={handleNext} />
        </View>
      </ScrollView>
    </View>
  );
}
