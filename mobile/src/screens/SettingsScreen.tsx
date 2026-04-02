import Feather from '@expo/vector-icons/Feather';
import Constants from 'expo-constants';
import {StyleSheet, Text, View} from 'react-native';
import {Card, Screen} from '../components/ui';
import {borders, colours, radii, spacing, surfaces, typography} from '../theme';

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title="Settings" subtitle="App details and support information for field work.">
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.profileIcon}>
            <Feather color={colours.primary} name="briefcase" size={22} />
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.heroTitle}>Workbase Mobile</Text>
            <Text style={styles.heroBody}>Built for inspection capture, review, and reporting in the field.</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Version</Text>
          <Text style={styles.detailValue}>{version}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Platform</Text>
          <Text style={styles.detailValue}>Mobile capture app</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Support</Text>
        <Text style={styles.supportText}>If you need help with inspections, templates, or reports, contact your Workbase coordinator.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.compactGap,
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surfaces.primarySoft,
    borderWidth: 1,
    borderColor: borders.primary,
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    ...typography.sectionTitle,
    color: colours.textPrimary,
  },
  heroBody: {
    ...typography.body,
    color: colours.textSecondary,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.tile,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  detailLabel: {
    ...typography.body,
    color: colours.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colours.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  supportText: {
    ...typography.body,
    color: colours.textSecondary,
  },
});
