import emptyRoomMp3 from "./assets/audio/empty-room.mp3"
import oneDoorMp3 from "./assets/audio/with-one-door.mp3"
import twoDoorsMp3 from "./assets/audio/with-two-doors.mp3"
import threeDoorsMp3 from "./assets/audio/with-three-doors.mp3"
import fourDoorsMp3 from "./assets/audio/with-four-doors.mp3"
import fiveDoorsMp3 from "./assets/audio/with-five-doors.mp3"
import althoughMp3 from "./assets/audio/although.mp3"
import horribleJourneyMp3 from "./assets/audio/horrible-journey.mp3"
import furtherDownMp3 from "./assets/audio/further-down.mp3"
import againStairsMp3 from "./assets/audio/again-stairs.mp3"
import theLightMp3 from "./assets/audio/the-light.mp3"
import restRoomMp3 from "./assets/audio/restroom.mp3"
import orientationLostMp3 from "./assets/audio/orientationLost.mp3"

export default class Narrator {
  constructor(scene) {
    this.scene = scene
    this.emptyRoom = scene.sound.add("emptyRoom")
    this.Door1 = scene.sound.add("Door1")
    this.Door2 = scene.sound.add("Door2")
    this.Door3 = scene.sound.add("Door3")
    this.Door4 = scene.sound.add("Door4")
    this.Door5 = scene.sound.add("Door5")
    this.although = scene.sound.add("although")
    this.horribleJourney = scene.sound.add("horribleJourney")
    this.furtherDown = scene.sound.add("furtherDown")
    this.againStairs = scene.sound.add("againStairs")
    this.theLight = scene.sound.add("theLight")
    this.restRoom = scene.sound.add("restRoom")
    this.orientationLost = scene.sound.add("orientationLost")
    this.slowmo = false
  }

  static preload(scene) {
    scene.load.audio("emptyRoom", emptyRoomMp3)
    scene.load.audio("Door1", oneDoorMp3)
    scene.load.audio("Door2", twoDoorsMp3)
    scene.load.audio("Door3", threeDoorsMp3)
    scene.load.audio("Door4", fourDoorsMp3)
    scene.load.audio("Door5", fiveDoorsMp3)
    scene.load.audio("although", althoughMp3)
    scene.load.audio("horribleJourney", horribleJourneyMp3)
    scene.load.audio("furtherDown", furtherDownMp3)
    scene.load.audio("againStairs", againStairsMp3)
    scene.load.audio("theLight", theLightMp3)
    scene.load.audio("restRoom", restRoomMp3)
    scene.load.audio("orientationLost", orientationLostMp3)
  }

  say(key, delay) {
    return new Promise((resolve) => {
      if (this.scene.registry.get('disableNarrator')) {
        resolve()
      } else {
        this[key].play({delay: delay || 0})
        this[key].once('complete', () => {
          resolve()
        })
      }
    })
  }

  sayOnce(key, delay) {
    const narratorSaid = this.scene.registry.get('narratorSaid')
    return new Promise((resolve) => {
      if (!narratorSaid.includes(key)) {
        narratorSaid.push(key)
        this.scene.registry.set('narratorSaid', narratorSaid)
        this.say(key, delay).then(() => resolve(true))
      } else {
        resolve(false)
      }
    })
  }

  levelIntro(level, doorCount) {
    if (this.scene.registry.get('disableNarrator')) return
    const delay = 0.5
    return new Promise((resolve) => {
      if (level === 1) {
        this.scene.time.delayedCall(delay * 1000, () => {
          this.slowmoStart()
        })
        this.sayOnce('emptyRoom', delay).then((saidSth) => {
          if (saidSth) {
            this.say('Door' + doorCount, 0).then(() => {
              this.sayOnce("although", 0).then(() => {
                resolve()
                this.slowmoEnd()
              });
            })
          } else {
            resolve()
            this.slowmoEnd()
          }
        });
      } else if (level === 2) {
        this.scene.time.delayedCall(delay * 1000, () => {
          this.slowmoStart()
        })
        this.sayOnce('furtherDown', delay).then((saidSth) => {
          if (saidSth) {
            this.say('Door' + doorCount, 0).then(() => {
              resolve()
              this.slowmoEnd()
            })
          } else {
            resolve()
            this.slowmoEnd()
          }
        });
      } else if (level === 5) {
        this.scene.time.delayedCall(delay * 1000, () => {
          this.slowmoStart()
        })
        this.sayOnce("theLight", delay).then(() => {
          resolve()
          this.slowmoEnd()
        })
      } else {
        resolve()
        this.slowmoEnd()
      }
    })
  }

  slowmoStart() {
    this.slowmo = true
    this.scene.cameras.main.zoomTo(2)
  }
  slowmoEnd() {
    this.slowmo = false
    this.scene.cameras.main.zoomTo(1)
  }
}
