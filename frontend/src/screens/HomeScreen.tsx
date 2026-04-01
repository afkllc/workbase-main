import {useState} from 'react';
import {LoaderCircle, MessageSquare, Plus, Sparkles} from 'lucide-react';
import {Header, SectionCard, statusPill} from '../components/layout';
import type {InspectionSummary} from '../types';

type CommandResult = {type: 'new'; address: string} | {type: 'open'; inspectionId: string} | {type: 'navigate'; screen: string} | {type: 'hint'; message: string};

function parseCommand(input: string, inspections: InspectionSummary[]): CommandResult {
  const text = input.trim().toLowerCase();

  if (/^(new|create|inspect|start)\b/.test(text)) {
    const address = input.replace(/^(new|create|inspect|start)\s*(inspection)?\s*/i, '').trim();
    return {type: 'new', address};
  }

  if (/^(report|reports|show reports)/.test(text)) {
    return {type: 'navigate', screen: 'reports'};
  }

  if (/^(next|what should|priority|todo)/.test(text)) {
    const needsReview = inspections.find((i) => i.status === 'draft' && i.confirmed_items < i.total_items);
    if (needsReview) return {type: 'open', inspectionId: needsReview.id};
    return {type: 'hint', message: 'All caught up — no inspections need attention right now.'};
  }

  if (/^(continue|open|resume)\b/.test(text)) {
    const query = input.replace(/^(continue|open|resume)\s*/i, '').trim().toLowerCase();
    const match = inspections.find((i) => i.property_address.toLowerCase().includes(query));
    if (match) return {type: 'open', inspectionId: match.id};
    return {type: 'hint', message: `No inspection found matching "${query}".`};
  }

  const addressMatch = inspections.find((i) => i.property_address.toLowerCase().includes(text));
  if (addressMatch) return {type: 'open', inspectionId: addressMatch.id};

  return {type: 'new', address: input.trim()};
}

export function HomeScreen({
  loading,
  inspections,
  onOpenInspection,
  onNewInspection,
  onNavigate,
}: {
  loading: boolean;
  inspections: InspectionSummary[];
  onOpenInspection: (inspectionId: string) => void;
  onNewInspection: (address?: string) => void;
  onNavigate: (screen: string) => void;
}) {
  const [command, setCommand] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  function handleCommand() {
    if (!command.trim()) return;
    const result = parseCommand(command, inspections);
    setCommand('');
    setHint(null);
    switch (result.type) {
      case 'new':
        onNewInspection(result.address || undefined);
        break;
      case 'open':
        onOpenInspection(result.inspectionId);
        break;
      case 'navigate':
        onNavigate(result.screen);
        break;
      case 'hint':
        setHint(result.message);
        break;
    }
  }

  return (
    <div>
      <Header title="Workbase" subtitle="Your inspection assistant." />
      <div className="space-y-5 px-4 py-5">
        <SectionCard>
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles size={16} />
            <p className="text-xs font-bold uppercase tracking-widest">Ask AI</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">Try "inspect 12 High Street" or "what should I do next?"</p>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={command}
                onChange={(e) => { setCommand(e.target.value); setHint(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommand(); }}
                placeholder="What would you like to do?"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              />
            </div>
            <button
              type="button"
              onClick={handleCommand}
              disabled={!command.trim()}
              className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Go
            </button>
          </div>
          {hint ? <p className="mt-2 text-sm text-amber-600">{hint}</p> : null}
        </SectionCard>

        <SectionCard>
          <h2 className="text-lg font-semibold text-slate-950">Get started</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Create inspections, review room progress, and generate reports.
          </p>
          <button
            type="button"
            onClick={() => onNewInspection()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/30"
          >
            <Plus size={18} />
            New inspection
          </button>
        </SectionCard>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Inspections</h3>
          {loading ? <LoaderCircle className="animate-spin text-slate-400" size={18} /> : null}
        </div>

        <div className="space-y-3">
          {inspections.length === 0 ? (
            <SectionCard>
              <h4 className="text-base font-semibold text-slate-950">No inspections yet</h4>
              <p className="mt-1 text-sm text-slate-600">Create your first inspection to start capturing property conditions.</p>
              <button type="button" onClick={() => onNewInspection()} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/30">
                <Plus size={18} />
                New inspection
              </button>
            </SectionCard>
          ) : (
            inspections.map((inspection) => (
              <button
                key={inspection.id}
                type="button"
                onClick={() => onOpenInspection(inspection.id)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{inspection.property_address}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {inspection.property_type} · {inspection.inspection_date}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(inspection.status)}`}>
                    {inspection.status}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{inspection.confirmed_items} of {inspection.total_items} items confirmed</span>
                    <span>{inspection.rooms_count} rooms</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{width: `${inspection.total_items ? (inspection.confirmed_items / inspection.total_items) * 100 : 0}%`}}
                    />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
