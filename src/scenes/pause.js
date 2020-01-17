import Phaser from "phaser"

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause')
  }

  create() {
    this.scene.bringToTop()

    this.currentDungeon = this.scene.get('Dungeon' + this.registry.get('currentDungeon'))

    this.input.keyboard.on('keyup-ESC', () => {
      this.tweens.add({
        targets: this.overlay,
        duration: 500,
        alpha: { from: 0.5, to: 0 },
        ease: 'Cubic'
      })
      this.tweens.add({
        targets: this.text,
        duration: 500,
        scale: { from: 2, to: 3},
        alpha: { from: 1, to: 0 },
        x: '-=25',
        ease: 'Cubic',
        onComplete: () => {
          if (this.currentDungeon.narrator.playing) this.currentDungeon.narrator.playing.resume()
          this.currentDungeon.scene.resume()
          this.scene.stop()
        }
      })
      this.tweens.add({
        targets: this.instructions,
        duration: 500,
        scale: { from: 1, to: 1.5},
        alpha: { from: 1, to: 0 },
        x: '-=25',
        ease: 'Cubic',
        onComplete: () => {
          if (this.currentDungeon.narrator.playing) this.currentDungeon.narrator.playing.resume()
          this.currentDungeon.scene.resume()
          this.scene.stop()
        }
      })
    })

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

    this.text = this.add.text(centerX - 70, centerY, 'Pause', {
      font: '12px monospace',
      fill: '#ffffff'
    }).setAlign('center').setAlpha(0)
    this.tweens.add({
      targets: this.text,
      duration: 500,
      scale: { from: 3, to: 2},
      alpha: { from: 0, to: 1 },
      x: '+=25',
      ease: 'Cubic'
    })

    this.instructions = this.add.text(
      centerX - 100,
      centerY + 50,
      'Move:        WASD/Arrows' + "\n" +
      'Attack:      Space' + "\n" +
      'Shield:      Shift' + "\n" +
      'Use:         E' + "\n" +
      'Scout\'s Eye: Q' + "\n" +
      'Pause:       Esc',
      {
        font: "13px monospace",
        fill: "#FFFFFF"
      }
    )

    this.tweens.add({
      targets: this.instructions,
      duration: 500,
      scale: { from: 1.5, to: 1},
      alpha: { from: 0, to: 1 },
      x: '+=25',
      ease: 'Cubic'
    })
  }
}
