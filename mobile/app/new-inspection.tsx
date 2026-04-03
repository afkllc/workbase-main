import Feather from '@expo/vector-icons/Feather';
import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Button, Card, Label, LoadingRow, Notice, Screen, TextField} from '../src/components/ui';
import {createInspection, listTemplates} from '../src/lib/api';
import type {CreateInspectionPayload, TemplateSummary} from '../src/lib/types';
import {formatDisplayName} from '../src/lib/utils';
import {AppStackScreen} from '../src/navigation/AppStackScreen';
import {borders, colours, radii, spacing, surfaces, typography} from '../src/theme';

const today = new Date().toISOString().slice(0, 10);

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseNaturalInput(text: string, templates: TemplateSummary[]): Partial<CreateInspectionPayload> {
  const result: Partial<CreateInspectionPayload> = {};
  let remaining = text.trim();

  const datePatterns: Array<{pattern: RegExp; resolve: () => string}> = [
    {pattern: /\btomorrow\b/i, resolve: () => offsetDate(1)},
    {pattern: /\btoday\b/i, resolve: () => today},
    {pattern: /\bnext week\b/i, resolve: () => offsetDate(7)},
    {pattern: /\b(\d{4}-\d{2}-\d{2})\b/, resolve: () => RegExp.$1},
    {pattern: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/, resolve: () => `${RegExp.$3}-${RegExp.$2.padStart(2, '0')}-${RegExp.$1.padStart(2, '0')}`},
  ];

  for (const {pattern, resolve} of datePatterns) {
    if (pattern.test(remaining)) {
      result.inspection_date = resolve();
      remaining = remaining.replace(pattern, '').trim();
      break;
    }
  }

  for (const template of templates) {
    const typeWords = template.property_type.toLowerCase().split(/[\s_]+/);
    for (const word of typeWords) {
      if (word.length > 2 && remaining.toLowerCase().includes(word)) {
        result.template_key = template.key;
        remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'i'), '').trim();
        break;
      }
    }
    if (result.template_key) {
      break;
    }
  }

  const postcodeMatch = remaining.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  if (postcodeMatch) {
    result.postcode = postcodeMatch[1].toUpperCase();
    remaining = remaining.replace(postcodeMatch[0], '').trim();
  }

  remaining = remaining.replace(/\s{2,}/g, ' ').replace(/^[,.\-\s]+|[,.\-\s]+$/g, '').trim();
  if (remaining) {
    result.property_address = remaining;
  }

  return result;
}

