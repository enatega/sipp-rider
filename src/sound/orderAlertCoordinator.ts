import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { newOrderBeepManager } from './newOrderBeep';

type SeenState = { orders: Record<string, number> };
type NewOrderEvent = {
  userId: string;
  orderId: string;
  occurredAt: string;
  kind?: 'offer' | 'assignment';
  expiresAt?: string;
  allowOlderEvent?: boolean;
};

const MAX_EVENT_AGE_MS = 120_000;
const SEEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
let queue: Promise<unknown> = Promise.resolve();
let activeUserId: string | null = null;
let state: SeenState | null = null;
let epoch = 0;

async function load(userId: string): Promise<SeenState> {
  if (activeUserId === userId && state) return state;
  activeUserId = userId;
  try {
    const raw = await AsyncStorage.getItem(`rider:order-alerts:${userId}`);
    const parsed = raw ? JSON.parse(raw) as Partial<SeenState> : null;
    state = parsed?.orders && typeof parsed.orders === 'object'
      ? { orders: parsed.orders }
      : { orders: {} };
  } catch {
    state = { orders: {} };
  }
  return state;
}

export function alertForNewRiderOrder(event: NewOrderEvent): Promise<boolean> {
  const requestEpoch = epoch;
  const operation = queue.then(async () => {
    if (requestEpoch !== epoch || AppState.currentState !== 'active') return false;
    const occurredAt = Date.parse(event.occurredAt);
    const now = Date.now();
    if (!event.userId || !event.orderId || !Number.isFinite(occurredAt)
      || occurredAt > now + 30_000 || (!event.allowOlderEvent && now - occurredAt > MAX_EVENT_AGE_MS)) return false;
    if (event.expiresAt && Date.parse(event.expiresAt) <= now) return false;
    const seen = await load(event.userId);
    if (requestEpoch !== epoch || AppState.currentState !== 'active') return false;
    seen.orders = Object.fromEntries(Object.entries(seen.orders).filter(([, at]) => now - at < SEEN_TTL_MS));
    const alertKey = event.kind === 'assignment' ? `assignment:${event.orderId}` : event.orderId;
    if (seen.orders[alertKey]) return false;
    seen.orders[alertKey] = now;
    if (Object.keys(seen.orders).length > 5000) {
      seen.orders = Object.fromEntries(Object.entries(seen.orders).sort((a, b) => a[1] - b[1]).slice(-5000));
    }
    try {
      await AsyncStorage.setItem(`rider:order-alerts:${event.userId}`, JSON.stringify(seen));
    } catch {
      // In-memory deduplication still protects the current session.
    }
    if (requestEpoch !== epoch || AppState.currentState !== 'active') return false;
    void newOrderBeepManager.playOnce();
    return true;
  });
  queue = operation.catch(() => undefined);
  return operation;
}

export function stopRiderOrderAlerts(): void {
  epoch += 1;
  void newOrderBeepManager.stop();
}
