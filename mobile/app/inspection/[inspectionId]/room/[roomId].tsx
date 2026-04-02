import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import * as ImagePicker from 'expo-image-picker';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {EmptyState} from '../../../../src/components/EmptyState';
import {ItemCaptureSheet, type ItemCaptureConfirmPayload, type ItemCaptureSheetMode} from '../../../../src/components/ItemCaptureSheet';
import {StatusSummaryRow} from '../../../../src/components/StatusSummaryRow';
import {Button, Card, LoadingRow, Notice, Screen, SuccessBanner} from '../../../../src/components/ui';
import {analysePhoto, getInspection, resetItem, updateItem} from '../../../../src/lib/api';
import type {Condition, InspectionRecord, ItemRecord} from '../../../../src/lib/types';
import {formatCondition} from '../../../../src/lib/utils';
import {AppStackScreen} from '../../../../src/navigation/AppStackScreen';
import {borders, colours, radii, spacing, surfaces, typography, withAlpha} from '../../../../src/theme';

type CaptureSheetState = {
  item: ItemRecord;
  mode: ItemCaptureSheetMode;
  sessionId: number;
  initialAsset?: ImagePicker.ImagePickerAsset;
  initialError?: string | null;
  initialCondition?: Condition | null;
  initialDescription?: string;
  initialPhotoName?: string;
};

type CaptureInFlightState = {
  itemId: string;
  itemName: string;
  stage: 'analysing' | 'saving';
};

type AutoSavedState = {
  itemId: string;
  itemName: string;
  condition: Condition;
  description: string;
  photoName?: string;
  asset: ImagePicker.ImagePickerAsset;
  nextItemId?: string;
  nextItemName?: string;
};

function getDerivedRoomStatus(itemsConfirmed: number, itemsTotal: number): InspectionRecord['rooms'][number]['status'] {
  if (itemsConfirmed <= 0) {
    return 'not_started';
  }

  if (itemsConfirmed >= itemsTotal) {
    return 'confirmed';
  }

  return 'review';
}

function applyOptimisticItemUpdate(inspection: InspectionRecord, roomId: string, payload: ItemCaptureConfirmPayload): InspectionRecord {
  return {
    ...inspection,
    rooms: inspection.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      const items = room.items.map((item) => {
        if (item.id !== payload.itemId) {
          return item;
        }

        const photos = payload.photoName && !item.photos.includes(payload.photoName) ? [...item.photos, payload.photoName] : item.photos;
        const aiConfidence: ItemRecord['ai_confidence'] = payload.source === 'photo_ai' ? 'high' : null;

        return {
          ...item,
          condition: payload.condition,
          description: payload.description,
          source: payload.source,
          ai_confidence: aiConfidence,
          is_confirmed: true,
          photos,
        };
      });

      const itemsConfirmed = items.filter((candidate) => candidate.is_confirmed).length;

      return {
        ...room,
        capture_mode: 'photo',
        items_confirmed: itemsConfirmed,
        status: getDerivedRoomStatus(itemsConfirmed, room.items_total),
        items,
      };
    }),
  };
}

function applyOptimisticItemReset(inspection: InspectionRecord, roomId: string, itemId: string): InspectionRecord {
  return {
    ...inspection,
    rooms: inspection.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      const items = room.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              condition: null,
              description: '',
              ai_confidence: null,
              source: 'manual' as const,
              is_confirmed: false,
              photos: [] as string[],
            }
          : item,
      );
      const itemsConfirmed = items.filter((candidate) => candidate.is_confirmed).length;

      return {
        ...room,
        items_confirmed: itemsConfirmed,
        status: getDerivedRoomStatus(itemsConfirmed, room.items_total),
        items,
      };
    }),
  };
}

function getNextIncompleteRoom(inspection: InspectionRecord, currentRoomId: string) {
  return inspection.rooms.find((candidate) => candidate.id !== currentRoomId && candidate.items_confirmed < candidate.items_total) ?? null;
}

function hasUsableAnalysisResult(condition: string | null | undefined, description: string | null | undefined): condition is Condition {
  return Boolean(condition && description && description.trim());
}

