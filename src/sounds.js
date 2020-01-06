import activateSafeRoomMp3 from './assets/audio/sounds/activate-safe-room.mp3'
import attackSound from './assets/audio/sounds/attack.mp3';
import attackPunchSound from './assets/audio/sounds/attack-punch.mp3';
import zombie1 from './assets/audio/sounds/zombie1.mp3';
import zombie2 from './assets/audio/sounds/zombie2.mp3';

export default class Sounds {
  constructor(scene) {
    this.scene = scene
    this.activateSafeRoom = scene.sound.add('activateSafeRoom')
    this.attackSound = scene.sound.add('attackSound', { volume: 0.25 })
    this.attackPunchSound = scene.sound.add('attackPunchSound', { volume: 0.25 })
    this.zombie1 = scene.sound.add('zombie1')
    this.zombie2 = scene.sound.add('zombie2')
    this.playing = null
  }

  static preload(scene) {
    scene.load.audio('activateSafeRoom', activateSafeRoomMp3)
    scene.load.audio('attackSound', attackSound)
    scene.load.audio('attackPunchSound', attackPunchSound)
    scene.load.audio('zombie1', zombie1)
    scene.load.audio('zombie2', zombie2)
  }

  play(key, delay, slowmo) {
    return new Promise((resolve) => {
      this.playing = this[key]
      this.playing.play({ rate: slowmo ? 0.3 : 1, delay: delay || 0 })
      this.playing.once('complete', () => {
        this.playing = null
        resolve()
      })
    })
  }
}
