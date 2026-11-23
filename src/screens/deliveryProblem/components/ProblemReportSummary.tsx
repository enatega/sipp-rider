import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';
import type { DeliveryProblem } from '../../../api/deliveryProblemService';

export default function ProblemReportSummary({ report }: { report: DeliveryProblem }) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const inReview = report.status === 'in_progress';
  const chip = inReview
    ? { background: theme.colors.primarySoft, foreground: theme.colors.brandInk }
    : { background: theme.colors.amber100, foreground: theme.colors.amber800 };
  const rows: Array<[string, React.ReactNode]> = [
    [t('delivery_problem_reference'), <Text key="ref" selectable weight="semiBold" color={theme.colors.gray900}>{report.ticketId}</Text>],
    [t('delivery_problem_status'), (
      <View key="status" style={[styles.chip, { backgroundColor: chip.background }]}>
        <View style={[styles.dot, { backgroundColor: chip.foreground }]} />
        <Text variant="caption" weight="semiBold" color={chip.foreground}>{t(['resolved', 'closed'].includes(report.status) ? 'delivery_issue_resolved' : inReview ? 'delivery_problem_in_progress' : 'delivery_problem_open')}</Text>
      </View>
    )],
    [t('delivery_problem_sent_at'), <Text key="sent" weight="medium" color={theme.colors.gray900}>{new Date(report.createdAt).toLocaleString()}</Text>],
  ];

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: theme.colors.green50 }]}>
          <Feather name="check" size={32} color={theme.colors.green600} />
        </View>
        <Text weight="bold" color={theme.colors.gray900} style={styles.title}>{t('delivery_problem_submitted')}</Text>
        <Text color={theme.colors.gray600} style={styles.explanation}>{t(['resolved','closed'].includes(report.status) ? 'delivery_issue_resolved' : 'delivery_problem_explanation')}</Text>
      </View>

      <View style={[styles.card, { borderColor: theme.colors.gray200 }]}>
        {rows.map(([label, value], index) => (
          <View key={label} style={[styles.row, index > 0 && { borderTopColor: theme.colors.gray200, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <Text variant="caption" color={theme.colors.gray600}>{label}</Text>
            {value}
          </View>
        ))}
      </View>

      {report.description ? (
        <View style={[styles.message, { backgroundColor: theme.colors.gray50 }]}>
          <Text variant="caption" weight="semiBold" color={theme.colors.gray600}>{t('delivery_problem_message')}</Text>
          <Text selectable color={theme.colors.gray900}>{report.description}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, lineHeight: 28, textAlign: 'center' },
  explanation: { textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16 },
  row: { paddingVertical: 12, gap: 4, alignItems: 'flex-start' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  message: { borderRadius: 14, padding: 14, gap: 4 },
});
