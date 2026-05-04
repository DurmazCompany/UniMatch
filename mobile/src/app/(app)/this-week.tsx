import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Colors, Radius } from "@/lib/theme";
import { UMCard, UMTag, UMButton } from "@/components/ui";
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
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function EventCard({ event, onToggleJoin }: { event: Event; onToggleJoin: (id: string, joined: boolean) => void }) {
  return (
    <UMCard
      style={{
        marginBottom: 12,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <UMTag variant="purple" label={formatEventDate(event.date)} />
          <UMTag variant="blue" label={formatEventTime(event.date)} />
        </View>

        <Text style={{ color: Colors.textDark, fontSize: 18, fontFamily: "DMSans_700Bold" }}>
          {event.title}
        </Text>

        {event.description ? (
          <Text style={{ color: Colors.textMuted, fontSize: 14, lineHeight: 20, fontFamily: "DMSans_400Regular" }} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular" }}>
            {event.location}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="people-outline" size={14} color={Colors.primary} />
            <Text style={{ color: Colors.primary, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
              +{event.participantCount} katılıyor
            </Text>
          </View>
          <Pressable
            testID={`join-event-${event.id}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onToggleJoin(event.id, event.isJoined);
            }}
            style={({ pressed }) => ({
              backgroundColor: event.isJoined ? Colors.textDark : Colors.primary,
              borderRadius: Radius.pill,
              paddingHorizontal: 18,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: Colors.white, fontSize: 14, fontFamily: "DMSans_700Bold" }}>
              {event.isJoined ? "Ayrıl" : "Katıl"}
            </Text>
          </Pressable>
        </View>
      </View>
    </UMCard>
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
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.85 : 1,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 10,
      })}
    >
      <Ionicons name="add-outline" size={28} color="#fff" />
    </Pressable>
  );
}

export default function ThisWeekScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: Colors.textDark, fontSize: 32, fontFamily: "DMSerifDisplay_400Regular" }}>
              Bu Hafta
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 2, fontFamily: "DMSans_400Regular" }}>
              Kampüsteki etkinliklere birlikte git
            </Text>
          </View>
          {isAmbassador ? <UMTag variant="purple" label="Ambassador" /> : null}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} testID="events-loading">
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 14, fontFamily: "DMSans_400Regular" }}>
            Etkinlikler yükleniyor...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + (isAmbassador ? 96 : 32),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          testID="events-list"
        >
          {!events || events.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 72 }} testID="no-events">
              <Text style={{ fontSize: 56, marginBottom: 20 }}>📅</Text>
              <Text style={{ color: Colors.textDark, fontSize: 22, fontFamily: "DMSerifDisplay_400Regular", marginBottom: 10, textAlign: "center" }}>
                Kampüsünde henüz etkinlik yok
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 280, fontFamily: "DMSans_400Regular" }}>
                Yakında burada hareket başlayacak. Takipte kal!
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

      {isAmbassador ? <AmbassadorFAB /> : null}
    </View>
  );
}
