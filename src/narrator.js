import whereAmI from "./assets/audio/narrator/where-am-i.mp3"
import whatWasThisAbout from "./assets/audio/narrator/what-was-this-about.mp3"
import finallySomeStairs from "./assets/audio/narrator/finally-some-stairs.mp3"
import undeadCreatures from "./assets/audio/narrator/undead-creatures.mp3"
import killingAllTheseEnemies from "./assets/audio/narrator/killing-all-these-enemies.mp3"
import thereItWasASword from "./assets/audio/narrator/there-it-was-a-sword.mp3"
import thisRoomWasDifferent from "./assets/audio/narrator/this-room-was-different.mp3"
import theDeeperHeWent from "./assets/audio/narrator/the-deeper-he-went.mp3"
import torchPerfect from "./assets/audio/narrator/torch-perfect.mp3"
import aTimeeater from "./assets/audio/narrator/a-timeeater.mp3"
import timeeaterQuickNow from "./assets/audio/narrator/timeeater-quick-now.mp3"
import dungeonStartedToQuake from "./assets/audio/narrator/dungeon-started-to-quake.mp3"
import itsGettingHot from "./assets/audio/narrator/its-getting-hot.mp3"

export default class Narrator {
  constructor(scene) {
    this.scene = scene

    this.whereAmI = scene.sound.add('whereAmI')
    this.whatWasThisAbout = scene.sound.add('whatWasThisAbout')
    this.finallySomeStairs = scene.sound.add('finallySomeStairs')
    this.undeadCreatures = scene.sound.add('undeadCreatures')
    this.killingAllTheseEnemies = scene.sound.add('killingAllTheseEnemies')
    this.thereItWasASword = scene.sound.add('thereItWasASword')
    this.thisRoomWasDifferent = scene.sound.add('thisRoomWasDifferent')
    this.theDeeperHeWent = scene.sound.add('theDeeperHeWent')
    this.torchPerfect = scene.sound.add('torchPerfect')
    this.aTimeeater = scene.sound.add('aTimeeater')
    this.timeeaterQuickNow = scene.sound.add('timeeaterQuickNow')
    this.dungeonStartedToQuake = scene.sound.add('dungeonStartedToQuake')
    this.itsGettingHot = scene.sound.add('itsGettingHot')

    this.slowmo = false
    this.freeze = false
    this.forceWalk = false
    this.playing = null
  }

  static preload(scene) {
    scene.load.audio('whereAmI', whereAmI)
    scene.load.audio('whatWasThisAbout', whatWasThisAbout)
    scene.load.audio('finallySomeStairs', finallySomeStairs)
    scene.load.audio('undeadCreatures', undeadCreatures)
    scene.load.audio('killingAllTheseEnemies', killingAllTheseEnemies)
    scene.load.audio('thereItWasASword', thereItWasASword)
    scene.load.audio('thisRoomWasDifferent', thisRoomWasDifferent)
    scene.load.audio('theDeeperHeWent', theDeeperHeWent)
    scene.load.audio('torchPerfect', torchPerfect)
    scene.load.audio('aTimeeater', aTimeeater)
    scene.load.audio('timeeaterQuickNow', timeeaterQuickNow)
    scene.load.audio('dungeonStartedToQuake', dungeonStartedToQuake)
    scene.load.audio('itsGettingHot', itsGettingHot)
  }

  say(key, delay) {
    return new Promise((resolve) => {
      if (this.scene.registry.get('disableNarrator')) {
        resolve()
      } else {
        this.playing = this[key]
        this.playing.play({delay: delay || 0})
        this.playing.once('complete', () => {
          this.playing = null
          resolve()
        })
      }
    })
  }

  sayOnce(key, delay) {
    const narratorSaid = this.scene.registry.get('narratorSaid')
    return new Promise((resolve) => {
      if (!narratorSaid.includes(key)) {
        this.scene.registry.get('music').setVolume(0.1)
        narratorSaid.push(key)
        this.scene.registry.set('narratorSaid', narratorSaid)
        this.say(key, delay).then(() => {
          this.scene.registry.get('music').setVolume(0.25)
          resolve(true)
        })
      } else {
        resolve(false)
      }
    })
  }

  slowmoStart() {
    this.slowmo = true
    this.scene.cameras.main.zoomTo(3)
  }
  slowmoEnd() {
    this.slowmo = false
    this.scene.cameras.main.zoomTo(2)
  }
  freezeStart() {
    this.freeze = true
    this.scene.cameras.main.zoomTo(3)
  }
  freezeEnd() {
    this.freeze = false
    this.scene.cameras.main.zoomTo(2)
  }
}
