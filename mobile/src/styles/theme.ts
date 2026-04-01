import {colours, surfaces} from '../theme';

export const palette = {
  background: colours.background,
  surface: colours.surface,
  surfaceMuted: surfaces.muted,
  border: colours.border,
  text: colours.textPrimary,
  textMuted: colours.textSecondary,
  textSoft: colours.textSecondary,
  primary: colours.primary,
  primaryDark: colours.primaryActive,
  danger: colours.destructive,
  success: colours.success,
  accent: colours.accent,
} as const;
