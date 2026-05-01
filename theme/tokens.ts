/**
 * Design tokens — Rituel Build 17 visual system.
 *
 * Palette: warm cream + espresso + copper.
 * Inspired by premium French beauty (soft Dior / Glossier).
 */
import { Platform } from 'react-native';

// ---- Colors ----
export const C = {
  // Background
  appBg: '#F6F1EC',
  bg: '#FDF8F5',
  bg2: '#F5EDE6',
  cream: '#F5EDE6',
  blush: '#F5EDE6',
  white: '#FFFFFF',

  // Espresso (dark text + dark cards)
  espresso: '#2A1410',
  text: '#1A1310',
  textDark: '#1A1310',
  textMid: '#6B5245',
  textSoft: '#9C8576',

  // Copper / accent
  copper: '#C08A6A',
  copperDark: '#B07A5E',
  warmNude: '#B98567',
  accent: '#B8856A',
  accent2: '#8C5E46',

  // UI
  border: '#E8D5C8',
  borderSoft: 'rgba(192,138,106,0.18)',
  light: '#E8D5C8',

  // Status
  green: '#5B9B6B',
  red: '#C0392B',
  orange: '#E67E22',
};

// ---- Spacing ----
export const Sp = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
};

// ---- Border radius ----
export const R = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 999,
};

// ---- Typography ----
export const Type = {
  h1: {
    fontSize: 32,
    fontWeight: '300' as const,
    color: C.text,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: C.text,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: C.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: C.textMid,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: C.textMid,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: C.textSoft,
  },
};

// ---- Shadows ----
export const Sh = {
  soft: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }) as any,
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 5 },
    default: {},
  }) as any,
  premium: Platform.select({
    ios: {
      shadowColor: C.espresso,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: { elevation: 10 },
    default: {},
  }) as any,
};

// ---- Gradients (color arrays for LinearGradient) ----
export const G = {
  espresso: ['#3A1F18', '#2A1410'] as const,
  copper: ['#C08A6A', '#A57050'] as const,
  cream: ['#F6F1EC', '#FBF6F1'] as const,
  blush: ['#F5EDE6', '#EDE0D3'] as const,
};