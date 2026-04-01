import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {StatusSummaryRow} from '../components/StatusSummaryRow';
import {Button, Card, LoadingRow, Notice, Screen} from '../components/ui';
import {getReportUrl, listInspections} from '../lib/api';
import type {InspectionSummary} from '../lib/types';
import {formatDisplayName} from '../lib/utils';
import {borders, colours, radii, spacing, typography, withAlpha} from '../theme';

export default function ReportsScreen() {
  const router = useRouter();
  const {from, inspectionId} = useLocalSearchParams<{from?: string; inspectionId?: string}>();
  const [reports, setReports] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await listInspections();
          if (isActive) {
            setReports(data.filter((item) => item.status === 'completed'));
          }
        } catch (err) {
          if (isActive) {
            setError(err instanceof Error ? err.message : 'Failed to load reports.');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      void load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const featuredReportId = from === 'review' ? inspectionId ?? null : null;

  useEffect(() => {
    if (!featuredReportId) {
      setHighlightedReportId(null);
      return;
    }

    setHighlightedReportId(featuredReportId);
    const timer = setTimeout(() => {
      setHighlightedReportId((current) => (current === featuredReportId ? null : current));
    }, 5000);

    return () => clearTimeout(timer);
  }, [featuredReportId]);

  const orderedReports = useMemo(() => {
    if (!featuredReportId) {
      return reports;
    }

    const matchingReport = reports.find((report) => report.id === featuredReportId);
    if (!matchingReport) {
      return reports;
    }

    return [matchingReport, ...reports.filter((report) => report.id !== featuredReportId)];
  }, [featuredReportId, reports]);

  return (
    <Screen title="Reports" subtitle="Completed inspection reports.">
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <LoadingRow label="Loading reports" /> : null}
      {reports.length === 0 && !loading ? (
        <Card>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.empty}>Complete an inspection and generate a report from the review screen.</Text>
          <Button label="View inspections" variant="secondary" onPress={() => router.push('/inspections')} />
        </Card>
      ) : null}

      {orderedReports.map((report) => {
        const reportUrl = report.report_url;
        const isHighlighted = report.id === highlightedReportId;

        return (
          <View key={report.id} style={isHighlighted ? styles.highlightShell : null}>
            <Card>
              {isHighlighted ? (
                <View style={styles.generatedBadge}>
                  <Text style={styles.generatedBadgeText}>Just generated</Text>
                </View>
              ) : null}
              <StatusSummaryRow
                subtitle={`${formatDisplayName(report.property_type)} - ${report.inspection_date}`}
                statusValue={report.status}
                title={report.property_address}
              />
              {reportUrl ? (
                <Pressable onPress={() => void Linking.openURL(getReportUrl(reportUrl))} style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>Open report</Text>
                </Pressable>
              ) : null}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  empty: {
    ...typography.body,
    color: colours.textSecondary,
  },
  highlightShell: {
    borderRadius: radii.card + 2,
    borderWidth: 1,
    borderColor: borders.accent,
    backgroundColor: withAlpha(colours.accent, 0.08),
    padding: 2,
  },
  generatedBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.badge,
    backgroundColor: withAlpha(colours.accent, 0.12),
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: spacing.tightGap,
  },
  generatedBadgeText: {
    ...typography.label,
    color: colours.accent,
    letterSpacing: 0.6,
  },
  linkButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colours.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkButtonText: {
    color: colours.surface,
    fontWeight: '700',
  },
});
