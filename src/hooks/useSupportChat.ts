import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { supportChatKeys } from '../api/queryKeys';
import { supportChatService } from '../api/supportChatService';
import {
  SendSupportChatMessagePayload,
  SendSupportChatMessageResponse,
  SupportChatMessagesResponse,
} from '../api/supportChatTypes';

export function useSupportChatMessagesQuery(chatBoxId?: string | null) {
  return useQuery<SupportChatMessagesResponse, ApiError>({
    queryKey: supportChatKeys.messages(chatBoxId ?? ''),
    queryFn: () => supportChatService.getMessages(chatBoxId ?? ''),
    enabled: Boolean(chatBoxId),
    staleTime: 10_000,
  });
}

export function useOrderChatSessionQuery(orderId: string, kind: 'store_rider' | 'customer_rider') {
  return useQuery({
    queryKey: supportChatKeys.order(orderId, kind),
    queryFn: () => supportChatService.getOrderChat(orderId, kind),
    enabled: Boolean(orderId),
  });
}

export function useRiderOrderChatUnreadQuery() {
  return useQuery({
    queryKey: supportChatKeys.unread(),
    queryFn: supportChatService.getOrderUnreadCounts,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMarkOrderChatReadMutation() {
  return useMutation({
    mutationFn: ({ orderId, kind }: { orderId: string; kind: 'store_rider' | 'customer_rider' }) =>
      supportChatService.markOrderChatRead(orderId, kind),
  });
}

export function useSendSupportChatMessageMutation(_chatBoxId?: string | null) {
  return useMutation<SendSupportChatMessageResponse, ApiError, SendSupportChatMessagePayload>({
    mutationFn: supportChatService.sendMessage,
  });
}
