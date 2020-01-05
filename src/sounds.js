import activateSafeRoomMp3 from './assets/audio/activate-safe-room.mp3'
import attackSound from './assets/audio/attack.mp3';
import attackPunchSound from './assets/audio/attack-punch.mp3';

export default class Sounds {
  constructor(scene) {
    this.scene = scene
    this.activateSafeRoom = scene.sound.add('activateSafeRoom')
    this.attackSound = scene.sound.add('attackSound', { volume: 0.3 })
    this.attackPunchSound = scene.sound.add('attackPunchSound', { volume: 0.3 })
    this.playing = null
  }

  static preload(scene) {
    scene.load.audio('activateSafeRoom', activateSafeRoomMp3)
    scene.load.audio('attackSound', attackSound)
    scene.load.audio('attackPunchSound', attackPunchSound)
  }

  play(key, delay) {
    return new Promise((resolve) => {
      this.playing = this[key]
      this.playing.play({delay: delay || 0})
      this.playing.once('complete', () => {
        this.playing = null
        resolve()
      })
    })
  }
}
