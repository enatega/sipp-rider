import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import { WithdrawalDetail } from '../../../api/riderWalletTypes';
import { useAppCurrency } from '../../../hooks/useCurrency';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { walletDate } from '../walletFormatting';
import WithdrawalStatus from './WithdrawalStatus';

type Props = { data: WithdrawalDetail; onProof: (uri: string) => void };

export default function WithdrawalDetailView({ data, onProof }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();
  const proof = data.payment_proof;
  const isDocument = proof ? /\.(pdf|docx?)(?:[?#]|$)/i.test(proof) : false;

  const detailRows: Array<[string, string]> = [
    [t('wallet_requested_amount'), formatCurrency(Number(data.amount))],
    ...(data.approved_amount != null ? [[t('wallet_approved_amount'), formatCurrency(Number(data.approved_amount))] as [string, string]] : []),
    [t('wallet_requested_on'), walletDate(data.createdAt, true)],
    [t('wallet_updated_on'), walletDate(data.updatedAt || data.createdAt, true)],
    [t('wallet_request_reference'), data.id],
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { backgroundColor: theme.colors.gray50 }]}>
        <WithdrawalStatus status={data.status} />
        <Text weight="bold" color={theme.colors.gray900} style={styles.heroAmount}>{formatCurrency(Number(data.approved_amount ?? data.amount))}</Text>
        <Text variant="caption" color={theme.colors.gray600}>{t(data.approved_amount != null ? 'wallet_approved_amount' : 'wallet_requested_amount')}</Text>
      </View>

      <View style={[styles.card, { borderColor: theme.colors.gray200 }]}>
        {detailRows.map(([label, value], index) => (
          <View key={label} style={[styles.detailRow, index > 0 && { borderTopColor: theme.colors.gray200, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <Text variant="caption" color={theme.colors.gray600}>{label}</Text>
            <Text weight="medium" color={theme.colors.gray900} style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      {data.notes ? (
        <View style={[styles.callout, { backgroundColor: theme.colors.sky100 }]}>
          <Feather name="message-square" size={18} color={theme.colors.sky600} />
          <View style={styles.calloutCopy}>
            <Text variant="caption" weight="semiBold" color={theme.colors.sky600}>{t('wallet_admin_notes')}</Text>
            <Text color={theme.colors.gray900}>{data.notes}</Text>
          </View>
        </View>
      ) : null}
      {data.rejection_reason ? (
        <View style={[styles.callout, { backgroundColor: theme.colors.red100 }]}>
          <Feather name="alert-circle" size={18} color={theme.colors.red800} />
          <View style={styles.calloutCopy}>
            <Text variant="caption" weight="semiBold" color={theme.colors.red800}>{t('wallet_rejection_reason')}</Text>
            <Text color={theme.colors.red800}>{data.rejection_reason}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.proofSection}>
        <Text weight="bold" color={theme.colors.gray900} style={styles.sectionTitle}>{t('wallet_payment_proof')}</Text>
        {proof ? (
          <>
            {!isDocument ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('wallet_view_proof')} onPress={() => onProof(proof)}>
                <Image source={{ uri: proof }} resizeMode="cover" style={[styles.proofImage, { backgroundColor: theme.colors.gray100 }]} />
              </Pressable>
            ) : (
              <View style={[styles.documentTile, { backgroundColor: theme.colors.gray50 }]}>
                <Feather name="file-text" size={28} color={theme.colors.gray500} />
              </View>
            )}
            <Button variant="secondary" label={t('wallet_view_proof')} onPress={() => onProof(proof)} />
          </>
        ) : (
          <View style={[styles.emptyProof, { backgroundColor: theme.colors.gray50 }]}>
            <Feather name="paperclip" size={16} color={theme.colors.gray500} />
            <Text variant="caption" color={theme.colors.gray600} style={styles.emptyProofText}>{t('wallet_no_proof')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  hero: { borderRadius: 20, padding: 20, gap: 8 },
  heroAmount: { fontSize: 36, lineHeight: 44, fontVariant: ['tabular-nums'] },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16 },
  detailRow: { paddingVertical: 12, gap: 3 },
  detailValue: { flexShrink: 1 },
  callout: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, padding: 14 },
  calloutCopy: { flex: 1, gap: 2 },
  proofSection: { gap: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, lineHeight: 26 },
  proofImage: { height: 190, width: '100%', borderRadius: 14 },
  documentTile: { height: 120, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyProof: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 14 },
  emptyProofText: { flex: 1 },
});
