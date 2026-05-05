import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Radius } from "@/lib/theme";
import { UMCard, UMButton } from "@/components/ui";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";

type IoniconName = keyof typeof Ionicons.glyphMap;

const HOBBIES: { value: string; label: string; icon: IoniconName }[] = [
  { value: "music", label: "Müzik", icon: "musical-notes-outline" },
  { value: "sports", label: "Spor", icon: "football-outline" },
  { value: "gaming", label: "Oyun", icon: "game-controller-outline" },
  { value: "movies", label: "Film/Dizi", icon: "film-outline" },
  { value: "reading", label: "Kitap", icon: "book-outline" },
  { value: "travel", label: "Seyahat", icon: "airplane-outline" },
  { value: "photography", label: "Fotoğraf", icon: "camera-outline" },
  { value: "cooking", label: "Yemek", icon: "restaurant-outline" },
  { value: "art", label: "Sanat", icon: "color-palette-outline" },
  { value: "fitness", label: "Fitness", icon: "barbell-outline" },
  { value: "coding", label: "Kodlama", icon: "code-slash-outline" },
  { value: "dance", label: "Dans", icon: "body-outline" },
  { value: "cafe", label: "Kafe Takılma", icon: "cafe-outline" },
  { value: "yoga", label: "Yoga", icon: "leaf-outline" },
  { value: "hiking", label: "Doğa Yürüyüşü", icon: "trail-sign-outline" },
  { value: "concerts", label: "Konser", icon: "musical-note" },
  { value: "volunteering", label: "Gönüllülük", icon: "heart-outline" },
  { value: "languages", label: "Yabancı Dil", icon: "globe-outline" },
  { value: "fashion", label: "Moda", icon: "bag-outline" },
  { value: "astrology", label: "Astroloji", icon: "star-outline" },
  { value: "podcast", label: "Podcast", icon: "mic-outline" },
  { value: "anime", label: "Anime/Manga", icon: "tv-outline" },
  { value: "board_games", label: "Kutu Oyunları", icon: "dice-outline" },
  { value: "theater", label: "Tiyatro/Sanat", icon: "ticket-outline" },
];

