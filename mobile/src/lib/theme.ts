import { useColorScheme } from "react-native";

// ============= NEW DESIGN SYSTEM v1.0 =============

export const Colors = {
  primary: '#7C6FF7',
  primaryLight: '#A89CF7',
  primaryPale: '#EEF0FF',
  primaryDark: '#5A4FD4',
  female: '#D4537E',
  femalePale: '#FBF0F4',
  male: '#185FA5',
  malePale: '#EBF3FD',
  coral: '#E8635A',
  bgDark: '#13131F',
  surfaceDark: '#1E1E30',
  cardDark: '#252538',
  bgLight: '#F8F7FF',
  white: '#FFFFFF',
  textDark: '#1C1C2E',
  textMuted: '#8B8BAA',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#9999BB',
};

export const Typography = {
  hero: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 36, color: Colors.textDark } as const,
  h1: { fontFamily: 'DMSans_700Bold', fontSize: 26, color: Colors.textDark } as const,
  h2: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, color: Colors.textDark } as const,
  h3: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.textDark } as const,
  body: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 20 } as const,
  bodyBold: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.textDark } as const,
  caption: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.textMuted } as const,
  tag: { fontFamily: 'DMSans_500Medium', fontSize: 12 } as const,
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const Radius = {
  pill: 50,
  card: 22,
  tag: 50,
  avatar: 999,
  modal: 28,
  input: 50,
  badge: 12,
};

// ============= LEGACY (keep until all screens migrate) =============

const female = { accent: Colors.female, pale: Colors.femalePale, mid: '#F2A8B8', border: 'rgba(212,83,126,0.18)' };
const male = { accent: Colors.male, pale: Colors.malePale, mid: '#B5D4F4', border: 'rgba(24,95,165,0.18)' };
const base = { bg: Colors.bgLight, surface: Colors.white, text: Colors.textDark, muted: Colors.textMuted, hint: '#A99FCC', border: 'rgba(124,111,247,0.12)' };

export const theme = {
  female,
  male,
  base,
  radius: { card: Radius.card, pill: Radius.pill, tag: Radius.tag, event: 20, person: 22, phone: 38 },
  background: Colors.bgLight,
  surface: Colors.white,
  surfaceElevated: Colors.white,
  inputBackground: Colors.white,
  cardBackground: Colors.white,
  cardShadow: 'rgba(0,0,0,0.06)',
  gradientStart: Colors.primaryPale,
  primary: Colors.primary,
  accent: Colors.primary,
  online: '#4CD964',
  textPrimary: Colors.textDark,
  textSecondary: Colors.textMuted,
  textPlaceholder: '#A99FCC',
  textOnPrimary: Colors.white,
  borderDefault: 'rgba(124,111,247,0.12)',
  inputBorder: 'rgba(0,0,0,0.1)',
  borderFocused: Colors.primary,
  borderError: '#FF3B30',
  success: '#4CD964',
  error: '#FF3B30',
  warning: '#FFCC00',
  streakFire: '#FF9500',
  streakDanger: '#FF3B30',
  messageSent: Colors.primary,
  messageReceived: Colors.white,
  messageTextReceived: Colors.textDark,
  buttonGradient: [Colors.primary, Colors.primaryLight] as [string, string],
  storyGradient: [Colors.primary, Colors.primaryLight, Colors.primaryPale] as [string, string, string],
  storyWatchedGradient: ['#E5E7EB', '#F3F4F6'] as [string, string],
  tabBarBackground: Colors.primary,
  tabBarBorder: 'transparent',
  tabBarActive: Colors.white,
  tabBarInactive: 'rgba(255,255,255,0.55)',
};

export const darkTheme = {
  ...theme,
  background: Colors.bgDark,
  surface: Colors.surfaceDark,
  surfaceElevated: Colors.cardDark,
  inputBackground: Colors.surfaceDark,
  cardBackground: Colors.cardDark,
  textPrimary: Colors.textOnDark,
  textSecondary: Colors.textOnDarkMuted,
  messageReceived: Colors.cardDark,
  messageTextReceived: Colors.white,
  tabBarBackground: Colors.primary,
};

export type ThemeColors = typeof theme;

export function useTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : theme;
}

export const gradients = {
  background: [Colors.bgLight, Colors.bgLight] as [string, string],
  button: [Colors.primary, Colors.primaryLight] as [string, string],
  cardOverlay: ['transparent', 'rgba(20,10,40,0.88)'] as [string, string],
  card: [Colors.primaryPale, 'rgba(255,255,255,0)'] as [string, string],
  story: [Colors.primary, Colors.primaryLight, Colors.primaryPale] as [string, string, string],
  header: [Colors.bgLight, Colors.bgLight] as [string, string],
  streak: ['#FF9500', '#FF5E00'] as [string, string],
  match: [Colors.coral, Colors.primary] as [string, string],
  premium: ['#FFD700', '#FF8C00'] as [string, string],
  onboarding: ['#C4BAF9', Colors.primaryLight] as [string, string],
};
