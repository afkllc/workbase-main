import {Download, LoaderCircle} from 'lucide-react';
import {Header, SectionCard, statusPill} from '../components/layout';
import type {InspectionSummary} from '../types';

export function ReportsScreen({
  baseUrl,
  loading,
  reports,
  onBack,
}: {
  baseUrl: string;
  loading: boolean;
  reports: InspectionSummary[];
  onBack: () => void;
}) {
  return (
    <div>
      <Header title="Reports" subtitle="Completed inspection reports." showBack onBack={onBack} />
      <div className="space-y-5 px-4 py-5">
        {loading ? (
          <SectionCard>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <LoaderCircle className="animate-spin" size={18} />
              Loading reports
            </div>
          </SectionCard>
        ) : null}

        {reports.length === 0 ? (
          <SectionCard>
            <h4 className="text-base font-semibold text-slate-950">No reports yet</h4>
            <p className="mt-1 text-sm text-slate-600">Complete an inspection and generate a report from the review screen.</p>
            <button type="button" onClick={onBack} className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              View inspections
            </button>
          </SectionCard>
        ) : (
          reports.map((report) => (
            <SectionCard key={report.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{report.property_address}</p>
                  <p className="mt-1 text-sm text-slate-500">{report.property_type} · {report.inspection_date}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(report.status)}`}>
                  {report.status}
                </span>
              </div>
              {report.report_url ? (
                <a
                  href={`${baseUrl}${report.report_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  <Download size={18} />
                  Download report
                </a>
              ) : null}
            </SectionCard>
          ))
        )}
      </div>
    </div>
  );
}
