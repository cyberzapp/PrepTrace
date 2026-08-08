const CoreColors = {
  black: '#000000',
  zinc900: '#18181B',
  zinc800: '#27272A',
  white: '#FAFAFA',
  zinc400: '#A1A1AA',
  blue: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
};

export const Colors = {
  // Base background & surfaces
  background: CoreColors.black,
  surface: CoreColors.zinc900,
  surfaceLight: CoreColors.zinc800,
  card: CoreColors.zinc900,
  cardHover: CoreColors.zinc800,
  cardBorder: CoreColors.zinc800,
  cardBackground: CoreColors.zinc900,
  border: CoreColors.zinc800,
  
  // Accents & Brand
  primary: CoreColors.blue,
  primaryDark: CoreColors.blue,
  primaryGlow: 'rgba(59, 130, 246, 0.15)',
  
  accentCyan: CoreColors.blue,
  accentIndigo: CoreColors.blue,
  accentGreen: CoreColors.blue,

  secondary: CoreColors.zinc800,
  secondaryGlow: 'rgba(39, 39, 42, 0.15)',

  // Status & Metrics
  success: CoreColors.green,
  successGlow: 'rgba(34, 197, 94, 0.2)',
  warning: CoreColors.blue,
  warningGlow: 'rgba(59, 130, 246, 0.15)',
  danger: CoreColors.red,
  dangerGlow: 'rgba(239, 68, 68, 0.2)',
  info: CoreColors.blue,

  // Text colors
  textPrimary: CoreColors.white,
  textSecondary: CoreColors.zinc400,
  textMuted: CoreColors.zinc400,
  textDisabled: CoreColors.zinc800,

  // Category Colors
  categoryCore: CoreColors.blue,
  categoryMath: CoreColors.blue,
  categoryAptitude: CoreColors.blue,
  categoryElective: CoreColors.zinc800,
  categoryGeneral: CoreColors.zinc800,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  glowPrimary: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
};
