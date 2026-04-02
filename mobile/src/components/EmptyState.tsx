import type {ComponentProps} from 'react';
import Feather from '@expo/vector-icons/Feather';
import {StyleSheet, Text, View} from 'react-native';
import {borders, colours, layout, radii, spacing, surfaces, typography} from '../theme';
import {Button} from './ui';

type FeatherName = ComponentProps<typeof Feather>['name'];

export function EmptyState({
  icon,
  message,
  action,
}: {
  icon: FeatherName;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  };
}) {
  return (
    <View style={styles.root}>
      <View style={styles.iconShell}>
        <Feather color={colours.primary} name={icon} size={20} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {action ? <Button label={action.label} onPress={action.onPress} variant={action.variant} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.compactGap,
    paddingVertical: spacing.tightGap,
  },
  iconShell: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.icon,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.body,
    color: colours.textSecondary,
    textAlign: 'center',
  },
});
