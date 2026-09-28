import apiClient from './apiClient';
import {
  SendSupportChatMessagePayload,
  SendSupportChatMessageResponse,
  SupportChatMessage,
  SupportChatMessagesResponse,
} from './supportChatTypes';

const SUPPORT_CHAT_BASE = '/apps/deliveries/chat';

type UnknownRecord = Record<string, unknown>;

const EMPTY_MESSAGE: SupportChatMessage = {
  id: '',
  text: '',
  senderId: null,
  receiverId: null,
  createdAt: null,
};

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' ? (value as UnknownRecord) : {};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeMessage = (value: unknown): SupportChatMessage | null => {
  const candidate = asRecord(value);
  const text = asString(candidate.text) ?? asString(candidate.message);
  if (!text) return null;

  return {
    ...EMPTY_MESSAGE,
    id:
      asString(candidate.id)
      ?? asString(candidate._id)
      ?? asString(candidate.messageId)
      ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    senderId: asString(candidate.senderId) ?? asString(candidate.sender_id) ?? asString(asRecord(candidate.sender).id),
    receiverId: asString(candidate.receiverId) ?? asString(candidate.receiver_id) ?? asString(asRecord(candidate.receiver).id),
    createdAt: asString(candidate.createdAt) ?? asString(candidate.updatedAt),
  };
};

const pickMessagesArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  const level1 = asRecord(root.data ?? payload);
  const level2 = asRecord(level1.data ?? level1);
  const nestedMessages =
    level2.messages
    ?? level1.messages
    ?? root.messages
    ?? level2.items
    ?? level1.items
    ?? root.items
    ?? [];

  return Array.isArray(nestedMessages) ? nestedMessages : [];
};

export const supportChatService = {
  getOrderUnreadCounts: () =>
    apiClient.get<{
      total: number;
      byOrderId: Record<string, number>;
      byOrderAndKind?: Record<string, { store_rider: number; customer_rider: number }>;
    }>(`${SUPPORT_CHAT_BASE}/order-unread`),
  getOrderChat: async (orderId: string, kind: 'store_rider' | 'customer_rider') => {
    const response = await apiClient.get<{ chatBoxId: string | null }>(`${SUPPORT_CHAT_BASE}/order/${orderId}/${kind}`);
    return response;
  },
  markOrderChatRead: async (orderId: string, kind: 'store_rider' | 'customer_rider') => {
    return apiClient.patch<{ unreadCount: number }>(`${SUPPORT_CHAT_BASE}/order/${orderId}/${kind}/read`, {});
  },
  getMessages: async (chatBoxId: string): Promise<SupportChatMessagesResponse> => {
    const response = await apiClient.get<unknown>(`${SUPPORT_CHAT_BASE}/messages/${chatBoxId}`);
    const messages = pickMessagesArray(response)
      .map(normalizeMessage)
      .filter((item): item is SupportChatMessage => Boolean(item))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });

    return { messages };
  },

  sendMessage: async (payload: SendSupportChatMessagePayload) => {
    if (payload.orderId && payload.kind) {
      return apiClient.post<SendSupportChatMessageResponse>(
        `${SUPPORT_CHAT_BASE}/order/${payload.orderId}/${payload.kind}/send`,
        { text: payload.text },
      );
    }
    return apiClient.post<SendSupportChatMessageResponse>(`${SUPPORT_CHAT_BASE}/send`, payload);
  },
};
