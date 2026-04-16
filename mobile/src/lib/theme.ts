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
