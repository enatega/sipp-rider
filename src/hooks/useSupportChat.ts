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

export function useSendSupportChatMessageMutation(_chatBoxId?: string | null) {
  return useMutation<SendSupportChatMessageResponse, ApiError, SendSupportChatMessagePayload>({
    mutationFn: supportChatService.sendMessage,
  });
}
