
class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.sounds = {
      // 톡 (클릭/입력)
      click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
      // 칭~ (성공)
      success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
      // 띠링 (힌트/알림)
      hint: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
      // 에잇 (오류)
      error: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
      // 빠밤 (최종 승리)
      win: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
      // 뽀용 (모드 전환/팝업)
      pop: new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3')
    };
    
    // 볼륨 조절 (너무 크지 않게)
    Object.values(this.sounds).forEach(s => s.volume = 0.3);
  }

  play(name: string) {
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // 첫 상호작용 전에는 재생이 막힐 수 있음
        console.log("Audio play blocked until interaction");
      });
    }
  }
}

export const audio = new AudioManager();
