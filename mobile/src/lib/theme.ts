// UniMatch Theme - Dark & Red Accent
export const theme = {
  // Background colors
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surfaceElevated: "#222222",
  inputBackground: "#1E1E1E",

  // Card backgrounds
  cardBackground: "#1A1A1A",
  cardShadow: "rgba(0,0,0,0.3)",

  // Primary colors
  primary: "#E8445A",
  accent: "#E8445A",
  online: "#4CD964",

  // Gradient colors
  gradientStart: "#1A0D12",

  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#8E8E93",
  textPlaceholder: "#48484A",
  textOnPrimary: "#FFFFFF",

  // Border colors
  borderDefault: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.12)",
  borderFocused: "#E8445A",
  borderError: "#FF3B30",

  // Status colors
  success: "#4CD964",
  error: "#FF3B30",
  warning: "#FFCC00",

  // Messages
  messageSent: "#E8445A",
  messageReceived: "#2C2C2E",
  messageTextReceived: "#FFFFFF",

  // Button gradients
  buttonGradient: ["#E8445A", "#FF5E73"] as [string, string],

  // Story ring gradient
  storyGradient: ["#E8445A", "#FF5E73", "#FF8C94"] as [string, string, string],
  storyWatchedGradient: ["#3A3A3C", "#2C2C2E"] as [string, string],

  // Tab bar
  tabBarBackground: "#111111",
  tabBarBorder: "rgba(255,255,255,0.1)",
  tabBarActive: "#E8445A",
  tabBarInactive: "#48484A",

  // Streak colors
  streakFire: "#FF9500",
  streakDanger: "#FF3B30",
};

// Gradient presets for LinearGradient
export const gradients = {
  background: ["#121212", "#0D0D0D"] as [string, string],
  button: theme.buttonGradient,
  cardOverlay: ["transparent", "rgba(0,0,0,0.85)"] as [string, string],
  card: ["rgba(232, 68, 90, 0.1)", "rgba(0, 0, 0, 0)"] as [string, string],
  story: theme.storyGradient as unknown as [string, string],
  header: ["#0D0D0D", "#0D0D0D"] as [string, string],
  streak: ["#FF9500", "#FF5E00"] as [string, string],
};
