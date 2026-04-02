import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {StatusSummaryRow} from '../../../src/components/StatusSummaryRow';
import {Button, Card, LoadingRow, Notice, Screen, StatusBadge, SuccessBanner} from '../../../src/components/ui';
import {generateReport, getInspection, updateItem} from '../../../src/lib/api';
import type {Condition, InspectionRecord, ItemRecord} from '../../../src/lib/types';
import {formatCondition} from '../../../src/lib/utils';
import {AppStackScreen} from '../../../src/navigation/AppStackScreen';
import {colours, layout, radii, spacing, typography} from '../../../src/theme';

const confidenceOrder: Record<string, number> = {low: 0, medium: 1, high: 2};

function sortItemsForReview(items: ItemRecord[]): ItemRecord[] {
  return [...items].sort((a, b) => {
    if (a.is_confirmed !== b.is_confirmed) return a.is_confirmed ? 1 : -1;
    const ca = confidenceOrder[a.ai_confidence ?? ''] ?? 3;
    const cb = confidenceOrder[b.ai_confidence ?? ''] ?? 3;
    return ca - cb;
  });
}

export default function ReviewScreen() {
  const router = useRouter();
  const {inspectionId} = useLocalSearchParams<{inspectionId: string}>();
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterNeedsReview, setFilterNeedsReview] = useState(true);

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
            setError(err instanceof Error ? err.message : 'Failed to load review data.');
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

  const totalConfirmed = inspection?.rooms.reduce((count, room) => count + room.items_confirmed, 0) ?? 0;
  const totalItems = inspection?.rooms.reduce((count, room) => count + room.items_total, 0) ?? 0;
  const hasNoChecklistItems = totalItems === 0;
  const allItemsConfirmed = hasNoChecklistItems || totalConfirmed === totalItems;
  const needsReviewCount = totalItems - totalConfirmed;

  const allConfirmableItems = useMemo(() => {
    if (!inspection) return [];
    const items: Array<{roomId: string; itemId: string; condition: Condition; description: string; photoName?: string}> = [];
    for (const room of inspection.rooms) {
      for (const item of room.items) {
        if (!item.is_confirmed && item.condition && item.description) {
          items.push({roomId: room.id, itemId: item.id, condition: item.condition as Condition, description: item.description, photoName: item.photos[0]});
        }
      }
    }
    return items;
  }, [inspection]);

  const visibleRoomCount = useMemo(() => {
    if (!inspection) {
      return 0;
    }

    return inspection.rooms.reduce((count, room) => count + (room.items.some((item) => !item.is_confirmed) ? 1 : 0), 0);
  }, [inspection]);

  async function confirmItem(roomId: string, itemId: string, condition: Condition, description: string, photoName?: string) {
    if (!inspection) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      setInspection(
        await updateItem(inspection.id, roomId, {
          item_id: itemId,
          condition,
          description,
          is_confirmed: true,
          source: 'manual',
          photo_name: photoName,
        }),
      );
      setSuccessMessage('Item confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm item.');
    } finally {
      setSaving(false);
    }
  }

  async function bulkConfirm(items: Array<{roomId: string; itemId: string; condition: Condition; description: string; photoName?: string}>) {
    if (!inspection) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let latest: InspectionRecord = inspection;
      for (const item of items) {
        latest = await updateItem(inspection.id, item.roomId, {
          item_id: item.itemId,
          condition: item.condition,
          description: item.description,
          is_confirmed: true,
          source: 'manual',
          photo_name: item.photoName,
        });
      }
      setInspection(latest);
      setSuccessMessage(`${items.length} items confirmed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk confirm items.');
    } finally {
      setSaving(false);
    }
  }

  async function createReport() {
    if (!inspection) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await generateReport(inspection.id);
      router.push(`/reports?from=review&inspectionId=${inspection.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppStackScreen fallbackBackLabel="Inspection" fallbackHref={`/inspection/${inspectionId}`} inspection={inspection} title="Review Inspection" />
      <Screen includeTopInset={false} showHeader={false}>
        {successMessage ? <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} /> : null}
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <LoadingRow label="Loading review state" /> : null}

        {inspection ? (
          <>
            <Card>
              <StatusSummaryRow
                subtitle={hasNoChecklistItems ? 'This template has no checklist items. You can generate the report immediately.' : 'All items must be confirmed before report generation.'}
                statusValue={allItemsConfirmed ? 'ready' : 'review'}
                title={`${totalConfirmed} of ${totalItems} items confirmed`}
              />
              {needsReviewCount > 0 ? <Text style={styles.reviewCount}>{needsReviewCount} items need review</Text> : null}
              {!hasNoChecklistItems ? (
                <View style={styles.actionRow}>
                  <Pressable
                    hitSlop={4}
                    onPress={() => setFilterNeedsReview(!filterNeedsReview)}
                    style={[styles.filterChip, filterNeedsReview ? styles.filterChipActive : null]}
                  >
                    <Text style={[styles.filterChipText, filterNeedsReview ? styles.filterChipTextActive : null]}>
                      {filterNeedsReview ? 'Needs review' : 'All items'}
                    </Text>
                  </Pressable>
                  {allConfirmableItems.length > 1 ? (
                    <Button label={`Confirm all (${allConfirmableItems.length})`} onPress={() => void bulkConfirm(allConfirmableItems)} disabled={saving} />
                  ) : null}
                </View>
              ) : null}
              <Button label={saving ? 'Generating...' : 'Generate report'} onPress={() => void createReport()} disabled={!allItemsConfirmed || saving} />
            </Card>

            {hasNoChecklistItems ? (
              <Card>
                <Text style={styles.emptyTitle}>This template has no checklist items.</Text>
                <Text style={styles.emptyCopy}>Generate the report from this screen to quickly test export and report rendering.</Text>
              </Card>
            ) : filterNeedsReview && visibleRoomCount === 0 ? (
              <Card>
                <Text style={styles.emptyTitle}>All items are confirmed - nothing left to review.</Text>
                <Text style={styles.emptyCopy}>You can generate the report whenever you're ready.</Text>
              </Card>
            ) : null}

            {inspection.rooms.map((room) => {
              const sortedItems = sortItemsForReview(room.items);
              const visibleItems = filterNeedsReview ? sortedItems.filter((item) => !item.is_confirmed) : sortedItems;
              const roomConfirmable = room.items.filter((item) => !item.is_confirmed && item.condition && item.description);

              if (filterNeedsReview && visibleItems.length === 0) return null;

              return (
                <Card key={room.id}>
                  <StatusSummaryRow
                    subtitle={`${room.items_confirmed} of ${room.items_total} confirmed`}
                    statusValue={room.status}
                    title={room.name}
                  />
                  {roomConfirmable.length > 1 ? (
                    <Button
                      label={`Confirm all in ${room.name} (${roomConfirmable.length})`}
                      variant="secondary"
                      onPress={() => void bulkConfirm(roomConfirmable.map((item) => ({roomId: room.id, itemId: item.id, condition: item.condition as Condition, description: item.description, photoName: item.photos[0]})))}
                      disabled={saving}
                    />
                  ) : null}
                  {visibleItems.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemCopy}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDescription}>{item.description || 'No AI description yet.'}</Text>
                        <View style={styles.itemMetaRow}>
                          <Text style={styles.itemMeta}>{formatCondition(item.condition)}</Text>
                          {item.ai_confidence ? (
                            <Text style={[styles.confidenceLabel, item.ai_confidence === 'high' ? styles.confidenceHigh : item.ai_confidence === 'medium' ? styles.confidenceMedium : styles.confidenceLow]}>
                              {item.ai_confidence} confidence
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {!item.is_confirmed && item.condition && item.description ? (
                        <Button
                          label="Confirm"
                          onPress={() => void confirmItem(room.id, item.id, item.condition as Condition, item.description, item.photos[0])}
                          disabled={saving}
                        />
                      ) : (
                        <StatusBadge value={item.is_confirmed ? 'confirmed' : 'pending'} />
                      )}
                    </View>
                  ))}
                </Card>
              );
            })}
          </>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  reviewCount: {
    marginTop: spacing.tightGap / 2,
    color: colours.accent,
    ...typography.supporting,
    fontFamily: 'Inter_600SemiBold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.tightGap,
    flexWrap: 'wrap',
  },
  filterChip: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.compactGap,
    paddingVertical: spacing.tightGap,
    backgroundColor: colours.background,
    borderWidth: 1,
    borderColor: colours.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colours.background,
    borderColor: colours.accent,
  },
  filterChipText: {
    ...typography.label,
    fontFamily: 'Inter_700Bold',
    color: colours.textSecondary,
  },
  filterChipTextActive: {
    color: colours.accent,
  },
  itemRow: {
    borderTopColor: colours.border,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  itemCopy: {
    gap: 4,
  },
  itemName: {
    color: colours.textPrimary,
    ...typography.body,
    fontFamily: 'Inter_700Bold',
  },
  itemDescription: {
    color: colours.textSecondary,
    ...typography.supporting,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemMeta: {
    color: colours.textSecondary,
    ...typography.label,
    fontFamily: 'Inter_600SemiBold',
  },
  confidenceLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  confidenceHigh: {
    color: colours.success,
  },
  confidenceMedium: {
    color: colours.accent,
  },
  confidenceLow: {
    color: colours.destructive,
  },
  emptyTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  emptyCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
});
