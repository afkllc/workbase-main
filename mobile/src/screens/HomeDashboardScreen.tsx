import {useFocusEffect, useRouter} from 'expo-router';
import {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {AiPill} from '../components/AiPill';
import {EmptyState} from '../components/EmptyState';
import {QuickActionTile} from '../components/QuickActionTile';
import {Button, Card, LoadingRow, Notice, Screen, StatusBadge} from '../components/ui';
import {listInspections} from '../lib/api';
import type {InspectionSummary} from '../lib/types';
import {formatDisplayName} from '../lib/utils';
import {borders, colours, placeholderText, radii, spacing, surfaces, typography, withAlpha} from '../theme';

const QUICK_ACTION_TILE_WIDTH = 142;

function parseCommand(input: string, inspections: InspectionSummary[]): {type: 'new'; address: string} | {type: 'open'; id: string} | {type: 'navigate'; screen: string} | {type: 'hint'; message: string} {
  const text = input.trim().toLowerCase();

  if (/^(new|create|inspect|start)\b/.test(text)) {
    const address = input.replace(/^(new|create|inspect|start)\s*(inspection)?\s*/i, '').trim();
    return {type: 'new', address};
  }

  if (/^(report|reports|show reports)/.test(text)) {
    return {type: 'navigate', screen: '/reports'};
  }

  if (/^(next|what should|priority|todo)/.test(text)) {
    const needsReview = inspections.find((item) => item.status === 'draft' && item.confirmed_items < item.total_items);
    if (needsReview) {
      return {type: 'open', id: needsReview.id};
    }

    return {type: 'hint', message: 'All caught up, nothing needs attention right now.'};
  }

  if (/^(continue|open|resume)\b/.test(text)) {
    const query = input.replace(/^(continue|open|resume)\s*/i, '').trim().toLowerCase();
    const match = inspections.find((item) => item.property_address.toLowerCase().includes(query));
    if (match) {
      return {type: 'open', id: match.id};
    }

    return {type: 'hint', message: `No inspection found for "${query}".`};
  }

  const addressMatch = inspections.find((item) => item.property_address.toLowerCase().includes(text));
  if (addressMatch) {
    return {type: 'open', id: addressMatch.id};
  }

  return {type: 'new', address: input.trim()};
}

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await listInspections();
          if (isActive) {
            setInspections(data);
          }
        } catch (err) {
          if (isActive) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      void load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const draftCount = useMemo(() => inspections.filter((item) => item.status === 'draft').length, [inspections]);
  const completedCount = useMemo(() => inspections.filter((item) => item.status === 'completed').length, [inspections]);
  const recentInspections = useMemo(() => inspections.slice(0, 3), [inspections]);
  const overviewTitle = draftCount > 0
    ? `${draftCount} inspections are still moving.`
    : inspections.length > 0
      ? 'The day is in a good place.'
      : 'Start your first inspection.';
  const overviewCopy = draftCount > 0
    ? 'Keep capture and review moving from one place, then open the right screen when you are ready.'
    : 'Use the shortcuts below to jump into active work, reports, or settings.';

  function handleCommand() {
    if (!command.trim()) {
      return;
    }

    const result = parseCommand(command, inspections);
    setCommand('');
    setHint(null);

    switch (result.type) {
      case 'new':
        router.push(result.address ? `/new-inspection?address=${encodeURIComponent(result.address)}` : '/new-inspection');
        break;
      case 'open':
        router.push(`/inspection/${result.id}`);
        break;
      case 'navigate':
        router.push(result.screen as '/reports');
        break;
      case 'hint':
        setHint(result.message);
        break;
    }
  }

  return (
    <Screen title="Workbase" subtitle="A clear view of what needs attention today.">
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <LoadingRow label="Loading dashboard" /> : null}

      <Card>
        <Text style={styles.kicker}>Daily overview</Text>
        <Text style={styles.heroTitle}>{overviewTitle}</Text>
        <Text style={styles.heroCopy}>{overviewCopy}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inspections.length}</Text>
            <Text style={styles.statLabel}>Total inspections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{draftCount}</Text>
            <Text style={styles.statLabel}>In progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Reports ready</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Ask AI</Text>
            <AiPill />
          </View>
          <Text style={styles.sectionHint}>Start, continue, or route work quickly.</Text>
        </View>
        <TextInput
          onChangeText={(text) => {
            setCommand(text);
            setHint(null);
          }}
          onSubmitEditing={handleCommand}
          placeholder={`Try entering: ${completedCount > 0 ? 'open (address)' : 'create (address)'}`}
          placeholderTextColor={placeholderText}
          returnKeyType="go"
          style={styles.commandInput}
          value={command}
        />
        <View style={styles.commandActions}>
          <Button disabled={!command.trim()} label="Run command" onPress={handleCommand} />
        </View>
        {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <Text style={styles.sectionHint}>Secondary shortcuts when you need to jump around the app.</Text>
        </View>
        <View style={styles.quickActionGrid}>
          <QuickActionTile description="Open active inspection work." icon="clipboard" label="Inspections" onPress={() => router.push('/inspections')} style={styles.quickActionTile} />
          <QuickActionTile description="See completed reports." icon="file-text" label="Reports" onPress={() => router.push('/reports')} style={styles.quickActionTile} />
          <QuickActionTile description="Version and app details." icon="settings" label="Settings" onPress={() => router.push('/settings')} style={styles.quickActionTile} />
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent inspections</Text>
          <Text style={styles.sectionHint}>Pick up where you left off.</Text>
        </View>

        {recentInspections.length === 0 && !loading ? (
          <EmptyState
            action={{label: 'New inspection', onPress: () => router.push('/new-inspection')}}
            icon="clipboard"
            message="Create the first inspection to start capturing rooms and property details."
          />
        ) : null}

        {recentInspections.map((inspection) => (
          <Pressable key={inspection.id} onPress={() => router.push(`/inspection/${inspection.id}`)} style={({pressed}) => [styles.listRow, pressed ? styles.listRowPressed : null]}>
            <View style={styles.listCopy}>
              <Text style={styles.listTitle}>{inspection.property_address}</Text>
              <Text style={styles.listMeta}>{formatDisplayName(inspection.property_type)} - {inspection.inspection_date}</Text>
              <Text style={styles.listProgress}>{inspection.confirmed_items} of {inspection.total_items} items confirmed</Text>
            </View>
            <StatusBadge value={inspection.status} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.label,
    color: colours.primary,
  },
  heroTitle: {
    ...typography.sectionTitle,
    color: colours.textPrimary,
  },
  heroCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.tightGap,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.tile,
    backgroundColor: surfaces.muted,
    borderWidth: 1,
    borderColor: borders.subtle,
    padding: 14,
    gap: 4,
  },
  statValue: {
    ...typography.sectionTitle,
    color: colours.textPrimary,
  },
  statLabel: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.compactGap,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  sectionHint: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  commandInput: {
    minHeight: 54,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colours.textPrimary,
    ...typography.body,
  },
  commandActions: {
    alignItems: 'flex-start',
  },
  hintText: {
    ...typography.supporting,
    color: colours.accent,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.compactGap,
  },
  quickActionTile: {
    width: QUICK_ACTION_TILE_WIDTH,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.compactGap,
    borderRadius: radii.tile,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    padding: 16,
  },
  listRowPressed: {
    backgroundColor: withAlpha(colours.primary, 0.08),
  },
  listCopy: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  listMeta: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  listProgress: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
});
