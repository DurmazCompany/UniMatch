import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { fetch } from "expo/fetch";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@/lib/auth/use-session";
import { Match, Message, Profile } from "@/lib/types";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCheck, Send, ChevronLeft, MoreVertical, Mic, X, Snowflake, Image as ImageIcon, Eye, Flame } from "lucide-react-native";
import { useVoiceRecording } from "@/lib/hooks/useVoiceRecording";
import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";
import { useScreenProtectionOnFocus } from "@/lib/hooks/useScreenProtection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Conversation starter suggestions shown when chat is empty
const CONVERSATION_STARTERS = [
  "Merhaba! Profilini çok beğendim 😊",
  "Hangi bölümdeydin? 🎓",
  "Boş zamanlarında ne yaparsın?",
  "Kampüste en çok hangi yeri seversin? ☕",
  "Hafta sonu planların var mı?",
];

function getPartnerProfile(match: Match, myUserId: string): Profile {
  return match.user1.userId === myUserId ? match.user2 : match.user1;
}

function getProfileColor(id: string): [string, string] {
  const colors: [string, string][] = [
    ["#E8445A", "#FF5E73"],
    ["#059669", "#34D399"],
    ["#DC2626", "#F87171"],
    ["#D97706", "#FCD34D"],
    ["#2563EB", "#60A5FA"],
    ["#DB2777", "#F472B6"],
  ];
  const idx = id.charCodeAt(0) % colors.length;
  return colors[idx];
}

function parsePhotos(photos: string | string[]): string[] {
  if (Array.isArray(photos)) return photos;
  try {
    return JSON.parse(photos) as string[];
  } catch {
    return [];
  }
}

function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  return format(d, "HH:mm", { locale: tr });
}

function formatDateSeparator(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return "Bugün";
  if (isYesterday(d)) return "Dün";
  return format(d, "d MMMM", { locale: tr });
}

// Ephemeral photo viewer overlay
function EphemeralPhotoViewer({
  uri,
  onClose,
}: {
  uri: string;
  onClose: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
          alignItems: "center",
          justifyContent: "center",
        }}
        testID="ephemeral-photo-viewer"
      >
        <Image
          source={{ uri }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
          resizeMode="contain"
        />
        <View
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Eye size={16} color="#FF5E73" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {secondsLeft}s
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 54,
            left: 20,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 20,
            padding: 10,
          }}
          testID="close-ephemeral-viewer"
        >
          <X size={22} color="#fff" />
        </Pressable>
        <Text
          style={{
            position: "absolute",
            bottom: 60,
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
          }}
        >
          Bu fotoğraf bir kez görüntülenebilir
        </Text>
      </View>
    </Modal>
  );
}

