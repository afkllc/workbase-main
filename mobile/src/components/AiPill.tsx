import Feather from '@expo/vector-icons/Feather';
import {StyleSheet, Text, View} from 'react-native';
import {colours, typography} from '../theme';

export function AiPill() {
  return (
    <View style={styles.inline}>
      <Feather color={colours.aiIndicator} name="zap" size={12} />
      <Text style={styles.label}>AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  label: {
    ...typography.supporting,
    color: colours.aiIndicator,
    fontFamily: 'Inter_700Bold',
  },
});
