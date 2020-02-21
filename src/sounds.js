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
import fireball from './assets/audio/sounds/fireball.mp3';
import fireball2 from './assets/audio/sounds/fireball2.mp3';
import book from './assets/audio/sounds/book.mp3';

export default class Sounds {
  constructor(scene) {
    this.scene = scene
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
    scene.load.audio('fireball', fireball)
    scene.load.audio('fireball2', fireball2)
    scene.load.audio('book', book)
  }

  play(key, delay, slowmo, loop, volume) {
    const sound = this.scene.sound.add(key, { volume: volume })
    sound.once('complete', sound.destroy, sound)
    sound.play({ rate: slowmo ? 0.3 : 1, delay: delay || 0, loop: loop || false })
    return sound
  }
}
