import React from "react";
import Svg, { Path } from "react-native-svg";
import { theme } from "@/lib/theme";

interface ZodiacIconProps {
  size?: number;
  color?: string;
}

export function ZodiacIcon({
  size = 24,
  color = theme.primary,
}: ZodiacIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17h4V7c0-2.2 1.8-4 4-4s4 1.8 4 4v3c0 2.2 1.8 4 4 4h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 17h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
