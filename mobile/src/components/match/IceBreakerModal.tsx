import { View, Text, Modal, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Match } from "@/lib/types";

interface IceBreakerModalProps {
  match: Match | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export function IceBreakerModal({ match, onAccept, onDismiss }: IceBreakerModalProps) {
  if (!match) return null;

  return (
    <Modal transparent animationType="slide" visible={!!match} testID="icebreaker-modal">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,10,15,0.85)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 28,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text
            style={{
              color: "#F9FAFB",
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            🧊 Buz Kırıcı
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 20 }}>
            Bu soruyla konuşmaya başlayın!
          </Text>

          <View
            style={{
              backgroundColor: "rgba(124,58,237,0.1)",
              borderWidth: 1,
              borderColor: "rgba(124,58,237,0.3)",
              borderRadius: 14,
              padding: 18,
              marginBottom: 28,
            }}
          >
            <Text style={{ color: "#F9FAFB", fontSize: 17, lineHeight: 26 }}>
              {match.iceBreakerQuestion}
            </Text>
          </View>

          <Pressable
            onPress={onAccept}
            testID="icebreaker-accept-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginBottom: 12 })}
          >
            <LinearGradient
              colors={["#E8445A", "#FF5E73"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Bu soruyla başla
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            testID="icebreaker-dismiss-button"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: "center" })}
          >
            <Text style={{ color: "#6B7280", fontSize: 15, paddingVertical: 8 }}>Atla</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
