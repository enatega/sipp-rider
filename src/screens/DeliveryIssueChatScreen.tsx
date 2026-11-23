import type { DeliveryIssueMessage } from '../api/deliveryIssueChatService';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useDeliveryIssueChat } from '../hooks/useDeliveryIssueChat';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import OrderDetailTopBar from './orderDetail/components/OrderDetailTopBar';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryIssueChat'>;
export default function DeliveryIssueChatScreen({ route, navigation }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { query, send, userId } = useDeliveryIssueChat(route.params.chatBoxId);
  const [text, setText] = useState('');
  const sending = useRef(false);
  const list = useRef<FlatList<DeliveryIssueMessage>>(null);
  const followLatest = useRef(true);
  const submit = async () => {
    if (!text.trim() || sending.current) return;
    sending.current = true;
    const submitted = text;
    try { followLatest.current = true; await send.mutateAsync(submitted.trim()); setText((current) => current === submitted ? '' : current); }
    catch { /* Keep input and show retryable inline error. */ }
    finally { sending.current = false; }
  };
  const closed = query.data?.status === 'resolved';
  return <SafeAreaView style={[styles.page, { backgroundColor: theme.colors.background }]}>
    <OrderDetailTopBar title={t('delivery_issue_chat')} onBack={() => navigation.goBack()} />
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {query.isPending && <ActivityIndicator color={theme.colors.primary} />}
      {query.isError && <View style={styles.notice}><Text>{t('delivery_problem_load_error')}</Text><Button label={t('delivery_problem_retry')} onPress={() => void query.refetch()} /></View>}
      <FlatList ref={list} onScroll={({ nativeEvent }) => {
        followLatest.current = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y < 80;
      }} scrollEventThrottle={100} onContentSizeChange={() => { if (followLatest.current) list.current?.scrollToEnd({ animated: true }); }} data={query.data?.messages ?? []} keyExtractor={(item) => item.id} keyboardDismissMode="none" keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.messages} renderItem={({ item }) => <View style={[styles.message, { alignSelf: item.sender_id === userId ? 'flex-end' : 'flex-start',
          backgroundColor: item.sender_id === userId ? theme.colors.sky100 : theme.colors.gray100 }]}>
          <Text color={theme.colors.gray900} selectable>{item.text}</Text><Text variant="caption" color={theme.colors.gray600}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>} />
      {send.isError && <Text style={styles.notice} color={theme.colors.red800} accessibilityRole="alert">{send.error.message || t('delivery_problem_send_error')}</Text>}
      {!closed ? <View style={[styles.composer, { borderTopColor: theme.colors.gray200 }]}>
        <TextInput value={text} onChangeText={setText} multiline maxLength={2000} style={styles.input} placeholder={t('delivery_issue_message')} accessibilityLabel={t('delivery_issue_message')} />
        <Button label={t('delivery_issue_send')} disabled={!text.trim() || send.isPending} onPress={() => void submit()} />
      </View> : <Text style={styles.notice}>{t('delivery_issue_resolved')}</Text>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1 }, messages: { padding: 16, gap: 12 }, message: { maxWidth: '90%', borderRadius: 14, padding: 12, gap: 6 },
  notice: { padding: 16 }, composer: { padding: 16, gap: 10, borderTopWidth: StyleSheet.hairlineWidth }, input: { minHeight: 48, maxHeight: 120 } });
