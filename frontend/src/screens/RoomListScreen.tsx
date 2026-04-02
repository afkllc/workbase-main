import {AlertCircle, FileText, KeyRound, Zap} from 'lucide-react';
import {EmptyState, Header, PageBody, SectionCard, statusPill} from '../components/layout';
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
      <Header title={inspection.property_address} subtitle={`${inspection.property_type} - ${inspection.inspection_date}`} showBack onBack={onBack} />
      <PageBody>
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Inspection progress</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {total === 0 ? 'No checklist items in this inspection' : `${confirmed} of ${total} items confirmed`}
              </h2>
              {inspection.rooms.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">This template contains no rooms, so you can move straight to review and generate the report.</p>
              ) : null}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(inspection.status)}`}>
              {inspection.status}
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-600" style={{width: `${total ? (confirmed / total) * 100 : 0}%`}} />
          </div>
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
            <button type="button" onClick={onGoToMeters} className="wb-card-button px-3 py-4 text-center font-semibold text-slate-700">
              <Zap size={16} className="mx-auto mb-2 text-amber-500" />
              Meters
            </button>
            <button type="button" onClick={onGoToKeys} className="wb-card-button px-3 py-4 text-center font-semibold text-slate-700">
              <KeyRound size={16} className="mx-auto mb-2 text-blue-600" />
              Keys
            </button>
            <button type="button" onClick={onGoToGeneral} className="wb-card-button px-3 py-4 text-center font-semibold text-slate-700">
              <AlertCircle size={16} className="mx-auto mb-2 text-rose-500" />
              General
            </button>
          </div>
        </SectionCard>

        {inspection.rooms.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No rooms to capture"
            description="This template skips room-by-room capture. Continue to review when you are ready to generate the report."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {inspection.rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => onOpenRoom(room)}
                className="wb-card-button flex h-full items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{room.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{room.items_confirmed} of {room.items_total} items confirmed</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(room.status)}`}>
                  {room.status}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onGoToReview}
          className="wb-btn-dark w-full"
        >
          <FileText size={18} />
          Review inspection
        </button>
      </PageBody>
    </div>
  );
}
