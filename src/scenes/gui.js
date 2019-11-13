import Phaser from "phaser";

// assets
import frame from "../assets/gui/frame.png";
import orbs from "../assets/gui/orbs.png";

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
  }

  create() {
    const orbY = this.game.scale.height - 46
    const leftOrbX = this.game.scale.width / 2 - 193
    const rightOrbX = this.game.scale.width / 2 + 193

    // frame
    this.add.image(
      this.game.scale.width / 2,
      this.game.scale.height - 46,
      "gui-frame"
    ).setScrollFactor(0).setDepth(2);

    // health orb
    this.add.sprite(
      leftOrbX,
      orbY,
      "gui-orbs",
      2
    ).setScrollFactor(0).setDepth(1);
    // fill
    this.healthFill = this.add.sprite(
      leftOrbX,
      orbY,
      "gui-orbs",
      0
    ).setScrollFactor(0).setDepth(0);

    // mana orb
    this.add.sprite(
      rightOrbX,
      orbY,
      "gui-orbs",
      2
    ).setScrollFactor(0).setDepth(1).setFlipX(true);
    // fill
    this.manaFill = this.add.sprite(
      rightOrbX,
      orbY,
      "gui-orbs",
      1
    ).setScrollFactor(0).setDepth(0);
  }

  update() {
    const health = this.registry.get('health')
    const maxHealth = this.registry.get('maxHealth')

    this.healthFill.setCrop(0, 90 - 90 * (health / maxHealth), 90, 90)
    this.manaFill.setCrop(0, 90, 90, 90)
  }
}
