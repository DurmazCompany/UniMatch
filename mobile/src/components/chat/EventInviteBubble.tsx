import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "@/lib/theme";
import { EventInvitation } from "@/lib/types";
import { useRespondToInvitation } from "@/lib/hooks/useEvents";

interface Props {
  invitation: EventInvitation;
  isMine: boolean;
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

export function EventInviteBubble({ invitation, isMine }: Props) {
  const respond = useRespondToInvitation();
  const event = invitation.event;

  const handleRespond = async (status: "accepted" | "declined") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await respond.mutateAsync({
        eventId: invitation.eventId,
        invId: invitation.id,
        status,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View
      style={{ alignItems: "center", marginVertical: Spacing.md, alignSelf: "stretch" }}
      testID={`event-invite-bubble-${invitation.id}`}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 2, borderRadius: Radius.card, maxWidth: "85%" }}
      >
        <View
          style={{
            backgroundColor: Colors.cardDark,
            borderRadius: Radius.card - 2,
            paddingVertical: 16,
            paddingHorizontal: 20,
            alignItems: "center",
            gap: 6,
            minWidth: 240,
          }}
        >
          <Ionicons name="calendar-outline" size={28} color={Colors.white} />
          <Text
            style={{ color: Colors.white, fontSize: 12, fontFamily: "DMSans_700Bold", letterSpacing: 0.5 }}
          >
            ETKİNLİK DAVETİ
          </Text>
          <Text
            style={{
              color: Colors.white,
              fontSize: 16,
              fontFamily: "DMSans_700Bold",
              textAlign: "center",
            }}
          >
            {event?.title ?? "Etkinlik"}
          </Text>
          {event ? (
            <Text
              style={{
                color: Colors.textOnDarkMuted,
                fontSize: 12,
                fontFamily: "DMSans_400Regular",
                textAlign: "center",
              }}
            >
              {formatEventDate(event.date)} · {event.location}
            </Text>
          ) : null}

          {invitation.status === "pending" && !isMine ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10, alignSelf: "stretch" }}>
              <Pressable
                onPress={() => handleRespond("declined")}
                disabled={respond.isPending}
                testID={`event-invite-decline-${invitation.id}`}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: Radius.pill,
                  paddingVertical: 10,
                  alignItems: "center",
                  opacity: pressed || respond.isPending ? 0.7 : 1,
                })}
              >
                <Text style={{ color: Colors.white, fontSize: 13, fontFamily: "DMSans_600SemiBold" }}>
                  Reddet
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleRespond("accepted")}
                disabled={respond.isPending}
                testID={`event-invite-accept-${invitation.id}`}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: Colors.primary,
                  borderRadius: Radius.pill,
                  paddingVertical: 10,
                  alignItems: "center",
                  opacity: pressed || respond.isPending ? 0.7 : 1,
                })}
              >
                <Text style={{ color: Colors.white, fontSize: 13, fontFamily: "DMSans_700Bold" }}>
                  Kabul Et
                </Text>
              </Pressable>
            </View>
          ) : invitation.status === "pending" && isMine ? (
            <Text
              style={{
                color: Colors.textOnDarkMuted,
                fontSize: 12,
                fontFamily: "DMSans_400Regular",
                marginTop: 8,
              }}
            >
              Bekleniyor...
            </Text>
          ) : invitation.status === "accepted" ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
            >
              <Ionicons name="checkmark-circle" size={16} color={Colors.coral} />
              <Text style={{ color: Colors.coral, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
                Kabul edildi
              </Text>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textOnDarkMuted} />
              <Text
                style={{ color: Colors.textOnDarkMuted, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}
              >
                Reddedildi
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
