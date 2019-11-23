import Phaser from "phaser";

export default class CharacterScene extends Phaser.Scene {
  constructor() {
    super('Character')
    this.pointsSpent = 0
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
      .text(centerX, centerY - 80, 'Skill Points: ' + (this.registry.get('skillPoints') - this.pointsSpent), {
        font: "24px monospace",
        fill: "#ffffff",
        padding: { x: 20, y: 10 }
      })

    const moreHealth = this.add
      .text(centerX, centerY, 'Health: ' + this.registry.get('maxHealth'), {
        font: "24px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setInteractive();
    moreHealth.on('pointerup', () => {
      if (this.registry.get('skillPoints') > this.pointsSpent) {
        this.pointsSpent += 1
        this.registry.set('maxHealth', this.registry.get('maxHealth') + 1)
        this.registry.set('health', this.registry.get('maxHealth'))
      }
    })

    const moreDamage = this.add
      .text(centerX, centerY + 50, 'Damage: ' + this.registry.get('damage'), {
        font: "24px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setInteractive();
    moreDamage.on('pointerup', () => {
      if (this.registry.get('skillPoints') > this.pointsSpent) {
        this.pointsSpent += 1
        this.registry.set('damage', this.registry.get('damage') + 1)
      }
    })

    const moreTorchDuration = this.add
      .text(centerX, centerY + 100, 'Torch Duration: ' + this.registry.get('torchDuration') + 's', {
        font: "24px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setInteractive();
    moreTorchDuration.on('pointerup', () => {
      if (this.registry.get('skillPoints') > this.pointsSpent) {
        this.pointsSpent += 1
        this.registry.set('torchDuration', this.registry.get('torchDuration') + 30)
      }
    })

    this.registry.events.on('changedata', () => {
      moreHealth.setText('Health: ' + this.registry.get('maxHealth'))
      moreDamage.setText('Damage: ' + this.registry.get('damage'))
      moreTorchDuration.setText('Torch Duration: ' + this.registry.get('torchDuration') + 's')
      availableSkillPoints.setText('Skill Points: ' + (this.registry.get('skillPoints') - this.pointsSpent))
    })
  }
}
