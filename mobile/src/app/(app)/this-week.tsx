import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Calendar, Users, Flame, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { theme, gradients } from "@/lib/theme";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  university?: string;
  participantCount: number;
  isJoined: boolean;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function EventCard({ event, onToggleJoin }: { event: Event; onToggleJoin: (id: string, joined: boolean) => void }) {
  return (
    <View
      testID={`event-card-${event.id}`}
      style={{
        backgroundColor: theme.surface,
        borderRadius: 20,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: event.isJoined ? theme.primary : theme.borderDefault,
      }}
    >
      {/* Color accent bar */}
      <LinearGradient
        colors={event.isJoined ? [theme.primary, "#FF5E73"] : ["#1A1A2E", "#16213E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4 }}
      />

      <View style={{ padding: 18 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontFamily: "Syne_700Bold", marginBottom: 8 }}>
          {event.title}
        </Text>

        {event.description ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 14 }} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        {/* Meta row */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Calendar size={15} color={theme.textPlaceholder} />
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatEventDate(event.date)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MapPin size={15} color={theme.textPlaceholder} />
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{event.location}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Users size={15} color={theme.textPlaceholder} />
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              {event.participantCount} kişi ilgileniyor
            </Text>
          </View>
        </View>

        {/* Go Together button */}
        <Pressable
          testID={`join-event-${event.id}`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onToggleJoin(event.id, event.isJoined);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <LinearGradient
            colors={event.isJoined ? ["#374151", "#1F2937"] : [theme.primary, "#FF5E73"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Flame size={16} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {event.isJoined ? "Ayrıl" : "Birlikte Gidelim!"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function AmbassadorFAB() {
  return (
    <Pressable
      testID="create-event-fab"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/create-event" as never);
      }}
      style={({ pressed }) => ({
        position: "absolute",
        bottom: 24,
        right: 20,
        width: 58,
        height: 58,
        borderRadius: 29,
        overflow: "hidden",
        opacity: pressed ? 0.85 : 1,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 16,
        elevation: 10,
      })}
    >
      <LinearGradient
        colors={gradients.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
}

export default function ThisWeekScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Get user profile to check ambassador role (served from cache if already loaded)
  const { data: myProfile } = useQuery<Profile | null>({
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

  const isAmbassador = myProfile?.role === "ambassador" || myProfile?.role === "admin";

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const result = await api.get<Event[]>("/api/events");
      return result ?? [];
    },
  });

  const joinMutation = useMutation({
    mutationFn: ({ eventId, joined }: { eventId: string; joined: boolean }) =>
      joined
        ? api.delete(`/api/events/${eventId}/join`)
        : api.post(`/api/events/${eventId}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["events"] });
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0D12", theme.background]}
        style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 28, fontFamily: "Syne_700Bold" }}>
              Bu Hafta 🗓️
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
              Kampüsteki etkinliklere birlikte git
            </Text>
          </View>
          {/* Ambassador badge */}
          {isAmbassador ? (
            <View
              style={{
                backgroundColor: "rgba(232,68,90,0.12)",
                borderWidth: 1,
                borderColor: "rgba(232,68,90,0.3)",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "700" }}>
                Ambassador
              </Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="events-loading">
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>Etkinlikler yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + (isAmbassador ? 96 : 32),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          testID="events-list"
        >
          {!events || events.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 72 }} testID="no-events">
              <Text style={{ fontSize: 56, marginBottom: 20 }}>👀</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontFamily: "Syne_700Bold", marginBottom: 10, textAlign: "center" }}>
                Kampüsünde henüz etkinlik yok
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 24, maxWidth: 280 }}>
                Yakında burada hareket başlayacak.{"\n"}Takipte kal! 🔥
              </Text>
            </View>
          ) : (
            events.map((event: Event) => (
              <EventCard
                key={event.id}
                event={event}
                onToggleJoin={(id, joined) => joinMutation.mutate({ eventId: id, joined })}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB — only for ambassadors */}
      {isAmbassador ? <AmbassadorFAB /> : null}
    </View>
  );
}
