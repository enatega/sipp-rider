import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

class NewOrderBeepManager {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private isPreparing = false;

  private async ensureSound() {
    if (this.sound || this.isPreparing) return;

    this.isPreparing = true;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/beep3.mp3'),
        {
          shouldPlay: false,
          isLooping: true,
          volume: 1,
        },
      );
      this.sound = sound;
    } finally {
      this.isPreparing = false;
    }
  }

  async start() {
    if (this.isPlaying) return;
    await this.ensureSound();
    if (!this.sound) return;

    try {
      await this.sound.playAsync();
      this.isPlaying = true;
    } catch (error) {
      console.log('[NEW_ORDER_BEEP][START][ERROR]', error);
    }
  }

  async stop() {
    if (!this.sound || !this.isPlaying) return;
    try {
      await this.sound.stopAsync();
    } catch (error) {
      console.log('[NEW_ORDER_BEEP][STOP][ERROR]', error);
    } finally {
      this.isPlaying = false;
    }
  }

  async dispose() {
    if (!this.sound) return;
    try {
      await this.sound.unloadAsync();
    } catch (error) {
      console.log('[NEW_ORDER_BEEP][DISPOSE][ERROR]', error);
    } finally {
      this.sound = null;
      this.isPlaying = false;
    }
  }
}

export const newOrderBeepManager = new NewOrderBeepManager();
