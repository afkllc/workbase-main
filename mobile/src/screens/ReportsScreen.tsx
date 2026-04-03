import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { Button, Card, LoadingRow, Notice, Screen, StatusBadge } from '../components/ui';
import { archiveReport, getReportUrl, listInspections } from '../lib/api';
import type { InspectionSummary } from '../lib/types';
import { formatDisplayName } from '../lib/utils';
import { borders, colours, layout, radii, spacing, typography, withAlpha } from '../theme';

export default function ReportsScreen() {
  const router = useRouter();
  const { from, inspectionId } = useLocalSearchParams<{ from?: string; inspectionId?: string }>();
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
            setReports(data.filter((item) => item.status === 'completed' && !item.is_archived));
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

  function handleArchivePress(report: InspectionSummary) {
    Alert.alert('Archive this report?', 'It will be removed from your reports list but not deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: () => {
          void confirmArchive(report);
        },
      },
    ]);
  }

  async function confirmArchive(report: InspectionSummary) {
    setError(null);
    const removedIndex = reports.findIndex((entry) => entry.id === report.id);
    if (removedIndex === -1) {
      return;
    }

    setReports((current) => current.filter((entry) => entry.id !== report.id));

    try {
      await archiveReport(report.id);
    } catch (err) {
      setReports((current) => {
        const next = [...current];
        next.splice(removedIndex, 0, report);
        return next;
      });
      setError(err instanceof Error ? err.message : 'Failed to archive report.');
    }
  }

  function openReview(reportId: string) {
    router.push(`/inspection/${reportId}/review`);
  }

  return (
    <Screen title="Reports" subtitle="Completed inspection reports.">
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <LoadingRow label="Loading reports" /> : null}
      {reports.length === 0 && !loading ? (
        <Card>
          <EmptyState
            action={{ label: 'View inspections', onPress: () => router.push('/inspections'), variant: 'secondary' }}
            icon="file-text"
            message="Complete an inspection and generate a report from the review screen."
          />
        </Card>
      ) : null}

      {orderedReports.map((report) => {
        const reportUrl = report.report_url;
        const isHighlighted = report.id === highlightedReportId;

        return (
          <View key={report.id} style={isHighlighted ? styles.highlightShell : null}>
            <Card>
              {isHighlighted ? (
                <View style={styles.generatedInline}>
                  <View style={styles.generatedMarker} />
                  <Text style={styles.generatedInlineText}>Just generated</Text>
                </View>
              ) : null}
              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  <Text numberOfLines={1} style={styles.reportTitle}>{report.property_address}</Text>
                  <Text ellipsizeMode="tail" numberOfLines={1} style={styles.reportSubtitle}>{`${formatDisplayName(report.property_type)} - ${report.inspection_date}`}</Text>
                </View>
                <Pressable accessibilityLabel="Archive report" hitSlop={10} onPress={() => handleArchivePress(report)} style={({ pressed }) => [styles.archiveButton, pressed ? styles.archiveButtonPressed : null]}>
                  <Feather color={colours.textSecondary} name="archive" size={18} />
                </Pressable>
              </View>
              <StatusBadge value={report.status} />
              {reportUrl ? (
                <Pressable onPress={() => void Linking.openURL(getReportUrl(reportUrl))} style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>Open report</Text>
                </Pressable>
              ) : (
                <View style={styles.missingReportBlock}>
                  <Text style={styles.missingReportCopy}>Report file not available — regenerate from Review</Text>
                  <Button label="Open review" onPress={() => openReview(report.id)} variant="secondary" />
                </View>
              )}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  highlightShell: {
    borderRadius: radii.card + 2,
    borderWidth: 1,
    borderColor: borders.accent,
    backgroundColor: withAlpha(colours.accent, 0.08),
    padding: 2,
  },
  generatedInline: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.tightGap,
  },
  generatedMarker: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colours.accent,
  },
  generatedInlineText: {
    ...typography.supporting,
    color: colours.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.compactGap,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  reportTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  reportSubtitle: {
    ...typography.supporting,
    color: colours.textSecondary,
  },
  archiveButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    borderRadius: radii.badge,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'none'
  },
  archiveButtonPressed: {
    backgroundColor: withAlpha(colours.textSecondary, 0.08),
    transform: [{ scale: 0.95 }],
  },
  linkButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colours.primary,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkButtonText: {
    color: colours.surface,
    fontWeight: 'bold',
  },
  missingReportBlock: {
    gap: 10,
  },
  missingReportCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
});
