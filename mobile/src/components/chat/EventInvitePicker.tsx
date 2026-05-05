import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, Radius } from "@/lib/theme";
import { useEvents, useInviteToEvent } from "@/lib/hooks/useEvents";
import { EventModel } from "@/lib/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  matchId: string;
  university?: string;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

export function EventInvitePicker({ visible, onClose, receiverId, matchId, university }: Props) {
  const { data: events, isLoading } = useEvents(university);
  const invite = useInviteToEvent();
  const qc = useQueryClient();

  const upcoming = (events ?? []).filter(
    (e) => new Date(e.date).getTime() >= Date.now()
  );

  const handleInvite = async (event: EventModel) => {
    try {
      await invite.mutateAsync({
        eventId: event.id,
        receiverId,
        matchId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["event-invitations", matchId] });
      onClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        testID="event-invite-picker-backdrop"
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: Colors.surfaceDark,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: Spacing.xl,
            paddingBottom: Spacing.xxxl,
            maxHeight: "80%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 2,
              marginBottom: Spacing.lg,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: Spacing.lg,
            }}
          >
            <Text style={{ color: Colors.textOnDark, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
              Etkinliğe Davet Et
            </Text>
            <Pressable onPress={onClose} testID="event-invite-picker-close">
              <Ionicons name="close-outline" size={24} color={Colors.textOnDark} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : upcoming.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textOnDarkMuted} />
              <Text
                style={{ color: Colors.textOnDarkMuted, fontSize: 14, fontFamily: "DMSans_400Regular" }}
              >
                Şu anda yaklaşan etkinlik yok
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 480 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {upcoming.map((event) => (
                <View
                  key={event.id}
                  testID={`event-invite-card-${event.id}`}
                  style={{
                    backgroundColor: Colors.cardDark,
                    borderRadius: Radius.card,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(124,111,247,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="calendar-outline" size={22} color={Colors.primaryLight} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{ color: Colors.textOnDark, fontSize: 15, fontFamily: "DMSans_700Bold" }}
                      numberOfLines={1}
                    >
                      {event.title}
                    </Text>
                    <Text
                      style={{
                        color: Colors.textOnDarkMuted,
                        fontSize: 12,
                        fontFamily: "DMSans_400Regular",
                      }}
                      numberOfLines={1}
                    >
                      {formatEventDate(event.date)} · {event.location}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleInvite(event)}
                    disabled={invite.isPending}
                    testID={`event-invite-send-${event.id}`}
                    style={({ pressed }) => ({
                      backgroundColor: Colors.primary,
                      borderRadius: Radius.pill,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      opacity: pressed || invite.isPending ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: Colors.white, fontSize: 13, fontFamily: "DMSans_700Bold" }}>
                      Davet Et
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