export default function ChatScreen() {
  // 🔒 Ekran görüntüsü / kayıt koruması (tab navigation'da her focus'ta devreye girer)
  useScreenProtectionOnFocus();

  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Ephemeral photo tracking (client-side only, resets on navigation)
  const [viewedEphemeralIds, setViewedEphemeralIds] = useState<Set<string>>(new Set());
  const [ephemeralViewerUri, setEphemeralViewerUri] = useState<string | null>(null);
  const [currentEphemeralId, setCurrentEphemeralId] = useState<string | null>(null);

  // Voice recording
  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = useVoiceRecording();
  const [isSendingVoice, setIsSendingVoice] = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // SSE: listen for new messages in real-time
  useEffect(() => {
    if (!matchId) return;

    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
    const url = `${baseUrl}/api/sse/matches/${matchId}`;
    const abortController = new AbortController();

    const connect = async () => {
      try {
        const cookieHeader =
          typeof authClient.getCookie === "function" ? authClient.getCookie() : "";

        const response = await fetch(url, {
          credentials: "include",
          headers: {
            Accept: "text/event-stream",
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw) continue;
            try {
              const event = JSON.parse(raw) as { type: string; data: unknown };
              if (event.type === "new_message" && isMounted.current) {
                const newMsg = event.data as Message;
                queryClient.setQueryData<Message[]>(
                  ["messages", matchId],
                  (prev) => {
                    const existing = prev ?? [];
                    if (existing.some((m) => m.id === newMsg.id)) return existing;
                    return [...existing, newMsg];
                  }
                );
              }
            } catch {
              // malformed JSON — skip
            }
          }
        }
      } catch {
        // aborted or network error — do nothing
      }
    };

    connect();

    return () => {
      abortController.abort();
    };
  }, [matchId, queryClient]);

  // Simulate typing indicator when partner might be typing
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000 + Math.random() * 2000);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const { data: match } = useQuery<Match | null>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      try {
        const matches = await api.get<Match[]>(`/api/matches`);
        return Array.isArray(matches) ? matches.find((m: Match) => m.id === matchId) ?? null : null;
      } catch {
        return null;
      }
    },
  });

  const { data: messages, isLoading } = useQuery<Message[] | null>({
    queryKey: ["messages", matchId],
    queryFn: async () => {
      try {
        const result = await api.get<Message[]>(`/api/matches/${matchId}/messages`);
        return result ?? [];
      } catch {
        return [];
      }
    },
  });

  const myProfile = match ? (match.user1.userId === myUserId ? match.user1 : match.user2) : null;
  const partner = match ? getPartnerProfile(match, myUserId) : null;
  const [pc1, pc2] = partner ? getProfileColor(partner.id) : ["#E8445A", "#FF5E73"];
  const partnerPhotos = partner ? parsePhotos(partner.photos) : [];

  // Group messages by date
  const messagesWithSeparators = useMemo(() => {
    const msgs = messages ?? [];
    const result: (Message | { type: "separator"; date: string })[] = [];
    let lastDate: string | null = null;

    for (const msg of msgs) {
      const msgDate = formatDateSeparator(msg.createdAt);
      if (msgDate !== lastDate) {
        result.push({ type: "separator", date: msgDate });
        lastDate = msgDate;
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (payload: { content: string; messageType?: string }) =>
      api.post<Message>(`/api/matches/${matchId}/messages`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText("");
    sendMessage({ content: trimmed, messageType: "text" });
  }, [text, isSending, sendMessage]);

  const handleStarterTap = useCallback(
    (starter: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      sendMessage({ content: starter, messageType: "text" });
    },
    [sendMessage]
  );

  // Upload an image and send as chat message
  const uploadImageAndSend = useCallback(
    async (uri: string, isEphemeral: boolean) => {
      setIsUploadingPhoto(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

        const formData = new FormData();
        formData.append("file", {
          uri,
          type: "image/jpeg",
          name: "chat_photo.jpg",
        } as unknown as Blob);

        const uploadResponse = await fetch(`${baseUrl}/api/uploads/image`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadResult = await uploadResponse.json() as { data?: { url?: string } };
        const imageUrl = uploadResult.data?.url;

        if (!imageUrl) {
          throw new Error("No image URL returned");
        }

        const messageType = isEphemeral ? "ephemeral_photo" : "photo";

        await api.post<Message>(`/api/matches/${matchId}/messages`, {
          content: imageUrl,
          messageType,
        });

        queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
        queryClient.invalidateQueries({ queryKey: ["matches"] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Failed to send photo:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [matchId, queryClient]
  );

  const handlePickPhoto = useCallback(
    async (isEphemeral: boolean) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImageAndSend(result.assets[0].uri, isEphemeral);
      }
    },
    [uploadImageAndSend]
  );

  // Voice message handling
  const uploadVoiceAndSend = useCallback(
    async (uri: string, voiceDuration: number) => {
      setIsSendingVoice(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

        const formData = new FormData();
        formData.append("audio", {
          uri,
          type: "audio/m4a",
          name: "voice.m4a",
        } as unknown as Blob);

        const uploadResponse = await fetch(`${baseUrl}/api/uploads/voice`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          throw new Error("Voice upload failed");
        }

        const uploadResult = await uploadResponse.json() as { data?: { url?: string } };
        const voiceUrl = uploadResult.data?.url;

        if (!voiceUrl) {
          throw new Error("No voice URL returned");
        }

        await api.post<Message>(`/api/matches/${matchId}/messages`, {
          content: "Sesli mesaj",
          messageType: "voice",
          voiceUrl,
          voiceDuration,
        });

        queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
        queryClient.invalidateQueries({ queryKey: ["matches"] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Failed to send voice message:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSendingVoice(false);
      }
    },
    [matchId, queryClient]
  );

  const handleVoiceRecord = useCallback(async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri && duration > 0) {
        await uploadVoiceAndSend(uri, duration);
      }
    } else {
      await startRecording();
    }
  }, [isRecording, duration, stopRecording, startRecording, uploadVoiceAndSend]);

  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [cancelRecording]);

  const handleEphemeralTap = useCallback(
    (msg: Message) => {
      if (viewedEphemeralIds.has(msg.id)) return;
      setCurrentEphemeralId(msg.id);
      setEphemeralViewerUri(msg.content);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [viewedEphemeralIds]
  );

  const handleCloseEphemeral = useCallback(() => {
    if (currentEphemeralId) {
      setViewedEphemeralIds((prev) => new Set([...prev, currentEphemeralId]));
    }
    setEphemeralViewerUri(null);
    setCurrentEphemeralId(null);
  }, [currentEphemeralId]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message | { type: "separator"; date: string }; index: number }) => {
      // Date separator
      if ("type" in item && item.type === "separator") {
        return (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.06)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#8E8E93", fontSize: 12, fontWeight: "600" }}>
                {item.date}
              </Text>
            </View>
          </View>
        );
      }

      const msg = item as Message;
      const isMe = msg.senderId === myProfile?.id;
      const nextItem = messagesWithSeparators[index + 1];
      const isLastInGroup =
        index === messagesWithSeparators.length - 1 ||
        (nextItem && "type" in nextItem) ||
        (nextItem && !("type" in nextItem) && (nextItem as Message).senderId !== msg.senderId);

      const isPhoto = msg.messageType === "photo";
      const isEphemeral = msg.messageType === "ephemeral_photo";
      const hasViewed = viewedEphemeralIds.has(msg.id);

      return (
        <View
          style={{
            flexDirection: "row",
            justifyContent: isMe ? "flex-end" : "flex-start",
            marginBottom: isLastInGroup ? 12 : 4,
            paddingHorizontal: 16,
          }}
        >
          {!isMe && isLastInGroup ? (
            partnerPhotos.length > 0 ? (
              <Image
                source={{ uri: partnerPhotos[0] }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  marginRight: 8,
                  alignSelf: "flex-end",
                }}
              />
            ) : (
              <LinearGradient
                colors={[pc1, pc2]}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  alignSelf: "flex-end",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                  {partner?.name[0]?.toUpperCase()}
                </Text>
              </LinearGradient>
            )
          ) : !isMe ? (
            <View style={{ width: 36 }} />
          ) : null}

          <View style={{ maxWidth: "72%" }}>
            {/* Photo message */}
            {isPhoto ? (
              <Pressable
                onPress={() => {
                  // Allow tapping to view full screen if needed (no restriction for regular photos)
                }}
                testID={`photo-message-${msg.id}`}
              >
                <Image
                  source={{ uri: msg.content }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 16,
                    borderBottomRightRadius: isMe && isLastInGroup ? 4 : 16,
                    borderBottomLeftRadius: !isMe && isLastInGroup ? 4 : 16,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ) : isEphemeral ? (
              // Ephemeral photo message
              <Pressable
                onPress={() => handleEphemeralTap(msg)}
                testID={`ephemeral-message-${msg.id}`}
                disabled={hasViewed}
              >
                {hasViewed ? (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 18,
                      borderBottomRightRadius: isMe && isLastInGroup ? 4 : 18,
                      borderBottomLeftRadius: !isMe && isLastInGroup ? 4 : 18,
                      backgroundColor: isMe ? "#F3D0D5" : "#E8E8E8",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Eye size={16} color={isMe ? "#E8445A" : "#8E8E93"} />
                    <Text style={{ color: isMe ? "#E8445A" : "#8E8E93", fontSize: 14 }}>
                      Görüntülendi
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={isMe ? ["#E8445A", "#FF5E73"] : ["#FF6B35", "#FF8C55"]}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 18,
                      borderBottomRightRadius: isMe && isLastInGroup ? 4 : 18,
                      borderBottomLeftRadius: !isMe && isLastInGroup ? 4 : 18,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Flame size={18} color="#fff" />
                    <View>
                      <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                        Fotoğraf
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                        Bir kez görüntülenebilir
                      </Text>
                    </View>
                  </LinearGradient>
                )}
              </Pressable>
            ) : (
              // Text or voice message
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                  borderBottomRightRadius: isMe && isLastInGroup ? 4 : 18,
                  borderBottomLeftRadius: !isMe && isLastInGroup ? 4 : 18,
                  backgroundColor: isMe ? "#E8445A" : "#F0F0F0",
                  minWidth: msg.messageType === "voice" ? 180 : undefined,
                }}
              >
                {msg.messageType === "voice" && msg.voiceUrl ? (
                  <VoiceMessagePlayer
                    voiceUrl={msg.voiceUrl}
                    duration={msg.voiceDuration ?? 0}
                    isMe={isMe}
                  />
                ) : (
                  <Text style={{ color: isMe ? "#FFFFFF" : "#1A1A1A", fontSize: 15, lineHeight: 21 }}>
                    {msg.content}
                  </Text>
                )}
              </View>
            )}

            {/* Time and read receipt */}
            {isLastInGroup ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  alignItems: "center",
                  marginTop: 4,
                  gap: 4,
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: "#6B7280", fontSize: 11 }}>
                  {formatMessageTime(msg.createdAt)}
                </Text>
                {isMe ? <CheckCheck size={14} color="#4CD964" /> : null}
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [myProfile, partner, partnerPhotos, pc1, pc2, messagesWithSeparators, viewedEphemeralIds, handleEphemeralTap]
  );

  const isEmpty = !isLoading && (messages?.length ?? 0) === 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8F8" }} testID="chat-screen">
      {/* Ephemeral photo viewer overlay */}
      {ephemeralViewerUri ? (
        <EphemeralPhotoViewer uri={ephemeralViewerUri} onClose={handleCloseEphemeral} />
      ) : null}

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0,0,0,0.06)",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            marginRight: 12,
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        {partner ? (
          partnerPhotos.length > 0 ? (
            <Image
              source={{ uri: partnerPhotos[0] }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                marginRight: 12,
                borderWidth: 2,
                borderColor: "#E8445A",
              }}
            />
          ) : (
            <LinearGradient
              colors={[pc1, pc2]}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {partner.name[0]?.toUpperCase()}
              </Text>
            </LinearGradient>
          )
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#1A1A1A", fontSize: 17, fontWeight: "700" }}>
              {partner?.name ?? "..."}
            </Text>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CD964" }} />
          </View>
          <Text style={{ color: isTyping ? "#4CD964" : "#6B7280", fontSize: 12 }}>
            {isTyping ? "Yazıyor..." : "Online"}
          </Text>
        </View>
        <Pressable
          testID="more-button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <MoreVertical size={20} color="#6B7280" />
        </Pressable>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#E8445A" testID="loading-indicator" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messagesWithSeparators}
          renderItem={renderMessage}
          keyExtractor={(item, index) =>
            "type" in item ? `sep-${index}` : (item as Message).id
          }
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            match && !match.iceBreakerAccepted ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  backgroundColor: "rgba(124,58,237,0.08)",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(124,58,237,0.2)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <Snowflake size={12} color="#FF5E73" />
                  <Text style={{ color: "#FF5E73", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
                    BASLATICI SORU
                  </Text>
                </View>
                <Text style={{ color: "#1A1A1A", fontSize: 15, lineHeight: 22 }}>
                  {match.iceBreakerQuestion}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isEmpty ? (
              <View
                style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: 24 }}
                testID="empty-chat-state"
              >
                {partnerPhotos.length > 0 ? (
                  <Image
                    source={{ uri: partnerPhotos[0] }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      marginBottom: 12,
                      borderWidth: 3,
                      borderColor: "#E8445A",
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={[pc1, pc2]}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
                      {partner?.name[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </LinearGradient>
                )}
                <Text style={{ color: "#1A1A1A", fontSize: 17, fontWeight: "700", marginBottom: 4 }}>
                  {partner?.name ?? "Eşleşmen"} ile eşleştin!
                </Text>
                <Text style={{ color: "#6B7280", fontSize: 14, textAlign: "center", marginBottom: 20 }}>
                  İlk adımı at, tanışmaya başla 💬
                </Text>
                {/* Conversation starters */}
                <View style={{ width: "100%", gap: 8 }} testID="conversation-starters">
                  {CONVERSATION_STARTERS.map((starter, idx) => (
                    <Pressable
                      key={idx}
                      testID={`starter-${idx}`}
                      onPress={() => handleStarterTap(starter)}
                      disabled={isSending}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? "#F3D0D5" : "#FFFFFF",
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1.5,
                        borderColor: "#E8445A",
                        opacity: isSending ? 0.6 : 1,
                      })}
                    >
                      <Text style={{ color: "#E8445A", fontSize: 14, fontWeight: "500", textAlign: "center" }}>
                        {starter}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            paddingBottom: insets.bottom + 10,
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
            backgroundColor: "#FFFFFF",
          }}
        >
          {isRecording ? (
            // Recording UI
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable
                testID="cancel-recording-button"
                onPress={handleCancelRecording}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#F2F2F7",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <X size={20} color="#8E8E93" />
              </Pressable>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFF0F2",
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#E8445A",
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E8445A" }} />
                <Text style={{ color: "#E8445A", fontSize: 16, fontWeight: "600" }}>
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
                </Text>
                <Text style={{ color: "#8E8E93", fontSize: 13 }}>Kayıt ediliyor...</Text>
              </View>

              <Pressable
                testID="stop-recording-button"
                onPress={handleVoiceRecord}
                disabled={isSendingVoice}
                style={({ pressed }) => ({
                  opacity: pressed || isSendingVoice ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <LinearGradient
                  colors={["#E8445A", "#FF5E73"]}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSendingVoice ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={18} color="#fff" style={{ marginLeft: 2 }} />
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            // Normal input row
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              {/* Photo buttons (only show when not typing) */}
              {!text.trim() ? (
                <>
                  <Pressable
                    testID="photo-button"
                    onPress={() => handlePickPhoto(false)}
                    disabled={isUploadingPhoto}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: "#F2F2F7",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed || isUploadingPhoto ? 0.7 : 1,
                    })}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color="#E8445A" />
                    ) : (
                      <ImageIcon size={18} color="#E8445A" />
                    )}
                  </Pressable>
                  <Pressable
                    testID="ephemeral-photo-button"
                    onPress={() => handlePickPhoto(true)}
                    disabled={isUploadingPhoto}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: "#FFF0EB",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed || isUploadingPhoto ? 0.7 : 1,
                    })}
                  >
                    <Flame size={18} color="#FF6B35" />
                  </Pressable>
                </>
              ) : null}

              <TextInput
                testID="message-input"
                value={text}
                onChangeText={setText}
                placeholder="Mesaj yaz..."
                placeholderTextColor="#C7C7CC"
                multiline
                maxLength={500}
                style={{
                  flex: 1,
                  backgroundColor: "#F2F2F7",
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: "#1A1A1A",
                  fontSize: 15,
                  maxHeight: 120,
                }}
              />

              {text.trim() ? (
                <Pressable
                  testID="send-button"
                  onPress={handleSend}
                  disabled={isSending}
                  style={({ pressed }) => ({
                    opacity: pressed || isSending ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <LinearGradient
                    colors={["#E8445A", "#FF5E73"]}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={18} color="#fff" style={{ marginLeft: 2 }} />
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable
                  testID="mic-button"
                  onPress={handleVoiceRecord}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <LinearGradient
                    colors={["#E8445A", "#FF5E73"]}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Mic size={20} color="#fff" />
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
