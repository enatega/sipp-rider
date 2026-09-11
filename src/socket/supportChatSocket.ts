import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';
import { apiConfig } from '../api/apiConfig';

type SocketOptionsInput = Partial<ManagerOptions & SocketOptions>;

export type SocketSubscriptionCleanup = () => void;

export type SocketReceivedMessage = {
  id?: string;
  text?: string;
  sender?: string;
  receiver?: string;
  senderId?: string;
  receiverId?: string;
  chatBoxId?: string;
  chat_box_id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SocketSentMessage = {
  sender: string;
  receiver: string;
  text: string;
  chatBoxId?: string | null;
};

type ChatSocketSession = {
  token: string | null;
  userId: string | null;
};

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function buildSocketUrl() {
  const baseUrl = normalizeUrl(process.env.EXPO_PUBLIC_SOCKET_URL ?? apiConfig.baseUrl);
  return `${baseUrl}/deliveries`;
}

class SupportChatSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private userId: string | null = null;

  private buildAuth(token: string | null) {
    return token ? { token } : {};
  }

  private ensureSocket(options?: SocketOptionsInput) {
    if (this.socket) {
      this.socket.auth = this.buildAuth(this.token);
      return this.socket;
    }

    this.socket = io(buildSocketUrl(), {
      autoConnect: false,
      path: process.env.EXPO_PUBLIC_SOCKET_PATH ?? '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.5,
      timeout: 20_000,
      auth: this.buildAuth(this.token),
      ...options,
    });

    this.socket.on('connect', () => {
      if (this.userId) {
        this.socket?.emit('add-user', this.userId);
      }
    });

    return this.socket;
  }

  connect(options?: SocketOptionsInput) {
    const socket = this.ensureSocket(options);
    if (!this.token) return socket;
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  disconnect() {
    if (!this.socket?.connected) return;
    this.socket.disconnect();
  }

  updateSession(session: ChatSocketSession) {
    const tokenChanged = this.token !== session.token;
    this.token = session.token;
    this.userId = session.userId;

    if (!this.socket) return;

    this.socket.auth = this.buildAuth(this.token);

    if (!this.token) {
      this.disconnect();
      return;
    }

    if (tokenChanged && this.socket.connected) {
      this.socket.disconnect().connect();
      return;
    }

    if (this.socket.connected && this.userId) {
      this.socket.emit('add-user', this.userId);
    }
  }

  private subscribe<T extends unknown[]>(event: string, handler: (...args: T) => void): SocketSubscriptionCleanup {
    const socket = this.ensureSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }

  onReceiveMessage(
    handler: (message: SocketReceivedMessage) => void,
  ): SocketSubscriptionCleanup {
    return this.subscribe<[SocketReceivedMessage]>('receive-message', (message) => {
      console.log('Received socket message:', message);
      handler(message);
    });
  }

  sendMessage(message: SocketSentMessage) {
    const socket = this.socket;

    if (!socket?.connected) {
      console.log('[Socket] Send message skipped because socket is not connected', {
        receiver: message.receiver,
        sender: message.sender,
      });
      return false;
    }

    console.log('[Socket] Sending socket message', {
      receiver: message.receiver,
      sender: message.sender,
    });
    socket.emit('send-message', message);
    return true;
  }
}

export const supportChatSocketClient = new SupportChatSocketClient();
