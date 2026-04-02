import {useState} from 'react';
import {FieldLabel, Input, ToggleRow} from '../components/fields';
import {formatCondition, Header, PageBody, SectionCard} from '../components/layout';
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
      <PageBody className="max-w-4xl">
        <SectionCard>
          <div className="space-y-4">
            <Input label="Gas" value={value.gas} onChange={(gas) => setValue({...value, gas})} />
            <Input label="Electric" value={value.electric} onChange={(electric) => setValue({...value, electric})} />
            <Input label="Water" value={value.water} onChange={(water) => setValue({...value, water})} />
          </div>
        </SectionCard>
        <button type="button" onClick={() => onSave(value)} disabled={saving} className="wb-btn-primary w-full">
          Save meter readings
        </button>
      </PageBody>
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
      <PageBody className="max-w-4xl">
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
                  className="wb-field w-24"
                />
              </div>
            ))}
          </div>
        </SectionCard>
        <button type="button" onClick={() => onSave(value)} disabled={saving} className="wb-btn-primary w-full">
          Save keys
        </button>
      </PageBody>
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
      <PageBody className="max-w-4xl">
        <SectionCard>
          <div className="space-y-4">
            <ToggleRow label="Smoke alarms present" checked={value.smoke_alarms} onChange={(smoke_alarms) => setValue({...value, smoke_alarms})} />
            <ToggleRow label="CO detector present" checked={value.co_detector} onChange={(co_detector) => setValue({...value, co_detector})} />
            <div>
              <FieldLabel label="Overall cleanliness" />
              <select
                value={value.overall_cleanliness}
                onChange={(event) => setValue({...value, overall_cleanliness: event.target.value})}
                className="wb-field"
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
                className="wb-field"
              />
            </div>
          </div>
        </SectionCard>
        <button type="button" onClick={() => onSave(value)} disabled={saving} className="wb-btn-primary w-full">
          Save observations
        </button>
      </PageBody>
    </div>
  );
}
