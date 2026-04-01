import {AlertCircle, FileText, KeyRound, Zap} from 'lucide-react';
import {Header, SectionCard, statusPill} from '../components/layout';
import type {InspectionRecord, RoomRecord} from '../types';

export function RoomListScreen({
  inspection,
  onBack,
  onOpenRoom,
  onGoToReview,
  onGoToMeters,
  onGoToKeys,
  onGoToGeneral,
}: {
  inspection: InspectionRecord;
  onBack: () => void;
  onOpenRoom: (room: RoomRecord) => void;
  onGoToReview: () => void;
  onGoToMeters: () => void;
  onGoToKeys: () => void;
  onGoToGeneral: () => void;
}) {
  const confirmed = inspection.rooms.reduce((count, room) => count + room.items_confirmed, 0);
  const total = inspection.rooms.reduce((count, room) => count + room.items_total, 0);

  return (
    <div>
      <Header title={inspection.property_address} subtitle={`${inspection.property_type} · ${inspection.inspection_date}`} showBack onBack={onBack} />
      <div className="space-y-5 px-4 py-5">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Inspection progress</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{confirmed} of {total} items confirmed</h2>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(inspection.status)}`}>
              {inspection.status}
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-600" style={{width: `${total ? (confirmed / total) * 100 : 0}%`}} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <button type="button" onClick={onGoToMeters} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
              <Zap size={16} className="mx-auto mb-2 text-amber-500" />
              Meters
            </button>
            <button type="button" onClick={onGoToKeys} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
              <KeyRound size={16} className="mx-auto mb-2 text-blue-600" />
              Keys
            </button>
            <button type="button" onClick={onGoToGeneral} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
              <AlertCircle size={16} className="mx-auto mb-2 text-rose-500" />
              General
            </button>
          </div>
        </SectionCard>

        <div className="space-y-3">
          {inspection.rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onOpenRoom(room)}
              className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div>
                <p className="text-lg font-semibold text-slate-950">{room.name}</p>
                <p className="mt-1 text-sm text-slate-500">{room.items_confirmed} of {room.items_total} items confirmed</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(room.status)}`}>
                {room.status}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onGoToReview}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          <FileText size={18} />
          Review inspection
        </button>
      </div>
    </div>
  );
}
