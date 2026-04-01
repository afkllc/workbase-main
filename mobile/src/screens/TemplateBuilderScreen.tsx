import {useEffect, useMemo, useState} from 'react';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {StyleSheet, Text, View} from 'react-native';
import {Button, Card, Label, LoadingRow, Notice, Screen, TextField, ToggleRow} from '../components/ui';
import {createTemplate, getTemplate, updateTemplate} from '../lib/api';
import type {Condition, EditableTemplateItem, EditableTemplateRoom, TemplateDetail, TemplateEditorPayload} from '../lib/types';
import {AppStackScreen} from '../navigation/AppStackScreen';
import {borders, colours, radii, spacing, surfaces, typography} from '../theme';

const CONDITION_OPTIONS: Condition[] = ['good', 'fair', 'poor', 'damaged', 'na'];

function newItem(): EditableTemplateItem {
  return {
    key: '',
    name: '',
    condition_options: ['good', 'fair', 'poor', 'damaged'],
    photo_required: false,
    max_photos: 1,
    guidance_note: '',
    ai_hints: [],
  };
}

function newRoom(): EditableTemplateRoom {
  return {
    key: '',
    name: '',
    is_required: true,
    items: [newItem()],
  };
}

function normalizeTemplate(template: TemplateDetail): TemplateEditorPayload {
  const allRooms = [...template.rooms, ...template.optional_rooms].sort((left, right) => left.display_order - right.display_order);
  return {
    name: template.name,
    property_type: template.property_type,
    rooms: allRooms.map((room) => ({
      key: room.key,
      name: room.name,
      is_required: room.is_required,
      items: room.items.map((item) => ({
        key: item.key,
        name: item.name,
        condition_options: item.condition_options,
        photo_required: item.photo_required,
        max_photos: item.max_photos,
        guidance_note: item.guidance_note,
        ai_hints: item.ai_hints,
      })),
    })),
  };
}

function parseConditionOptions(value: string): Condition[] {
  const normalized = value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is Condition => CONDITION_OPTIONS.includes(entry as Condition));

  return normalized.length ? normalized : ['good', 'fair', 'poor', 'damaged'];
}

