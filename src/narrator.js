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

import outtake1 from "./assets/audio/outtakes/1.mp3"
import outtake2 from "./assets/audio/outtakes/2.mp3"
import outtake3 from "./assets/audio/outtakes/3.mp3"
import outtake4 from "./assets/audio/outtakes/4.mp3"
import outtake5 from "./assets/audio/outtakes/5.mp3"
import outtake6 from "./assets/audio/outtakes/6.mp3"
import outtake7 from "./assets/audio/outtakes/7.mp3"
import outtake8 from "./assets/audio/outtakes/8.mp3"

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

    this.outtake1 = scene.sound.add('outtake1')
    this.outtake2 = scene.sound.add('outtake2')
    this.outtake3 = scene.sound.add('outtake3')
    this.outtake4 = scene.sound.add('outtake4')
    this.outtake5 = scene.sound.add('outtake5')
    this.outtake6 = scene.sound.add('outtake6')
    this.outtake7 = scene.sound.add('outtake7')
    this.outtake8 = scene.sound.add('outtake8')

    this.slowmo = false
    this.freeze = false
    this.forceWalk = false
    this.playing = null
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

    scene.load.audio('outtake1', outtake1)
    scene.load.audio('outtake2', outtake2)
    scene.load.audio('outtake3', outtake3)
    scene.load.audio('outtake4', outtake4)
    scene.load.audio('outtake5', outtake5)
    scene.load.audio('outtake6', outtake6)
    scene.load.audio('outtake7', outtake7)
    scene.load.audio('outtake8', outtake8)
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
          this.scene.startIdleTimer()
          resolve()
        })
      }
    })
  }

  sayOnce(key, delay, volume) {
    const narratorSaid = this.scene.registry.get('narratorSaid')
    return new Promise((resolve) => {
      if (!narratorSaid.includes(key)) {
        this.scene.registry.get('music').setVolume(0.1)
        narratorSaid.push(key)
        this.scene.registry.set('narratorSaid', narratorSaid)
        this.say(key, delay, volume).then(() => {
          this.scene.registry.get('music').setVolume(0.25)
          resolve(true)
        })
      } else {
        resolve(false)
      }
    })
  }

  slowmoStart() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.slowmo = true
      this.scene.cameras.main.zoomTo(3)
    }
  }
  slowmoEnd() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.slowmo = false
      this.scene.cameras.main.zoomTo(2)
    }
  }
  freezeStart() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.freeze = true
      this.scene.cameras.main.zoomTo(3)
    }
  }
  freezeEnd() {
    if (!this.scene.registry.get('disableNarrator')) {
      this.freeze = false
      this.scene.cameras.main.zoomTo(2)
    }
  }
}
