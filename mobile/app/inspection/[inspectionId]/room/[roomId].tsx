import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useState} from 'react';
import * as ImagePicker from 'expo-image-picker';
import {Picker} from '@react-native-picker/picker';
import {Image, StyleSheet, Text, View} from 'react-native';
import {StatusSummaryRow} from '../../../../src/components/StatusSummaryRow';
import {Button, Card, Label, LoadingRow, Notice, Screen, SuccessBanner, TextField} from '../../../../src/components/ui';
import {analysePhoto, getInspection, updateItem} from '../../../../src/lib/api';
import type {AnalysisSuggestion, Condition, InspectionRecord} from '../../../../src/lib/types';
import {formatCondition} from '../../../../src/lib/utils';
import {AppStackScreen} from '../../../../src/navigation/AppStackScreen';
import {colours, typography} from '../../../../src/theme';

type SuggestionDraft = AnalysisSuggestion & {
  selectedItemId: string;
  descriptionDraft: string;
  conditionDraft: Condition;
  previewUri: string | null;
};

export default function RoomCaptureScreen() {
  const router = useRouter();
  const {inspectionId, roomId} = useLocalSearchParams<{inspectionId: string; roomId: string}>();
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionDraft | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
            setError(err instanceof Error ? err.message : 'Failed to load room.');
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

  async function pickPhoto() {
    if (!inspection || !room) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to upload inspection photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const analysis = await analysePhoto(inspection.id, room.id, result.assets[0]);
      setSuggestion({
        ...analysis,
        selectedItemId: analysis.suggested_item_id,
        descriptionDraft: analysis.description,
        conditionDraft: analysis.condition,
        previewUri: result.assets[0].uri,
      });
      setInspection(await getInspection(inspection.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse photo.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmSuggestion() {
    if (!inspection || !room || !suggestion) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateItem(inspection.id, room.id, {
        item_id: suggestion.selectedItemId,
        condition: suggestion.conditionDraft,
        description: suggestion.descriptionDraft,
        is_confirmed: true,
        source: 'photo_ai',
        photo_name: suggestion.photo_name,
      });
      setInspection(updated);
      setSuggestion(null);
      setSuccessMessage('Item confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm suggestion.');
    } finally {
      setSaving(false);
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
        preventRemove={Boolean(suggestion)}
        title={room ? `${room.name} - Capture` : 'Room Capture'}
      />
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
              <Text style={styles.sectionTitle}>Capture actions</Text>
              <Button label={saving ? 'Working...' : 'Upload photo'} onPress={() => void pickPhoto()} disabled={saving} />
              <Button label="Open review" variant="secondary" onPress={() => router.push(`/inspection/${inspection.id}/review`)} disabled={saving} />
              <Text style={styles.helperText}>Upload a photo for AI analysis, then review or confirm the suggested updates below.</Text>
            </Card>

            {suggestion ? (
              <Card>
                <StatusSummaryRow subtitle={suggestion.suggested_item_name} statusValue={suggestion.confidence} title="AI suggestion" />
                {suggestion.previewUri ? <Image source={{uri: suggestion.previewUri}} style={styles.preview} /> : null}
                <Label>Assign to item</Label>
                <View style={styles.pickerShell}>
                  <Picker selectedValue={suggestion.selectedItemId} onValueChange={(selectedItemId) => setSuggestion({...suggestion, selectedItemId})}>
                    {room.items.map((item) => (
                      <Picker.Item key={item.id} label={item.name} value={item.id} />
                    ))}
                  </Picker>
                </View>
                <Label>Condition</Label>
                <View style={styles.pickerShell}>
                  <Picker
                    selectedValue={suggestion.conditionDraft}
                    onValueChange={(conditionDraft) => setSuggestion({...suggestion, conditionDraft: conditionDraft as Condition})}
                  >
                    {['good', 'fair', 'poor', 'damaged', 'na'].map((value) => (
                      <Picker.Item key={value} label={formatCondition(value)} value={value} />
                    ))}
                  </Picker>
                </View>
                <Label>Description</Label>
                <TextField value={suggestion.descriptionDraft} onChangeText={(descriptionDraft) => setSuggestion({...suggestion, descriptionDraft})} multiline />
                <Button label="Confirm suggestion" onPress={() => void confirmSuggestion()} disabled={saving} />
              </Card>
            ) : null}

            <Card>
              <Text style={styles.sectionTitle}>Checklist</Text>
              {room.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <StatusSummaryRow
                    subtitle={item.description || 'No description yet.'}
                    statusValue={item.is_confirmed ? 'confirmed' : item.condition ?? 'pending'}
                    title={item.name}
                  />
                </View>
              ))}
            </Card>

            <Button label="Back to inspection" onPress={() => router.push(`/inspection/${inspection.id}`)} />
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
  helperText: {
    ...typography.body,
    color: colours.textSecondary,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: colours.background,
  },
  pickerShell: {
    borderRadius: 14,
    borderColor: colours.border,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colours.background,
  },
  itemRow: {
    borderRadius: 16,
    borderColor: colours.border,
    borderWidth: 1,
    backgroundColor: colours.background,
    padding: 14,
    gap: 12,
  },
});
