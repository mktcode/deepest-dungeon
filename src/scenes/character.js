import Phaser from "phaser";

export default class CharacterScene extends Phaser.Scene {
  constructor() {
    super('Character')
  }

  static preload(scene) {

  }

  create() {
    this.input.keyboard.on('keyup-ESC', () => {
      this.scene.sleep()
    })

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height / 2

    const availableSkillPoints = this.add
      .text(centerX - 125, centerY - 80, 'Skill Points: ' + (this.registry.get('skillPoints') - this.registry.get('skillPointsSpent')), {
        font: "24px monospace",
        fill: "#ffffff",
        padding: { x: 20, y: 10 }
      })

    const close = this.add
      .text(centerX - 50, centerY - 44, 'close', {
        font: "20px monospace",
        fill: "#ffffff",
        padding: { x: 20, y: 10 }
      })
      .setInteractive();
    close.on('pointerup', () => {
      this.scene.sleep()
    })

    const moreHealth = this.add
      .text(centerX - 85, centerY, 'Health: ' + this.registry.get('maxHealth'), {
        font: "24px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setInteractive();
    moreHealth.on('pointerup', () => {
      if (this.registry.get('skillPoints') > this.registry.get('skillPointsSpent')) {
        this.registry.set('skillPointsSpent', this.registry.get('skillPointsSpent') + 1)
        this.registry.set('maxHealth', this.registry.get('maxHealth') + 1)
        this.registry.set('health', this.registry.get('maxHealth'))
      }
    })

    const moreDamage = this.add
      .text(centerX - 85, centerY + 55, 'Damage: ' + this.registry.get('damage'), {
        font: "24px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setInteractive();
    moreDamage.on('pointerup', () => {
      if (this.registry.get('skillPoints') > this.registry.get('skillPointsSpent')) {
        this.registry.set('skillPointsSpent', this.registry.get('skillPointsSpent') + 1)
        this.registry.set('damage', this.registry.get('damage') + 1)
      }
    })

    const moreTorchDuration = this.add
      .text(centerX - 157, centerY + 110, 'Torch Duration: ' + this.registry.get('torchDuration') + 's', {
        font: "24px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setInteractive();
    moreTorchDuration.on('pointerup', () => {
      if (this.registry.get('skillPoints') > this.registry.get('skillPointsSpent')) {
        this.registry.set('skillPointsSpent', this.registry.get('skillPointsSpent') + 1)
        this.registry.set('torchDuration', this.registry.get('torchDuration') + 30)
      }
    })

    this.registry.events.on('changedata', () => {
      moreHealth.setText('Health: ' + this.registry.get('maxHealth'))
      moreDamage.setText('Damage: ' + this.registry.get('damage'))
      moreTorchDuration.setText('Torch Duration: ' + this.registry.get('torchDuration') + 's')
      availableSkillPoints.setText('Skill Points: ' + (this.registry.get('skillPoints') - this.registry.get('skillPointsSpent')))
    })
  }
}
