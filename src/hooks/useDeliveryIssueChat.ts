import { scheduleRiderQueryRefresh } from './riderQueryRefresh';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { riderHomeKeys } from '../api/queryKeys';
import { deliveryIssueChatService, type DeliveryIssueMessages } from '../api/deliveryIssueChatService';
import { riderOrdersSocketClient } from '../socket/riderOrdersSocket';
export function useDeliveryIssueChat(chatId: string) {
  const { session } = useAuth();
  const client = useQueryClient();
  const key = riderHomeKeys.deliveryIssueMessages(session.user?.id ?? '', chatId);
  const query = useQuery({ queryKey: key, queryFn: () => deliveryIssueChatService.messages(chatId), enabled: !!chatId && !!session.user?.id,
    retry: false, staleTime: 30_000 });
  useFocusEffect(useCallback(() => {
    const off = riderOrdersSocketClient.subscribeDeliveryIssue((event) => {
      if (event.chatBoxId !== chatId) return;
      if (event.message) {
        const message = event.message;
        client.setQueryData<DeliveryIssueMessages>(riderHomeKeys.deliveryIssueMessages(session.user?.id ?? '', chatId), (current) => ({
          status: current?.status ?? 'opened',
          messages: current?.messages.some((item) => item.id === message.id)
            ? current.messages : [...(current?.messages ?? []), message],
        }));
        // Refresh once in the shared batch to acknowledge read state and reconcile snapshots.
        if (message.sender_id !== session.user?.id) scheduleRiderQueryRefresh(client, [riderHomeKeys.deliveryIssueMessages(session.user?.id ?? '', chatId)]);
      } else {
        scheduleRiderQueryRefresh(client, [riderHomeKeys.deliveryIssueMessages(session.user?.id ?? '', chatId)]);
      }
    });
    const reconnect = riderOrdersSocketClient.subscribeConnection(() => { void query.refetch(); });
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') void query.refetch(); });
    return () => { off(); reconnect(); sub.remove(); };
  }, [chatId, client, query.refetch, session.user?.id]));
  const send = useMutation({ mutationFn: (text: string) => deliveryIssueChatService.send(chatId, text), retry: false,
    onSuccess: (response) => client.setQueryData<DeliveryIssueMessages>(key, (current) => ({
      status: current?.status ?? 'opened', messages: current?.messages.some((m) => m.id === response.detail.id)
        ? current.messages : [...(current?.messages ?? []), response.detail],
    })) });
  return { query, send, userId: session.user?.id };
}
