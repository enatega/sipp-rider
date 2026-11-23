import apiClient from './apiClient';

// apiClient's base URL already includes /api/v1.
const ticketsBase = '/deliveries/support-tickets';
const chatBase = '/deliveries/support-chat-app';

export type SupportTicket = {
  id: string;
  chatBoxId: string | null;
  title: string;
  subtitle: string;
  date: { day: string; month: string };
  createdAt: string;
  status: { key: string; label: string };
  unreadCount: number;
};

export type TicketMessage = {
  id: string;
  sender_id: string;
  text: string;
  createdAt: string;
};

export type TicketConversation = { messages: TicketMessage[]; status: string };

export const supportTicketService = {
  list: () => apiClient.get<{ tickets: SupportTicket[] }>(`${ticketsBase}/my-tickets?creatorType=rider`),
  create: (email: string, reason: string, description: string) =>
    apiClient.post<{ chatBoxId: string }>(ticketsBase, {
      creatorType: 'rider', category: 'business_support', reason, email, description,
    }),
  messages: (chatBoxId: string) =>
    apiClient.get<TicketConversation>(`${chatBase}/messages/${chatBoxId}`),
  send: (chatBoxId: string, text: string) =>
    apiClient.post(`${chatBase}/send-to-chat-box`, { chatBoxId, text }),
};
