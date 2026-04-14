import { View, Text, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/lib/theme";

interface StoryCircleProps {
  id: string;
  name: string;
  avatarUrl: string;
  hasUnwatched: boolean;
  onPress: () => void;
  isOwn?: boolean;
}

export function StoryCircle({
  id,
  name,
  avatarUrl,
  hasUnwatched,
  onPress,
  isOwn = false,
}: StoryCircleProps) {
  const gradientColors = hasUnwatched
    ? (["#E8445A", "#FF5E73", "#E8445A"] as const)
    : (["#3A3A3C", "#3A3A3C", "#3A3A3C"] as const);

  return (
    <Pressable
      onPress={onPress}
      testID={`story-circle-${id}`}
      style={({ pressed }) => ({
        alignItems: "center",
        opacity: pressed ? 0.8 : 1,
        marginHorizontal: 6,
      })}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          padding: 2.5,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 63,
            height: 63,
            borderRadius: 31.5,
            backgroundColor: theme.background,
            padding: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: 59,
              height: 59,
              borderRadius: 29.5,
            }}
          />
        </View>
      </LinearGradient>

      {isOwn === true && hasUnwatched === false ? (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 0,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: theme.background,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>+</Text>
        </View>
      ) : null}

      <Text
        numberOfLines={1}
        style={{
          color: theme.textPrimary,
          fontSize: 11,
          fontWeight: "500",
          marginTop: 6,
          maxWidth: 68,
          textAlign: "center",
        }}
      >
        {isOwn ? "Hikayem" : name}
      </Text>
    </Pressable>
  );
}
