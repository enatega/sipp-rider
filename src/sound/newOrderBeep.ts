import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { RIDER_ORDER_BEEP_5S_CHANNEL_ID } from '../hooks/useExpoPushToken';

class NewOrderBeepManager {
  private generation = 0;
  private sound: Audio.Sound | null = null;
  private finishCurrent: (() => void) | null = null;

  async playOnce(): Promise<void> {
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
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted || permission.ios?.allowsSound === false) return;
      if (Platform.OS === 'android') {
        const channel = await Notifications.getNotificationChannelAsync(RIDER_ORDER_BEEP_5S_CHANNEL_ID);
        if (!channel || channel.importance < Notifications.AndroidImportance.DEFAULT || !channel.sound) return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });
      if (request !== this.generation || AppState.currentState !== 'active') return;
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/new_order_beep_5s.wav'),
        { shouldPlay: false, isLooping: false, volume: 1 },
      );
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
