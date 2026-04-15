import {Archive, Download, FileText, LoaderCircle} from 'lucide-react';
import {EmptyState, Header, LoadingCards, PageBody, SectionCard, statusPill} from '../components/layout';
import type {InspectionSummary} from '../types';

export function ReportsScreen({
  baseUrl,
  loading,
  onArchive,
  reports,
  onBack,
}: {
  baseUrl: string;
  loading: boolean;
  onArchive: (report: InspectionSummary) => void;
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
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      aria-label={`Archive report for ${report.property_address}`}
                      onClick={() => {
                        if (window.confirm('Archive this report? It will be removed from your reports list but not deleted.')) {
                          onArchive(report);
                        }
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                    >
                      <Archive size={18} />
                    </button>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
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
