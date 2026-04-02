import type {RefObject} from 'react';
import {Camera, LoaderCircle, Upload, Video} from 'lucide-react';
import {FieldLabel} from '../components/fields';
import {EmptyState, formatCondition, Header, PageBody, SectionCard, statusPill} from '../components/layout';
import type {AnalysisSuggestion, Condition, InspectionRecord, RoomRecord} from '../types';

type SuggestionDraft = AnalysisSuggestion & {
  selectedItemId: string;
  descriptionDraft: string;
  conditionDraft: Condition;
  previewUrl: string | null;
};

export function RoomCaptureScreen({
  inspection,
  room,
  suggestion,
  saving,
  fileInputRef,
  onBack,
  onUploadClick,
  onFileChange,
  onVideoScan,
  onSuggestionChange,
  onConfirmSuggestion,
}: {
  inspection: InspectionRecord;
  room: RoomRecord;
  suggestion: SuggestionDraft | null;
  saving: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onUploadClick: () => void;
  onFileChange: (file: File) => void;
  onVideoScan: () => void;
  onSuggestionChange: (suggestion: SuggestionDraft | null) => void;
  onConfirmSuggestion: () => void;
}) {
  return (
    <div>
      <Header title={room.name} subtitle={`${inspection.property_address} - ${room.capture_mode.toUpperCase()} mode`} showBack onBack={onBack} />
      <PageBody>
        <SectionCard>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onUploadClick}
              disabled={saving}
              className="wb-btn-primary py-4"
            >
              <Upload size={18} className="mx-auto mb-2" />
              Upload photo
            </button>
            <button
              type="button"
              onClick={onVideoScan}
              disabled={saving}
              className="wb-btn-secondary py-4"
            >
              <Video size={18} className="mx-auto mb-2" />
              Run room scan
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onFileChange(file);
                event.target.value = '';
              }
            }}
          />
          <p className="mt-4 text-sm text-slate-500">
            Upload a photo for AI analysis or run a quick scan to assess all items at once.
          </p>
        </SectionCard>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {suggestion ? (
            <SectionCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">AI suggestion</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{suggestion.suggested_item_name}</h2>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {suggestion.confidence} confidence
                </span>
              </div>

              {suggestion.previewUrl ? (
                <img src={suggestion.previewUrl} alt="Uploaded preview" className="mt-4 h-48 w-full rounded-2xl object-cover" />
              ) : null}

              <div className="mt-4 space-y-4">
                <div>
                  <FieldLabel label="Assign to item" />
                  <select
                    value={suggestion.selectedItemId}
                    onChange={(event) => onSuggestionChange({...suggestion, selectedItemId: event.target.value})}
                    className="wb-field"
                  >
                    {room.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Condition" />
                  <select
                    value={suggestion.conditionDraft}
                    onChange={(event) => onSuggestionChange({...suggestion, conditionDraft: event.target.value as Condition})}
                    className="wb-field"
                  >
                    {['good', 'fair', 'poor', 'damaged', 'na'].map((condition) => (
                      <option key={condition} value={condition}>
                        {formatCondition(condition)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Description" />
                  <textarea
                    value={suggestion.descriptionDraft}
                    onChange={(event) => onSuggestionChange({...suggestion, descriptionDraft: event.target.value})}
                    rows={4}
                    className="wb-field"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onSuggestionChange(null)}
                    className="wb-btn-secondary"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={onConfirmSuggestion}
                    disabled={saving}
                    className="wb-btn-primary"
                  >
                    Confirm item
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : (
            <EmptyState
              icon={Camera}
              title="No AI suggestion yet"
              description="Upload a photo or run a room scan to generate a draft condition and description for an item in this room."
            />
          )}

          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Checklist</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{room.items_confirmed} of {room.items_total} confirmed</h2>
              </div>
              {saving ? <LoaderCircle className="animate-spin text-slate-400" size={18} /> : <Camera size={18} className="text-slate-400" />}
            </div>
            {room.items.length === 0 ? (
              <EmptyState
                icon={Camera}
                title="No checklist items in this room"
                description="This room does not have any configured checklist items, so there is nothing to capture here."
                className="mt-4"
              />
            ) : (
              <div className="mt-4 space-y-3">
                {room.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.description || 'No description yet.'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(item.is_confirmed ? 'confirmed' : room.status)}`}>
                        {item.is_confirmed ? 'confirmed' : formatCondition(item.condition)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </PageBody>
    </div>
  );
}
