import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { Audio } from "expo-av";
import { Play, Pause } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface VoiceMessagePlayerProps {
  voiceUrl: string;
  duration: number;
  isMe: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceMessagePlayer({
  voiceUrl,
  duration,
  isMe,
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const loadSound = useCallback(async () => {
    if (soundRef.current) {
      return soundRef.current;
    }

    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentPosition(0);
            } else if (status.positionMillis !== undefined) {
              setCurrentPosition(Math.floor(status.positionMillis / 1000));
            }
          }
        }
      );

      soundRef.current = sound;
      setIsLoading(false);
      return sound;
    } catch (error) {
      console.error("Failed to load sound:", error);
      setIsLoading(false);
      return null;
    }
  }, [voiceUrl]);

  const togglePlayback = useCallback(async () => {
    try {
      const sound = await loadSound();
      if (!sound) return;

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // If finished, restart from beginning
        if (status.didJustFinish || status.positionMillis >= (status.durationMillis ?? 0)) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Playback error:", error);
      setIsPlaying(false);
    }
  }, [loadSound]);

  const progress = duration > 0 ? currentPosition / duration : 0;
  const displayDuration = isPlaying ? currentPosition : duration;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minWidth: 140,
      }}
    >
      <Pressable
        onPress={togglePlayback}
        disabled={isLoading}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isMe ? "rgba(255,255,255,0.2)" : "rgba(232,68,90,0.3)",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed || isLoading ? 0.6 : 1,
        })}
        testID="voice-play-button"
      >
        {isPlaying ? (
          <Pause size={18} color="#fff" fill="#fff" />
        ) : (
          <Play size={18} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
        )}
      </Pressable>

      <View style={{ flex: 1, gap: 4 }}>
        {/* Progress bar */}
        <View
          style={{
            height: 4,
            backgroundColor: isMe ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${Math.min(progress * 100, 100)}%`,
              height: "100%",
              backgroundColor: isMe ? "#fff" : "#E8445A",
              borderRadius: 2,
            }}
          />
        </View>

        {/* Duration */}
        <Text
          style={{
            color: isMe ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.6)",
            fontSize: 11,
          }}
        >
          {formatDuration(displayDuration)}
        </Text>
      </View>
    </View>
  );
}
