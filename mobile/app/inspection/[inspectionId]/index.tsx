import Feather from '@expo/vector-icons/Feather';
import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {EmptyState} from '../../../src/components/EmptyState';
import {StatusSummaryRow} from '../../../src/components/StatusSummaryRow';
import {Button, Card, LoadingRow, Notice, Screen} from '../../../src/components/ui';
import {getInspection} from '../../../src/lib/api';
import type {InspectionRecord} from '../../../src/lib/types';
import {formatDisplayName} from '../../../src/lib/utils';
import {AppStackScreen} from '../../../src/navigation/AppStackScreen';
import {borders, colours, radii, spacing, surfaces, typography, withAlpha} from '../../../src/theme';

export default function InspectionScreen() {
  const router = useRouter();
  const {inspectionId, from} = useLocalSearchParams<{inspectionId: string; from?: string}>();
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        if (!inspectionId) {
          return;
        }

        setLoading(true);
        setError(null);
        try {
          const data = await getInspection(inspectionId);
          if (isActive) {
            setInspection(data);
          }
        } catch (err) {
          if (isActive) {
            setError(err instanceof Error ? err.message : 'Failed to load inspection.');
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
    }, [inspectionId]),
  );

  useEffect(() => {
    setShowCreatedBanner(from === 'new');
  }, [from, inspectionId]);

  const confirmed = inspection?.rooms.reduce((count, room) => count + room.items_confirmed, 0) ?? 0;
  const total = inspection?.rooms.reduce((count, room) => count + room.items_total, 0) ?? 0;
  const flagged = inspection?.rooms.reduce((count, room) => count + room.items.filter((item) => item.is_confirmed && item.condition === 'poor').length, 0) ?? 0;
  const remaining = Math.max(0, total - confirmed);
  const completion = total > 0 ? (confirmed / total) * 100 : 0;
  const nextIncompleteRoom = inspection?.rooms.find((room) => room.items_confirmed < room.items_total) ?? null;
  const captureActive = Boolean(nextIncompleteRoom);

  useEffect(() => {
    setShowSecondaryActions(!captureActive);
  }, [captureActive, inspectionId]);

  let primaryActionLabel = 'Open review';
  let primaryAction: (() => void) | null = inspection ? () => router.push(`/inspection/${inspection.id}/review`) : null;
  let progressHelperCopy = 'Review the inspection and generate the report when you are ready.';

  if (inspection) {
    if (nextIncompleteRoom) {
      primaryActionLabel = `Continue ${nextIncompleteRoom.name}`;
      primaryAction = () => router.push(`/inspection/${inspection.id}/room/${nextIncompleteRoom.id}`);
      progressHelperCopy = `Next up: ${nextIncompleteRoom.name}. Keep capturing to move the inspection forward.`;
    } else if (!inspection.sections_completed) {
      primaryActionLabel = 'Continue fixed sections';
      primaryAction = () => router.push(`/inspection/${inspection.id}/sections`);
      progressHelperCopy = 'Rooms are done. Save the fixed sections to unlock review and reporting.';
    } else {
      primaryActionLabel = 'Finish inspection review';
      primaryAction = () => router.push(`/inspection/${inspection.id}/review`);
      progressHelperCopy = 'Everything is captured. Move into review to finish the inspection.';
    }
  }

  function dismissCreatedBanner() {
    setShowCreatedBanner(false);
  }

  return (
    <>
      <AppStackScreen fallbackBackLabel="Inspections" fallbackHref="/inspections" inspection={inspection} title="Inspection" />
      <Screen includeTopInset={false} onScrollBeginDrag={showCreatedBanner ? dismissCreatedBanner : undefined} showHeader={false}>
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <LoadingRow label="Loading inspection" /> : null}

        {inspection ? (
          <>
            {showCreatedBanner ? (
              <View style={styles.creationBanner}>
                <Text style={styles.creationBannerTitle}>New inspection created</Text>
                <Text style={styles.creationBannerCopy}>Open a room below to start capturing.</Text>
              </View>
            ) : null}

            <Card>
              <Text style={styles.kicker}>{formatDisplayName(inspection.property_type)}</Text>
              <StatusSummaryRow subtitle={inspection.inspection_date} statusValue={inspection.status} title={inspection.property_address} />

              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{confirmed} of {total} confirmed</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: `${completion}%`}]} />
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{confirmed}</Text>
                  <Text style={styles.metricLabel}>Captured</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={[styles.metricValue, styles.flaggedMetric]}>{flagged}</Text>
                  <Text style={styles.metricLabel}>Flagged</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{remaining}</Text>
                  <Text style={styles.metricLabel}>Remaining</Text>
                </View>
              </View>
              <Text style={styles.guidanceCopy}>{progressHelperCopy}</Text>

              {primaryAction ? <Button label={primaryActionLabel} onPress={primaryAction} /> : null}
              {captureActive ? (
                <Pressable
                  onPress={() => setShowSecondaryActions((current) => !current)}
                  style={({pressed}) => [styles.secondaryToggle, pressed ? styles.secondaryTogglePressed : null]}
                >
                  <View style={styles.secondaryToggleCopy}>
                    <Text style={styles.secondaryToggleTitle}>{showSecondaryActions ? 'Hide options' : 'More options'}</Text>
                    <Text style={styles.secondaryToggleHint}>Review and fixed sections stay tucked away until you need them.</Text>
                  </View>
                  <Feather color={colours.textSecondary} name={showSecondaryActions ? 'chevron-up' : 'chevron-down'} size={18} />
                </Pressable>
              ) : null}
              {showSecondaryActions ? (
                <View style={styles.actionRow}>
                  <Button label="Fixed sections" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/sections`)} />
                  <Button label="Review inspection" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/review`)} />
                </View>
              ) : null}
            </Card>

            {inspection.rooms.length === 0 ? (
              <Card>
                <EmptyState
                  action={{label: 'Open review', onPress: () => router.push(`/inspection/${inspection.id}/review`), variant: 'secondary'}}
                  icon="home"
                  message="No rooms to capture"
                />
              </Card>
            ) : null}

            {inspection.rooms.map((room) => (
              <Pressable
                key={room.id}
                onPress={() => {
                  dismissCreatedBanner();
                  router.push(`/inspection/${inspection.id}/room/${room.id}`);
                }}
                style={({pressed}) => [styles.roomCard, nextIncompleteRoom?.id === room.id ? styles.roomCardNext : null, pressed ? styles.roomCardPressed : null]}
              >
                <StatusSummaryRow
                  subtitle={`${room.items_confirmed} of ${room.items_total} items confirmed`}
                  statusValue={room.status}
                  title={room.name}
                />
                <View style={styles.roomFooter}>
                  <Text style={styles.roomAction}>
                    {room.items_confirmed === 0 ? 'Start room' : room.items_confirmed === room.items_total ? 'Review room' : 'Continue room'}
                  </Text>
                  <Feather color={colours.primary} name="chevron-right" size={18} />
                </View>
              </Pressable>
            ))}
          </>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  creationBanner: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: borders.primary,
    backgroundColor: surfaces.primarySoft,
    padding: spacing.cardPadding,
    gap: 4,
  },
  creationBannerTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  creationBannerCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
  kicker: {
    ...typography.label,
    color: colours.primary,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.tightGap,
  },
  progressLabel: {
    ...typography.label,
    color: colours.textSecondary,
  },
  progressValue: {
    ...typography.supporting,
    color: colours.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.badge,
    backgroundColor: surfaces.neutralSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: radii.badge,
    backgroundColor: colours.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.tightGap,
  },
  metricCard: {
    flex: 1,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    paddingHorizontal: spacing.compactGap,
    paddingVertical: spacing.compactGap,
    gap: 4,
  },
  metricValue: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  metricLabel: {
    ...typography.label,
    color: colours.textSecondary,
  },
  flaggedMetric: {
    color: colours.destructive,
  },
  guidanceCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.tightGap,
    flexWrap: 'wrap',
  },
  secondaryToggle: {
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    paddingHorizontal: spacing.compactGap,
    paddingVertical: spacing.compactGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.compactGap,
  },
  secondaryTogglePressed: {
    backgroundColor: withAlpha(colours.primary, 0.08),
  },
  secondaryToggleCopy: {
    flex: 1,
    gap: 4,
  },
  secondaryToggleTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  secondaryToggleHint: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  roomCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: colours.surface,
    padding: spacing.cardPadding,
    gap: spacing.compactGap,
  },
  roomCardNext: {
    borderColor: withAlpha(colours.primary, 0.26),
    backgroundColor: withAlpha(colours.primary, 0.04),
  },
  roomCardPressed: {
    backgroundColor: withAlpha(colours.primary, 0.05),
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  roomAction: {
    ...typography.supporting,
    color: colours.primary,
    fontFamily: 'Inter_700Bold',
  },
});
