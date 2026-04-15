import { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import { SwipeCard, SwipeCardRef } from "./SwipeCard";
import { Profile } from "@/lib/types";

export interface SwipeStackRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  swipeUp: () => void;
}

interface SwipeStackProps {
  profiles: Profile[];
  onSwipe: (profileId: string, direction: "like" | "pass" | "super") => void;
}

export const SwipeStack = forwardRef<SwipeStackRef, SwipeStackProps>(
  function SwipeStack({ profiles, onSwipe }, ref) {
    const topCardRef = useRef<SwipeCardRef>(null);
    const visible = profiles.slice(0, 3);

    useImperativeHandle(ref, () => ({
      swipeLeft: () => topCardRef.current?.swipeLeft(),
      swipeRight: () => topCardRef.current?.swipeRight(),
      swipeUp: () => topCardRef.current?.swipeUp(),
    }));

    return (
      <View style={{ flex: 1, position: "relative" }}>
        {[...visible].reverse().map((profile, reversedIndex) => {
          const index = visible.length - 1 - reversedIndex;
          return (
            <SwipeCard
              key={profile.id}
              ref={index === 0 ? topCardRef : null}
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
);
