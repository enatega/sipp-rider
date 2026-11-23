import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { RIDER_ORDER_BEEP_5S_CHANNEL_ID } from '../hooks/useExpoPushToken';

const BEEP_SOURCE = require('../../assets/sound/new_order_beep_5s.wav');

async function canPlayOrderSound(): Promise<boolean> {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted || permission.ios?.allowsSound === false) return false;
  if (Platform.OS !== 'android') return true;
  const channel = await Notifications.getNotificationChannelAsync(RIDER_ORDER_BEEP_5S_CHANNEL_ID);
  return Boolean(channel && channel.importance >= Notifications.AndroidImportance.DEFAULT && channel.sound);
}

function configureAudio() {
  return Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  });
}

class NewOrderBeepManager {
  private generation = 0;
  private sound: Audio.Sound | null = null;
  private finishCurrent: (() => void) | null = null;
  private loopGeneration = 0;
  private loopSound: Audio.Sound | null = null;

  get isLooping(): boolean {
    return this.loopSound !== null;
  }

  /** Beeps continuously until stopLoop(); a no-op while the loop already runs. */
  async startLoop(): Promise<void> {
    if (this.loopSound) return;
    const request = ++this.loopGeneration;
    try {
      if (AppState.currentState !== 'active' || !(await canPlayOrderSound())) return;
      await configureAudio();
      if (request !== this.loopGeneration || AppState.currentState !== 'active') return;
      const { sound } = await Audio.Sound.createAsync(BEEP_SOURCE, { shouldPlay: false, isLooping: true, volume: 1 });
      if (request !== this.loopGeneration || AppState.currentState !== 'active') {
        await sound.unloadAsync();
        return;
      }
      this.loopSound = sound;
      await sound.playAsync();
    } catch (error) {
      console.warn('[rider][order-alert] Unable to loop beep', error);
      await this.stopLoop();
    }
  }

  async stopLoop(): Promise<void> {
    this.loopGeneration += 1;
    const sound = this.loopSound;
    this.loopSound = null;
    if (!sound) return;
    try {
      await sound.stopAsync();
    } catch {
      // The audio resource may already be gone.
    }
    await sound.unloadAsync().catch(() => undefined);
  }

  async playOnce(): Promise<void> {
    if (this.loopSound) return;
    const request = ++this.generation;
    const previous = this.sound;
    const finishPrevious = this.finishCurrent;
    if (previous) {
      try {
        await previous.stopAsync();
      } catch {
        // The previous sound may already have finished.
      }
      finishPrevious?.();
    }
    try {
      if (request !== this.generation || AppState.currentState !== 'active') return;
      if (!(await canPlayOrderSound())) return;
      await configureAudio();
      if (request !== this.generation || AppState.currentState !== 'active') return;
      const { sound } = await Audio.Sound.createAsync(BEEP_SOURCE, { shouldPlay: false, isLooping: false, volume: 1 });
      if (request !== this.generation || AppState.currentState !== 'active') {
        await sound.unloadAsync();
        return;
      }
      this.sound = sound;
      await new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          if (this.sound === sound) this.sound = null;
          if (this.finishCurrent === finish) this.finishCurrent = null;
          sound.setOnPlaybackStatusUpdate(null);
          void sound.unloadAsync().catch(() => undefined);
          resolve();
        };
        this.finishCurrent = finish;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) finish();
          if (!status.isLoaded && status.error) finish();
        });
        void sound.playAsync().catch((error) => {
          console.warn('[rider][order-alert] Unable to play beep', error);
          finish();
        });
      });
    } catch (error) {
      console.warn('[rider][order-alert] Unable to play beep', error);
    }
  }

  async stop(): Promise<void> {
    await this.stopLoop();
    this.generation += 1;
    const sound = this.sound;
    const finish = this.finishCurrent;
    if (!sound) return;
    try {
      await sound.stopAsync();
    } catch {
      // The audio resource may already have finished.
    }
    finish?.();
  }
}

export const newOrderBeepManager = new NewOrderBeepManager();
