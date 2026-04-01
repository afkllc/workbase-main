import {colours, withAlpha} from '../theme';

/**
 * Converts a snake_case or kebab-case key to Title Case for display.
 * e.g. "living_room" → "Living Room", "meter_readings" → "Meter Readings"
 */
export function formatDisplayName(key: string): string {
  if (!key) {
    return '';
  }

  return key
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCondition(condition: string | null | undefined) {
  if (!condition) {
    return 'Pending';
  }

  if (condition === 'na') {
    return 'N/A';
  }

  return formatDisplayName(condition);
}

export function statusTone(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'completed' || normalized === 'confirmed' || normalized === 'ready' || normalized === 'good' || normalized === 'high') {
    return {
      backgroundColor: withAlpha(colours.success, 0.12),
      borderColor: withAlpha(colours.success, 0.22),
      color: colours.success,
    };
  }

  if (
    normalized === 'processing' ||
    normalized === 'capturing' ||
    normalized === 'review' ||
    normalized === 'in review' ||
    normalized === 'medium' ||
    normalized === 'fair'
  ) {
    return {
      backgroundColor: withAlpha(colours.accent, 0.12),
      borderColor: withAlpha(colours.accent, 0.2),
      color: colours.accent,
    };
  }

  if (normalized === 'poor' || normalized === 'damaged' || normalized === 'low') {
    return {
      backgroundColor: withAlpha(colours.destructive, 0.1),
      borderColor: withAlpha(colours.destructive, 0.18),
      color: colours.destructive,
    };
  }

  return {
    backgroundColor: withAlpha(colours.textSecondary, 0.1),
    borderColor: withAlpha(colours.textSecondary, 0.16),
    color: colours.textSecondary,
  };
}

/**
 * Route names that correspond to main tab screens.
 * When the back button would return to one of these, we suppress the label
 * and show only a plain chevron.
 */
const MAIN_TAB_ROUTES = new Set([
  '(tabs)',
  'index',
  'inspections',
  'reports',
  'settings',
]);

export function isMainTabRoute(routeName: string): boolean {
  return MAIN_TAB_ROUTES.has(routeName);
}
