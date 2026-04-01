import {Redirect, useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {StatusSummaryRow} from '../../../../../src/components/StatusSummaryRow';
import {Button, Card, LoadingRow, Notice, Screen} from '../../../../../src/components/ui';
import {featureFlags} from '../../../../../src/features/flags';
import {getInspection, runVideoScan} from '../../../../../src/lib/api';
import type {InspectionRecord} from '../../../../../src/lib/types';
import {AppStackScreen} from '../../../../../src/navigation/AppStackScreen';
import {colours, typography} from '../../../../../src/theme';

export default function VideoScanScreen() {
  const router = useRouter();
  const {inspectionId, roomId} = useLocalSearchParams<{inspectionId: string; roomId: string}>();

  if (!featureFlags.videoScan && inspectionId && roomId) {
    return <Redirect href={`/inspection/${inspectionId}/room/${roomId}`} />;
  }

  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

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
            setError(err instanceof Error ? err.message : 'Failed to load video scan screen.');
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

  const room = useMemo(() => inspection?.rooms.find((entry) => entry.id === roomId) ?? null, [inspection, roomId]);
  const roomHasUnconfirmedItems = room ? room.items.some((item) => !item.is_confirmed) : false;

  async function handleRunScan() {
    if (!inspection || !room) {
      return;
    }

    setRunning(true);
    setError(null);
    try {
      const updated = await runVideoScan(inspection.id, room.id);
      setInspection(updated);
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run room scan.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <AppStackScreen
        fallbackBackLabel="Inspection"
        fallbackHref={`/inspection/${inspectionId}`}
        inspection={inspection}
        title={room ? `${room.name} - Quick Scan` : 'Quick Scan'}
      />
      <Screen includeTopInset={false} showHeader={false}>
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <LoadingRow label="Loading room context" /> : null}
        {!loading && inspection && !room ? (
          <Card>
            <Notice>We couldn't find this room for quick scan.</Notice>
            <Button label="Back to capture" variant="secondary" onPress={() => router.push(`/inspection/${inspectionId}/room/${roomId}`)} />
          </Card>
        ) : null}

        {inspection && room ? (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Room quick scan</Text>
              <Text style={styles.bodyText}>
                Analyse all items in this room at once. The scan will assess each item and suggest conditions automatically.
              </Text>
              <Button label={running ? 'Scanning...' : 'Start quick scan'} onPress={() => void handleRunScan()} disabled={running} />
            </Card>

            <Card>
              <StatusSummaryRow
                subtitle={`${room.items_confirmed} of ${room.items_total} items confirmed`}
                statusValue={room.status}
                title="Room status"
              />
              {completed ? (
                <Text style={styles.successText}>
                  {roomHasUnconfirmedItems ? 'Scan complete. Review the updated items below.' : 'Scan complete. You can return to room capture.'}
                </Text>
              ) : null}
            </Card>

            {completed ? (
              <Button
                label={roomHasUnconfirmedItems ? 'Review updated items' : 'Back to room capture'}
                onPress={() =>
                  router.push(roomHasUnconfirmedItems ? `/inspection/${inspection.id}/review` : `/inspection/${inspection.id}/room/${room.id}`)
                }
              />
            ) : null}

            <Card>
              <Text style={styles.sectionTitle}>Updated items</Text>
              {room.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <StatusSummaryRow subtitle={item.description || 'No description yet.'} statusValue={item.condition ?? 'pending'} title={item.name} />
                </View>
              ))}
              <View style={styles.actions}>
                <Button label="Open review" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/review`)} />
                <Button label="Back to capture" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/room/${room.id}`)} />
              </View>
            </Card>
          </>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  bodyText: {
    ...typography.body,
    color: colours.textSecondary,
  },
  successText: {
    color: colours.success,
    ...typography.body,
    fontWeight: '600',
  },
  itemRow: {
    borderRadius: 16,
    borderColor: colours.border,
    borderWidth: 1,
    backgroundColor: colours.background,
    padding: 14,
    gap: 12,
  },
  actions: {
    gap: 10,
  },
});
