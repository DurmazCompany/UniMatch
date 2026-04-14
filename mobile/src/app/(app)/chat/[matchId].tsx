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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import { Match, Message, Profile } from "@/lib/types";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, CheckCheck, Send, ChevronLeft, MoreVertical, Mic, X, Snowflake, Hand } from "lucide-react-native";
import { useVoiceRecording } from "@/lib/hooks/useVoiceRecording";
import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";

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

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  // Voice recording
  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = useVoiceRecording();
  const [isSendingVoice, setIsSendingVoice] = useState(false);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Simulate typing indicator when partner might be typing
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to show typing indicator for demo
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
    refetchInterval: 5000,
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
    mutationFn: (content: string) =>
      api.post<Message>(`/api/matches/${matchId}/messages`, { content }),
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
    sendMessage(trimmed);
  }, [text, isSending, sendMessage]);

  // Voice message handling
  const uploadVoiceAndSend = useCallback(async (uri: string, voiceDuration: number) => {
    setIsSendingVoice(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

      // Create form data for upload
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "voice.m4a",
      } as unknown as Blob);

      // Upload voice file
      const uploadResponse = await fetch(`${baseUrl}/api/uploads/voice`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Voice upload failed");
      }

      const uploadResult = await uploadResponse.json();
      const voiceUrl = uploadResult.data?.url;

      if (!voiceUrl) {
        throw new Error("No voice URL returned");
      }

      // Send voice message
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
  }, [matchId, queryClient]);

  const handleVoiceRecord = useCallback(async () => {
    if (isRecording) {
      // Stop and send
      const uri = await stopRecording();
      if (uri && duration > 0) {
        await uploadVoiceAndSend(uri, duration);
      }
    } else {
      // Start recording
      await startRecording();
    }
  }, [isRecording, duration, stopRecording, startRecording, uploadVoiceAndSend]);

  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [cancelRecording]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message | { type: "separator"; date: string }; index: number }) => {
      // Date separator
      if ("type" in item && item.type === "separator") {
        return (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
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

      // Now item is definitely a Message
      const msg = item as Message;
      const isMe = msg.senderId === myProfile?.id;
      const nextItem = messagesWithSeparators[index + 1];
      const isLastInGroup = index === messagesWithSeparators.length - 1 ||
        (nextItem && "type" in nextItem) ||
        (nextItem && !("type" in nextItem) && nextItem.senderId !== msg.senderId);

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
                {isMe ? (
                  <CheckCheck size={14} color="#4CD964" />
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [myProfile, partner, partnerPhotos, pc1, pc2, messagesWithSeparators]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8F8" }} testID="chat-screen">
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
          <ActivityIndicator color="#E8445A" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messagesWithSeparators}
          renderItem={renderMessage}
          keyExtractor={(item, index) => "type" in item ? `sep-${index}` : item.id}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 8 }}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            match && !match.iceBreakerAccepted ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  backgroundColor: "rgba(124,58,237,0.1)",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(124,58,237,0.25)",
                }}
              >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Snowflake size={12} color="#FF5E73" />
                  <Text style={{ color: "#FF5E73", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
                    BASLATICI SORU
                  </Text>
                </View>
                <Text style={{ color: "#F9FAFB", fontSize: 15, lineHeight: 22 }}>
                  {match.iceBreakerQuestion}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                İlk mesajı sen gönder! 👋
              </Text>
            </View>
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
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: insets.bottom + 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.06)",
            backgroundColor: "#FFFFFF",
            gap: 10,
          }}
        >
          {isRecording ? (
            // Recording UI
            <>
              <Pressable
                testID="cancel-recording-button"
                onPress={handleCancelRecording}
                style={({ pressed }) => ({
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "#3A3A3C",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <X size={22} color="#fff" />
              </Pressable>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#1C1C1E",
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#E8445A",
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#E8445A",
                  }}
                />
                <Text style={{ color: "#E8445A", fontSize: 16, fontWeight: "600" }}>
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
                </Text>
                <Text style={{ color: "#8E8E93", fontSize: 14 }}>
                  Kayit ediliyor...
                </Text>
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
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSendingVoice ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={20} color="#fff" style={{ marginLeft: 2 }} />
                  )}
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            // Normal input UI
            <>
              <TextInput
                testID="message-input"
                value={text}
                onChangeText={setText}
                placeholder="Mesaj yaz..."
                placeholderTextColor="#48484A"
                multiline
                maxLength={500}
                style={{
                  flex: 1,
                  backgroundColor: "#1C1C1E",
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  color: "#fff",
                  fontSize: 16,
                  maxHeight: 120,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
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
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={20} color="#fff" style={{ marginLeft: 2 }} />
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
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Mic size={22} color="#fff" />
                  </LinearGradient>
                </Pressable>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
