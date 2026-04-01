import type {ComponentProps} from 'react';
import Feather from '@expo/vector-icons/Feather';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colours, radii, shadows, spacing, typography, withAlpha} from '../theme';

export type FeatherName = ComponentProps<typeof Feather>['name'];

export function QuickActionTile({
  description,
  icon,
  label,
  onPress,
}: {
  description: string;
  icon: FeatherName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.tile, pressed ? styles.tilePressed : null]}>
      <View style={styles.iconShell}>
        <Feather color={colours.primary} name={icon} size={20} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    minHeight: 134,
    borderRadius: radii.tile,
    borderWidth: 1,
    borderColor: colours.border,
    backgroundColor: colours.surface,
    padding: spacing.iconTilePadding,
    gap: 10,
    ...shadows.card,
  },
  tilePressed: {
    transform: [{scale: 0.98}],
  },
  iconShell: {
    width: 42,
    height: 42,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colours.primary, 0.08),
  },
  label: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  description: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
});
