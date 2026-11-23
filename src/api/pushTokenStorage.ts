import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sipp_rider_device_push_token';
const registrations = new Set<Promise<void>>();
let signingOut = false;

export const pushTokenStorage = {
  save: (token: string | null | undefined) => token ? AsyncStorage.setItem(KEY, token) : AsyncStorage.removeItem(KEY),
  get: () => AsyncStorage.getItem(KEY),
  clear: () => AsyncStorage.removeItem(KEY),
  register: async (token: string, send: () => Promise<unknown>) => {
    if (signingOut) return false;
    const pending = (async () => {
      await send();
      await AsyncStorage.setItem(KEY, token);
    })();
    registrations.add(pending);
    try {
      await pending;
      return true;
    } finally {
      registrations.delete(pending);
    }
  },
  beginLogout: async () => {
    signingOut = true;
    await Promise.allSettled([...registrations]);
  },
  cancelLogout: () => { signingOut = false; },
};
