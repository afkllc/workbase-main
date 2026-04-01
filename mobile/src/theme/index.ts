import {colours} from './colours';

export {colours} from './colours';

export function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return hex;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export const spacing = {
  screenGutter: 20,
  cardPadding: 18,
  sectionGap: 16,
  compactGap: 12,
  tightGap: 8,
  inputPaddingY: 14,
  inputPaddingX: 16,
  iconTilePadding: 14,
  tabBarBottomPadding: 12,
} as const;

export const radii = {
  card: 20,
  input: 18,
  button: 18,
  badge: 999,
  tile: 18,
  pill: 999,
  icon: 18,
} as const;

export const typography = {
  screenTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  supporting: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
} as const;

export const surfaces = {
  muted: withAlpha(colours.primary, 0.04),
  primarySoft: withAlpha(colours.primary, 0.09),
  accentSoft: withAlpha(colours.accent, 0.12),
  successSoft: withAlpha(colours.success, 0.12),
  destructiveSoft: withAlpha(colours.destructive, 0.1),
  neutralSoft: withAlpha(colours.textSecondary, 0.1),
} as const;

export const borders = {
  subtle: colours.border,
  strong: withAlpha(colours.textPrimary, 0.08),
  primary: withAlpha(colours.primary, 0.26),
  accent: withAlpha(colours.accent, 0.24),
  destructive: withAlpha(colours.destructive, 0.24),
} as const;

export const shadows = {
  card: {
    shadowColor: colours.textPrimary,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  floating: {
    shadowColor: colours.textPrimary,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const layout = {
  minTouchTarget: 48,
  tabBarTopPadding: 18,
  tabBarHeight: 84,
  centerActionSize: 62,
} as const;
