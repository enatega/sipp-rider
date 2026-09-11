export type SupportChatMessage = {
  id: string;
  text: string;
  senderId: string | null;
  receiverId: string | null;
  createdAt: string | null;
};

export type SupportChatMessagesResponse = {
  messages: SupportChatMessage[];
};

export type SendSupportChatMessagePayload = {
  senderId: string;
  receiverId: string;
  text: string;
};

export type SendSupportChatMessageResponse = {
  chatBoxId?: string | null;
  message?: string;
  detail?: {
    id?: string | null;
    sender_id?: string | null;
    receiver_id?: string | null;
    text?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};
