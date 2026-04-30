import { useColorScheme } from "react-native";

// UniMatch Theme - New Light Theme System
const female = {
  accent: "#D4537E",
  pale: "#FBEAF0",
  mid: "#F4C0D1",
  border: "rgba(212,83,126,0.18)",
};

const male = {
  accent: "#185FA5",
  pale: "#E6F1FB",
  mid: "#B5D4F4",
  border: "rgba(24,95,165,0.18)",
};

const base = {
  bg: "#F5F3F6",
  surface: "#FFFFFF",
  text: "#1A0D14",
  muted: "#6B4A58",
  hint: "#A08090",
  border: "rgba(180,100,140,0.12)",
};

const radius = {
  card: 16,
  pill: 14,
  tag: 20,
  event: 20,
  person: 22,
  phone: 38,
};

export const theme = {
  female,
  male,
  base,
  radius,

  // Legacy mappings for backward compatibility
  background: base.bg,
  surface: base.surface,
  surfaceElevated: base.surface,
  inputBackground: base.surface,
  cardBackground: base.surface,
  cardShadow: "rgba(0,0,0,0.06)",
  gradientStart: "#FBEAF0",

  // Primary colors (Defaulting to female accent for brand)
  primary: female.accent,
  accent: female.accent,
  online: "#4CD964",

  // Text colors
  textPrimary: base.text,
  textSecondary: base.muted,
  textPlaceholder: base.hint,
  textOnPrimary: "#FFFFFF",

  // Border colors
  borderDefault: base.border,
  inputBorder: base.border,
  borderFocused: female.accent,
  borderError: "#FF3B30",

  // Status colors
  success: "#4CD964",
  error: "#FF3B30",
  warning: "#FFCC00",

  streakFire: "#FF9500",
  streakDanger: "#FF3B30",

  // Messages
  messageSent: female.accent,
  messageReceived: base.surface,
  messageTextReceived: base.text,

  // Button gradients
  buttonGradient: [female.accent, female.mid] as [string, string],

  // Story ring gradient
  storyGradient: [female.accent, female.mid, female.pale] as [string, string, string],
  storyWatchedGradient: ["#E5E7EB", "#F3F4F6"] as [string, string],

  // Tab bar
  tabBarBackground: base.surface,
  tabBarBorder: base.border,
  tabBarActive: female.accent,
  tabBarInactive: base.hint,
};

// Dark theme — used when system prefers dark mode
export const darkTheme = {
  ...theme,
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surfaceElevated: "#222222",
  inputBackground: "#1E1E1E",
  cardBackground: "#1A1A1A",
  cardShadow: "rgba(0,0,0,0.3)",
  gradientStart: "#1A0D12",
  textPrimary: "#F5F5F5",
  textSecondary: "#A0A0A0",
  textPlaceholder: "#606060",
  borderDefault: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.12)",
  messageSent: "#E8445A",
  messageReceived: "#2C2C2E",
  messageTextReceived: "#FFFFFF",
  tabBarBackground: "#111111",
  tabBarBorder: "rgba(255,255,255,0.1)",
  tabBarActive: "#E8445A",
  tabBarInactive: "#48484A",
  base: {
    bg: "#0D0D0D",
    surface: "#1A1A1A",
    text: "#F5F5F5",
    muted: "#A0A0A0",
    hint: "#606060",
    border: "rgba(255,255,255,0.08)",
  },
  female: {
    ...female,
    accent: "#E8678A",
    pale: "#2D1520",
    mid: "#5C2035",
    border: "rgba(232,103,138,0.2)",
  },
};

export type ThemeColors = typeof theme;

export function useTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkTheme : theme;
}

// Gradient presets for LinearGradient
export const gradients = {
  background: [base.bg, base.bg] as [string, string],
  button: theme.buttonGradient,
  cardOverlay: ["transparent", "rgba(0,0,0,0.6)"] as [string, string],
  card: [female.pale, "rgba(255, 255, 255, 0)"] as [string, string],
  story: theme.storyGradient as unknown as [string, string],
  header: [base.bg, base.bg] as [string, string],
  streak: ["#FF9500", "#FF5E00"] as [string, string],
};
