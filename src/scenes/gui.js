import Phaser from "phaser";

// assets
import frame from "../assets/gui/frame.png";
import orbs from "../assets/gui/orbs.png";
import bars from "../assets/gui/bars.png";

export default class GuiScene extends Phaser.Scene {
  constructor() {
    super('Gui')
  }

  static preload(scene) {
    scene.load.image("gui-frame", frame)
    scene.load.spritesheet(
      "gui-orbs",
      orbs,
      {
        frameWidth: 87,
        frameHeight: 75
      }
    );
    scene.load.spritesheet(
      "gui-bars",
      bars,
      {
        frameWidth: 348,
        frameHeight: 9
      }
    );
  }

  create() {
    var timer = this.time.addEvent({
      delay: 60000,
      callback: () => {
        this.registry.set('torches', Math.max(this.registry.get('torches') - 1, 0))
      },
      loop: true
    });

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height - 46
    const leftOrbX = centerX - 193
    const rightOrbX = centerX + 193
    const levelBarY = centerY - 15
    const xpBarY = centerY - 3

    // frame
    this.add.image(
      centerX,
      centerY,
      "gui-frame"
    ).setScrollFactor(0).setDepth(1);

    // health orb
    this.healthFill = this.add.sprite(
      leftOrbX,
      centerY,
      "gui-orbs",
      0
    ).setScrollFactor(0).setDepth(0);

    // mana orb
    this.manaFill = this.add.sprite(
      rightOrbX,
      centerY,
      "gui-orbs",
      1
    ).setScrollFactor(0).setDepth(0);

    // level process bar
    this.levelBar = this.add.sprite(
      centerX,
      levelBarY,
      "gui-bars",
      0
    ).setScrollFactor(0).setDepth(2);

    // xp process bar
    this.xpBar = this.add.sprite(
      centerX,
      xpBarY,
      "gui-bars",
      1
    ).setScrollFactor(0).setDepth(2);

    // listen to changes
    this.registry.events.on('changedata-health', () => {
      this.updateHealth()
    })
    this.registry.events.on('changedata-maxHealth', () => {
      this.updateHealth()
    })

    this.registry.events.on('changedata-mana', () => {
      this.updateMana()
    })
    this.registry.events.on('changedata-maxMana', () => {
      this.updateMana()
    })

    this.registry.events.on('changedata-currentLevel', () => {
      this.updateLevel()
    })
    this.registry.events.on('changedata-deepestLevel', () => {
      this.updateLevel()
    })

    this.updateHealth()
    this.updateMana()
    this.updateLevel()
  }

  updateHealth() {
    const health = this.registry.get('health')
    const maxHealth = this.registry.get('maxHealth')

    this.healthFill.setCrop(0, 90 - 90 * (health / maxHealth), 90, 90)
  }

  updateMana() {
    const mana = this.registry.get('mana')
    const maxMana = this.registry.get('maxMana')

    this.manaFill.setCrop(0, 90 - 90 * (mana / maxMana), 90, 90)
  }

  updateLevel() {
    const currentLevel = this.registry.get('currentLevel')
    const deepestLevel = this.registry.get('deepestLevel')

    this.levelBar.setCrop(0, 0, 348 * (currentLevel / deepestLevel), 9)
  }
}
