import {useEffect, useState} from 'react';
import {ChevronDown, ChevronUp, LoaderCircle, Plus, Sparkles} from 'lucide-react';
import {Input, FieldLabel} from '../components/fields';
import {Header, PageBody, SectionCard} from '../components/layout';
import type {CreateInspectionPayload, TemplateSummary} from '../types';

const today = new Date().toISOString().slice(0, 10);

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

function offsetDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function NewInspectionScreen({
  templates,
  saving,
  initialAddress,
  onBack,
  onSubmit,
}: {
  templates: TemplateSummary[];
  saving: boolean;
  initialAddress?: string;
  onBack: () => void;
  onSubmit: (payload: CreateInspectionPayload) => void;
}) {
  const [form, setForm] = useState<CreateInspectionPayload>({
    template_key: templates[0]?.key ?? '',
    property_address: initialAddress ?? '',
    postcode: '',
    landlord_name: '',
    tenant_names: '',
    inspection_date: today,
  });
  const [prompt, setPrompt] = useState('');
  const [showDetails, setShowDetails] = useState(!!initialAddress);
  const [parsed, setParsed] = useState(false);

  useEffect(() => {
    if (templates.length && !templates.some((template) => template.key === form.template_key)) {
      setForm((current) => ({...current, template_key: templates[0].key}));
    }
  }, [templates, form.template_key]);

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

  const selectedTemplate = templates.find((template) => template.key === form.template_key) ?? null;
  const canSubmit = !saving && form.template_key && form.property_address.trim() && form.postcode.trim();

  return (
    <div>
      <Header title="New inspection" subtitle="Describe what you need or fill in the details below." showBack onBack={onBack} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <PageBody className="max-w-4xl">
          <SectionCard>
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles size={14} />
              <p className="text-xs font-bold uppercase tracking-widest">Quick start</p>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Try: "12 High Street NW1 4NP tomorrow" or "flat inspection next week"
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setParsed(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyPrompt();
                  }
                }}
                placeholder="Describe your inspection..."
                className="wb-field flex-1"
              />
              <button type="button" onClick={applyPrompt} disabled={!prompt.trim()} className="wb-btn-primary">
                Parse
              </button>
            </div>
            {parsed ? <p className="mt-2 text-xs font-medium text-emerald-600">Fields updated from your description. Review below and adjust if needed.</p> : null}
          </SectionCard>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 ease-out hover:border-blue-200 hover:bg-blue-50/40"
          >
            <span>{showDetails ? 'Hide details' : 'Edit details'}</span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetails ? (
            <SectionCard>
              <div className="space-y-4">
                <Input label="Property address" value={form.property_address} onChange={(property_address) => setForm({...form, property_address})} />
                <Input label="Postcode" value={form.postcode} onChange={(postcode) => setForm({...form, postcode})} />
                <div>
                  <FieldLabel label="Inspection template" />
                  <select
                    value={form.template_key}
                    onChange={(event) => setForm({...form, template_key: event.target.value})}
                    className="wb-field"
                  >
                    {templates.map((template) => (
                      <option key={template.key} value={template.key}>
                        {template.property_type} - {template.name}{template.source === 'custom' ? ' (custom)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate ? (
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedTemplate.source === 'custom' ? 'Custom template' : 'Built-in template'} selected for {selectedTemplate.property_type}.
                    </p>
                  ) : null}
                </div>
                <Input label="Landlord name" value={form.landlord_name} onChange={(landlord_name) => setForm({...form, landlord_name})} />
                <Input label="Tenant names" value={form.tenant_names} onChange={(tenant_names) => setForm({...form, tenant_names})} />
                <Input label="Inspection date" type="date" value={form.inspection_date} onChange={(inspection_date) => setForm({...form, inspection_date})} />
              </div>
            </SectionCard>
          ) : (
            <SectionCard>
              <h2 className="text-lg font-semibold text-slate-950">Current summary</h2>
              <div className="mt-3 space-y-1 text-sm">
                {form.property_address ? <p className="text-slate-900"><span className="font-medium text-slate-500">Address:</span> {form.property_address}</p> : null}
                {form.postcode ? <p className="text-slate-900"><span className="font-medium text-slate-500">Postcode:</span> {form.postcode}</p> : null}
                {selectedTemplate ? <p className="text-slate-900"><span className="font-medium text-slate-500">Template:</span> {selectedTemplate.property_type} - {selectedTemplate.name}</p> : null}
                <p className="text-slate-900"><span className="font-medium text-slate-500">Date:</span> {form.inspection_date}</p>
                {!form.property_address && !form.postcode ? <p className="italic text-slate-400">Use Quick start above or tap Edit details.</p> : null}
              </div>
            </SectionCard>
          )}

          <button type="submit" disabled={!canSubmit} className="wb-btn-primary w-full">
            {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}
            Start inspection
          </button>
        </PageBody>
      </form>
    </div>
  );
}
