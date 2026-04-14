import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { StoryUser } from "./types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5 seconds

interface StoryViewerProps {
  visible: boolean;
  stories: StoryUser[];
  initialUserIndex: number;
  onClose: () => void;
}

export function StoryViewer({
  visible,
  stories,
  initialUserIndex,
  onClose,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  const translateX = useSharedValue(0);

  const currentUser = stories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [visible, initialUserIndex]);

  // Progress timer
  useEffect(() => {
    if (!visible || isPaused || !currentStory) return;

    const startTime = Date.now();
    const initialProgress = progress;

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = initialProgress + (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        setProgress(0);
        goToNextStory();
      } else {
        setProgress(newProgress);
      }
    }, 16);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [visible, isPaused, currentUserIndex, currentStoryIndex, currentStory]);

  const goToNextStory = useCallback(() => {
    if (!currentUser) return;

    if (currentStoryIndex < currentUser.stories.length - 1) {
      // Next story for same user
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < stories.length - 1) {
      // Next user
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      // End of all stories
      onClose();
    }
  }, [currentUser, currentStoryIndex, currentUserIndex, stories.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story for same user
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      // Previous user
      setCurrentUserIndex((prev) => prev - 1);
      const prevUser = stories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentUserIndex, stories]);

  const goToNextUser = useCallback(() => {
    if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentUserIndex, stories.length, onClose]);

  const goToPrevUser = useCallback(() => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [currentUserIndex]);

  // Tap gesture for left/right navigation
  const handleTap = useCallback(
    (x: number) => {
      if (x < SCREEN_WIDTH / 3) {
        goToPrevStory();
      } else if (x > (SCREEN_WIDTH * 2) / 3) {
        goToNextStory();
      }
    },
    [goToPrevStory, goToNextStory]
  );

  // Horizontal swipe gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -50) {
        // Swipe left - next user
        runOnJS(goToNextUser)();
      } else if (event.translationX > 50) {
        // Swipe right - previous user
        runOnJS(goToPrevUser)();
      }
      translateX.value = withTiming(0);
    });

  const tapGesture = Gesture.Tap()
    .onStart((event) => {
      runOnJS(handleTap)(event.x);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(150)
    .onStart(() => {
      runOnJS(setIsPaused)(true);
    })
    .onEnd(() => {
      runOnJS(setIsPaused)(false);
    });

  const composedGestures = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          [-SCREEN_WIDTH * 0.3, 0, SCREEN_WIDTH * 0.3],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, SCREEN_WIDTH],
          [1, 0.9],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  if (!currentUser || !currentStory) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <GestureDetector gesture={composedGestures}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            {/* Story Image */}
            <Image
              source={{ uri: currentStory.imageUrl }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
                position: "absolute",
              }}
              resizeMode="cover"
            />

            {/* Overlay gradient */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 200,
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            />

            {/* Header */}
            <View
              style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: 12,
              }}
            >
              {/* Progress bars */}
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
                {currentUser.stories.map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      height: 2.5,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      borderRadius: 1.25,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width:
                          idx < currentStoryIndex
                            ? "100%"
                            : idx === currentStoryIndex
                            ? `${progress}%`
                            : "0%",
                        height: "100%",
                        backgroundColor: "#fff",
                        borderRadius: 1.25,
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* User info and close button */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Image
                    source={{ uri: currentUser.avatarUrl }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: "#fff",
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      {currentUser.name}
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                      }}
                    >
                      {formatTimestamp(currentStory.timestamp)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={onClose}
                  testID="close-story-button"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    padding: 8,
                  })}
                >
                  <X size={24} color="#fff" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Az once";
  if (minutes < 60) return `${minutes}dk`;
  if (hours < 24) return `${hours}sa`;
  return "1g+";
}
