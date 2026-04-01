import {useState} from 'react';
import {FieldLabel, Input, ToggleRow} from '../components/fields';
import {formatCondition, Header, SectionCard} from '../components/layout';
import type {InspectionRecord} from '../types';

export function MeterReadingsScreen({
  inspection,
  saving,
  onBack,
  onSave,
}: {
  inspection: InspectionRecord;
  saving: boolean;
  onBack: () => void;
  onSave: (value: InspectionRecord['sections']['meter_readings']) => void;
}) {
  const [value, setValue] = useState(inspection.sections.meter_readings);

  return (
    <div>
      <Header title="Meter readings" subtitle="Record current meter values for this property." showBack onBack={onBack} />
      <div className="space-y-5 px-4 py-5">
        <SectionCard>
          <div className="space-y-4">
            <Input label="Gas" value={value.gas} onChange={(gas) => setValue({...value, gas})} />
            <Input label="Electric" value={value.electric} onChange={(electric) => setValue({...value, electric})} />
            <Input label="Water" value={value.water} onChange={(water) => setValue({...value, water})} />
          </div>
        </SectionCard>
        <button type="button" onClick={() => onSave(value)} disabled={saving} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          Save meter readings
        </button>
      </div>
    </div>
  );
}

export function KeysScreen({
  inspection,
  saving,
  onBack,
  onSave,
}: {
  inspection: InspectionRecord;
  saving: boolean;
  onBack: () => void;
  onSave: (value: InspectionRecord['sections']['keys_and_fobs']) => void;
}) {
  const [value, setValue] = useState(inspection.sections.keys_and_fobs);

  return (
    <div>
      <Header title="Keys and fobs" subtitle="Record how many of each key type are being handed over." showBack onBack={onBack} />
      <div className="space-y-5 px-4 py-5">
        <SectionCard>
          <div className="space-y-4">
            {Object.entries(value).map(([label, quantity]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{label}</p>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) => setValue({...value, [label]: Number(event.target.value)})}
                  className="w-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                />
              </div>
            ))}
          </div>
        </SectionCard>
        <button type="button" onClick={() => onSave(value)} disabled={saving} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          Save keys
        </button>
      </div>
    </div>
  );
}

export function GeneralScreen({
  inspection,
  saving,
  onBack,
  onSave,
}: {
  inspection: InspectionRecord;
  saving: boolean;
  onBack: () => void;
  onSave: (value: InspectionRecord['sections']['general_observations']) => void;
}) {
  const [value, setValue] = useState(inspection.sections.general_observations);

  return (
    <div>
      <Header title="General observations" subtitle="Safety checks, cleanliness, and additional notes." showBack onBack={onBack} />
      <div className="space-y-5 px-4 py-5">
        <SectionCard>
          <div className="space-y-4">
            <ToggleRow label="Smoke alarms present" checked={value.smoke_alarms} onChange={(smoke_alarms) => setValue({...value, smoke_alarms})} />
            <ToggleRow label="CO detector present" checked={value.co_detector} onChange={(co_detector) => setValue({...value, co_detector})} />
            <div>
              <FieldLabel label="Overall cleanliness" />
              <select
                value={value.overall_cleanliness}
                onChange={(event) => setValue({...value, overall_cleanliness: event.target.value})}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {['professional_clean', 'good', 'fair', 'poor'].map((option) => (
                  <option key={option} value={option}>
                    {formatCondition(option)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel label="Additional notes" />
              <textarea
                value={value.additional_notes}
                onChange={(event) => setValue({...value, additional_notes: event.target.value})}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              />
            </div>
          </div>
        </SectionCard>
        <button type="button" onClick={() => onSave(value)} disabled={saving} className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          Save observations
        </button>
      </div>
    </div>
  );
}
