import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api/api";
import { Match, Profile } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { theme, useTheme } from "@/lib/theme";
import { Search, SlidersHorizontal, CheckCheck } from "lucide-react-native";
import { useScreenProtection } from "@/lib/hooks/useScreenProtection";

function getProfileColor(id: string): [string, string] {
  const colors: [string, string][] = [
    [theme.primary, "#FF5E73"],
    ["#059669", "#34D399"],
    ["#3B82F6", "#60A5FA"],
    ["#D97706", "#FCD34D"],
    ["#8B5CF6", "#A78BFA"],
    ["#DB2777", "#F472B6"],
  ];
  const idx = id.charCodeAt(0) % colors.length;
  return colors[idx];
}

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

// Seeded random for stable online status per match id
function isOnline(id: string): boolean {
  const n = id.charCodeAt(id.length - 1) + id.charCodeAt(0);
  return n % 3 !== 0;
}

function OnlineDot({ size = 12, borderWidth = 2 }: { size?: number; borderWidth?: number }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.online,
        borderWidth,
        borderColor: theme.background,
      }}
    />
  );
}

// Circular match card for "Yeni Eşleşmeler" horizontal row
function NewMatchCircle({ match, myUserId }: { match: Match; myUserId: string }) {
  const partner = getPartnerProfile(match, myUserId);
  const [c1, c2] = getProfileColor(partner.id);
  const photos = parsePhotos(partner.photos);
  const online = isOnline(match.id);

  return (
    <Pressable
      onPress={() => router.push(`/(app)/chat/${match.id}`)}
      testID={`new-match-${match.id}`}
      style={({ pressed }) => ({
        alignItems: "center",
        width: 76,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {/* Pink gradient ring */}
      <View style={{ position: "relative", marginBottom: 6 }}>
        <LinearGradient
          colors={[theme.primary, "#FF5E73", "#FF8C94"]}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            alignItems: "center",
            justifyContent: "center",
            padding: 2.5,
          }}
        >
          {photos.length > 0 ? (
            <Image
              source={{ uri: photos[0] }}
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                borderWidth: 2,
                borderColor: theme.background,
              }}
            />
          ) : (
            <LinearGradient
              colors={[c1, c2]}
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: theme.background,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>
                {partner.name[0]?.toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </LinearGradient>

        {online ? <OnlineDot size={13} borderWidth={2} /> : null}
      </View>

      <Text
        style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "500", textAlign: "center" }}
        numberOfLines={1}
      >
        {partner.name.split(" ")[0]}
      </Text>
    </Pressable>
  );
}

