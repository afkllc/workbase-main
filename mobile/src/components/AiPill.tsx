import Feather from '@expo/vector-icons/Feather';
import {StyleSheet, Text, View} from 'react-native';
import {colours, radii, typography, withAlpha} from '../theme';

export function AiPill() {
  return (
    <View style={styles.pill}>
      <Feather color={colours.aiIndicator} name="zap" size={12} />
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
    borderWidth: 1,
    borderColor: withAlpha(colours.aiIndicator, 0.3),
    backgroundColor: withAlpha(colours.aiIndicator, 0.12),
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  label: {
    ...typography.label,
    color: colours.aiIndicator,
    letterSpacing: 0.6,
  },
});
