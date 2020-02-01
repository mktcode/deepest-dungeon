import Phaser from 'phaser';

export default class GuiCheckbox {
  constructor(scene, x, y, width, text, clickCallback, isActive) {
    this.scene = scene
    this.pointerDown = false

    const height = 27

    this.box = this.scene.add.sprite(-width / 2 + 4, 0, 'guiCheckbox', isActive() ? 2 : 0)
    this.text = this.scene.add.text(-width / 2 + 27, -14, text, {
      font: '12px monospace',
      fill: '#999999',
      padding: { x: 2, y: 6 }
    }).setFixedSize(width - 27, height).setAlign('center')

    this.container = this.scene.add.container(x, y).setSize(width, height).setInteractive()
    this.container.add([
      this.box,
      this.text
    ])

    this.container.on('pointerover', () => {
      this.box.setFrame(1)
    })
    this.container.on('pointerout', () => {
      this.box.setFrame(isActive() ? 2 : 0)
      this.pointerDown = false
    })
    this.container.on('pointerdown', () => {
      this.pointerDown = true
    })
    this.container.on('pointerup', () => {
      if (this.pointerDown) {
        clickCallback()
        this.box.setFrame(isActive() ? 2 : 0)
      }
    })
  }
}
