import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useRef, useState} from 'react';
import * as ImagePicker from 'expo-image-picker';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {EmptyState} from '../../../../src/components/EmptyState';
import {ItemCaptureSheet, type ItemCaptureConfirmPayload} from '../../../../src/components/ItemCaptureSheet';
import {StatusSummaryRow} from '../../../../src/components/StatusSummaryRow';
import {Button, Card, LoadingRow, Notice, Screen, SuccessBanner} from '../../../../src/components/ui';
import {getInspection, updateItem} from '../../../../src/lib/api';
import type {InspectionRecord, ItemRecord} from '../../../../src/lib/types';
import {AppStackScreen} from '../../../../src/navigation/AppStackScreen';
import {borders, colours, radii, spacing, typography, withAlpha} from '../../../../src/theme';

type CaptureSheetState = {
  item: ItemRecord;
  sessionId: number;
  initialAsset?: ImagePicker.ImagePickerAsset;
  initialError?: string | null;
};

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
        status: itemsConfirmed === room.items_total ? 'confirmed' : 'review',
        items,
      };
    }),
  };
}

export default function RoomCaptureScreen() {
  const router = useRouter();
  const {inspectionId, roomId} = useLocalSearchParams<{inspectionId: string; roomId: string}>();
  const captureSessionRef = useRef(0);
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [captureSheet, setCaptureSheet] = useState<CaptureSheetState | null>(null);
  const [persistingItemIds, setPersistingItemIds] = useState<string[]>([]);

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

  function openCaptureSheet(item: ItemRecord, options?: {asset?: ImagePicker.ImagePickerAsset; error?: string | null}) {
    captureSessionRef.current += 1;
    setCaptureSheet({
      item,
      sessionId: captureSessionRef.current,
      initialAsset: options?.asset,
      initialError: options?.error ?? null,
    });
  }

  async function handleItemPress(item: ItemRecord) {
    if (!inspection || !room) {
      return;
    }

    setError(null);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        openCaptureSheet(item, {error: 'Camera permission is required to capture inspection photos.'});
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        openCaptureSheet(item, {error: 'Camera capture cancelled.'});
        return;
      }

      openCaptureSheet(item, {asset: result.assets[0]});
    } catch (captureError) {
      openCaptureSheet(item, {
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

    setInspection(optimisticInspection);
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
        setSuccessMessage('Item confirmed');
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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Checklist</Text>
                  <Text style={styles.helperText}>Tap an item to open the camera and confirm it from the capture sheet.</Text>
                </View>

                {room.items.length === 0 ? (
                  <EmptyState icon="inbox" message="No checklist items for this room." />
                ) : (
                  room.items.map((item) => {
                    const isPersisting = persistingItemIds.includes(item.id);
                    const isDisabled = Boolean(captureSheet) || isPersistingAny;

                    return (
                      <Pressable
                        key={item.id}
                        disabled={isDisabled}
                        onPress={() => void handleItemPress(item)}
                        style={({pressed}) => [
                          styles.itemRow,
                          pressed && !isDisabled ? styles.itemRowPressed : null,
                          isDisabled ? styles.itemRowDisabled : null,
                        ]}
                      >
                        <StatusSummaryRow
                          subtitle={item.description || (item.is_confirmed ? 'Confirmed item.' : 'Tap to capture or review this item.')}
                          statusValue={item.is_confirmed ? 'confirmed' : item.condition ?? 'pending'}
                          title={item.name}
                          titleAdornment={isPersisting ? <Text style={styles.savingTag}>Saving</Text> : null}
                        />
                      </Pressable>
                    );
                  })
                )}
              </Card>

              <Button label="Open review" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/review`)} disabled={Boolean(captureSheet) || isPersistingAny} />
              <Button label="Back to inspection" onPress={() => router.push(`/inspection/${inspection.id}`)} disabled={Boolean(captureSheet) || isPersistingAny} />
            </>
          ) : null}
        </Screen>

        {inspection && room && captureSheet ? (
          <ItemCaptureSheet
            key={`${captureSheet.item.id}-${captureSheet.sessionId}`}
            initialAsset={captureSheet.initialAsset}
            initialError={captureSheet.initialError}
            inspectionId={inspection.id}
            item={captureSheet.item}
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
});
