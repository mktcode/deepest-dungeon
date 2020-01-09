import activateSafeRoomMp3 from './assets/audio/sounds/activate-safe-room.mp3'
import attackSound from './assets/audio/sounds/attack.mp3';
import attackPunchSound from './assets/audio/sounds/attack-punch.mp3';
import zombie1 from './assets/audio/sounds/zombie1.mp3';
import zombie2 from './assets/audio/sounds/zombie2.mp3';
import spider1 from './assets/audio/sounds/spider1.mp3';
import spider2 from './assets/audio/sounds/spider2.mp3';
import ticking from './assets/audio/sounds/ticking.mp3';
import tickingFast from './assets/audio/sounds/ticking-fast.mp3';

export default class Sounds {
  constructor(scene) {
    this.scene = scene
    this.activateSafeRoom = scene.sound.add('activateSafeRoom')
    this.attackSound = scene.sound.add('attackSound', { volume: 0.25 })
    this.attackPunchSound = scene.sound.add('attackPunchSound', { volume: 0.25 })
    this.zombie1 = scene.sound.add('zombie1')
    this.zombie2 = scene.sound.add('zombie2')
    this.spider1 = scene.sound.add('spider1')
    this.spider2 = scene.sound.add('spider2')
    this.ticking = scene.sound.add('ticking')
    this.tickingFast = scene.sound.add('tickingFast')
    this.playing = null
  }

  static preload(scene) {
    scene.load.audio('activateSafeRoom', activateSafeRoomMp3)
    scene.load.audio('attackSound', attackSound)
    scene.load.audio('attackPunchSound', attackPunchSound)
    scene.load.audio('zombie1', zombie1)
    scene.load.audio('zombie2', zombie2)
    scene.load.audio('spider1', spider1)
    scene.load.audio('spider2', spider2)
    scene.load.audio('ticking', ticking)
    scene.load.audio('tickingFast', tickingFast)
  }

  play(key, delay, slowmo, loop) {
    return new Promise((resolve) => {
      this.playing = this[key]
      this.playing.play({ rate: slowmo ? 0.3 : 1, delay: delay || 0, loop: loop || false })
      this.playing.once('complete', () => {
        this.playing = null
        resolve()
      })
    })
  }

  stop(key) {
    this[key].stop()
  }
}
