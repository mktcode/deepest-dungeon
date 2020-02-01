import Phaser from 'phaser';

export default class GuiButton {
  constructor(scene, x, y, width, text, callback) {
    this.scene = scene
    this.pointerDown = false

    const height = 27

    this.left = this.scene.add.image(-width / 2 + 4, 0, 'guiButtonLeftRight')
    this.right = this.scene.add.image(width / 2 - 4, 0, 'guiButtonLeftRight').setFlipX(true)
    this.topBottom = this.scene.add.tileSprite(0, 0, width, height, 'guiButtonTopBottom')
    this.background = this.scene.add.tileSprite(0, 0, width, 23, 'guiButtonBg', 0)
    this.text = this.scene.add.text(-width / 2, -14, text, {
      font: '12px monospace',
      fill: '#999999',
      padding: { x: 2, y: 6 }
    }).setFixedSize(width, height).setAlign('center')

    this.container = this.scene.add.container(x, y).setSize(width, height).setInteractive()
    this.container.add([
      this.background,
      this.left,
      this.right,
      this.topBottom,
      this.text
    ])

    this.container.on('pointerover', () => {
      this.background.setFrame(1)
    })
    this.container.on('pointerout', () => {
      this.background.setFrame(0)
      this.pointerDown = false
    })
    this.container.on('pointerdown', () => {
      this.pointerDown = true
    })
    this.container.on('pointerup', () => {
      if (this.pointerDown) {
        callback()
      }
    })
  }
}
