import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import { useDeliveryProblem } from '../hooks/useDeliveryProblem';
import { deliveryProblemReasons, DeliveryProblemReason } from '../api/deliveryProblemService';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import OrderDetailTopBar from './orderDetail/components/OrderDetailTopBar';
import ProblemReasonOption from './deliveryProblem/components/ProblemReasonOption';
import ProblemReportSummary from './deliveryProblem/components/ProblemReportSummary';

const MAX_DETAILS_LENGTH = 2000;

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryProblem'>;
export default function DeliveryProblemScreen({ route, navigation }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { query, mutation } = useDeliveryProblem(route.params.orderId);
  const [reason, setReason] = useState<DeliveryProblemReason | null>(null);
  const [details, setDetails] = useState('');
  const submitting = useRef(false);
  const report = query.data?.report;
  const isForm = !query.isLoading && !query.isError && !report;
  const needsDetails = reason === 'other';
  const canSubmit = Boolean(reason) && (!needsDetails || Boolean(details.trim())) && !mutation.isPending;

  const submit = async () => {
    if (!reason || submitting.current) return;
    submitting.current = true;
    try { await mutation.mutateAsync({ reason, details: details.trim() }); }
    catch { /* The persistent inline error retains the form for retry. */ }
    finally { submitting.current = false; }
  };
  const confirmSubmit = () => Alert.alert(t('delivery_problem_title'), t('delivery_problem_confirm'), [
    { text: t('delivery_problem_cancel'), style: 'cancel' },
    { text: t('delivery_problem_submit'), onPress: () => void submit() },
  ]);

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <OrderDetailTopBar title={t('delivery_problem_title')} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.orderChip, { backgroundColor: theme.colors.gray100 }]}>
            <Feather name="package" size={14} color={theme.colors.gray700} />
            <Text variant="caption" weight="bold" color={theme.colors.gray700}>#{route.params.orderId.split('-')[0].toUpperCase()}</Text>
          </View>

          {query.isLoading ? <ActivityIndicator style={styles.loader} color={theme.colors.brandInk} /> : null}
          {query.isError ? (
            <View style={[styles.notice, { backgroundColor: theme.colors.red100 }]}>
              <Text color={theme.colors.red800}>{t('delivery_problem_load_error')}</Text>
              <Button variant="secondary" label={t('delivery_problem_retry')} onPress={() => void query.refetch()} />
            </View>
          ) : null}
          {report ? <><ProblemReportSummary report={report} />{report.chatBoxId && <Button label={`${t('delivery_issue_chat')}${report.unreadCount ? ` (${report.unreadCount > 99 ? '99+' : report.unreadCount})` : ''}`} onPress={() => navigation.navigate('DeliveryIssueChat', { orderId: route.params.orderId, chatBoxId: report.chatBoxId! })} />}</> : null}

          {isForm ? (
            <>
              <View style={[styles.intro, { backgroundColor: theme.colors.primarySoft }]}>
                <Feather name="info" size={18} color={theme.colors.brandInk} />
                <Text variant="caption" color={theme.colors.gray700} style={styles.introText}>{t('delivery_problem_explanation')}</Text>
              </View>

              <Text weight="bold" color={theme.colors.gray900} style={styles.sectionTitle}>{t('delivery_problem_choose_reason')}</Text>
              <View style={styles.reasons} accessibilityRole="radiogroup">
                {deliveryProblemReasons.map((value) => (
                  <ProblemReasonOption key={value} reason={value} label={t(`delivery_problem_reason_${value}`)} isSelected={reason === value} onPress={() => setReason(value)} />
                ))}
              </View>

              <View style={styles.detailsHeader}>
                <Text weight="bold" color={theme.colors.gray900} style={styles.sectionTitle}>{t('delivery_problem_details_title')}</Text>
                <Text variant="caption" weight="semiBold" color={needsDetails ? theme.colors.red500 : theme.colors.gray500}>
                  {t(needsDetails ? 'delivery_problem_required' : 'delivery_problem_optional')}
                </Text>
              </View>
              <TextInput
                multiline
                maxLength={MAX_DETAILS_LENGTH}
                value={details}
                onChangeText={setDetails}
                accessibilityLabel={t('delivery_problem_details_title')}
                placeholder={t(needsDetails ? 'delivery_problem_details_required' : 'delivery_problem_details')}
                style={styles.input}
              />
              <Text variant="caption" color={theme.colors.gray500} style={styles.counter}>{details.length}/{MAX_DETAILS_LENGTH}</Text>

              {mutation.isError ? (
                <View accessibilityRole="alert" style={[styles.inlineError, { backgroundColor: theme.colors.red100 }]}>
                  <Feather name="alert-circle" size={16} color={theme.colors.red800} />
                  <Text variant="caption" color={theme.colors.red800} style={styles.introText}>{mutation.error.message || t('delivery_problem_send_error')}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        {isForm || report ? (
          <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.gray200 }]}>
            {isForm ? (
              <Button
                label={t(mutation.isPending ? 'delivery_problem_sending' : 'delivery_problem_submit')}
                disabled={!canSubmit}
                onPress={confirmSubmit}
                textColor={theme.colors.black}
                containerStyle={styles.submit}
              />
            ) : (
              <Button variant="secondary" label={t('delivery_problem_back_to_order')} onPress={() => navigation.goBack()} containerStyle={styles.submit} />
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  orderChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  loader: { paddingVertical: 24 },
  notice: { borderRadius: 14, padding: 16, gap: 12 },
  intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 14 },
  introText: { flex: 1 },
  sectionTitle: { fontSize: 17, lineHeight: 24 },
  reasons: { gap: 10 },
  detailsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 },
  input: { height: 112, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', marginTop: -6 },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
  submit: { height: 54, borderRadius: 14 },
});
