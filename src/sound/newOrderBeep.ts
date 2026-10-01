import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

class NewOrderBeepManager {
  private sound: Audio.Sound | null = null;
  private preparing: Promise<Audio.Sound> | null = null;
  private shouldPlay = false;
  private operation: Promise<void> = Promise.resolve();

  private async ensureSound() {
    if (this.sound) return this.sound;
    if (this.preparing) return this.preparing;

    this.preparing = (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/beep3.mp3'),
        { shouldPlay: false, isLooping: true, volume: 1 },
      );
      this.sound = sound;
      return sound;
    })();

    try {
      return await this.preparing;
    } finally {
      this.preparing = null;
    }
  }

  async start() {
    this.shouldPlay = true;
    this.operation = this.operation.then(async () => {
      try {
        if (!this.shouldPlay) return;
        const sound = await this.ensureSound();
        if (!this.shouldPlay) return;
        const status = await sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying && this.shouldPlay) {
          await sound.playAsync();
        }
      } catch (error) {
        console.warn('[rider][order-alert] unable to play beep', error);
      }
    });
    await this.operation;
  }

  async stop() {
    this.shouldPlay = false;
    this.operation = this.operation.then(async () => {
      try {
        if (this.shouldPlay) return;
        const sound = this.sound;
        this.sound = null;
        if (!sound) return;
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.warn('[rider][order-alert] unable to stop beep', error);
      }
    });
    await this.operation;
  }
}

export const newOrderBeepManager = new NewOrderBeepManager();
