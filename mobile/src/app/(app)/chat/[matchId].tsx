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
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { fetch } from "expo/fetch";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@/lib/auth/use-session";
import { Match, Message, Profile, GiftSent, EventInvitation } from "@/lib/types";
import { GiftPicker } from "@/components/chat/GiftPicker";
import { GiftBubble } from "@/components/chat/GiftBubble";
import { EventInvitePicker } from "@/components/chat/EventInvitePicker";
import { EventInviteBubble } from "@/components/chat/EventInviteBubble";
import { useMatchInvitations } from "@/lib/hooks/useEvents";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { Colors, Radius } from "@/lib/theme";
import { UMAvatar } from "@/components/ui";
import { useVoiceRecording } from "@/lib/hooks/useVoiceRecording";
import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";
import { useScreenProtectionOnFocus } from "@/lib/hooks/useScreenProtection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

function EphemeralPhotoViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
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
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" }}
        testID="ephemeral-photo-viewer"
      >
        <Image source={{ uri }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }} resizeMode="contain" />
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
          <Ionicons name="eye-outline" size={16} color={Colors.coral} />
          <Text style={{ color: Colors.white, fontFamily: "DMSans_700Bold", fontSize: 15 }}>{secondsLeft}s</Text>
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
          <Ionicons name="close-outline" size={22} color={Colors.white} />
        </Pressable>
        <Text
          style={{
            position: "absolute",
            bottom: 60,
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            fontFamily: "DMSans_400Regular",
          }}
        >
          Bu fotoğraf bir kez görüntülenebilir
        </Text>
      </View>
    </Modal>
  );
}

