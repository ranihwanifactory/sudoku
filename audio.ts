
class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.sounds = {
      click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
      success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
      error: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
      win: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    };
    
    // Low volume for feedback
    Object.values(this.sounds).forEach(s => s.volume = 0.4);
  }

  play(name: string) {
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => { /* Interaction required first */ });
    }
  }
}

export const audio = new AudioManager();
