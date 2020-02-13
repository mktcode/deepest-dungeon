import GuiContainer from "../gui/container.js"

export default class SubmenuScene extends Phaser.Scene {
  constructor(key, width, height, contentCallback) {
    super(key)
    this.width = width
    this.height = height
    this.contentCallback = contentCallback
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0)

    this.addContainer()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(250, 0, 0, 0)
    })
  }

  addContainer() {
    this.container = new GuiContainer(
      this,
      this.game.scale.width / 2,
      this.game.scale.height / 2,
      this.width,
      this.height,
      this.contentCallback,
      this.closeCallback.bind(this)
    )
  }

  closeCallback() {
    this.sound.play('clickMinor')
    this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        this.scene.sleep()
        this.scene.wake('Menu')
      }
    })
  }
}
