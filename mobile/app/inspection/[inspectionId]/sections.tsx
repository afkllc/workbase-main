import {useEffect, useRef, useState} from 'react';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Picker} from '@react-native-picker/picker';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Button, Card, Label, LoadingRow, Notice, Screen, SuccessBanner, TextField, ToggleRow} from '../../../src/components/ui';
import {getInspection, updateSections} from '../../../src/lib/api';
import type {InspectionRecord} from '../../../src/lib/types';
import {formatDisplayName} from '../../../src/lib/utils';
import {AppStackScreen} from '../../../src/navigation/AppStackScreen';
import {borders, colours, layout, radii, spacing, surfaces, typography} from '../../../src/theme';

export default function SectionsScreen() {
  const router = useRouter();
  const {inspectionId} = useLocalSearchParams<{inspectionId: string}>();
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shouldNavigateToReviewAfterSuccess, setShouldNavigateToReviewAfterSuccess] = useState(false);
  const [initialSectionsSnapshot, setInitialSectionsSnapshot] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
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
          setInitialSectionsSnapshot(JSON.stringify(data.sections));
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load sections.');
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
  }, [inspectionId]);

  const isDirty = Boolean(inspection && initialSectionsSnapshot && JSON.stringify(inspection.sections) !== initialSectionsSnapshot);
  const allRoomsComplete = inspection ? inspection.rooms.every((room) => room.items_confirmed === room.items_total) : false;

  async function save() {
    if (!inspection) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateSections(inspection.id, {
        meter_readings: inspection.sections.meter_readings,
        keys_and_fobs: inspection.sections.keys_and_fobs,
        general_observations: inspection.sections.general_observations,
      });
      setInspection(updated);
      setInitialSectionsSnapshot(JSON.stringify(updated.sections));
      scrollViewRef.current?.scrollTo({y: 0, animated: true});
      setSuccessMessage('Sections saved');
      setShouldNavigateToReviewAfterSuccess(allRoomsComplete);
    } catch (err) {
      setSuccessMessage(null);
      setShouldNavigateToReviewAfterSuccess(false);
      setError(err instanceof Error ? err.message : 'Failed to save sections.');
    } finally {
      setSaving(false);
    }
  }

  function handleSuccessBannerDismiss() {
    setSuccessMessage(null);
    if (shouldNavigateToReviewAfterSuccess && inspection) {
      setShouldNavigateToReviewAfterSuccess(false);
      router.push(`/inspection/${inspection.id}/review`);
      return;
    }

    router.back();
  }

  return (
    <>
      <AppStackScreen
        confirmMessage="Unsaved changes will be lost."
        confirmTitle="Leave this screen?"
        fallbackBackLabel="Inspection"
        fallbackHref={`/inspection/${inspectionId}`}
        inspection={inspection}
        preventRemove={isDirty}
        title="Inspection Sections"
      />
      <Screen includeTopInset={false} showHeader={false} scroll={false}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error ? <Notice>{error}</Notice> : null}
          {successMessage ? <SuccessBanner message={successMessage} onDismiss={handleSuccessBannerDismiss} /> : null}
          {loading ? <LoadingRow label="Loading sections" /> : null}
          {inspection ? (
            <>
              {isDirty ? (
                <Card>
                  <Text style={styles.sectionTitle}>Unsaved changes</Text>
                  <Text style={styles.sectionBody}>Save your property details before leaving this screen.</Text>
                </Card>
              ) : null}

              {allRoomsComplete ? (
                <Card>
                  <Text style={styles.sectionTitle}>Final capture step</Text>
                  <Text style={styles.sectionBody}>Save these fixed sections once to unlock the final inspection review.</Text>
                </Card>
              ) : null}

              <Card>
                <Text style={styles.sectionTitle}>Meter readings</Text>
                <Text style={styles.sectionBody}>Capture the latest gas, electric, and water readings for the inspection.</Text>
                <Label>Gas</Label>
                <TextField value={inspection.sections.meter_readings.gas} onChangeText={(gas) => setInspection({...inspection, sections: {...inspection.sections, meter_readings: {...inspection.sections.meter_readings, gas}}})} />
                <Label>Electric</Label>
                <TextField value={inspection.sections.meter_readings.electric} onChangeText={(electric) => setInspection({...inspection, sections: {...inspection.sections, meter_readings: {...inspection.sections.meter_readings, electric}}})} />
                <Label>Water</Label>
                <TextField value={inspection.sections.meter_readings.water} onChangeText={(water) => setInspection({...inspection, sections: {...inspection.sections, meter_readings: {...inspection.sections.meter_readings, water}}})} />
              </Card>

              <Card>
                <Text style={styles.sectionTitle}>Keys and fobs</Text>
                <Text style={styles.sectionBody}>Record the quantities handed over for entry and access items.</Text>
                {Object.entries(inspection.sections.keys_and_fobs).map(([label, quantity]) => (
                  <View key={label} style={styles.keyRow}>
                    <Text ellipsizeMode="tail" numberOfLines={1} style={styles.keyLabel}>{formatDisplayName(label)}</Text>
                    <TextInput
                      keyboardType="numeric"
                      onChangeText={(value) =>
                        setInspection({
                          ...inspection,
                          sections: {
                            ...inspection.sections,
                            keys_and_fobs: {
                              ...inspection.sections.keys_and_fobs,
                              [label]: Number(value || 0),
                            },
                          },
                        })
                      }
                      style={styles.qtyInput}
                      value={String(quantity)}
                    />
                  </View>
                ))}
              </Card>

              <Card>
                <Text style={styles.sectionTitle}>General observations</Text>
                <Text style={styles.sectionBody}>Capture the overall condition and any additional property notes.</Text>
                <ToggleRow label="Smoke alarms present" onValueChange={(smoke_alarms) => setInspection({...inspection, sections: {...inspection.sections, general_observations: {...inspection.sections.general_observations, smoke_alarms}}})} value={inspection.sections.general_observations.smoke_alarms} />
                <ToggleRow label="CO detector present" onValueChange={(co_detector) => setInspection({...inspection, sections: {...inspection.sections, general_observations: {...inspection.sections.general_observations, co_detector}}})} value={inspection.sections.general_observations.co_detector} />
                <Label>Overall cleanliness</Label>
                <View style={styles.pickerShell}>
                  <Picker selectedValue={inspection.sections.general_observations.overall_cleanliness} onValueChange={(overall_cleanliness) => setInspection({...inspection, sections: {...inspection.sections, general_observations: {...inspection.sections.general_observations, overall_cleanliness}}})}>
                    <Picker.Item label="Professional clean" value="professional_clean" />
                    <Picker.Item label="Good" value="good" />
                    <Picker.Item label="Fair" value="fair" />
                    <Picker.Item label="Poor" value="poor" />
                  </Picker>
                </View>
                <Label>Additional notes</Label>
                <TextField multiline value={inspection.sections.general_observations.additional_notes} onChangeText={(additional_notes) => setInspection({...inspection, sections: {...inspection.sections, general_observations: {...inspection.sections.general_observations, additional_notes}}})} />
              </Card>

              <Pressable disabled={saving} onPress={() => void save()} style={({pressed}) => [styles.saveButton, saving ? styles.saveButtonDisabled : null, pressed && !saving ? styles.saveButtonPressed : null]}>
                {saving ? (
                  <View style={styles.saveButtonLoading}>
                    <ActivityIndicator color={colours.surface} size="small" />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>{allRoomsComplete ? 'Save and continue to review' : 'Save sections'}</Text>
                )}
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.screenGutter,
    paddingTop: 16,
    paddingBottom: 40,
    gap: spacing.sectionGap,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  sectionBody: {
    ...typography.body,
    color: colours.textSecondary,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.compactGap,
  },
  keyLabel: {
    ...typography.body,
    color: colours.textPrimary,
    flex: 1,
  },
  qtyInput: {
    width: 76,
    backgroundColor: surfaces.muted,
    borderColor: borders.subtle,
    borderWidth: 1,
    borderRadius: radii.input,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colours.textPrimary,
  },
  pickerShell: {
    borderRadius: radii.input,
    borderColor: borders.subtle,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: surfaces.muted,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: radii.button,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.primary,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonPressed: {
    opacity: 0.92,
  },
  saveButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.tightGap,
  },
  saveButtonText: {
    color: colours.surface,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
});