export default function RoomCaptureScreen() {
  const router = useRouter();
  const {inspectionId, roomId} = useLocalSearchParams<{inspectionId: string; roomId: string}>();
  const captureSessionRef = useRef(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [captureSheet, setCaptureSheet] = useState<CaptureSheetState | null>(null);
  const [persistingItemIds, setPersistingItemIds] = useState<string[]>([]);
  const [captureInFlight, setCaptureInFlight] = useState<CaptureInFlightState | null>(null);
  const [recentCaptureAssets, setRecentCaptureAssets] = useState<Record<string, ImagePicker.ImagePickerAsset>>({});
  const [lastAutoSaved, setLastAutoSaved] = useState<AutoSavedState | null>(null);

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
        } catch (loadError) {
          if (isActive) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load room.');
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

  const room = inspection?.rooms.find((entry) => entry.id === roomId) ?? null;
  const isPersistingAny = persistingItemIds.length > 0;
  const isInteractionLocked = Boolean(captureSheet) || Boolean(captureInFlight) || isPersistingAny;
  const items = room?.items ?? [];
  const capturedCount = room?.items_confirmed ?? 0;
  const flaggedCount = items.filter((item) => item.is_confirmed && item.condition === 'poor').length;
  const remainingCount = room ? room.items_total - room.items_confirmed : 0;
  const armedItem = items.find((item) => !item.is_confirmed) ?? null;
  const roomComplete = Boolean(room && room.items_confirmed === room.items_total);
  const nextIncompleteRoom = inspection && room ? getNextIncompleteRoom(inspection, room.id) : null;

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  function clearAutoSaveBanner() {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setLastAutoSaved(null);
  }

  function showAutoSaveBanner(state: AutoSavedState) {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setLastAutoSaved(state);
    autoSaveTimerRef.current = setTimeout(() => {
      setLastAutoSaved(null);
      autoSaveTimerRef.current = null;
    }, 4000);
  }

  function openCaptureSheet(
    item: ItemRecord,
    options: {
      mode: ItemCaptureSheetMode;
      asset?: ImagePicker.ImagePickerAsset;
      error?: string | null;
      condition?: Condition | null;
      description?: string;
      photoName?: string;
    },
  ) {
    captureSessionRef.current += 1;
    setCaptureSheet({
      item,
      mode: options.mode,
      sessionId: captureSessionRef.current,
      initialAsset: options.asset,
      initialError: options.error ?? null,
      initialCondition: options.condition,
      initialDescription: options.description,
      initialPhotoName: options.photoName,
    });
  }

  async function handleItemPress(item: ItemRecord) {
    if (!inspection || !room) {
      return;
    }

    setError(null);
    clearAutoSaveBanner();

    if (item.is_confirmed) {
      openCaptureSheet(item, {
        mode: 'edit',
        asset: recentCaptureAssets[item.id],
        condition: item.condition,
        description: item.description,
        photoName: item.photos[0],
      });
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        openCaptureSheet(item, {
          mode: 'fallback',
          error: 'Camera permission is required to capture inspection photos.',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        openCaptureSheet(item, {
          mode: 'fallback',
          error: 'Camera capture cancelled.',
        });
        return;
      }

      const asset = result.assets[0];
      setCaptureInFlight({itemId: item.id, itemName: item.name, stage: 'analysing'});

      try {
        const analysis = await analysePhoto(inspection.id, room.id, asset, item.id);
        if (!hasUsableAnalysisResult(analysis.condition, analysis.description)) {
          setCaptureInFlight(null);
          openCaptureSheet(item, {
            mode: 'manual_review',
            asset,
            error: 'AI analysis returned an incomplete result. You can confirm it manually.',
            condition: analysis.condition ?? item.condition,
            description: analysis.description,
            photoName: analysis.photo_name,
          });
          return;
        }

        const currentInspection = inspection;
        const nextItem = room.items.find((candidate) => candidate.id !== item.id && !candidate.is_confirmed);
        const payload: ItemCaptureConfirmPayload = {
          itemId: item.id,
          condition: analysis.condition,
          description: analysis.description,
          source: 'photo_ai',
          photoName: analysis.photo_name,
        };
        const optimisticInspection = applyOptimisticItemUpdate(currentInspection, room.id, payload);

        setCaptureInFlight({itemId: item.id, itemName: item.name, stage: 'saving'});
        setInspection(optimisticInspection);
        setRecentCaptureAssets((current) => ({...current, [item.id]: asset}));
        setPersistingItemIds((current) => [...current, item.id]);

        try {
          const updated = await updateItem(currentInspection.id, room.id, {
            item_id: payload.itemId,
            condition: payload.condition,
            description: payload.description,
            is_confirmed: true,
            source: payload.source,
            photo_name: payload.photoName,
          });
          setInspection(updated);
          showAutoSaveBanner({
            itemId: item.id,
            itemName: item.name,
            condition: payload.condition,
            description: payload.description,
            photoName: payload.photoName,
            asset,
            nextItemId: nextItem?.id,
            nextItemName: nextItem?.name,
          });
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : 'Failed to save this item.');
          try {
            setInspection(await getInspection(currentInspection.id));
          } catch {
            setInspection(currentInspection);
          }
        } finally {
          setPersistingItemIds((current) => current.filter((itemId) => itemId !== item.id));
          setCaptureInFlight(null);
        }
      } catch (analysisError) {
        setCaptureInFlight(null);
        openCaptureSheet(item, {
          mode: 'manual_review',
          asset,
          error: analysisError instanceof Error ? analysisError.message : 'AI analysis failed. You can continue manually.',
        });
      }
    } catch (captureError) {
      openCaptureSheet(item, {
        mode: 'fallback',
        error: captureError instanceof Error ? captureError.message : 'Unable to open the camera right now.',
      });
    }
  }

  function dismissCaptureSheet() {
    setCaptureSheet(null);
  }

  function handleItemConfirm(payload: ItemCaptureConfirmPayload) {
    if (!inspection || !room) {
      return;
    }

    const previousInspection = inspection;
    const optimisticInspection = applyOptimisticItemUpdate(previousInspection, room.id, payload);
    const currentInspectionId = inspection.id;
    const currentRoomId = room.id;

    clearAutoSaveBanner();
    setInspection(optimisticInspection);
    if (captureSheet?.initialAsset) {
      setRecentCaptureAssets((current) => ({...current, [payload.itemId]: captureSheet.initialAsset as ImagePicker.ImagePickerAsset}));
    }
    setPersistingItemIds((current) => [...current, payload.itemId]);

    void (async () => {
      try {
        const updated = await updateItem(currentInspectionId, currentRoomId, {
          item_id: payload.itemId,
          condition: payload.condition,
          description: payload.description,
          is_confirmed: true,
          source: payload.source,
          photo_name: payload.photoName,
        });
        setInspection(updated);
        setSuccessMessage('Item updated');
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to confirm item.');
        try {
          setInspection(await getInspection(currentInspectionId));
        } catch {
          setInspection(previousInspection);
        }
      } finally {
        setPersistingItemIds((current) => current.filter((itemId) => itemId !== payload.itemId));
      }
    })();
  }

  function handleEditLastAutoSaved() {
    if (!inspection || !room || !lastAutoSaved) {
      return;
    }

    const currentItem = room.items.find((candidate) => candidate.id === lastAutoSaved.itemId);
    if (!currentItem) {
      return;
    }

    clearAutoSaveBanner();
    openCaptureSheet(currentItem, {
      mode: 'edit',
      asset: lastAutoSaved.asset,
      condition: currentItem.condition,
      description: currentItem.description,
      photoName: lastAutoSaved.photoName ?? currentItem.photos[0],
    });
  }

  function handleUndoLastAutoSaved() {
    if (!inspection || !room || !lastAutoSaved) {
      return;
    }

    const currentInspection = inspection;
    const targetItemId = lastAutoSaved.itemId;
    clearAutoSaveBanner();
    setInspection(applyOptimisticItemReset(currentInspection, room.id, targetItemId));
    setPersistingItemIds((current) => [...current, targetItemId]);

    void (async () => {
      try {
        const updated = await resetItem(currentInspection.id, room.id, targetItemId);
        setInspection(updated);
        setSuccessMessage('Item reverted');
      } catch (undoError) {
        setError(undoError instanceof Error ? undoError.message : 'Failed to undo this item.');
        try {
          setInspection(await getInspection(currentInspection.id));
        } catch {
          setInspection(currentInspection);
        }
      } finally {
        setPersistingItemIds((current) => current.filter((itemId) => itemId !== targetItemId));
      }
    })();
  }

  let roomCompletionLabel: string | null = null;
  let roomCompletionAction: (() => void) | null = null;

  if (inspection && room && roomComplete) {
    if (nextIncompleteRoom) {
      roomCompletionLabel = `Next room: ${nextIncompleteRoom.name}`;
      roomCompletionAction = () => router.push(`/inspection/${inspection.id}/room/${nextIncompleteRoom.id}`);
    } else if (!inspection.sections_completed) {
      roomCompletionLabel = 'Continue fixed sections';
      roomCompletionAction = () => router.push(`/inspection/${inspection.id}/sections`);
    } else {
      roomCompletionLabel = 'Finish inspection review';
      roomCompletionAction = () => router.push(`/inspection/${inspection.id}/review`);
    }
  }

  return (
    <>
      <AppStackScreen
        confirmMessage="Unsaved changes will be lost."
        confirmTitle="Leave this room?"
        fallbackBackLabel="Inspection"
        fallbackHref={`/inspection/${inspectionId}`}
        inspection={inspection}
        preventRemove={Boolean(captureSheet)}
        title={room ? `${room.name} - Capture` : 'Room Capture'}
      />
      <View style={styles.root}>
        <Screen includeTopInset={false} showHeader={false}>
          {successMessage ? <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} /> : null}
          {error ? <Notice>{error}</Notice> : null}
          {loading ? <LoadingRow label="Loading room" /> : null}

          {!loading && inspection && !room ? (
            <Card>
              <Notice>We couldn't find this room in the current inspection.</Notice>
              <Button label="Back to inspection" variant="secondary" onPress={() => router.push(`/inspection/${inspectionId}`)} />
            </Card>
          ) : null}

          {inspection && room ? (
            <>
              <Card>
                <View style={styles.roomSummaryHeader}>
                  <Text style={styles.sectionTitle}>{room.name}</Text>
                  <Text style={styles.helperText}>
                    {roomComplete
                      ? roomCompletionLabel
                        ? `Room complete. ${roomCompletionLabel}.`
                        : 'Room complete.'
                      : armedItem
                        ? `Next up: ${armedItem.name}. Capture evidence to keep moving.`
                        : 'Capture the remaining items in this room.'}
                  </Text>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{capturedCount}</Text>
                    <Text style={styles.metricLabel}>Captured</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={[styles.metricValue, styles.flaggedMetric]}>{flaggedCount}</Text>
                    <Text style={styles.metricLabel}>Flagged</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{remainingCount}</Text>
                    <Text style={styles.metricLabel}>Remaining</Text>
                  </View>
                </View>
              </Card>

              {captureInFlight ? (
                <Card>
                  <View style={styles.inFlightRow}>
                    <Text style={styles.inFlightTitle}>
                      {captureInFlight.stage === 'analysing' ? 'Analysing evidence...' : 'Saving item...'}
                    </Text>
                    <LoadingRow label={captureInFlight.itemName} />
                  </View>
                </Card>
              ) : null}

              {!roomComplete && lastAutoSaved ? (
                <Card>
                  <View style={styles.autoSaveHeader}>
                    <Text style={styles.autoSaveTitle}>{lastAutoSaved.itemName} saved as {formatCondition(lastAutoSaved.condition)}</Text>
                    <Text style={styles.autoSaveCopy}>
                      {lastAutoSaved.nextItemName ? `Next item armed: ${lastAutoSaved.nextItemName}.` : 'Room capture updated.'}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Button label="Undo" variant="secondary" onPress={handleUndoLastAutoSaved} disabled={isInteractionLocked} />
                    <Button label="Edit" variant="secondary" onPress={handleEditLastAutoSaved} disabled={isInteractionLocked} />
                  </View>
                </Card>
              ) : null}

              <Card>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Inspection items</Text>
                  <Text style={styles.helperText}>Tap the highlighted next item to capture it fast. Tap a saved item to review or adjust it.</Text>
                </View>

                {room.items.length === 0 ? (
                  <EmptyState icon="inbox" message="No checklist items for this room." />
                ) : (
                  room.items.map((item) => {
                    const isPersisting = persistingItemIds.includes(item.id);
                    const isDisabled = isInteractionLocked;
                    const isArmed = armedItem?.id === item.id;
                    const isFlagged = item.is_confirmed && item.condition === 'poor';
                    const subtitle = item.is_confirmed
                      ? isFlagged
                        ? 'Flagged item. Tap to review or correct it.'
                        : 'Captured item. Tap to review or adjust it.'
                      : isArmed
                        ? 'Next item armed. Tap to capture now.'
                        : 'Tap to capture this item.';
                    const titleAdornment = isPersisting ? (
                      <Text style={styles.savingTag}>Saving</Text>
                    ) : isArmed ? (
                      <Text style={styles.nextTag}>Next</Text>
                    ) : isFlagged ? (
                      <Text style={styles.flaggedTag}>Flagged</Text>
                    ) : null;

                    return (
                      <Pressable
                        key={item.id}
                        disabled={isDisabled}
                        onPress={() => void handleItemPress(item)}
                        style={({pressed}) => [
                          styles.itemRow,
                          isArmed ? styles.itemRowArmed : null,
                          isFlagged ? styles.itemRowFlagged : null,
                          pressed && !isDisabled ? styles.itemRowPressed : null,
                          isDisabled ? styles.itemRowDisabled : null,
                        ]}
                      >
                        <StatusSummaryRow
                          subtitle={item.description || subtitle}
                          statusValue={item.is_confirmed ? item.condition ?? 'confirmed' : item.condition ?? 'pending'}
                          title={item.name}
                          titleAdornment={titleAdornment}
                        />
                      </Pressable>
                    );
                  })
                )}
              </Card>

              {roomComplete && roomCompletionLabel && roomCompletionAction ? (
                <Button label={roomCompletionLabel} onPress={roomCompletionAction} disabled={isInteractionLocked} />
              ) : null}
              <Button label="Review flagged items" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/review`)} disabled={isInteractionLocked} />
            </>
          ) : null}
        </Screen>

        {inspection && room && captureSheet ? (
          <ItemCaptureSheet
            key={`${captureSheet.item.id}-${captureSheet.sessionId}`}
            initialCondition={captureSheet.initialCondition}
            initialDescription={captureSheet.initialDescription}
            initialAsset={captureSheet.initialAsset}
            initialError={captureSheet.initialError}
            initialPhotoName={captureSheet.initialPhotoName}
            inspectionId={inspection.id}
            item={captureSheet.item}
            mode={captureSheet.mode}
            onConfirm={handleItemConfirm}
            onDismiss={dismissCaptureSheet}
            roomId={room.id}
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  roomSummaryHeader: {
    gap: spacing.tightGap,
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
  inFlightRow: {
    gap: spacing.tightGap,
  },
  inFlightTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  autoSaveHeader: {
    gap: spacing.tightGap,
  },
  autoSaveTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  autoSaveCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.tightGap,
  },
  sectionHeader: {
    gap: spacing.tightGap,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  helperText: {
    ...typography.body,
    color: colours.textSecondary,
  },
  itemRow: {
    borderRadius: radii.card,
    borderColor: borders.subtle,
    borderWidth: 1,
    backgroundColor: colours.surface,
    padding: 14,
    shadowColor: colours.textPrimary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  itemRowArmed: {
    borderColor: withAlpha(colours.primary, 0.3),
    backgroundColor: withAlpha(colours.primary, 0.05),
  },
  itemRowFlagged: {
    borderColor: withAlpha(colours.destructive, 0.22),
  },
  itemRowPressed: {
    backgroundColor: withAlpha(colours.primary, 0.04),
    borderColor: withAlpha(colours.primary, 0.26),
  },
  itemRowDisabled: {
    opacity: 0.72,
  },
  savingTag: {
    ...typography.label,
    color: colours.accent,
  },
  nextTag: {
    ...typography.label,
    color: colours.primary,
  },
  flaggedTag: {
    ...typography.label,
    color: colours.destructive,
  },
});
