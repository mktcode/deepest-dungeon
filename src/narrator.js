import whereAmI from "./assets/audio/narrator/where-am-i.mp3"
import whatWasThisAbout from "./assets/audio/narrator/what-was-this-about.mp3"
import finallySomeStairs from "./assets/audio/narrator/finally-some-stairs.mp3"
import whenHeWasDefeated from "./assets/audio/narrator/when-he-was-defeated.mp3"
import againEmptiness from "./assets/audio/narrator/again-emptiness.mp3"
import frozenInFear from "./assets/audio/narrator/frozen-in-fear.mp3"
import startedToMoveAgain from "./assets/audio/narrator/started-to-move-again.mp3"
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
import shieldSpell from "./assets/audio/narrator/shield-spell.mp3"
import aScoutsEye from "./assets/audio/narrator/a-scouts-eye.mp3"
import maybeAboutDecisions from "./assets/audio/narrator/maybe-about-decisions.mp3"
import slowlyHeBeganToQuestion from "./assets/audio/narrator/slowly-he-began-to-question.mp3"
import theEnd from "./assets/audio/narrator/the-end.mp3"
import outtakes from "./assets/audio/narrator/outtakes.mp3"


export default class Narrator {
  constructor(scene) {
    this.scene = scene

    this.whereAmI = scene.sound.add('whereAmI')
    this.whatWasThisAbout = scene.sound.add('whatWasThisAbout')
    this.finallySomeStairs = scene.sound.add('finallySomeStairs')
    this.whenHeWasDefeated = scene.sound.add('whenHeWasDefeated')
    this.againEmptiness = scene.sound.add('againEmptiness')
    this.frozenInFear = scene.sound.add('frozenInFear')
    this.startedToMoveAgain = scene.sound.add('startedToMoveAgain')
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
    this.aScoutsEye = scene.sound.add('aScoutsEye')
    this.shieldSpell = scene.sound.add('shieldSpell')
    this.maybeAboutDecisions = scene.sound.add('maybeAboutDecisions')
    this.slowlyHeBeganToQuestion = scene.sound.add('slowlyHeBeganToQuestion')
    this.theEnd = scene.sound.add('theEnd')
    this.outtakes = scene.sound.add('outtakes')


    this.slowmo = false
    this.freeze = false
    this.forceWalk = false
    this.playing = null
    this.blockStairs = true
  }

  static preload(scene) {
    scene.load.audio('whereAmI', whereAmI)
    scene.load.audio('whatWasThisAbout', whatWasThisAbout)
    scene.load.audio('finallySomeStairs', finallySomeStairs)
    scene.load.audio('whenHeWasDefeated', whenHeWasDefeated)
    scene.load.audio('againEmptiness', againEmptiness)
    scene.load.audio('frozenInFear', frozenInFear)
    scene.load.audio('startedToMoveAgain', startedToMoveAgain)
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
    scene.load.audio('aScoutsEye', aScoutsEye)
    scene.load.audio('shieldSpell', shieldSpell)
    scene.load.audio('maybeAboutDecisions', maybeAboutDecisions)
    scene.load.audio('slowlyHeBeganToQuestion', slowlyHeBeganToQuestion)
    scene.load.audio('theEnd', theEnd)
    scene.load.audio('outtakes', outtakes)

  }

  say(key, delay, volume) {
    volume = volume || 1
    return new Promise((resolve) => {
      if (this.scene.registry.get('disableNarrator')) {
        resolve()
      } else {
        this.playing = this[key]
        this.playing.play({delay: delay || 0, volume: volume})
        this.playing.once('complete', () => {
          this.playing = null
          resolve()
        })
      }
    })
  }

  sayOnce(key, delay, volume) {
    const narratorSaid = this.scene.registry.get('narratorSaid')
    return new Promise((resolve) => {
      if (!narratorSaid.includes(key)) {
        this.scene.registry.get('ambientMusic').setVolume(0.2)
        narratorSaid.push(key)
        this.scene.registry.set('narratorSaid', narratorSaid)
        this.say(key, delay, volume).then(() => {
          this.scene.registry.get('ambientMusic').setVolume(1)
          resolve(true)
        })
      } else {
        resolve(false)
      }
    })
  }

  slowmoStart() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.scene.scene.get('Gui').showLetterBoxes()
      this.slowmo = true
      this.scene.cameras.main.zoomTo(this.scene.registry.get('defaultZoom') * 1.5)
    }
  }
  slowmoEnd() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.scene.scene.get('Gui').hideLetterBoxes()
      this.slowmo = false
      this.scene.cameras.main.zoomTo(this.scene.registry.get('defaultZoom'))
    }
  }
  freezeStart() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.scene.scene.get('Gui').showLetterBoxes()
      this.freeze = true
      this.scene.cameras.main.zoomTo(this.scene.registry.get('defaultZoom') * 1.5)
    }
  }
  freezeEnd() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.scene.scene.get('Gui').hideLetterBoxes()
      this.freeze = false
      this.scene.cameras.main.zoomTo(this.scene.registry.get('defaultZoom'))
    }
  }
}
