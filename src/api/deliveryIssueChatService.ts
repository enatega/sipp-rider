import apiClient from './apiClient';
export interface DeliveryIssueMessage { id: string; sender_id: string; text: string; createdAt: string; }
export interface DeliveryIssueMessages { messages: DeliveryIssueMessage[]; status: string; }
const base = '/deliveries/support-chat-app';
export const deliveryIssueChatService = {
  messages: (chatId: string) => apiClient.get<DeliveryIssueMessages>(`${base}/messages/${chatId}`),
  send: (chatId: string, text: string) => apiClient.post<{ detail: DeliveryIssueMessage }>(`${base}/send-to-chat-box`, { chatBoxId: chatId, text }),
};
