export type SupportChatMessage = {
  id: string;
  text: string;
  attachmentUrls: string[];
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
  text?: string;
  attachmentUrls?: string[];
  orderId?: string;
  kind?: 'store_rider' | 'customer_rider';
};

export type SendSupportChatMessageResponse = {
  chatBoxId?: string | null;
  message?: string;
  detail?: {
    id?: string | null;
    sender_id?: string | null;
    receiver_id?: string | null;
    text?: string | null;
    attachmentUrls?: string[];
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};

export type OrderChatPhoto = {
  uri: string;
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/heic';
  fileSize?: number;
};

export type UploadOrderChatPhotoResponse = {
  url: string;
  mimeType: string;
};
