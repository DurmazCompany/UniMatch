import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { useSession } from "@/lib/auth/use-session";
import { Match, Message, Profile } from "@/lib/types";

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

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
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

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = item.senderId === myProfile?.id;
      return (
        <View
          style={{
            flexDirection: "row",
            justifyContent: isMe ? "flex-end" : "flex-start",
            marginBottom: 8,
            paddingHorizontal: 16,
          }}
        >
          {!isMe ? (
            <LinearGradient
              colors={[pc1, pc2]}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
                alignSelf: "flex-end",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {partner?.name[0]?.toUpperCase()}
              </Text>
            </LinearGradient>
          ) : null}
          <View
            style={{
              maxWidth: "72%",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              borderBottomRightRadius: isMe ? 4 : 18,
              borderBottomLeftRadius: isMe ? 18 : 4,
              backgroundColor: isMe ? "#E8445A" : "#2C2C2E",
              borderWidth: 0,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, lineHeight: 22 }}>
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    [myProfile, partner]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0D0D" }} testID="chat-screen">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
          backgroundColor: "#0D0D0D",
        }}
      >
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginRight: 12 })}
        >
          <Text style={{ color: "#E8445A", fontSize: 18, fontWeight: "600" }}>←</Text>
        </Pressable>
        {partner ? (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 14,
              backgroundColor: "#222",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
              {partner.name[0]?.toUpperCase()}
            </Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {partner?.name ?? "..."}
            </Text>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CD964" }} />
          </View>
          {match ? (
            <Text style={{ color: "#8E8E93", fontSize: 11 }}>
              Online
            </Text>
          ) : null}
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#E8445A" />
        </View>
      ) : (
        <FlatList<Message>
          ref={flatListRef}
          data={(messages ?? []) as Message[]}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
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
                <Text style={{ color: "#FF5E73", fontSize: 12, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 }}>
                  🧊 BAŞLATICİ SORU
                </Text>
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
            borderTopColor: "rgba(255,255,255,0.06)",
            backgroundColor: "#0D0D0D",
            gap: 10,
          }}
        >
          <TextInput
            testID="message-input"
            value={text}
            onChangeText={setText}
            placeholder="Mesaj gönder..."
            placeholderTextColor="#48484A"
            multiline
            maxLength={500}
            style={{
              flex: 1,
              backgroundColor: "#1E1E1E",
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: "#fff",
              fontSize: 15,
              maxHeight: 120,
            }}
          />
          <Pressable
            testID="send-button"
            onPress={handleSend}
            disabled={!text.trim() || isSending}
            style={({ pressed }) => ({ opacity: pressed || !text.trim() ? 0.5 : 1 })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#E8445A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 20 }}>↑</Text>
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
