import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SupportTicket, TicketMessage } from '../../api/supportTicketService';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { supportTicketTitle } from './supportTicketTitle';

type Props = {
  ticket?: SupportTicket;
  messages: TicketMessage[];
  status?: string;
  userId?: string;
  isLoading: boolean;
  isError: boolean;
  isRefreshing: boolean;
  isSending: boolean;
  onRefresh: () => void;
  onSend: (text: string) => Promise<void>;
};

export default function SupportTicketConversation({ ticket, messages, status, userId, isLoading, isError, isRefreshing, isSending, onRefresh, onSend }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const canReply = status === 'opened' || status === 'in_progress';
  const closed = status === 'closed' || status === 'resolved';
  const submit = async () => {
    const text = draft.trim();
    if (!text || !canReply || isSending) return;
    setSendError(false);
    try { await onSend(text); setDraft(''); }
    catch { setSendError(true); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <Text weight="bold" style={[styles.heroTitle, { color: theme.colors.gray900 }]} numberOfLines={2}>
          {ticket ? supportTicketTitle(ticket.title) : t('support_conversation')}
        </Text>
        <View style={[styles.status, { backgroundColor: theme.colors.surface }]}>
          <Text variant="caption" weight="semiBold" style={{ color: theme.colors.gray900 }}>
            {ticket?.status.label ?? (closed ? t('support_filter_closed') : t('support_filter_active'))}
          </Text>
        </View>
      </View>
      {ticket?.subtitle ? <View style={[styles.summary, { borderBottomColor: theme.colors.gray200 }]}>
        <Text numberOfLines={2} style={{ color: theme.colors.gray600 }}>{ticket.subtitle}</Text>
      </View> : null}

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {isLoading ? <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><Text style={{ color: theme.colors.gray600 }}>{t('support_chat_loading')}</Text></View>
          : isError ? <View style={styles.state}><Text weight="semiBold" style={{ color: theme.colors.gray900 }}>{t('support_chat_load_failed')}</Text><Text style={{ color: theme.colors.gray600 }}>{t('support_pull_refresh')}</Text></View>
          : messages.length === 0 ? <View style={styles.state}><Text weight="semiBold" style={{ color: theme.colors.gray900 }}>{t('support_chat_empty')}</Text><Text style={{ color: theme.colors.gray600 }}>{t('support_chat_empty_hint')}</Text></View>
          : messages.map((message) => {
            const mine = message.sender_id === userId;
            return <View key={message.id} style={[styles.bubble, { alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: mine ? theme.colors.sky100 : theme.colors.gray50 }]}>
              <Text variant="caption" weight="semiBold" style={{ color: theme.colors.gray600 }}>{mine ? t('support_you') : t('support_team')}</Text>
              <Text style={{ color: theme.colors.gray900 }}>{message.text}</Text>
              <Text variant="caption" style={[styles.time, { color: theme.colors.gray500 }]}>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}</Text>
            </View>;
          })}
        {closed && <View style={[styles.closed, { backgroundColor: theme.colors.green50 }]}><Text style={{ color: theme.colors.green600 }}>{t('support_closed')}</Text></View>}
      </ScrollView>

      {sendError && <View style={[styles.error, { backgroundColor: theme.colors.amber100 }]}><Text style={{ color: theme.colors.amber800 }}>{t('support_send_failed')}</Text></View>}
      {canReply && !isError ? <View style={[styles.composer, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray200 }]}>
        <TextInput multiline value={draft} onChangeText={setDraft} maxLength={2000} placeholder={t('support_message_hint')}
          placeholderTextColor={theme.colors.gray500} style={[styles.messageInput, { backgroundColor: theme.colors.gray50, color: theme.colors.gray900 }]} />
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !draft.trim() || isSending }} disabled={!draft.trim() || isSending}
          onPress={() => void submit()} style={[styles.send, { backgroundColor: theme.colors.primary, opacity: draft.trim() && !isSending ? 1 : 0.5 }]}>
          <Ionicons name="send" size={20} color={theme.colors.gray900} />
        </Pressable>
      </View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 96, paddingHorizontal: 20, paddingVertical: 16, gap: 8, justifyContent: 'center' },
  heroTitle: { fontSize: 20, lineHeight: 26 }, status: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  summary: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth }, messages: { flex: 1 },
  messageContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, gap: 14 }, state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, gap: 5 }, time: { alignSelf: 'flex-end' },
  closed: { alignSelf: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 },
  error: { paddingHorizontal: 16, paddingVertical: 10 }, composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  messageInput: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 10 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
