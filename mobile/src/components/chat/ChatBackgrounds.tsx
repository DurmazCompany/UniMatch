import { View, Dimensions } from "react-native";
import Svg, { Defs, Pattern, Rect, Circle, Path, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/lib/theme";

export type ChatBgId = "default" | "stars" | "hearts" | "waves" | "campus";

export const BG_OPTIONS: { id: ChatBgId; label: string; emoji: string }[] = [
  { id: "default", label: "Varsayılan", emoji: "⚫" },
  { id: "stars", label: "Yıldızlar", emoji: "✨" },
  { id: "hearts", label: "Kalpler", emoji: "💕" },
  { id: "waves", label: "Dalgalar", emoji: "🌊" },
  { id: "campus", label: "Kampüs", emoji: "🎓" },
];

const FILL = "rgba(255,255,255,0.06)";

export function ChatBackground({ id }: { id: ChatBgId }) {
  const { width, height } = Dimensions.get("window");

  const wrap = (children: React.ReactNode, gradient: [string, string, ...string[]] = [Colors.bgDark, Colors.bgDark]) => (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <LinearGradient
        colors={gradient}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );

  if (id === "default") {
    return wrap(null, [Colors.bgDark, Colors.bgDark]);
  }

  if (id === "stars") {
    return wrap(
      <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <Pattern id="stars-pat" width="80" height="80" patternUnits="userSpaceOnUse">
            <Circle cx="10" cy="14" r="1.2" fill={FILL} />
            <Circle cx="40" cy="30" r="0.8" fill="rgba(255,255,255,0.10)" />
            <Circle cx="65" cy="55" r="1.4" fill={FILL} />
            <Circle cx="22" cy="62" r="0.9" fill="rgba(255,255,255,0.09)" />
            <Circle cx="55" cy="10" r="0.7" fill="rgba(255,255,255,0.07)" />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#stars-pat)" />
      </Svg>,
      ["#13131F", "#1A1832"]
    );
  }

  if (id === "hearts") {
    const heart = "M12 21s-7-4.35-9.5-8.5C0.5 8 3.5 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 6.5 4 4.5 8.5C19 16.65 12 21 12 21z";
    return wrap(
      <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <Pattern id="hearts-pat" width="70" height="70" patternUnits="userSpaceOnUse">
            <Path d={heart} fill="rgba(232,99,90,0.10)" transform="translate(8,8) scale(0.9)" />
            <Path d={heart} fill="rgba(232,99,90,0.07)" transform="translate(40,40) scale(0.7)" />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#hearts-pat)" />
      </Svg>,
      ["#1A1024", "#13131F"]
    );
  }

  if (id === "waves") {
    return wrap(
      <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <G opacity="0.18">
          <Path
            d={`M0 ${height * 0.3} Q ${width / 2} ${height * 0.2} ${width} ${height * 0.35} L ${width} ${height} L 0 ${height} Z`}
            fill={Colors.primary}
          />
          <Path
            d={`M0 ${height * 0.55} Q ${width / 2} ${height * 0.45} ${width} ${height * 0.6} L ${width} ${height} L 0 ${height} Z`}
            fill={Colors.primaryLight}
            opacity={0.5}
          />
          <Path
            d={`M0 ${height * 0.8} Q ${width / 2} ${height * 0.7} ${width} ${height * 0.85} L ${width} ${height} L 0 ${height} Z`}
            fill={Colors.male}
            opacity={0.45}
          />
        </G>
      </Svg>,
      ["#13131F", "#1B1840"]
    );
  }

  if (id === "campus") {
    // graduation cap pattern: simple cap silhouette
    const cap =
      "M12 3 L2 8 L12 13 L22 8 Z M6 11 L6 16 C6 18 9 19 12 19 C15 19 18 18 18 16 L18 11";
    return wrap(
      <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <Pattern id="campus-pat" width="90" height="90" patternUnits="userSpaceOnUse">
            <Path
              d={cap}
              stroke="rgba(168,156,247,0.18)"
              strokeWidth="1.4"
              fill="none"
              transform="translate(15,18) scale(1.4)"
            />
            <Path
              d={cap}
              stroke="rgba(168,156,247,0.10)"
              strokeWidth="1.2"
              fill="none"
              transform="translate(55,55) scale(1.0)"
            />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#campus-pat)" />
      </Svg>,
      ["#13131F", "#181F30"]
    );
  }

  return wrap(null);
}
