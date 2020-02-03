import Phaser from "phaser"
import GuiContainer from "../gui/container.js";
import GuiButton from "../gui/button.js";
import GuiCheckbox from "../gui/checkbox.js";

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause')
  }

  create() {
    this.scene.bringToTop()

    this.addOverlay()
    this.addPauseMenu()

    this.input.keyboard.on('keyup-ESC', () => this.unpause())
  }

  unpause() {
    this.tweens.add({
      targets: this.overlay,
      duration: 500,
      alpha: { from: 0.5, to: 0 },
      ease: 'Cubic'
    })
    this.tweens.add({
      targets: this.pauseMenu.container,
      duration: 500,
      alpha: { from: 1, to: 0 },
      ease: 'Cubic',
      onComplete: () => {
        const currentDungeon = this.scene.get('Dungeon' + this.registry.get('currentDungeon'))
        if (currentDungeon.narrator.playing) currentDungeon.narrator.playing.resume()
        currentDungeon.scene.resume()
        this.scene.get('Gui').scene.resume()
        this.scene.stop()
      }
    })
  }

  addOverlay() {
    const width = this.game.scale.width
    const height = this.game.scale.height
    const centerX = width / 2
    const centerY = height / 2
    this.overlay = this.add.rectangle(centerX, centerY, width, height, '#000000').setAlpha(0)
    this.tweens.add({
      targets: this.overlay,
      duration: 500,
      alpha: { from: 0, to: 0.5 },
      ease: 'Cubic'
    })
  }

  addPauseMenu() {
    this.pauseMenu = new GuiContainer(this, this.game.scale.width / 2, this.game.scale.height / 2, 300, 300, container => {
      // continue button
      container.add(new GuiButton(this, 0, -80, 150, 'Continue', () => {
        this.sound.play('clickMajor')
        this.unpause()
      }).container)

      // narrator checkbox
      container.add(new GuiCheckbox(
        this,
        0,
        -40,
        150,
        'Disable Narrator',
        () => {
          this.sound.play('clickMinor')
          if (this.registry.get("disableNarrator")) {
            this.registry.set("disableNarrator", false)
          } else {
            this.registry.set("disableNarrator", true)
          }
        },
        () => this.registry.get("disableNarrator")
      ).container)

      // instructions
      const instructions = this.add.container(-90, 0)
      const textConfig = { font: "13px monospace", fill: "#999999" }
      instructions.add(
        this.add.text(
          0,
          0,
          'Move:       WASD/Click' + "\n" +
          'Use:      E/Left Click' + "\n" +
          'Attack:    Space/Click' + "\n" +
          'Scout:               Q' + "\n" +
          'Shield:          Shift' + "\n" +
          'Fireball:  Right Click' + "\n" +
          'Pause:             ESC',
          textConfig
        )
      )
      container.add(instructions)
    })

    this.pauseMenu.container.setAlpha(0)
    this.tweens.add({
      targets: this.pauseMenu.container,
      duration: 500,
      alpha: { from: 0, to: 1 },
      ease: 'Cubic'
    })
  }
}
