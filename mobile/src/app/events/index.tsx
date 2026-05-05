import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing, Typography } from "@/lib/theme";
import { UMCard, UMTag, TabSelector } from "@/components/ui";
import { useEvents } from "@/lib/hooks/useEvents";
import { api } from "@/lib/api/api";
import { Profile } from "@/lib/types";

type Filter = "all" | "this-week" | "upcoming";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "this-week", label: "Bu Hafta" },
  { value: "upcoming", label: "Yaklaşan" },
  { value: "all", label: "Tümü" },
];

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("this-week");
  const { data: events, isLoading } = useEvents();

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        return (await api.get<Profile>("/api/profile")) ?? null;
      } catch {
        return null;
      }
    },
  });

  const isAmbassador =
    profile?.role === "ambassador" || profile?.role === "admin";

  const filtered = useMemo(() => {
    if (!events) return [];
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    return events.filter((e) => {
      const t = new Date(e.date).getTime();
      if (filter === "all") return true;
      if (filter === "this-week") return t >= now && t <= weekAhead;
      return t >= now;
    });
  }, [events, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} testID="events-screen">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="back-button"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
          })}
        >
          <Ionicons name="chevron-back-outline" size={22} color={Colors.textDark} />
        </Pressable>
        <Text style={[Typography.h2, { flex: 1 }]}>Etkinlikler</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: Spacing.md }}>
        <TabSelector value={filter} onChange={setFilter} options={FILTERS} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 96,
          }}
        >
          {filtered.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 60,
                paddingHorizontal: 32,
                gap: 12,
              }}
              testID="events-empty"
            >
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.bodyBold, { textAlign: "center" }]}>
                Henüz etkinlik yok
              </Text>
              <Text style={[Typography.body, { textAlign: "center" }]}>
                Yakında yeni etkinlikler burada görünecek.
              </Text>
            </View>
          ) : (
            filtered.map((event) => {
              const cap = event.capacity ?? event.maxAttendees ?? null;
              const sold = event.ticketsSold ?? 0;
              return (
                <UMCard
                  key={event.id}
                  style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}
                >
                  {event.coverUrl ? (
                    <Image
                      source={{ uri: event.coverUrl }}
                      style={{
                        width: "100%",
                        height: 160,
                        borderTopLeftRadius: Radius.card,
                        borderTopRightRadius: Radius.card,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: 120,
                        backgroundColor: Colors.primaryPale,
                        borderTopLeftRadius: Radius.card,
                        borderTopRightRadius: Radius.card,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={36}
                        color={Colors.primary}
                      />
                    </View>
                  )}
                  <View style={{ padding: Spacing.lg, gap: 8 }}>
                    <UMTag
                      variant="purple"
                      label={formatEventDate(event.date)}
                    />
                    <Text style={[Typography.bodyBold, { fontSize: 16 }]}>
                      {event.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={Colors.textMuted}
                      />
                      <Text style={Typography.caption}>{event.location}</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <Text style={Typography.caption}>
                        {cap ? `${sold} / ${cap} kişi` : `${sold} kişi`}
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={20}
                        color={Colors.textMuted}
                      />
                    </View>
                  </View>
                </UMCard>
              );
            })
          )}
        </ScrollView>
      )}

      {isAmbassador ? (
        <View
          style={{
            position: "absolute",
            right: 16,
            bottom: insets.bottom + 16,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Pressable
            onPress={() => router.push("/events/create")}
            testID="create-event-fab"
            style={({ pressed }) => ({
              backgroundColor: Colors.primary,
              borderRadius: Radius.pill,
              paddingHorizontal: 20,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text
              style={{
                color: Colors.white,
                fontFamily: "DMSans_700Bold",
                fontSize: 15,
              }}
            >
              Etkinlik Oluştur
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
