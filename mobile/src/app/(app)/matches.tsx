import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api/api";
import { Match, Profile } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { tr } from "date-fns/locale";
import { theme } from "@/lib/theme";
import { Search, MoreHorizontal, Plus, CheckCheck } from "lucide-react-native";
import { StoriesRow, mockStories } from "@/components/stories";
import { useState } from "react";
import { StoryViewer } from "@/components/stories";

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

function ConversationRow({ match, myUserId }: { match: Match; myUserId: string }) {
  const partner = getPartnerProfile(match, myUserId);
  const myProfile = match.user1.userId === myUserId ? match.user1 : match.user2;
  const [c1, c2] = getProfileColor(partner.id);
  const photos = parsePhotos(partner.photos);
  const lastMessage = match.messages[0];
  const isMyMessage = lastMessage?.senderId === myProfile.id;
  const unreadCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;

  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { locale: tr, addSuffix: false })
    : formatDistanceToNow(new Date(match.matchedAt), { locale: tr, addSuffix: false });

  return (
    <Pressable
      onPress={() => router.push(`/(app)/chat/${match.id}`)}
      testID={`conversation-${match.id}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: pressed ? "rgba(0,0,0,0.02)" : "transparent",
      })}
    >
      {/* Avatar */}
      <View style={{ position: "relative", marginRight: 14 }}>
        {photos.length > 0 ? (
          <Image
            source={{ uri: photos[0] }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: theme.primary,
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
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "600" }}>
            {partner.name}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{timeAgo}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }} numberOfLines={1}>
              {lastMessage
                ? `${isMyMessage ? "" : ""}${lastMessage.content}`
                : "Sohbete başla! 👋"}
            </Text>
            {isMyMessage && lastMessage ? (
              <CheckCheck size={14} color={theme.primary} style={{ marginLeft: 4 }} />
            ) : null}
          </View>
          {unreadCount > 0 ? (
            <View
              style={{
                backgroundColor: theme.primary,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

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

  const conversations = matches ?? [];

  const handleStoryPress = useCallback((index: number) => {
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
  }, []);

  const renderConversation = useCallback(
    ({ item }: { item: Match }) => (
      <ConversationRow match={item} myUserId={myUserId} />
    ),
    [myUserId]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} testID="matches-screen">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: "700" }}>
          Sohbet
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Search size={22} color={theme.textPrimary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <MoreHorizontal size={22} color={theme.textPrimary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            {/* Story section */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "600" }}>
                  Story
                </Text>
                <MoreHorizontal size={18} color={theme.textSecondary} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {/* Add Story button */}
                <Pressable
                  style={{
                    alignItems: "center",
                    width: 68,
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 2,
                      borderColor: theme.borderDefault,
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Plus size={24} color={theme.textSecondary} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: "center" }}>
                    Ekle
                  </Text>
                </Pressable>

                {/* Stories */}
                {mockStories.map((story, index) => (
                  <Pressable
                    key={story.id}
                    onPress={() => handleStoryPress(index)}
                    style={{ alignItems: "center", width: 68 }}
                  >
                    <View
                      style={{
                        padding: 2,
                        borderRadius: 32,
                        marginBottom: 6,
                      }}
                    >
                      <LinearGradient
                        colors={story.hasUnwatched ? [theme.primary, "#FF5E73"] : ["#D1D5DB", "#9CA3AF"]}
                        style={{
                          padding: 2,
                          borderRadius: 30,
                        }}
                      >
                        <Image
                          source={{ uri: story.avatarUrl }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            borderWidth: 2,
                            borderColor: theme.background,
                          }}
                        />
                      </LinearGradient>
                    </View>
                    <Text
                      style={{ color: theme.textPrimary, fontSize: 12, textAlign: "center" }}
                      numberOfLines={1}
                    >
                      {story.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Chat section header */}
            {conversations.length > 0 ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "600" }}>
                  Chat
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 40 }}>
            <Text style={{ fontSize: 56, marginBottom: 20 }}>💬</Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 20,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Henüz mesaj yok
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center" }}>
              Eşleşmelerinden birine mesaj at ve tanışmaya başla!
            </Text>
          </View>
        }
      />

      {/* Story viewer modal */}
      <StoryViewer
        visible={storyViewerVisible}
        stories={mockStories}
        initialUserIndex={selectedStoryIndex}
        onClose={() => setStoryViewerVisible(false)}
      />
    </View>
  );
}
