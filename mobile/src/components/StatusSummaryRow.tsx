import {StyleSheet, Text, View} from 'react-native';
import {StatusBadge} from './ui';
import {colours, spacing, typography} from '../theme';

export function StatusSummaryRow({
  title,
  subtitle,
  statusValue,
  rightAlignVariant = 'top',
}: {
  title: string;
  subtitle: string;
  statusValue: string;
  rightAlignVariant?: 'top' | 'center';
}) {
  return (
    <View style={[styles.row, rightAlignVariant === 'center' ? styles.rowCenter : null]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <StatusBadge value={statusValue} />
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
    gap: 4,
  },
  title: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  subtitle: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
});
