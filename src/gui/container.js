import GuiButton from './button.js'

export default class GuiContainer {
  constructor(scene, x, y, width, height, contentCallback, closeCallback) {
    this.scene = scene

    this.cornerTopLeft = this.scene.add.image(-width / 2 + 50, -height / 2 + 50, 'guiContainerCorner')
    this.cornerTopRight = this.scene.add.image(width / 2 - 50, -height / 2 + 50, 'guiContainerCorner').setFlipX(true)
    this.cornerBottomLeft = this.scene.add.image(-width / 2 + 50, height / 2 - 50, 'guiContainerCorner').setFlipY(true)
    this.cornerBottomRight = this.scene.add.image(width / 2 - 50, height / 2 - 50, 'guiContainerCorner').setFlipY(true).setFlipX(true)

    this.edgeLeft = this.scene.add.tileSprite(-width / 2 + 15, 0, 30, height, 'guiContainerEdgeV')
    this.edgeRight = this.scene.add.tileSprite(width / 2 - 15, 0, 30, height, 'guiContainerEdgeV').setFlipX(true)
    this.edgeTop = this.scene.add.tileSprite(0, -height / 2 + 15, width, 30, 'guiContainerEdgeH')
    this.edgeBottom = this.scene.add.tileSprite(0, height / 2 - 15, width, 30, 'guiContainerEdgeH').setFlipY(true)

    this.background = this.scene.add.tileSprite(0, 0, width, height, 'guiContainerBg')

    this.container = this.scene.add.container(x, y)
    this.container.add([
      this.background,
      this.edgeLeft,
      this.edgeRight,
      this.edgeTop,
      this.edgeBottom,
      this.cornerTopLeft,
      this.cornerTopRight,
      this.cornerBottomLeft,
      this.cornerBottomRight
    ])

    if (closeCallback) {
      // close button
      this.container.add(new GuiButton(this.scene, width / 2 - 14, -(height / 2 - 14), 27, 'x', closeCallback).container)
    }

    contentCallback(this.container)
  }
}
