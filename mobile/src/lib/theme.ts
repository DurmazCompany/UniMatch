// CampusMatch Theme - Dark & Red Accent
export const theme = {
  // Background colors
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surfaceElevated: "#222222",
  inputBackground: "#1E1E1E",

  // Primary colors
  primary: "#E8445A",
  accent: "#E8445A",
  online: "#4CD964",

  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#8E8E93",
  textPlaceholder: "#48484A",

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

  // Button gradients
  buttonGradient: ["#E8445A", "#FF5E73"] as [string, string],
};

// Gradient presets for LinearGradient
export const gradients = {
  background: ["#121212", "#0D0D0D"] as [string, string],
  button: theme.buttonGradient,
  cardOverlay: ["transparent", "rgba(0,0,0,0.85)"] as [string, string],
  card: ["rgba(232, 68, 90, 0.1)", "rgba(0, 0, 0, 0)"] as [string, string],
};

