import activateSafeRoomMp3 from './assets/audio/sounds/activate-safe-room.mp3'
import attackSound from './assets/audio/sounds/attack.mp3';
import attackHitSound from './assets/audio/sounds/attack-hit.mp3';
import attackPunchSound from './assets/audio/sounds/attack-punch.mp3';
import attackPunchHitSound from './assets/audio/sounds/attack-punch-hit.mp3';
import zombie1 from './assets/audio/sounds/zombie1.mp3';
import zombie2 from './assets/audio/sounds/zombie2.mp3';
import spider1 from './assets/audio/sounds/spider1.mp3';
import spider2 from './assets/audio/sounds/spider2.mp3';
import ticking from './assets/audio/sounds/ticking.mp3';
import tickingFast from './assets/audio/sounds/ticking-fast.mp3';
import levelUp from './assets/audio/sounds/level-up.mp3';
import skillUp from './assets/audio/sounds/skill-up.mp3';
import heartBeat from './assets/audio/sounds/heart-beat.mp3';
import takeHit from './assets/audio/sounds/take-hit.mp3';
import die from './assets/audio/sounds/die.mp3';
import running from './assets/audio/sounds/running.mp3';
import walking from './assets/audio/sounds/walking.mp3';
import healthPing from './assets/audio/sounds/health-ping.mp3';
import xpPing1 from './assets/audio/sounds/xp-ping1.mp3';
import xpPing2 from './assets/audio/sounds/xp-ping2.mp3';
import xpPing3 from './assets/audio/sounds/xp-ping3.mp3';
import xpPing4 from './assets/audio/sounds/xp-ping4.mp3';
import xpPing5 from './assets/audio/sounds/xp-ping5.mp3';
import xpPing6 from './assets/audio/sounds/xp-ping6.mp3';
import xpPing7 from './assets/audio/sounds/xp-ping7.mp3';
import xpPing8 from './assets/audio/sounds/xp-ping8.mp3';

export default class Sounds {
  constructor(scene) {
    this.scene = scene
    this.activateSafeRoom = scene.sound.add('activateSafeRoom')
    this.attackSound = scene.sound.add('attackSound', { volume: 0.25 })
    this.attackHitSound = scene.sound.add('attackHitSound', { volume: 0.5 })
    this.attackPunchSound = scene.sound.add('attackPunchSound', { volume: 0.25 })
    this.attackPunchHitSound = scene.sound.add('attackPunchHitSound', { volume: 0.3 })
    this.zombie1 = scene.sound.add('zombie1')
    this.zombie2 = scene.sound.add('zombie2')
    this.spider1 = scene.sound.add('spider1')
    this.spider2 = scene.sound.add('spider2')
    this.ticking = scene.sound.add('ticking')
    this.tickingFast = scene.sound.add('tickingFast')
    this.levelUp = scene.sound.add('levelUp', { volume: 0.7 })
    this.skillUp = scene.sound.add('skillUp')
    this.heartBeat = scene.sound.add('heartBeat', { volume: 0.5 })
    this.takeHit = scene.sound.add('takeHit', { volume: 0.3 })
    this.die = scene.sound.add('die', { volume: 0.3 })
    this.running = scene.sound.add('running', { volume: 0 })
    this.walking = scene.sound.add('walking', { volume: 0 })
    this.healthPing = scene.sound.add('healthPing')
    this.xpPing1 = scene.sound.add('xpPing1', { volume: 0.7 })
    this.xpPing2 = scene.sound.add('xpPing2', { volume: 0.7 })
    this.xpPing3 = scene.sound.add('xpPing3', { volume: 0.7 })
    this.xpPing4 = scene.sound.add('xpPing4', { volume: 0.7 })
    this.xpPing5 = scene.sound.add('xpPing5', { volume: 0.7 })
    this.xpPing6 = scene.sound.add('xpPing6', { volume: 0.7 })
    this.xpPing7 = scene.sound.add('xpPing7', { volume: 0.7 })
    this.xpPing8 = scene.sound.add('xpPing8', { volume: 0.7 })
    this.playing = null
  }

  static preload(scene) {
    scene.load.audio('activateSafeRoom', activateSafeRoomMp3)
    scene.load.audio('attackSound', attackSound)
    scene.load.audio('attackHitSound', attackHitSound)
    scene.load.audio('attackPunchSound', attackPunchSound)
    scene.load.audio('attackPunchHitSound', attackPunchHitSound)
    scene.load.audio('zombie1', zombie1)
    scene.load.audio('zombie2', zombie2)
    scene.load.audio('spider1', spider1)
    scene.load.audio('spider2', spider2)
    scene.load.audio('ticking', ticking)
    scene.load.audio('tickingFast', tickingFast)
    scene.load.audio('levelUp', levelUp)
    scene.load.audio('skillUp', skillUp)
    scene.load.audio('heartBeat', heartBeat)
    scene.load.audio('takeHit', takeHit)
    scene.load.audio('die', die)
    scene.load.audio('running', running)
    scene.load.audio('walking', walking)
    scene.load.audio('healthPing', healthPing)
    scene.load.audio('xpPing1', xpPing1)
    scene.load.audio('xpPing2', xpPing2)
    scene.load.audio('xpPing3', xpPing3)
    scene.load.audio('xpPing4', xpPing4)
    scene.load.audio('xpPing5', xpPing5)
    scene.load.audio('xpPing6', xpPing6)
    scene.load.audio('xpPing7', xpPing7)
    scene.load.audio('xpPing8', xpPing8)
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
