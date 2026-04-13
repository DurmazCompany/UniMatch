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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, gradients } from "@/lib/theme";
import { ChevronLeft, Check } from "lucide-react-native";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";

const HOBBIES = [
  { value: "music", label: "Muzik", emoji: "M" },
  { value: "sports", label: "Spor", emoji: "S" },
  { value: "gaming", label: "Oyun", emoji: "G" },
  { value: "movies", label: "Film/Dizi", emoji: "F" },
  { value: "reading", label: "Kitap", emoji: "K" },
  { value: "travel", label: "Seyahat", emoji: "T" },
  { value: "photography", label: "Fotograf", emoji: "P" },
  { value: "cooking", label: "Yemek", emoji: "Y" },
  { value: "art", label: "Sanat", emoji: "A" },
  { value: "fitness", label: "Fitness", emoji: "F" },
  { value: "coding", label: "Kodlama", emoji: "C" },
  { value: "dance", label: "Dans", emoji: "D" },
];

const BIO_MAX_LENGTH = 200;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Form state
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");

  // Fetch current profile
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

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? "");
      setPhotos(JSON.parse(profile.photos || "[]"));
      setSelectedHobbies(JSON.parse(profile.hobbies || "[]"));
    }
  }, [profile]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        bio,
        photos: JSON.stringify(photos),
        hobbies: JSON.stringify(selectedHobbies),
      };
      return api.post("/api/profile", payload);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      router.back();
    },
    onError: () => {
      setError("Profil kaydedilemedi. Lutfen tekrar dene.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Photo handlers
  const pickFromGallery = async () => {
    setShowPicker(false);
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
    setShowPicker(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Izin gerekli", "Fotograf cekmek icin kamera izni gerekli");
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
    setShowPicker(true);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Hobby handlers
  const toggleHobby = (value: string) => {
    setError("");
    if (selectedHobbies.includes(value)) {
      setSelectedHobbies((prev) => prev.filter((h) => h !== value));
    } else if (selectedHobbies.length < 5) {
      setSelectedHobbies((prev) => [...prev, value]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Validation and save
  const handleSave = () => {
    if (photos.length < 2) {
      setError("En az 2 fotograf gerekli");
      return;
    }
    if (selectedHobbies.length < 1) {
      setError("En az 1 hobi sec");
      return;
    }
    saveMutation.mutate();
  };

  if (profileLoading || !profile) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}
        testID="edit-profile-loading"
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const slots = Array.from({ length: 6 });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="edit-profile-screen">
      <LinearGradient
        colors={gradients.background}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
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
              borderRadius: 12,
              backgroundColor: theme.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontFamily: "Syne_700Bold", flex: 1 }}>
            Profili Duzenle
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Bio Section */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              padding: 18,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: theme.borderDefault,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Hakkinda</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {bio.length}/{BIO_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              testID="bio-input"
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, BIO_MAX_LENGTH))}
              placeholder="Kendinden biraz bahset..."
              placeholderTextColor={theme.textPlaceholder}
              multiline
              numberOfLines={4}
              style={{
                color: theme.textPrimary,
                fontSize: 15,
                lineHeight: 22,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Photos Section */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              padding: 18,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: theme.borderDefault,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Fotograflar</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {photos.length}/6 (en az 2)
              </Text>
            </View>

            {/* Photo grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {slots.map((_, i) => {
                const photo = photos[i];
                const slotSize = 95;
                return (
                  <View
                    key={i}
                    style={{
                      width: slotSize,
                      height: slotSize * 1.3,
                      borderRadius: 14,
                      overflow: "hidden",
                      backgroundColor: "#1E1E1E",
                      borderWidth: 1.5,
                      borderStyle: photo ? "solid" : "dashed",
                      borderColor: photo ? theme.primary : theme.borderDefault,
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
                          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>x</Text>
                        </Pressable>
                        <Image
                          source={{ uri: photo }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </>
                    ) : (
                      <Pressable
                        onPress={i === photos.length ? handleAddPhoto : undefined}
                        testID={i === photos.length ? "add-photo-slot" : undefined}
                        style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
                      >
                        <Text
                          style={{
                            color: i === photos.length ? theme.primary : "#3A3A4A",
                            fontSize: 26,
                            fontWeight: "300",
                          }}
                        >
                          +
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Photo picker modal */}
            {showPicker ? (
              <View
                style={{
                  backgroundColor: "#1E1E1E",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.borderDefault,
                }}
              >
                <Text
                  style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 14, textAlign: "center" }}
                >
                  Fotograf Ekle
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={takePhoto}
                    testID="camera-option"
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: pressed ? "rgba(225,29,72,0.2)" : "rgba(225,29,72,0.1)",
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                      gap: 6,
                      borderWidth: 1,
                      borderColor: "rgba(225,29,72,0.3)",
                    })}
                  >
                    <Text style={{ fontSize: 24 }}>C</Text>
                    <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>Kamera</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickFromGallery}
                    testID="gallery-option"
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: pressed ? "rgba(225,29,72,0.2)" : "rgba(225,29,72,0.1)",
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                      gap: 6,
                      borderWidth: 1,
                      borderColor: "rgba(225,29,72,0.3)",
                    })}
                  >
                    <Text style={{ fontSize: 24 }}>G</Text>
                    <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>Galeri</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  testID="cancel-picker"
                  style={{ marginTop: 12, alignItems: "center" }}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Iptal</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleAddPhoto}
                disabled={photos.length >= 6}
                testID="add-photo-button"
                style={({ pressed }) => ({
                  opacity: pressed || photos.length >= 6 ? 0.6 : 1,
                  backgroundColor: "#1E1E1E",
                  borderWidth: 1.5,
                  borderColor: theme.borderDefault,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                })}
              >
                <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>
                  + Fotograf Ekle
                </Text>
              </Pressable>
            )}
          </View>

          {/* Hobbies Section */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              padding: 18,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: theme.borderDefault,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Hobiler</Text>
              <Text style={{ color: theme.accent, fontSize: 13 }}>
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
                      borderRadius: 100,
                      borderWidth: 1.5,
                      borderColor: isSelected ? theme.primary : theme.borderDefault,
                      backgroundColor: isSelected ? "rgba(225,29,72,0.15)" : "#1E1E1E",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? theme.accent : theme.textSecondary,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {hobby.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Error message */}
          {error ? (
            <Text style={{ color: theme.error, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Fixed save button at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "rgba(10,10,15,0.95)",
          borderTopWidth: 1,
          borderTopColor: theme.borderDefault,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={saveMutation.isPending}
          testID="save-button"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Kaydet</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
