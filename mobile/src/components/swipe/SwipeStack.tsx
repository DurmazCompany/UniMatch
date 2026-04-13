import { View, Dimensions } from "react-native";
import { SwipeCard } from "./SwipeCard";
import { Profile } from "@/lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

interface SwipeStackProps {
  profiles: Profile[];
  onSwipe: (profileId: string, direction: "like" | "pass" | "super") => void;
}

export function SwipeStack({ profiles, onSwipe }: SwipeStackProps) {
  const visible = profiles.slice(0, 3);

  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[...visible].reverse().map((profile, reversedIndex) => {
        const index = visible.length - 1 - reversedIndex;
        return (
          <SwipeCard
            key={profile.id}
            profile={profile}
            isTop={index === 0}
            index={index}
            onSwipe={(direction) => onSwipe(profile.id, direction)}
          />
        );
      })}
    </View>
  );
}