// Conversation row for "Mesajlar" vertical list
function ConversationRow({ match, myUserId, onExtend }: { match: Match; myUserId: string; onExtend?: (matchId: string) => void }) {
  const partner = getPartnerProfile(match, myUserId);
  const myProfile = match.user1.userId === myUserId ? match.user1 : match.user2;
  const [c1, c2] = getProfileColor(partner.id);
  const photos = parsePhotos(partner.photos);
  const online = isOnline(match.id);
  const lastMessage = match.messages[0];
  const isMyMessage = lastMessage?.senderId === myProfile.id;

  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { locale: tr, addSuffix: false })
    : formatDistanceToNow(new Date(match.matchedAt), { locale: tr, addSuffix: false });

  const isExpiringSoon = match.expiresAt && (new Date(match.expiresAt).getTime() - Date.now()) < 6 * 60 * 60 * 1000;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/chat/${match.id}`)}
      testID={`conversation-${match.id}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: pressed ? "rgba(255,255,255,0.03)" : "transparent",
      })}
    >
      {/* Avatar with online dot */}
      <View style={{ position: "relative", marginRight: 14 }}>
        {photos.length > 0 ? (
          <Image
            source={{ uri: photos[0] }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
            }}
          />
        ) : (
          <LinearGradient
            colors={[c1, c2]}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
              {partner.name[0]?.toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {online ? <OnlineDot size={14} borderWidth={2} /> : null}
      </View>

      {/* Text content */}
      <View style={{ flex: 1 }}>
        {/* Name + time */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>
            {partner.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {isExpiringSoon && onExtend ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onExtend(match.id);
                }}
                testID={`extend-match-${match.id}`}
                style={{
                  backgroundColor: "rgba(212,83,126,0.1)",
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: "rgba(212,83,126,0.3)",
                }}
              >
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>+5 Gün</Text>
              </Pressable>
            ) : null}
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{timeAgo}</Text>
          </View>
        </View>

        {/* Last message + read receipt */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {isMyMessage && lastMessage ? (
            <CheckCheck size={14} color={theme.primary} style={{ marginRight: 4 }} />
          ) : null}
          <Text
            style={{ color: theme.textSecondary, fontSize: 13, flex: 1 }}
            numberOfLines={1}
          >
            {lastMessage ? lastMessage.content : "Sohbete başla!"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MatchesScreen() {
  // 🔒 Match fotoğrafları ve eşleşme anını koru
  useScreenProtection();

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";
  const queryClient = useQueryClient();

  const extendMutation = useMutation({
    mutationFn: (matchId: string) => api.post(`/api/matches/${matchId}/extend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      if (err?.code === "PREMIUM_REQUIRED") {
        router.push("/paywall");
      }
    },
  });
  const handleExtendMatch = (matchId: string) => extendMutation.mutate(matchId);

  const { data: matches, isLoading } = useQuery<Match[] | null>({
    queryKey: ["matches"],
    queryFn: async () => {
      try {
        const result = await api.get<Match[]>("/api/matches");
        return result ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const allMatches = matches ?? [];

  // "Yeni Eşleşmeler" = matches with no messages (or all if everything has messages)
  const newMatches = useMemo(() => {
    const withoutMessages = allMatches.filter((m) => m.messages.length === 0);
    return withoutMessages.length > 0 ? withoutMessages : allMatches.slice(0, 5);
  }, [allMatches]);

  // "Mesajlar" = all matches sorted by last message time desc
  const conversations = useMemo(() => {
    return [...allMatches].sort((a, b) => {
      const aTime = a.messages[0]
        ? new Date(a.messages[0].createdAt).getTime()
        : new Date(a.matchedAt).getTime();
      const bTime = b.messages[0]
        ? new Date(b.messages[0].createdAt).getTime()
        : new Date(b.matchedAt).getTime();
      return bTime - aTime;
    });
  }, [allMatches]);

  const renderConversation = useCallback(
    ({ item }: { item: Match }) => (
      <ConversationRow match={item} myUserId={myUserId} onExtend={handleExtendMatch} />
    ),
    [myUserId, handleExtendMatch]
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
        testID="matches-loading"
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="matches-screen">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
          UniMatch
        </Text>
        <Pressable
          testID="filter-button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <SlidersHorizontal size={18} color={theme.textPrimary} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.surface,
            borderRadius: 24,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Search size={16} color={theme.textSecondary} />
          <TextInput
            placeholder="Ara..."
            placeholderTextColor={theme.textSecondary}
            editable={false}
            style={{
              flex: 1,
              color: theme.textPrimary,
              fontSize: 15,
              padding: 0,
            }}
            testID="search-input"
          />
        </View>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View>
            {/* Yeni Eşleşmeler section */}
            {newMatches.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 17,
                    fontWeight: "700",
                    paddingHorizontal: 20,
                    marginBottom: 14,
                    letterSpacing: -0.3,
                  }}
                >
                  Yeni Eşleşmeler
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                >
                  {newMatches.map((match) => (
                    <NewMatchCircle key={match.id} match={match} myUserId={myUserId} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Mesajlar section header */}
            {conversations.length > 0 ? (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 17,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                  }}
                >
                  Mesajlar
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingTop: 60,
              paddingHorizontal: 40,
            }}
            testID="matches-empty"
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.surface,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 36 }}>💬</Text>
            </View>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Henüz eşleşme yok
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Beğendiklerini keşfet ve yeni insanlarla tanış!
            </Text>
          </View>
        }
      />
    </View>
  );
}
