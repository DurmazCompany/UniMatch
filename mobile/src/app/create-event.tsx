import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { theme, gradients } from "@/lib/theme";
import { api } from "@/lib/api/api";
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Type,
  CheckCircle,
  Tag,
  Users,
} from "lucide-react-native";

type PickerMode = "date" | "time";

function SuccessToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: "#10B981",
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        zIndex: 999,
      }}
    >
      <CheckCircle size={20} color="#fff" />
      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
        Etkinlik yayınlandı 🚀
      </Text>
    </View>
  );
}

function InputBlock({
  label,
  icon,
  required,
  children,
  error,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {label}
          {required ? <Text style={{ color: theme.primary }}> *</Text> : null}
        </Text>
      </View>
      {children}
      {error ? (
        <Text style={{ color: theme.error, fontSize: 12, marginTop: 5 }}>{error}</Text>
      ) : null}
    </View>
  );
}

const inputStyle = (focused: boolean) => ({
  backgroundColor: theme.surface,
  borderWidth: 1.5,
  borderColor: focused ? theme.primary : theme.borderDefault,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: theme.textPrimary,
  fontSize: 16,
  shadowColor: focused ? theme.primary : "transparent",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: focused ? 0.2 : 0,
  shadowRadius: focused ? 8 : 0,
} as const);

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const [showPicker, setShowPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    location?: string;
    ticketPrice?: string;
    maxAttendees?: string;
  }>({});
  const [focused, setFocused] = useState<string | null>(null);

  const [isPaid, setIsPaid] = useState(false);
  const [ticketPrice, setTicketPrice] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");

  const formatDate = (d: Date) => {
    const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      date: string;
      location: string;
      isPaid: boolean;
      ticketPrice?: number;
      maxAttendees?: number;
    }) => api.post("/api/events", data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 1800);
    },
  });

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Başlık zorunludur";
    if (!location.trim()) newErrors.location = "Konum zorunludur";
    if (isPaid) {
      const price = parseFloat(ticketPrice);
      if (!ticketPrice.trim() || isNaN(price) || price <= 0) {
        newErrors.ticketPrice = "Geçerli bir fiyat girin";
      }
    }
    if (maxAttendees.trim()) {
      const cap = parseInt(maxAttendees, 10);
      if (isNaN(cap) || cap <= 0) {
        newErrors.maxAttendees = "Geçerli bir sayı girin";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setErrors({});

    const parsedPrice = isPaid ? parseFloat(ticketPrice) : undefined;
    const parsedMax = maxAttendees.trim() ? parseInt(maxAttendees, 10) : undefined;

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      date: eventDate.toISOString(),
      location: location.trim(),
      isPaid,
      ticketPrice: parsedPrice,
      maxAttendees: parsedMax,
    });
  };

  const handlePickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setEventDate(selected);
  };

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode);
    setShowPicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="create-event-screen">
      <SuccessToast visible={showSuccess} />

      {/* Header */}
      <LinearGradient
        colors={["#1A0D12", theme.background]}
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="back-button"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronLeft size={22} color={theme.textPrimary} />
        </Pressable>
        <View>
          <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: "800" }}>
            Etkinlik Oluştur
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
            Sadece ambassador yetkisiyle
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <InputBlock
          label="Başlık"
          required
          icon={<Type size={14} color={theme.textSecondary} />}
          error={errors.title}
        >
          <TextInput
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: undefined })); }}
            placeholder="Etkinliğin adı"
            placeholderTextColor={theme.textPlaceholder}
            testID="title-input"
            onFocus={() => setFocused("title")}
            onBlur={() => setFocused(null)}
            style={inputStyle(focused === "title")}
          />
        </InputBlock>

        {/* Description */}
        <InputBlock
          label="Açıklama"
          icon={<FileText size={14} color={theme.textSecondary} />}
        >
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Kısa bir açıklama (isteğe bağlı)"
            placeholderTextColor={theme.textPlaceholder}
            multiline
            numberOfLines={4}
            maxLength={400}
            testID="description-input"
            onFocus={() => setFocused("description")}
            onBlur={() => setFocused(null)}
            style={[
              inputStyle(focused === "description"),
              { minHeight: 100, textAlignVertical: "top" },
            ]}
          />
          <Text style={{ color: theme.textPlaceholder, fontSize: 11, textAlign: "right", marginTop: 4 }}>
            {description.length}/400
          </Text>
        </InputBlock>

        {/* Date & Time row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          {/* Date */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Calendar size={14} color={theme.textSecondary} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Tarih <Text style={{ color: theme.primary }}>*</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => openPicker("date")}
              testID="date-picker-button"
              style={({ pressed }) => ({
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "500" }}>
                {formatDate(eventDate)}
              </Text>
            </Pressable>
          </View>

          {/* Time */}
          <View style={{ flex: 0.6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Clock size={14} color={theme.textSecondary} />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Saat <Text style={{ color: theme.primary }}>*</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => openPicker("time")}
              testID="time-picker-button"
              style={({ pressed }) => ({
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.borderDefault,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: theme.primary, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
                {formatTime(eventDate)}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Location */}
        <InputBlock
          label="Konum"
          required
          icon={<MapPin size={14} color={theme.textSecondary} />}
          error={errors.location}
        >
          <TextInput
            value={location}
            onChangeText={(t) => { setLocation(t); setErrors((e) => ({ ...e, location: undefined })); }}
            placeholder="Örn. Kütüphane 2. Kat, Amfi B"
            placeholderTextColor={theme.textPlaceholder}
            testID="location-input"
            onFocus={() => setFocused("location")}
            onBlur={() => setFocused(null)}
            style={inputStyle(focused === "location")}
          />
        </InputBlock>

        {/* Paid event toggle */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: isPaid ? theme.primary : theme.borderDefault,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Tag size={18} color={isPaid ? theme.primary : theme.textSecondary} />
            <View>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "600" }}>
                Ücretli etkinlik
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
                {isPaid ? "Katılım ücretli" : "Ücretsiz katılım"}
              </Text>
            </View>
          </View>
          <Switch
            testID="paid-toggle"
            value={isPaid}
            onValueChange={(v) => {
              setIsPaid(v);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!v) setTicketPrice("");
            }}
            trackColor={{ false: theme.borderDefault, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Ticket price — shown only when isPaid */}
        {isPaid ? (
          <InputBlock
            label="Bilet Fiyatı"
            required
            icon={<Tag size={14} color={theme.textSecondary} />}
            error={errors.ticketPrice}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1.5,
                  borderColor: focused === "ticketPrice" ? theme.primary : theme.borderDefault,
                  borderRightWidth: 0,
                  borderTopLeftRadius: 14,
                  borderBottomLeftRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: theme.primary, fontSize: 17, fontWeight: "700" }}>₺</Text>
              </View>
              <TextInput
                value={ticketPrice}
                onChangeText={(t) => {
                  setTicketPrice(t.replace(/[^0-9.]/g, ""));
                  setErrors((e) => ({ ...e, ticketPrice: undefined }));
                }}
                placeholder="0.00"
                placeholderTextColor={theme.textPlaceholder}
                keyboardType="decimal-pad"
                testID="ticket-price-input"
                onFocus={() => setFocused("ticketPrice")}
                onBlur={() => setFocused(null)}
                style={[
                  inputStyle(focused === "ticketPrice"),
                  {
                    flex: 1,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  },
                ]}
              />
            </View>
          </InputBlock>
        ) : null}

        {/* Max attendees */}
        <InputBlock
          label="Maksimum Katılımcı"
          icon={<Users size={14} color={theme.textSecondary} />}
          error={errors.maxAttendees}
        >
          <TextInput
            value={maxAttendees}
            onChangeText={(t) => {
              setMaxAttendees(t.replace(/[^0-9]/g, ""));
              setErrors((e) => ({ ...e, maxAttendees: undefined }));
            }}
            placeholder="Sınırsız (isteğe bağlı)"
            placeholderTextColor={theme.textPlaceholder}
            keyboardType="number-pad"
            testID="max-attendees-input"
            onFocus={() => setFocused("maxAttendees")}
            onBlur={() => setFocused(null)}
            style={inputStyle(focused === "maxAttendees")}
          />
        </InputBlock>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          testID="submit-event-button"
          style={({ pressed }) => ({
            opacity: pressed || createMutation.isPending ? 0.8 : 1,
            marginTop: 8,
          })}
        >
          <LinearGradient
            colors={gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 14,
            }}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                Etkinliği Oluştur 🚀
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {createMutation.isError ? (
          <Text style={{ color: theme.error, fontSize: 13, textAlign: "center", marginTop: 12 }}>
            Etkinlik oluşturulamadı. Lütfen tekrar dene.
          </Text>
        ) : null}
      </ScrollView>

      {/* DateTimePicker — iOS inline modal, Android native */}
      {Platform.OS === "ios" ? (
        <Modal
          transparent
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={() => setShowPicker(false)}
          >
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#1C1C1E",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: insets.bottom + 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                  {pickerMode === "date" ? "Tarih Seç" : "Saat Seç"}
                </Text>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={{ color: theme.primary, fontSize: 15, fontWeight: "700" }}>Tamam</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={eventDate}
                mode={pickerMode}
                display="spinner"
                onChange={handlePickerChange}
                minimumDate={pickerMode === "date" ? new Date() : undefined}
                style={{ backgroundColor: "#1C1C1E" }}
                themeVariant="dark"
                locale="tr-TR"
              />
            </View>
          </Pressable>
        </Modal>
      ) : showPicker ? (
        <DateTimePicker
          value={eventDate}
          mode={pickerMode}
          display="default"
          onChange={handlePickerChange}
          minimumDate={pickerMode === "date" ? new Date() : undefined}
        />
      ) : null}
    </View>
  );
}
