import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api/api";
import { Match, Profile } from "@/lib/types";
import { useSession } from "@/lib/auth/use-session";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Colors, Radius, Spacing } from "@/lib/theme";
import { UMAvatar, UMCard, TabSelector } from "@/components/ui";
import { useScreenProtection } from "@/lib/hooks/useScreenProtection";

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

function isOnline(id: string): boolean {
  const n = id.charCodeAt(id.length - 1) + id.charCodeAt(0);
  return n % 3 !== 0;
}

function OnlineDot({ size = 12 }: { size?: number }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#4CD964",
        borderWidth: 2.5,
        borderColor: Colors.bgDark,
      }}
    />
  );
}

function NewMatchCircle({ match, myUserId }: { match: Match; myUserId: string }) {
  const partner = getPartnerProfile(match, myUserId);
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
      <View style={{ position: "relative", marginBottom: 8 }}>
        <UMAvatar uri={photos[0]} size="lg" ring fallback={partner.name} />
        {online ? <OnlineDot size={14} /> : null}
      </View>
      <Text
        style={{ color: Colors.textOnDark, fontSize: 13, fontFamily: "DMSans_500Medium", textAlign: "center" }}
        numberOfLines={1}
      >
        {partner.name.split(" ")[0]}
      </Text>
    </Pressable>
  );
}

function ConversationRow({ match, myUserId }: { match: Match; myUserId: string }) {
  const partner = getPartnerProfile(match, myUserId);
  const myProfile = match.user1.userId === myUserId ? match.user1 : match.user2;
  const photos = parsePhotos(partner.photos);
  const online = isOnline(match.id);
  const lastMessage = match.messages[0];
  const isMyMessage = lastMessage?.senderId === myProfile.id;

  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { locale: tr, addSuffix: false })
    : formatDistanceToNow(new Date(match.matchedAt), { locale: tr, addSuffix: false });

  return (
    <Pressable
      onPress={() => router.push(`/(app)/chat/${match.id}`)}
      testID={`conversation-${match.id}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginHorizontal: 16, marginBottom: 10 })}
    >
      <UMCard dark>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ position: "relative", marginRight: 14 }}>
            <UMAvatar uri={photos[0]} size="md" fallback={partner.name} />
            {online ? <OnlineDot size={12} /> : null}
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_700Bold" }}>
                {partner.name}
              </Text>
              <Text style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_400Regular" }}>{timeAgo}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isMyMessage && lastMessage ? (
                <Ionicons name="checkmark-done" size={14} color={Colors.primaryLight} style={{ marginRight: 4 }} />
              ) : null}
              <Text
                style={{ color: Colors.textOnDarkMuted, fontSize: 13, fontFamily: "DMSans_400Regular", flex: 1 }}
                numberOfLines={1}
              >
                {lastMessage ? lastMessage.content : "Sohbete başla!"}
              </Text>
            </View>
          </View>
        </View>
      </UMCard>
    </Pressable>
  );
}

export default function MatchesScreen() {
  useScreenProtection();

  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";
  const [tab, setTab] = useState<"matches" | "messages">("messages");
  const [search, setSearch] = useState("");

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

  const newMatches = useMemo(() => {
    const withoutMessages = allMatches.filter((m) => m.messages.length === 0);
    return withoutMessages.length > 0 ? withoutMessages : allMatches.slice(0, 5);
  }, [allMatches]);

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
      <ConversationRow match={item} myUserId={myUserId} />
    ),
    [myUserId]
  );

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: "center", justifyContent: "center" }}
        testID="matches-loading"
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="matches-screen">
      <StatusBar barStyle="light-content" />

      {/* Title */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 14 }}>
        <Text style={{ color: Colors.textOnDark, fontSize: 32, fontFamily: "DMSerifDisplay_400Regular" }}>
          Mesajlar
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors.surfaceDark,
            borderRadius: Radius.input,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <Ionicons name="search-outline" size={18} color={Colors.textOnDarkMuted} />
          <TextInput
            placeholder="Ara..."
            placeholderTextColor={Colors.textOnDarkMuted}
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              color: Colors.textOnDark,
              fontSize: 15,
              fontFamily: "DMSans_400Regular",
              padding: 0,
            }}
            testID="search-input"
          />
        </View>
      </View>

      {/* Tab selector */}
      <View style={{ paddingHorizontal: 20, marginBottom: Spacing.xl }}>
        <TabSelector
          value={tab}
          onChange={setTab}
          options={[
            { value: "matches", label: "Eşleşmeler" },
            { value: "messages", label: "Mesajlar" },
          ]}
        />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View>
            {newMatches.length > 0 ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: Colors.textOnDark,
                    fontSize: 17,
                    fontFamily: "DMSans_700Bold",
                    paddingHorizontal: 20,
                    marginBottom: 14,
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

            {conversations.length > 0 ? (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: Colors.textOnDark,
                    fontSize: 17,
                    fontFamily: "DMSans_700Bold",
                  }}
                >
                  Sohbetler
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
                backgroundColor: Colors.cardDark,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={36} color={Colors.primaryLight} />
            </View>
            <Text
              style={{
                color: Colors.textOnDark,
                fontSize: 22,
                fontFamily: "DMSerifDisplay_400Regular",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Henüz eşleşme yok
            </Text>
            <Text
              style={{
                color: Colors.textOnDarkMuted,
                fontSize: 14,
                fontFamily: "DMSans_400Regular",
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
