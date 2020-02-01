import Phaser from 'phaser'

export default class BaseScene extends Phaser.Scene {
  constructor(key) {
    super(key)
  }

  create() {
    this.addCursor()
  }

  addCursor() {
    this.input.setDefaultCursor('none')
    this.cursor = this.add.sprite(0, 0, "guiCursor", 0).setDepth(50)
    this.resetHideCursorsTimer()

    this.input.on('pointerdown', () => {
      this.resetHideCursorsTimer()
      this.cursor.setFrame(1)
    })
    this.input.on('pointerup', () => {
      this.resetHideCursorsTimer()
      this.cursor.setFrame(0)
    })
    this.input.on('pointermove', () => {
      this.resetHideCursorsTimer()
    })
  }

  resetHideCursorsTimer() {
    if (this.hideCursorTimer) this.hideCursorTimer.remove()
    this.cursor.setAlpha(1)
    this.hideCursorTimer = this.time.delayedCall(3000, () => {
      this.cursor.setAlpha(0)
    })
  }

  updateCursor() {
    this.cursor.setX(this.input.activePointer.x + 18)
    this.cursor.setY(this.input.activePointer.y + 20)
  }

  update() {
    this.updateCursor()
  }
}
