import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';
import { apiConfig } from '../api/apiConfig';

type SocketOptionsInput = Partial<ManagerOptions & SocketOptions>;

export type RiderOrderStatusUpdatedPayload = {
  orderId: string;
  status: string;
  riderStatus: string | null;
  riderId: string | null;
  riderUserId?: string | null;
  updatedAt: string;
  assignmentType?: 'broadcast_claim' | 'manual';
  eta?: import('../api/riderHomeTypes').RiderOrderEta | null;
};

export type RiderStatusUpdatedPayload = {
  orderId: string;
  riderStatus: string | null;
  riderId: string | null;
  riderName: string | null;
  updatedAt: string;
};

export type RiderOrderAvailablePayload = {
  orderId: string;
  orderCode: string;
  storeId: string;
  storeName: string;
  pickupAddress: string | null;
  orderAmount: number;
  zoneId: string;
  status: string;
  updatedAt: string;
  expiresAt: string;
};

export type RiderLocationUpdatePayload = {
  orderId: string;
  riderUserId: string;
  customerUserId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: number;
};

type RiderSocketSession = {
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

class RiderOrdersSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private userId: string | null = null;

  private buildAuth(token: string | null) {
    return token ? { token } : {};
  }

  private emitAddUser(socket: Socket) {
    if (!this.userId) {
      console.log('[rider][socket] add-user skipped: missing userId');
      return;
    }
    console.log('[rider][socket] emitting add-user', {
      userId: this.userId,
      socketId: socket.id,
      connected: socket.connected,
    });
    socket.emit('add-user', this.userId);
  }

  private ensureSocket(options?: SocketOptionsInput) {
    if (this.socket) {
      this.socket.auth = this.buildAuth(this.token);
      return this.socket;
    }

    const socketUrl = buildSocketUrl();
    const socketPath = process.env.EXPO_PUBLIC_SOCKET_PATH ?? '/socket.io';
    console.log('[rider][socket] creating connection', {
      socketUrl,
      socketPath,
    });

    this.socket = io(socketUrl, {
      autoConnect: false,
      path: socketPath,
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
      console.log('[rider][socket] connected', {
        socketId: this.socket?.id,
        hasToken: Boolean(this.token),
        userId: this.userId,
      });
      this.emitAddUser(this.socket as Socket);
    });

    this.socket.on('connect_error', (error) => {
      console.log('[rider][socket] connect_error', {
        message: error.message,
        name: error.name,
        hasToken: Boolean(this.token),
        userId: this.userId,
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[rider][socket] disconnected', {
        reason,
        userId: this.userId,
      });
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

  updateSession(session: RiderSocketSession) {
    const tokenChanged = this.token !== session.token;
    this.token = session.token;
    this.userId = session.userId;
    console.log('[rider][socket] session updated', {
      tokenChanged,
      hasToken: Boolean(this.token),
      userId: this.userId,
      socketExists: Boolean(this.socket),
      socketConnected: Boolean(this.socket?.connected),
    });

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

    if (this.socket.connected) {
      this.emitAddUser(this.socket);
    }
  }

  subscribeOrderStatusUpdated(handler: (payload: RiderOrderStatusUpdatedPayload) => void) {
    const socket = this.ensureSocket();
    socket.on('order-status-updated', handler);

    return () => {
      socket.off('order-status-updated', handler);
    };
  }

  subscribeRiderStatusUpdated(handler: (payload: RiderStatusUpdatedPayload) => void) {
    const socket = this.ensureSocket();
    socket.on('rider-status-updated', handler);

    return () => {
      socket.off('rider-status-updated', handler);
    };
  }

  subscribeRiderOrderAvailable(handler: (payload: RiderOrderAvailablePayload) => void) {
    const socket = this.ensureSocket();
    socket.on('rider-order-available', handler);

    return () => {
      socket.off('rider-order-available', handler);
    };
  }

  publishLocation(payload: RiderLocationUpdatePayload) {
    const socket = this.connect();
    if (!this.token) return false;

    // Socket.IO buffers this event while reconnecting. Keeping the newest GPS
    // sample queued avoids waiting for another movement callback after connect.
    socket.emit('update-rider-current-location', payload);
    return true;
  }
}

export const riderOrdersSocketClient = new RiderOrdersSocketClient();
