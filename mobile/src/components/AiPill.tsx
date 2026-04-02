import Feather from '@expo/vector-icons/Feather';
import {StyleSheet, Text, View} from 'react-native';
import {colours, radii, spacing, typography} from '../theme';

export function AiPill() {
  return (
    <View style={styles.pill}>
      <Feather color={colours.surface} name="zap" size={12} />
      <Text style={styles.label}>AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colours.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  label: {
    ...typography.label,
    color: colours.surface,
    letterSpacing: 0.6,
  },
});