const BIO_MAX_LENGTH = 200;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [error, setError] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        const result = await api.get<Profile>("/api/profile");
        return result ?? null;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? "");
      setPhotos(JSON.parse(profile.photos || "[]"));
      setSelectedHobbies(JSON.parse(profile.hobbies || "[]"));
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const uploadedPhotos: string[] = [];
      for (const photo of photos) {
        if (photo.startsWith("file://") || photo.startsWith("ph://") || !photo.startsWith("http")) {
          try {
            const formData = new FormData();
            formData.append("file", {
              uri: photo,
              type: "image/jpeg",
              name: "photo.jpg",
            } as any);
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/uploads/photo`,
              { method: "POST", body: formData, credentials: "include" }
            );
            const data = await res.json();
            if (data?.data?.url) {
              uploadedPhotos.push(data.data.url);
            } else {
              uploadedPhotos.push(photo);
            }
          } catch {
            uploadedPhotos.push(photo);
          }
        } else {
          uploadedPhotos.push(photo);
        }
      }
      // Backend requires ALL profile fields — pull existing values from profile and merge edits
      if (!profile) throw new Error("Profile not loaded");
      const payload = {
        name: profile.name,
        birthDate: typeof profile.birthDate === "string" ? profile.birthDate : new Date(profile.birthDate).toISOString(),
        gender: profile.gender,
        department: profile.department,
        year: profile.year,
        university: profile.university,
        bio,
        photos: uploadedPhotos,
        hobbies: selectedHobbies,
      };
      return api.post("/api/profile", payload);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      router.back();
    },
    onError: () => {
      setError("Profil kaydedilemedi. Lütfen tekrar dene.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
      setError("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf çekmek için kamera izni gerekli");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
      setError("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= 6) return;
    Alert.alert(
      "Fotoğraf Ekle",
      "Fotoğrafı nereden seçmek istersin?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Kamera", onPress: takePhoto },
        { text: "Galeri", onPress: pickFromGallery },
      ]
    );
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleHobby = (value: string) => {
    setError("");
    if (selectedHobbies.includes(value)) {
      setSelectedHobbies((prev) => prev.filter((h) => h !== value));
    } else if (selectedHobbies.length < 5) {
      setSelectedHobbies((prev) => [...prev, value]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    if (photos.length < 2) {
      setError("En az 2 fotoğraf gerekli");
      return;
    }
    if (selectedHobbies.length < 1) {
      setError("En az 1 hobi seç");
      return;
    }
    saveMutation.mutate();
  };

  if (profileLoading || !profile) {
    return (
      <View
        style={{ flex: 1, backgroundColor: Colors.bgLight, alignItems: "center", justifyContent: "center" }}
        testID="edit-profile-loading"
      >
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const slots = Array.from({ length: 6 });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="edit-profile-screen">
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top + 12,
            paddingBottom: 20,
            gap: 14,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            testID="back-button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.white,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Ionicons name="chevron-back-outline" size={24} color={Colors.textDark} />
          </Pressable>
          <Text style={{ color: Colors.textDark, fontSize: 24, fontFamily: "DMSans_700Bold", flex: 1 }}>
            Profili Düzenle
          </Text>
        </View>

        <UMCard style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: Colors.textDark, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>Hakkında</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" }}>
              {bio.length}/{BIO_MAX_LENGTH}
            </Text>
          </View>
          <TextInput
            testID="bio-input"
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, BIO_MAX_LENGTH))}
            placeholder="Kendinden biraz bahset..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            style={{
              color: Colors.textDark,
              fontSize: 15,
              lineHeight: 22,
              minHeight: 100,
              textAlignVertical: "top",
              fontFamily: "DMSans_400Regular",
            }}
          />
        </UMCard>

        <UMCard style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ color: Colors.textDark, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>Fotoğraflar</Text>
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" }}>
              {photos.length}/6 (en az 2)
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            {slots.map((_, i) => {
              const photo = photos[i];
              const slotSize = 95;
              const isNextSlot = i === photos.length;
              return (
                <View
                  key={i}
                  style={{
                    width: slotSize,
                    height: slotSize * 1.3,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: Colors.bgLight,
                    borderWidth: 1.5,
                    borderStyle: photo ? "solid" : "dashed",
                    borderColor: photo ? Colors.primary : isNextSlot ? Colors.primary : "rgba(0,0,0,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {photo ? (
                    <>
                      <Pressable
                        onPress={() => handleRemovePhoto(i)}
                        testID={`remove-photo-${i}`}
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
                        <Ionicons name="close-outline" size={14} color="#fff" />
                      </Pressable>
                      <Image
                        source={{ uri: photo }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </>
                  ) : (
                    <Pressable
                      onPress={isNextSlot ? handleAddPhoto : undefined}
                      testID={isNextSlot ? "add-photo-slot" : undefined}
                      style={{ alignItems: "center", justifyContent: "center", flex: 1, alignSelf: "stretch" }}
                    >
                      {isNextSlot ? <Ionicons name="add-outline" size={28} color={Colors.primary} /> : null}
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          <UMButton variant="ghost" label="+ Fotoğraf Ekle" onPress={handleAddPhoto} disabled={photos.length >= 6} />
        </UMCard>

        <UMCard style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ color: Colors.textDark, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>Hobiler</Text>
            <Text style={{ color: Colors.primary, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
              {selectedHobbies.length}/5 (en az 1)
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {HOBBIES.map((hobby) => {
              const isSelected = selectedHobbies.includes(hobby.value);
              const isDisabled = !isSelected && selectedHobbies.length >= 5;
              return (
                <Pressable
                  key={hobby.value}
                  onPress={() => toggleHobby(hobby.value)}
                  disabled={isDisabled}
                  testID={`hobby-${hobby.value}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: Radius.pill,
                    borderWidth: 1.5,
                    borderColor: isSelected ? Colors.primary : "rgba(0,0,0,0.08)",
                    backgroundColor: isSelected ? Colors.primaryPale : Colors.bgLight,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  <Ionicons name={hobby.icon} size={14} color={isSelected ? Colors.primaryDark : Colors.textMuted} />
                  <Text
                    style={{
                      color: isSelected ? Colors.primaryDark : Colors.textMuted,
                      fontSize: 13,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    {hobby.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </UMCard>

        {error ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, marginBottom: 16, textAlign: "center", fontFamily: "DMSans_400Regular" }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.06)",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        }}
      >
        <UMButton
          variant="primary"
          label="Kaydet"
          icon="checkmark-outline"
          loading={saveMutation.isPending}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}
