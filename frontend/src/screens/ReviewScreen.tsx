import {useMemo, useState} from 'react';
import {Check, CheckCheck, FileText, Filter, Inbox, LoaderCircle} from 'lucide-react';
import {EmptyState, formatCondition, Header, PageBody, SectionCard, statusPill} from '../components/layout';
import type {Condition, InspectionRecord, ItemRecord} from '../types';

const confidenceOrder: Record<string, number> = {low: 0, medium: 1, high: 2};

function sortItemsForReview(items: ItemRecord[]): ItemRecord[] {
  return [...items].sort((a, b) => {
    if (a.is_confirmed !== b.is_confirmed) return a.is_confirmed ? 1 : -1;
    const ca = confidenceOrder[a.ai_confidence ?? ''] ?? 3;
    const cb = confidenceOrder[b.ai_confidence ?? ''] ?? 3;
    return ca - cb;
  });
}

export function ReviewScreen({
  inspection,
  totalConfirmed,
  totalItems,
  allItemsConfirmed,
  saving,
  onBack,
  onGenerate,
  onConfirmItem,
  onBulkConfirm,
}: {
  inspection: InspectionRecord;
  totalConfirmed: number;
  totalItems: number;
  allItemsConfirmed: boolean;
  saving: boolean;
  onBack: () => void;
  onGenerate: () => void;
  onConfirmItem: (roomId: string, itemId: string, condition: Condition, description: string, photoName?: string) => void;
  onBulkConfirm: (items: Array<{roomId: string; itemId: string; condition: Condition; description: string; photoName?: string}>) => void;
}) {
  const [filterNeedsReview, setFilterNeedsReview] = useState(true);
  const hasNoChecklistItems = totalItems === 0;
  const needsReviewCount = Math.max(totalItems - totalConfirmed, 0);

  const allConfirmableItems = useMemo(() => {
    const items: Array<{roomId: string; itemId: string; condition: Condition; description: string; photoName?: string}> = [];
    for (const room of inspection.rooms) {
      for (const item of room.items) {
        if (!item.is_confirmed && item.condition && item.description) {
          items.push({
            roomId: room.id,
            itemId: item.id,
            condition: item.condition as Condition,
            description: item.description,
            photoName: item.photos[0],
          });
        }
      }
    }
    return items;
  }, [inspection]);

  const visibleRooms = useMemo(
    () =>
      inspection.rooms
        .map((room) => {
          const sortedItems = sortItemsForReview(room.items);
          const visibleItems = filterNeedsReview ? sortedItems.filter((item) => !item.is_confirmed) : sortedItems;
          const roomConfirmable = room.items.filter((item) => !item.is_confirmed && item.condition && item.description);
          return {room, visibleItems, roomConfirmable};
        })
        .filter(({visibleItems}) => !filterNeedsReview || visibleItems.length > 0),
    [filterNeedsReview, inspection.rooms],
  );

  return (
    <div>
      <Header title="Review inspection" subtitle="Confirm AI output before generating the report." showBack onBack={onBack} />
      <PageBody>
        <SectionCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Readiness</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {hasNoChecklistItems ? 'No checklist items required' : `${totalConfirmed} of ${totalItems} items confirmed`}
              </h2>
              {hasNoChecklistItems ? (
                <p className="mt-1 text-sm font-medium text-emerald-600">
                  This testing template has no checklist items, so the report can be generated immediately.
                </p>
              ) : needsReviewCount > 0 ? (
                <p className="mt-1 text-sm font-medium text-amber-600">{needsReviewCount} items need review</p>
              ) : (
                <p className="mt-1 text-sm font-medium text-emerald-600">Everything is confirmed and ready for report generation.</p>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(allItemsConfirmed ? 'ready' : 'review')}`}>
              {allItemsConfirmed ? 'Ready' : 'Needs review'}
            </span>
          </div>
          {!hasNoChecklistItems ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterNeedsReview(!filterNeedsReview)}
                className={`wb-chip ${filterNeedsReview ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
              >
                <Filter size={12} />
                {filterNeedsReview ? 'Needs review' : 'All items'}
              </button>
              {allConfirmableItems.length > 1 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onBulkConfirm(allConfirmableItems)}
                  className="wb-chip bg-blue-600 text-white disabled:opacity-60"
                >
                  <CheckCheck size={12} />
                  Confirm all ({allConfirmableItems.length})
                </button>
              ) : null}
            </div>
          ) : null}
        </SectionCard>

        {hasNoChecklistItems ? (
          <EmptyState
            icon={Inbox}
            title="Nothing to confirm"
            description="This template has no checklist items — you can generate the report immediately."
          />
        ) : null}

        {!hasNoChecklistItems && visibleRooms.length === 0 ? (
          <EmptyState
            icon={CheckCheck}
            title="Review is complete"
            description="All visible checklist items are confirmed. Switch to all items if you want to audit the full record, or generate the report now."
          />
        ) : null}

        {visibleRooms.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleRooms.map(({room, visibleItems, roomConfirmable}) => (
              <SectionCard key={room.id} className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{room.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{room.items_confirmed} of {room.items_total} items confirmed</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(room.status)}`}>{room.status}</span>
                </div>
                {roomConfirmable.length > 1 ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      onBulkConfirm(
                        roomConfirmable.map((item) => ({
                          roomId: room.id,
                          itemId: item.id,
                          condition: item.condition as Condition,
                          description: item.description,
                          photoName: item.photos[0],
                        })),
                      )
                    }
                    className="mt-2 wb-chip bg-blue-50 text-blue-700 disabled:opacity-60"
                  >
                    <CheckCheck size={12} />
                    Confirm all in {room.name} ({roomConfirmable.length})
                  </button>
                ) : null}
                <div className="mt-4 space-y-3">
                  {visibleItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.description || 'No AI description yet.'}</p>
                          {item.ai_confidence ? (
                            <p className={`mt-1 text-xs font-medium ${item.ai_confidence === 'high' ? 'text-emerald-600' : item.ai_confidence === 'medium' ? 'text-amber-600' : 'text-rose-600'}`}>
                              {item.ai_confidence} confidence
                            </p>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(item.is_confirmed ? 'confirmed' : room.status)}`}>
                          {item.is_confirmed ? 'confirmed' : formatCondition(item.condition)}
                        </span>
                      </div>
                      {!item.is_confirmed && item.condition && item.description ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onConfirmItem(room.id, item.id, item.condition as Condition, item.description, item.photos[0])}
                          className="mt-3 wb-btn-primary text-xs"
                        >
                          <Check size={14} />
                          Confirm suggestion
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onGenerate}
          disabled={!allItemsConfirmed || saving}
          className="wb-btn-dark w-full"
        >
          {saving ? <LoaderCircle className="animate-spin" size={18} /> : <FileText size={18} />}
          Generate report
        </button>
      </PageBody>
    </div>
  );
}
