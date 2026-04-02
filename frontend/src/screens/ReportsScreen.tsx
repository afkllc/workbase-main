import {Download, FileText, LoaderCircle} from 'lucide-react';
import {EmptyState, Header, LoadingCards, PageBody, SectionCard, statusPill} from '../components/layout';
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
      <PageBody>
        {loading && reports.length === 0 ? <LoadingCards className="xl:grid-cols-2" count={2} /> : null}

        {loading && reports.length > 0 ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={18} />
            Refreshing reports
          </div>
        ) : null}

        {reports.length === 0 && !loading ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Complete an inspection and generate a report from the review screen."
            action={(
              <button type="button" onClick={onBack} className="wb-btn-secondary">
                View inspections
              </button>
            )}
          />
        ) : null}

        {reports.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {reports.map((report) => (
              <SectionCard key={report.id} className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{report.property_address}</h3>
                    <p className="mt-1 text-sm text-slate-500">{report.property_type} - {report.inspection_date}</p>
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
                    className="wb-btn-primary mt-auto"
                  >
                    <Download size={18} />
                    Download report
                  </a>
                ) : null}
              </SectionCard>
            ))}
          </div>
        ) : null}
      </PageBody>
    </div>
  );
}
