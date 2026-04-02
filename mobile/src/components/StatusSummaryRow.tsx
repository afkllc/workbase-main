import type {ReactNode} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {StatusBadge} from './ui';
import {colours, spacing, typography} from '../theme';

export function StatusSummaryRow({
  title,
  subtitle,
  statusValue,
  rightAlignVariant = 'top',
  titleAdornment,
}: {
  title: string;
  subtitle: string;
  statusValue: string;
  rightAlignVariant?: 'top' | 'center';
  titleAdornment?: ReactNode;
}) {
  return (
    <View style={[styles.row, rightAlignVariant === 'center' ? styles.rowCenter : null]}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.title}>{title}</Text>
          {titleAdornment ? <View style={styles.titleAdornment}>{titleAdornment}</View> : null}
        </View>
        <Text ellipsizeMode="tail" numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.badgeShell}>
        <StatusBadge value={statusValue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.compactGap,
  },
  rowCenter: {
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.tightGap,
  },
  title: {
    flex: 1,
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  titleAdornment: {
    flexShrink: 0,
  },
  subtitle: {
    ...typography.supporting,
    color: colours.textSecondary,
    flexShrink: 1,
  },
  badgeShell: {
    flexShrink: 0,
  },
});