function parseHints(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function TemplateBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{templateKey?: string}>();
  const [draft, setDraft] = useState<TemplateEditorPayload>({
    name: '',
    property_type: '',
    rooms: [newRoom()],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);

  const editing = Boolean(params.templateKey);

  useEffect(() => {
    let isActive = true;

    async function load() {
      if (!params.templateKey) {
        setTemplateName(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const template = await getTemplate(params.templateKey);
        if (isActive) {
          if (!template.is_editable) {
            setError('Built-in templates are read-only.');
          } else {
            setDraft(normalizeTemplate(template));
            setTemplateName(template.name);
          }
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load template.');
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
  }, [params.templateKey]);

  const canSave = useMemo(
    () =>
      draft.name.trim().length > 0 &&
      draft.property_type.trim().length > 0 &&
      draft.rooms.length > 0 &&
      draft.rooms.every((room) => room.name.trim().length > 0 && room.items.length > 0 && room.items.every((item) => item.name.trim().length > 0)),
    [draft],
  );

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const saved = editing && params.templateKey ? await updateTemplate(params.templateKey, draft) : await createTemplate(draft);
      router.replace(`/new-inspection?templateKey=${saved.key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppStackScreen fallbackBackLabel="New Inspection" fallbackHref="/new-inspection" title={editing ? templateName ?? 'Edit Template' : 'Create Template'} />
      <Screen includeTopInset={false} showHeader={false}>
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <LoadingRow label="Loading template builder" /> : null}

        <Card>
          <Text style={styles.kicker}>Template builder</Text>
          <Text style={styles.heroTitle}>{editing ? 'Refine this template for future inspections.' : 'Build a reusable inspection template.'}</Text>
          <Text style={styles.heroBody}>Templates appear in New Inspection and define room structure, checklist items, and capture expectations.</Text>
        </Card>

        <Card>
          <Label>Template name</Label>
          <TextField onChangeText={(name) => setDraft({...draft, name})} placeholder="Student studio template" value={draft.name} />
          <Label>Property type label</Label>
          <TextField onChangeText={(property_type) => setDraft({...draft, property_type})} placeholder="Studio Flat" value={draft.property_type} />
        </Card>

        {draft.rooms.map((room, roomIndex) => (
          <Card key={`${room.key || 'room'}-${roomIndex}`}>
            <View style={styles.roomHeader}>
              <View style={styles.roomTitleBlock}>
                <Text style={styles.sectionTitle}>Room {roomIndex + 1}</Text>
                <Text style={styles.roomStatus}>{room.is_required ? 'Required room' : 'Optional room'}</Text>
              </View>
              <Button label="Delete room" variant="destructive" onPress={() => setDraft({...draft, rooms: draft.rooms.filter((_, index) => index !== roomIndex)})} />
            </View>

            <Label>Room name</Label>
            <TextField
              onChangeText={(name) =>
                setDraft({
                  ...draft,
                  rooms: draft.rooms.map((entry, index) => (index === roomIndex ? {...entry, name} : entry)),
                })
              }
              placeholder="Kitchen"
              value={room.name}
            />
            <ToggleRow
              label="Required room"
              onValueChange={(is_required) =>
                setDraft({
                  ...draft,
                  rooms: draft.rooms.map((entry, index) => (index === roomIndex ? {...entry, is_required} : entry)),
                })
              }
              value={room.is_required}
            />

            {room.items.map((item, itemIndex) => (
              <View key={`${item.key || 'item'}-${itemIndex}`} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Checklist item {itemIndex + 1}</Text>
                  <Button
                    label="Delete item"
                    variant="destructive"
                    onPress={() =>
                      setDraft({
                        ...draft,
                        rooms: draft.rooms.map((entry, index) =>
                          index === roomIndex ? {...entry, items: entry.items.filter((_, currentIndex) => currentIndex !== itemIndex)} : entry,
                        ),
                      })
                    }
                  />
                </View>
                <Label>Item name</Label>
                <TextField
                  onChangeText={(name) =>
                    setDraft({
                      ...draft,
                      rooms: draft.rooms.map((entry, index) =>
                        index === roomIndex
                          ? {
                              ...entry,
                              items: entry.items.map((currentItem, currentIndex) => (currentIndex === itemIndex ? {...currentItem, name} : currentItem)),
                            }
                          : entry,
                      ),
                    })
                  }
                  placeholder="Walls and ceiling"
                  value={item.name}
                />
                <Label>Condition options</Label>
                <TextField
                  onChangeText={(value) =>
                    setDraft({
                      ...draft,
                      rooms: draft.rooms.map((entry, index) =>
                        index === roomIndex
                          ? {
                              ...entry,
                              items: entry.items.map((currentItem, currentIndex) =>
                                currentIndex === itemIndex ? {...currentItem, condition_options: parseConditionOptions(value)} : currentItem,
                              ),
                            }
                          : entry,
                      ),
                    })
                  }
                  placeholder="good, fair, poor, damaged"
                  value={item.condition_options.join(', ')}
                />
                <ToggleRow
                  label="Photo required"
                  onValueChange={(photo_required) =>
                    setDraft({
                      ...draft,
                      rooms: draft.rooms.map((entry, index) =>
                        index === roomIndex
                          ? {
                              ...entry,
                              items: entry.items.map((currentItem, currentIndex) =>
                                currentIndex === itemIndex ? {...currentItem, photo_required} : currentItem,
                              ),
                            }
                          : entry,
                      ),
                    })
                  }
                  value={item.photo_required}
                />
                <Label>Max photos</Label>
                <TextField
                  onChangeText={(value) =>
                    setDraft({
                      ...draft,
                      rooms: draft.rooms.map((entry, index) =>
                        index === roomIndex
                          ? {
                              ...entry,
                              items: entry.items.map((currentItem, currentIndex) =>
                                currentIndex === itemIndex ? {...currentItem, max_photos: Number(value || 1)} : currentItem,
                              ),
                            }
                          : entry,
                      ),
                    })
                  }
                  placeholder="1"
                  value={String(item.max_photos)}
                />
                <Label>Guidance note</Label>
                <TextField
                  multiline
                  onChangeText={(guidance_note) =>
                    setDraft({
                      ...draft,
                      rooms: draft.rooms.map((entry, index) =>
                        index === roomIndex
                          ? {
                              ...entry,
                              items: entry.items.map((currentItem, currentIndex) =>
                                currentIndex === itemIndex ? {...currentItem, guidance_note} : currentItem,
                              ),
                            }
                          : entry,
                      ),
                    })
                  }
                  placeholder="Record finish and visible wear."
                  value={item.guidance_note}
                />
                <Label>AI hints</Label>
                <TextField
                  onChangeText={(value) =>
                    setDraft({
                      ...draft,
                      rooms: draft.rooms.map((entry, index) =>
                        index === roomIndex
                          ? {
                              ...entry,
                              items: entry.items.map((currentItem, currentIndex) =>
                                currentIndex === itemIndex ? {...currentItem, ai_hints: parseHints(value)} : currentItem,
                              ),
                            }
                          : entry,
                      ),
                    })
                  }
                  placeholder="wall, paint, ceiling"
                  value={item.ai_hints.join(', ')}
                />
              </View>
            ))}

            <Button label="Add item" variant="secondary" onPress={() => setDraft({...draft, rooms: draft.rooms.map((entry, index) => (index === roomIndex ? {...entry, items: [...entry.items, newItem()]} : entry))})} />
          </Card>
        ))}

        <Button label="Add room" variant="secondary" onPress={() => setDraft({...draft, rooms: [...draft.rooms, newRoom()]})} />
        <Button disabled={saving || !canSave} label={saving ? 'Saving...' : editing ? 'Save template' : 'Create template'} onPress={() => void submit()} />
      </Screen>
    </>
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
  heroBody: {
    ...typography.body,
    color: colours.textSecondary,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.compactGap,
  },
  roomTitleBlock: {
    flex: 1,
    gap: 4,
  },
  roomStatus: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  itemCard: {
    borderColor: borders.subtle,
    borderWidth: 1,
    borderRadius: radii.tile,
    backgroundColor: surfaces.muted,
    padding: spacing.compactGap,
    gap: spacing.compactGap,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.compactGap,
  },
  itemTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
    flex: 1,
  },
});