export default function ChatScreen() {
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

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [showEventInvitePicker, setShowEventInvitePicker] = useState(false);

  const [viewedEphemeralIds, setViewedEphemeralIds] = useState<Set<string>>(new Set());
  const [ephemeralViewerUri, setEphemeralViewerUri] = useState<string | null>(null);
  const [currentEphemeralId, setCurrentEphemeralId] = useState<string | null>(null);

  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = useVoiceRecording();
  const [isSendingVoice, setIsSendingVoice] = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (matchId) {
      api.patch(`/api/matches/${matchId}/read`, {}).catch(() => {});
    }
  }, [matchId]);

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
              // skip
            }
          }
        }
      } catch {
        // skip
      }
    };

    connect();

    return () => {
      abortController.abort();
    };
  }, [matchId, queryClient]);

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
  const isPremiumAsk = myProfile?.premiumTier === "ask";
  const partner = match ? getPartnerProfile(match, myUserId) : null;
  const partnerPhotos = partner ? parsePhotos(partner.photos) : [];

  const { data: matchGifts } = useQuery<GiftSent[] | null>({
    queryKey: ["gifts-by-match", matchId],
    queryFn: async () => {
      try {
        return await api.get<GiftSent[]>(`/api/gifts/match/${matchId}`);
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
    enabled: !!matchId,
  });

  const { data: matchInvitations } = useMatchInvitations(matchId);

  type ChatItem =
    | { kind: "message"; data: Message; createdAt: string }
    | { kind: "gift"; data: GiftSent; createdAt: string }
    | { kind: "invitation"; data: EventInvitation; createdAt: string }
    | { kind: "separator"; date: string };

  const messagesWithSeparators = useMemo<ChatItem[]>(() => {
    const msgs = (messages ?? []).map((m) => ({
      kind: "message" as const,
      data: m,
      createdAt: m.createdAt,
    }));
    const gifts = (matchGifts ?? []).map((g) => ({
      kind: "gift" as const,
      data: g,
      createdAt: g.createdAt,
    }));
    const invs = (matchInvitations ?? []).map((i) => ({
      kind: "invitation" as const,
      data: i,
      createdAt: i.createdAt,
    }));
    type DatedItem = Extract<ChatItem, { createdAt: string }>;
    const merged: DatedItem[] = ([...msgs, ...gifts, ...invs] as DatedItem[]).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const result: ChatItem[] = [];
    let lastDate: string | null = null;
    for (const item of merged) {
      const dateLabel = formatDateSeparator(item.createdAt);
      if (dateLabel !== lastDate) {
        result.push({ kind: "separator", date: dateLabel });
        lastDate = dateLabel;
      }
      result.push(item);
    }
    return result;
  }, [messages, matchGifts, matchInvitations]);

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

  const uploadImageAndSend = useCallback(
    async (uri: string, isEphemeral: boolean) => {
      setIsUploadingPhoto(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
        const formData = new FormData();
        formData.append("file", { uri, type: "image/jpeg", name: "chat_photo.jpg" } as unknown as Blob);

        const uploadResponse = await fetch(`${baseUrl}/api/uploads/image`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadResult = (await uploadResponse.json()) as { data?: { url?: string } };
        const imageUrl = uploadResult.data?.url;
        if (!imageUrl) throw new Error("No image URL returned");

        const messageType = isEphemeral ? "ephemeral_photo" : "photo";
        await api.post<Message>(`/api/matches/${matchId}/messages`, { content: imageUrl, messageType });

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
      if (status !== "granted") return;

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

  const uploadVoiceAndSend = useCallback(
    async (uri: string, voiceDuration: number) => {
      setIsSendingVoice(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
        const formData = new FormData();
        formData.append("audio", { uri, type: "audio/m4a", name: "voice.m4a" } as unknown as Blob);

        const uploadResponse = await fetch(`${baseUrl}/api/uploads/voice`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) throw new Error("Voice upload failed");

        const uploadResult = (await uploadResponse.json()) as { data?: { url?: string } };
        const voiceUrl = uploadResult.data?.url;
        if (!voiceUrl) throw new Error("No voice URL returned");

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
    ({ item, index }: { item: ChatItem; index: number }) => {
      if (item.kind === "separator") {
        return (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                {item.date}
              </Text>
            </View>
          </View>
        );
      }

      if (item.kind === "invitation") {
        const inv = item.data;
        const isMine = inv.senderId === myProfile?.id;
        return (
          <View style={{ paddingHorizontal: 16 }}>
            <EventInviteBubble invitation={inv} isMine={isMine} />
          </View>
        );
      }

      if (item.kind === "gift") {
        const g = item.data;
        const isMine = g.senderId === myProfile?.id;
        const senderName = isMine ? "Sen" : partner?.name;
        return (
          <View style={{ paddingHorizontal: 16 }}>
            <GiftBubble
              emoji={g.gift?.emoji ?? "🎁"}
              giftName={g.gift?.nameTr ?? "Hediye"}
              senderName={senderName}
              isMine={isMine}
            />
          </View>
        );
      }

      const msg = item.data;
      const isMe = msg.senderId === myProfile?.id;
      const nextItem = messagesWithSeparators[index + 1];
      const isLastInGroup =
        index === messagesWithSeparators.length - 1 ||
        (nextItem && nextItem.kind !== "message") ||
        (nextItem && nextItem.kind === "message" && nextItem.data.senderId !== msg.senderId);

      const isPhoto = msg.messageType === "photo";
      const isEphemeral = msg.messageType === "ephemeral_photo";
      const hasViewed = viewedEphemeralIds.has(msg.id);

      const bubbleBg = isMe ? Colors.primary : Colors.cardDark;
      const bubbleText = Colors.white;

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
            <View style={{ marginRight: 8, alignSelf: "flex-end" }}>
              <UMAvatar uri={partnerPhotos[0]} size="sm" fallback={partner?.name} />
            </View>
          ) : !isMe ? (
            <View style={{ width: 44 }} />
          ) : null}

          <View style={{ maxWidth: "72%" }}>
            {isPhoto ? (
              <Pressable testID={`photo-message-${msg.id}`}>
                <Image
                  source={{ uri: msg.content }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 22,
                    borderBottomRightRadius: isMe && isLastInGroup ? 6 : 22,
                    borderBottomLeftRadius: !isMe && isLastInGroup ? 6 : 22,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ) : isEphemeral ? (
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
                      borderRadius: 22,
                      borderBottomRightRadius: isMe && isLastInGroup ? 6 : 22,
                      borderBottomLeftRadius: !isMe && isLastInGroup ? 6 : 22,
                      backgroundColor: isMe ? "rgba(124,111,247,0.3)" : Colors.surfaceDark,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color={Colors.textOnDarkMuted} />
                    <Text style={{ color: Colors.textOnDarkMuted, fontSize: 14, fontFamily: "DMSans_500Medium" }}>
                      Görüntülendi
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[Colors.coral, Colors.primary]}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 22,
                      borderBottomRightRadius: isMe && isLastInGroup ? 6 : 22,
                      borderBottomLeftRadius: !isMe && isLastInGroup ? 6 : 22,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons name="flame-outline" size={18} color={Colors.white} />
                    <View>
                      <Text style={{ color: Colors.white, fontSize: 14, fontFamily: "DMSans_600SemiBold" }}>
                        Fotoğraf
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "DMSans_400Regular" }}>
                        Bir kez görüntülenebilir
                      </Text>
                    </View>
                  </LinearGradient>
                )}
              </Pressable>
            ) : (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 22,
                  borderBottomRightRadius: isMe && isLastInGroup ? 6 : 22,
                  borderBottomLeftRadius: !isMe && isLastInGroup ? 6 : 22,
                  backgroundColor: bubbleBg,
                  minWidth: msg.messageType === "voice" ? 180 : undefined,
                }}
              >
                {msg.messageType === "voice" && msg.voiceUrl ? (
                  <VoiceMessagePlayer voiceUrl={msg.voiceUrl} duration={msg.voiceDuration ?? 0} isMe={isMe} />
                ) : (
                  <Text style={{ color: bubbleText, fontSize: 15, fontFamily: "DMSans_400Regular", lineHeight: 21 }}>
                    {msg.content}
                  </Text>
                )}
              </View>
            )}

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
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 11, fontFamily: "DMSans_400Regular" }}>
                  {formatMessageTime(msg.createdAt)}
                </Text>
                {isMe ? <Ionicons name="checkmark-done" size={14} color={Colors.primaryLight} /> : null}
              </View>
            ) : null}
            {isMe && msg.readAt && isPremiumAsk ? (
              <Text style={{ color: Colors.textOnDarkMuted, fontSize: 10, fontFamily: "DMSans_400Regular", textAlign: "right", marginTop: 2 }}>
                Görüldü
              </Text>
            ) : null}
          </View>
        </View>
      );
    },
    [myProfile, partner, partnerPhotos, messagesWithSeparators, viewedEphemeralIds, handleEphemeralTap, isPremiumAsk]
  );

  const isEmpty = !isLoading && (messages?.length ?? 0) === 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="chat-screen">
      <StatusBar barStyle="light-content" />

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
          backgroundColor: Colors.bgDark,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.surfaceDark,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back-outline" size={20} color={Colors.textOnDark} />
        </Pressable>
        {partner ? (
          <View style={{ marginRight: 12 }}>
            <UMAvatar uri={partnerPhotos[0]} size="md" fallback={partner.name} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textOnDark, fontSize: 17, fontFamily: "DMSans_700Bold" }}>
            {partner?.name ?? "..."}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4CD964" }} />
            <Text style={{ color: isTyping ? "#4CD964" : Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_500Medium" }}>
              {isTyping ? "Yazıyor..." : "Online"}
            </Text>
          </View>
        </View>
        <Pressable
          testID="more-button"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="ellipsis-horizontal-outline" size={20} color={Colors.textOnDarkMuted} />
        </Pressable>
      </View>

      {/* Expiry banner */}
      {/* Messages */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.primary} testID="loading-indicator" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messagesWithSeparators}
          renderItem={renderMessage}
          keyExtractor={(item, index) =>
            item.kind === "separator"
              ? `sep-${index}`
              : item.kind === "gift"
              ? `gift-${item.data.id}`
              : item.kind === "invitation"
              ? `inv-${item.data.id}`
              : item.data.id
          }
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            match && !match.iceBreakerAccepted ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  backgroundColor: Colors.surfaceDark,
                  borderRadius: Radius.card,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(124,111,247,0.25)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Ionicons name="sparkles-outline" size={14} color={Colors.primaryLight} />
                  <Text style={{ color: Colors.primaryLight, fontSize: 12, fontFamily: "DMSans_700Bold", letterSpacing: 0.5 }}>
                    BAŞLATICI SORU
                  </Text>
                </View>
                <Text style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_400Regular", lineHeight: 22 }}>
                  {match.iceBreakerQuestion}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isEmpty ? (
              <View style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: 24 }} testID="empty-chat-state">
                <View style={{ marginBottom: 12 }}>
                  <UMAvatar uri={partnerPhotos[0]} size="xl" ring fallback={partner?.name ?? "?"} />
                </View>
                <Text style={{ color: Colors.textOnDark, fontSize: 20, fontFamily: "DMSerifDisplay_400Regular", marginBottom: 4 }}>
                  {partner?.name ?? "Eşleşmen"} ile eşleştin!
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", marginBottom: 24 }}>
                  İlk adımı at, tanışmaya başla 💬
                </Text>
                <View style={{ width: "100%", gap: 8 }} testID="conversation-starters">
                  {CONVERSATION_STARTERS.map((starter, idx) => (
                    <Pressable
                      key={idx}
                      testID={`starter-${idx}`}
                      onPress={() => handleStarterTap(starter)}
                      disabled={isSending}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? Colors.cardDark : Colors.surfaceDark,
                        borderRadius: Radius.card,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderColor: "rgba(124,111,247,0.3)",
                        opacity: isSending ? 0.6 : 1,
                      })}
                    >
                      <Text style={{ color: Colors.textOnDark, fontSize: 14, fontFamily: "DMSans_500Medium", textAlign: "center" }}>
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            paddingBottom: insets.bottom + 10,
            backgroundColor: Colors.surfaceDark,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
          }}
        >
          {isRecording ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable
                testID="cancel-recording-button"
                onPress={handleCancelRecording}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Colors.cardDark,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="close-outline" size={20} color={Colors.textOnDarkMuted} />
              </Pressable>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(232,99,90,0.15)",
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: Colors.coral,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.coral }} />
                <Text style={{ color: Colors.coral, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
                </Text>
                <Text style={{ color: Colors.textOnDarkMuted, fontSize: 13, fontFamily: "DMSans_400Regular" }}>Kayıt ediliyor...</Text>
              </View>

              <Pressable
                testID="stop-recording-button"
                onPress={handleVoiceRecord}
                disabled={isSendingVoice}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: Colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || isSendingVoice ? 0.7 : 1,
                })}
              >
                {isSendingVoice ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Ionicons name="send" size={18} color={Colors.white} style={{ marginLeft: 2 }} />
                )}
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
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
                      backgroundColor: Colors.cardDark,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed || isUploadingPhoto ? 0.7 : 1,
                    })}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color={Colors.primaryLight} />
                    ) : (
                      <Ionicons name="image-outline" size={18} color={Colors.primaryLight} />
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
                      backgroundColor: "rgba(232,99,90,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed || isUploadingPhoto ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="flame-outline" size={18} color={Colors.coral} />
                  </Pressable>
                  <Pressable
                    testID="gift-button"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowGiftPicker(true);
                    }}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: "rgba(124,111,247,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="gift-outline" size={18} color={Colors.primaryLight} />
                  </Pressable>
                  <Pressable
                    testID="event-invite-button"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowEventInvitePicker(true);
                    }}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: "rgba(124,111,247,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="calendar-outline" size={18} color={Colors.primaryLight} />
                  </Pressable>
                </>
              ) : null}

              <TextInput
                testID="message-input"
                value={text}
                onChangeText={setText}
                placeholder="Mesaj yaz..."
                placeholderTextColor={Colors.textOnDarkMuted}
                multiline
                maxLength={500}
                style={{
                  flex: 1,
                  backgroundColor: Colors.cardDark,
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: Colors.textOnDark,
                  fontSize: 15,
                  fontFamily: "DMSans_400Regular",
                  maxHeight: 120,
                }}
              />

              {text.trim() ? (
                <Pressable
                  testID="send-button"
                  onPress={handleSend}
                  disabled={isSending}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed || isSending ? 0.6 : 1,
                  })}
                >
                  <Ionicons name="send" size={18} color={Colors.white} style={{ marginLeft: 2 }} />
                </Pressable>
              ) : (
                <Pressable
                  testID="mic-button"
                  onPress={handleVoiceRecord}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="mic-outline" size={20} color={Colors.white} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {partner ? (
        <GiftPicker
          visible={showGiftPicker}
          onClose={() => setShowGiftPicker(false)}
          receiverId={partner.id}
          matchId={matchId}
        />
      ) : null}

      {partner ? (
        <EventInvitePicker
          visible={showEventInvitePicker}
          onClose={() => setShowEventInvitePicker(false)}
          receiverId={partner.id}
          matchId={matchId}
          university={myProfile?.university}
        />
      ) : null}
    </View>
  );
}
