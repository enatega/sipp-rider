import React, { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import SupportPageHeader from '../components/support/SupportPageHeader';
import SupportTicketConversation from '../components/support/SupportTicketConversation';
import SupportTicketForm from '../components/support/SupportTicketForm';
import SupportTicketsHome from '../components/support/SupportTicketsHome';
import { useSupportTickets } from '../hooks/useSupportTickets';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';

export default function SupportTicketsScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { session } = useAuth();
  const [chatBoxId, setChatBoxId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { list, messages, create, send } = useSupportTickets(chatBoxId);
  const ticket = list.data?.tickets.find((item) => item.chatBoxId === chatBoxId);

  const goBack = () => {
    if (chatBoxId) setChatBoxId(null);
    else if (creating) setCreating(false);
    else navigation.goBack();
  };

  useFocusEffect(useCallback(() => {
    if (!chatBoxId && !creating) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chatBoxId) setChatBoxId(null);
      else setCreating(false);
      return true;
    });
    return () => subscription.remove();
  }, [chatBoxId, creating]));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SupportPageHeader title={creating ? t('support_new_ticket') : chatBoxId ? t('support_conversation') : t('support_title')}
        backLabel={t('support_back')} onBack={goBack} />
      {creating ? (
        <SupportTicketForm initialEmail={session.user?.email ?? ''} isSubmitting={create.isPending}
          onSubmit={async (email, reason, description) => {
            const result = await create.mutateAsync({ email, reason, description });
            setCreating(false);
            setChatBoxId(result.chatBoxId);
          }} />
      ) : chatBoxId ? (
        <SupportTicketConversation ticket={ticket} messages={messages.data?.messages ?? []}
          status={messages.data?.status} userId={session.user?.id}
          isLoading={messages.isPending} isError={messages.isError} isRefreshing={messages.isRefetching}
          isSending={send.isPending} onRefresh={() => void messages.refetch()}
          onSend={async (text) => { await send.mutateAsync(text); }} />
      ) : (
        <SupportTicketsHome tickets={list.data?.tickets ?? []} isLoading={list.isPending}
          isError={list.isError} isRefreshing={list.isRefetching}
          onRefresh={() => void list.refetch()} onNewTicket={() => setCreating(true)} onOpenTicket={setChatBoxId} />
      )}
    </SafeAreaView>
  );
}
