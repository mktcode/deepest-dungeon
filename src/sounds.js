import activateSafeRoomMp3 from "./assets/audio/activate-safe-room.mp3"

export default class Sounds {
  constructor(scene) {
    this.scene = scene
    this.activateSafeRoom = scene.sound.add("activateSafeRoom")
    this.playing = null
  }

  static preload(scene) {
    scene.load.audio("activateSafeRoom", activateSafeRoomMp3)
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