export default function NewInspectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{templateKey?: string; address?: string}>();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState(false);
  const [showDetails, setShowDetails] = useState(Boolean(params.address));
  const [form, setForm] = useState<CreateInspectionPayload>({
    template_key: '',
    property_address: params.address ?? '',
    postcode: '',
    landlord_name: '',
    tenant_names: '',
    inspection_date: today,
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await listTemplates();
          if (!isActive) {
            return;
          }

          setTemplates(data);

          const preferredKey =
            (params.templateKey && data.some((template) => template.key === params.templateKey) && params.templateKey) ||
            (form.template_key && data.some((template) => template.key === form.template_key) && form.template_key) ||
            data[0]?.key ||
            '';

          setForm((current) => ({...current, template_key: preferredKey}));
        } catch (err) {
          if (isActive) {
            setError(err instanceof Error ? err.message : 'Failed to load templates.');
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
    }, [form.template_key, params.templateKey]),
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === form.template_key) ?? null,
    [form.template_key, templates],
  );

  function applyPrompt() {
    if (!prompt.trim()) {
      return;
    }

    const extracted = parseNaturalInput(prompt, templates);
    setForm((current) => ({
      ...current,
      ...(extracted.property_address ? {property_address: extracted.property_address} : {}),
      ...(extracted.postcode ? {postcode: extracted.postcode} : {}),
      ...(extracted.inspection_date ? {inspection_date: extracted.inspection_date} : {}),
      ...(extracted.template_key ? {template_key: extracted.template_key} : {}),
    }));
    setParsed(true);
    setShowDetails(true);
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const inspection = await createInspection(form);
      router.replace(`/inspection/${inspection.id}?from=new`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inspection.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppStackScreen fallbackBackLabel="Inspections" fallbackHref="/inspections" title="New Inspection" />
      <Screen includeTopInset={false} showHeader={false}>
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <LoadingRow label="Loading property templates" /> : null}

        <Card>
          <Text style={styles.kicker}>Quick start</Text>
          <Text style={styles.cardTitle}>Describe the inspection in plain language.</Text>
          <Text style={styles.cardBody}>Try an address, postcode, and timing, then review the details below.</Text>
          <TextInput
            onChangeText={(text) => {
              setPrompt(text);
              setParsed(false);
            }}
            onSubmitEditing={applyPrompt}
            placeholder="12 High Street NW1 4NP tomorrow"
            placeholderTextColor={colours.textSecondary}
            returnKeyType="go"
            style={styles.promptInput}
            value={prompt}
          />
          <View style={styles.promptActions}>
            <Button disabled={!prompt.trim()} label="Apply quick start" onPress={applyPrompt} />
          </View>
          {parsed ? <Text style={styles.parsedHint}>Fields updated. Review below and adjust if needed.</Text> : null}
        </Card>

        <Pressable onPress={() => setShowDetails(!showDetails)} style={({pressed}) => [styles.detailsToggle, pressed ? styles.detailsTogglePressed : null]}>
          <View>
            <Text style={styles.detailsLabel}>{showDetails ? 'Hide details' : 'Edit details'}</Text>
            <Text style={styles.detailsHint}>{showDetails ? 'Collapse the full form once everything looks right.' : 'Expand the full form to change template and property details.'}</Text>
          </View>
          <Feather color={colours.textSecondary} name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} />
        </Pressable>

        {!showDetails ? (
          <Card>
            <Text style={styles.sectionTitle}>Current summary</Text>
            {form.property_address ? <Text style={styles.summaryLine}><Text style={styles.summaryLabel}>Address: </Text>{form.property_address}</Text> : null}
            {form.postcode ? <Text style={styles.summaryLine}><Text style={styles.summaryLabel}>Postcode: </Text>{form.postcode}</Text> : null}
            <Text style={styles.summaryLine}><Text style={styles.summaryLabel}>Date: </Text>{form.inspection_date}</Text>
            {!form.property_address && !form.postcode ? <Text style={styles.summaryPlaceholder}>Use Quick start above or open Edit details.</Text> : null}
          </Card>
        ) : null}

        {showDetails ? (
          <>
            <Card>
              <Label>Choose a template</Label>
              <View style={styles.pickerShell}>
                <Picker selectedValue={form.template_key} onValueChange={(template_key) => setForm({...form, template_key})}>
                  {templates.map((template) => (
                    <Picker.Item
                      key={template.key}
                      label={`${formatDisplayName(template.property_type)} - ${template.name}${template.source === 'custom' ? ' (custom)' : ''}`}
                      value={template.key}
                    />
                  ))}
                </Picker>
              </View>

              {selectedTemplate ? (
                <View style={styles.templateBlock}>
                  <View style={styles.templateHeader}>
                    <View style={styles.templateCopy}>
                      <Text style={styles.sectionTitle}>{selectedTemplate.name}</Text>
                      <Text style={styles.templateMeta}>{formatDisplayName(selectedTemplate.property_type)} - {selectedTemplate.source === 'custom' ? 'Custom template' : 'Built-in template'}</Text>
                    </View>
                    <View style={styles.templateInline}>
                      <View style={[styles.templateMarker, selectedTemplate.source === 'custom' ? styles.templateMarkerCustom : styles.templateMarkerBuiltin]} />
                      <Text style={styles.templateInlineText}>{selectedTemplate.source === 'custom' ? 'Custom' : 'Built-in'}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </Card>

            <Card>
              <Label>Property address</Label>
              <TextField onChangeText={(property_address) => setForm({...form, property_address})} placeholder="12 High Street" value={form.property_address} />
              <Label>Postcode</Label>
              <TextField onChangeText={(postcode) => setForm({...form, postcode})} placeholder="NW1 4NP" value={form.postcode} />
              <Label>Landlord name</Label>
              <TextField onChangeText={(landlord_name) => setForm({...form, landlord_name})} placeholder="Landlord name" value={form.landlord_name} />
              <Label>Tenant names</Label>
              <TextField onChangeText={(tenant_names) => setForm({...form, tenant_names})} placeholder="Tenant names" value={form.tenant_names} />
              <Label>Inspection date</Label>
              <TextField onChangeText={(inspection_date) => setForm({...form, inspection_date})} placeholder="2026-03-29" value={form.inspection_date} />
            </Card>
          </>
        ) : null}

        <Button
          disabled={saving || !form.template_key || !form.property_address.trim() || !form.postcode.trim()}
          label={saving ? 'Creating...' : 'Create inspection'}
          onPress={() => void submit()}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...typography.label,
    color: colours.primary,
  },
  cardTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: colours.textSecondary,
  },
  promptInput: {
    minHeight: 56,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: surfaces.muted,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colours.textPrimary,
    ...typography.body,
  },
  promptActions: {
    alignItems: 'flex-start',
  },
  parsedHint: {
    ...typography.supporting,
    color: colours.success,
  },
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.tile,
    borderWidth: 1,
    borderColor: borders.subtle,
    backgroundColor: colours.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailsTogglePressed: {
    backgroundColor: surfaces.muted,
  },
  detailsLabel: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  detailsHint: {
    ...typography.supporting,
    color: colours.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  summaryLine: {
    ...typography.body,
    color: colours.textPrimary,
  },
  summaryLabel: {
    color: colours.textSecondary,
    fontFamily: 'Inter_700Bold',
  },
  summaryPlaceholder: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  pickerShell: {
    borderRadius: radii.input,
    borderColor: borders.subtle,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: surfaces.muted,
  },
  templateBlock: {
    gap: spacing.compactGap,
    borderTopWidth: 1,
    borderTopColor: borders.subtle,
    paddingTop: spacing.compactGap,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.compactGap,
  },
  templateCopy: {
    flex: 1,
    gap: 4,
  },
  templateMeta: {
    ...typography.body,
    color: colours.textSecondary,
  },
  templateInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateMarker: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  templateMarkerCustom: {
    backgroundColor: colours.accent,
  },
  templateMarkerBuiltin: {
    backgroundColor: colours.primary,
  },
  templateInlineText: {
    ...typography.supporting,
    color: colours.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
