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
  constructor() {
    this.restRoomExplained = false
    this.playerHasDied = 0
    this.playedOrientationLost = false
  }

  preload(scene) {
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

  create(scene) {
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
  }

  say(key, delay) {
    return new Promise((resolve) => {
      this[key].play({delay: delay || 0})
      this[key].once('complete', () => {
        resolve()
      })
    })
  }

  levelIntro(level, doorCount) {
    return new Promise((resolve) => {
      if (this.playerHasDied && !this.playedOrientationLost) {
        this.playedOrientationLost = true
        this.say("orientationLost").then(() => resolve())
      } else if (level === 1) {
        this.say('emptyRoom', 2).then(() => {
          this.say('Door' + doorCount, 0).then(() => {
            this.say("although", 0).then(() => resolve());
          })
        });
      } else if (level === 2) {
        this.say('furtherDown', 2).then(() => {
          this.say('Door' + doorCount, 0).then(() => resolve())
        });
      } else if (level === 5) {
        this.say("theLight", 2).then(() => resolve())
      } else {
        resolve()
      }
    })
  }
}
