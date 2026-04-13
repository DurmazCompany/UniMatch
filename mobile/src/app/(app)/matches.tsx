import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
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
import { theme, gradients } from "@/lib/theme";

function getProfileColor(id: string): [string, string] {
  const colors: [string, string][] = [
    [theme.primary, theme.accent],
    ["#059669", "#34D399"],
    ["#DC2626", "#F87171"],
    ["#D97706", "#FCD34D"],
    ["#2563EB", "#60A5FA"],
    ["#DB2777", "#F472B6"],
  ];
  const idx = id.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getPartnerProfile(match: Match, myUserId: string): Profile {
  return match.user1.userId === myUserId ? match.user2 : match.user1;
}

function NewMatchAvatar({ match, myUserId }: { match: Match; myUserId: string }) {
  const partner = getPartnerProfile(match, myUserId);
  const [c1, c2] = getProfileColor(partner.id);
  const hoursLeft = differenceInHours(new Date(match.expiresAt), new Date());
  const isExpiring = hoursLeft < 12;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/chat/${match.id}`)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: "center", width: 80, marginRight: 12 })}
    >
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[c1, c2]}
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: c1,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700" }}>
            {partner.name[0]?.toUpperCase()}
          </Text>
        </LinearGradient>
        {isExpiring ? (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: hoursLeft < 6 ? theme.error : theme.warning,
              borderWidth: 2,
              borderColor: theme.background,
            }}
          />
        ) : null}
      </View>
      <Text
        style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "600", marginTop: 6, textAlign: "center" }}
        numberOfLines={1}
      >
        {partner.name}
      </Text>
      <Text style={{ color: theme.accent, fontSize: 11, marginTop: 2 }}>%{match.compatibilityScore}</Text>
    </Pressable>
  );
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const myUserId = session?.user?.id ?? "";

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

  const newMatches = matches?.filter((m) => m.messages.length === 0) ?? [];
  const conversations = matches?.filter((m) => m.messages.length > 0) ?? [];

  const ListHeader = useCallback(() => (
    <View>
      {/* Page header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 24, fontFamily: "Syne_700Bold" }}>Eşleşmeler</Text>
        {matches && matches.length > 0 ? (
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
            {matches.length} aktif eşleşme
          </Text>
        ) : null}
      </View>

      {/* New matches horizontal row — FlatList inside a header is fine (outer is a FlatList not ScrollView) */}
      {newMatches.length > 0 ? (
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
              paddingHorizontal: 20,
              marginBottom: 14,
            }}
          >
            Yeni Eşleşmeler
          </Text>
          {/* Plain horizontal ScrollView — no nested VirtualizedList warning */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {newMatches.map((item) => (
              <NewMatchAvatar key={item.id} match={item} myUserId={myUserId} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {conversations.length > 0 ? (
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 1,
            textTransform: "uppercase",
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          Mesajlar
        </Text>
      ) : null}
    </View>
  ), [insets.top, matches, newMatches, myUserId, conversations.length]);

  const renderMatchCard = useCallback(
    ({ item }: { item: Match }) => {
      const partner = getPartnerProfile(item, myUserId);
      const photos = (() => {
        try { return JSON.parse(partner.photos) as string[]; } catch { return []; }
      })();
      const age = Math.floor((Date.now() - new Date(partner.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      return (
        <Pressable
          onPress={() => router.push(`/(app)/chat/${item.id}`)}
          style={({ pressed }) => ({
            width: (Dimensions.get("window").width - 50) / 2,
            height: 240,
            borderRadius: 14,
            overflow: "hidden",
            margin: 5,
            opacity: pressed ? 0.9 : 1,
            backgroundColor: "#1A1A1A",
          })}
        >
          {photos.length > 0 ? (
            <Animated.Image
              source={{ uri: photos[0] }}
              style={{ position: "absolute", width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ position: "absolute", width: "100%", height: "100%", backgroundColor: "#222" }} />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" }}
          />

          {/* Match Badge */}
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "#E8445A",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              %{item.compatibilityScore}
            </Text>
          </View>

          {/* Info */}
          <View style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
                {partner.name}, {age}
              </Text>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CD964" }} />
            </View>
            <Text style={{ color: "#CCCCCC", fontSize: 13 }} numberOfLines={1}>
              {partner.university?.split(" ")[0] ?? "Kampüs"}
            </Text>
          </View>
        </Pressable>
      );
    },
    [myUserId]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8445A" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0D0D" }} testID="matches-screen">
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>Eşleşmeler</Text>
      </View>

      <FlatList
        data={matches}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 20 }}>❤️</Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
              Henüz eşleşme yok
            </Text>
          </View>
        }
      />
    </View>
  );
}

