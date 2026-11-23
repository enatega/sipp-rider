import { Platform, Settings } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// iOS keeps Keychain items (what expo-secure-store writes to) after the app is
// deleted, so a reinstall would otherwise restore the previous login. NSUserDefaults
// (react-native `Settings`) is wiped on uninstall, so a missing marker means this
// is a fresh install and the leftover Keychain auth state must be purged.
const INSTALL_MARKER_KEY = 'sipp_rider_install_marker_v1';

const KEYCHAIN_KEYS_TO_PURGE = [
  'deliveries_rider_app_auth_token',
  'deliveries_rider_app_refresh_token',
  'deliveries_rider_app_auth_user',
];

let pending: Promise<void> | null = null;

async function purgeIfFreshInstall() {
  if (Settings.get(INSTALL_MARKER_KEY)) return;

  try {
    await Promise.all(KEYCHAIN_KEYS_TO_PURGE.map((key) => SecureStore.deleteItemAsync(key)));
    Settings.set({ [INSTALL_MARKER_KEY]: true });
  } catch (error) {
    // Leave the marker unset so the purge is retried on the next launch.
    console.warn('[auth] fresh-install keychain cleanup failed', error);
  }
}

/**
 * Memoized so every reader/writer of auth state can await it and none observe the
 * stale Keychain session before the purge finishes. No-op outside iOS.
 */
export function ensureFreshInstallKeychainCleanup(): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.resolve();
  pending ??= purgeIfFreshInstall();
  return pending;
}
