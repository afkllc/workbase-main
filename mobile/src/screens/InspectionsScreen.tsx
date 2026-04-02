import Feather from '@expo/vector-icons/Feather';
import {useFocusEffect, useRouter} from 'expo-router';
import {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {EmptyState} from '../components/EmptyState';
import {Card, LoadingRow, Notice, Screen, StatusBadge} from '../components/ui';
import {listInspections} from '../lib/api';
import type {InspectionSummary} from '../lib/types';
import {formatDisplayName} from '../lib/utils';
import {borders, colours, radii, spacing, surfaces, typography, withAlpha} from '../theme';

export default function InspectionsScreen() {
  const router = useRouter();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            setError(err instanceof Error ? err.message : 'Failed to load inspections.');
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

  const draftCount = useMemo(() => inspections.filter((inspection) => inspection.status === 'draft').length, [inspections]);
  const completedCount = useMemo(() => inspections.filter((inspection) => inspection.status === 'completed').length, [inspections]);

  return (
    <Screen title="Inspections" subtitle={`${inspections.length} inspections in the workspace.`}>
      <Card>
        <Text style={styles.cardTitle}>Inspection queue</Text>
        <Text style={styles.cardBody}>Open an inspection to continue capture, update property details, or move toward final review.</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{draftCount}</Text>
            <Text style={styles.summaryLabel}>In progress</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>
      </Card>

      {error ? <Notice>{error}</Notice> : null}
      {loading ? <LoadingRow label="Loading inspections" /> : null}

      {inspections.length === 0 && !loading ? (
        <Card>
          <EmptyState
            action={{label: 'New inspection', onPress: () => router.push('/new-inspection')}}
            icon="clipboard"
            message="Start a new inspection to begin capturing rooms and property details."
          />
        </Card>
      ) : null}

      {inspections.map((inspection) => (
        <Pressable key={inspection.id} onPress={() => router.push(`/inspection/${inspection.id}`)} style={({pressed}) => [styles.inspectionCard, pressed ? styles.inspectionCardPressed : null]}>
          <View style={styles.rowHeader}>
            <View style={styles.rowCopy}>
              <Text numberOfLines={1} style={styles.rowTitle}>{inspection.property_address}</Text>
              <Text ellipsizeMode="tail" numberOfLines={1} style={styles.rowSubtitle}>{formatDisplayName(inspection.property_type)} - {inspection.inspection_date}</Text>
            </View>
            <StatusBadge value={inspection.status} />
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${inspection.total_items ? (inspection.confirmed_items / inspection.total_items) * 100 : 0}%`}]} />
            </View>
            <Text style={styles.progressText}>{inspection.confirmed_items} / {inspection.total_items}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerCopy}>Open inspection</Text>
            <Feather color={colours.primary} name="chevron-right" size={18} />
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: colours.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.tightGap,
  },
  summaryPill: {
    flex: 1,
    borderRadius: radii.tile,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    padding: 14,
    gap: 2,
  },
  summaryValue: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  summaryLabel: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  inspectionCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: colours.surface,
    padding: spacing.cardPadding,
    gap: spacing.compactGap,
  },
  inspectionCardPressed: {
    backgroundColor: withAlpha(colours.primary, 0.05),
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.compactGap,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  rowSubtitle: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: radii.badge,
    backgroundColor: surfaces.neutralSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: radii.badge,
    backgroundColor: colours.primary,
  },
  progressText: {
    ...typography.supporting,
    color: colours.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  footerCopy: {
    ...typography.supporting,
    color: colours.primary,
    fontWeight: '700',
  },
});
