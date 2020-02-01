import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import GuiScene from "../scenes/gui.js"
import PauseScene from "../scenes/pause.js"
import Hero from "../objects/hero.js"
import GuiContainer from "../gui/container.js";
import GuiButton from "../gui/button.js";
import GuiCheckbox from "../gui/checkbox.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu")
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.music = this.sound.add('ambientMusik', { volume: 0.25, loop: true  });

    this.centerX = this.game.scale.width / 2
    this.centerY = this.game.scale.height / 2

    this.setRegistryDefaults()
    this.addContainer()
  }

  setRegistryDefaults() {
    this.registry.set('music', this.music)
    this.registry.set('currentDungeon', 1)
    this.registry.set('minDungeon', 1)
    this.registry.set('deepestDungeon', 12)
    this.registry.set('narratorSaid', [])
    this.registry.set('disableNarrator', false)
    this.registry.set('weapon', null)
    this.registry.set('items', [])
    this.registry.set('torchDuration', 60)
    this.registry.set('torchIntensity', 1)
    this.registry.set('damage', 1)
    this.registry.set('health', 5)
    this.registry.set('maxHealth', 5)
    this.registry.set('mana', 3)
    this.registry.set('maxMana', 3)
    this.registry.set('level', 1)
    this.registry.set('xp', 0)
    this.registry.set('skillPoints', 0)
    this.registry.set('skillPointsSpent', 0)
    this.registry.set('enemiesKilled', 0)
    this.registry.set('zoom', this.game.device.os.desktop ? 2 : 1.5)
  }

  addContainer() {
    this.container = new GuiContainer(this, this.game.scale.width / 2, this.game.scale.height / 2, 300, 300, container => {
      // new game button
      container.add(new GuiButton(this, 0, -80, 150, 'New Game', () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
          if (progress === 1) {
            this.scene.sleep()
            this.scene.add('Dungeon1', new DungeonScene(this.registry.get('currentDungeon')), true)
            this.scene.add('Gui', new GuiScene(), true)
            this.scene.add('Pause', new PauseScene())
          }
        })
      }).container)

      // narrator checkbox
      container.add(new GuiCheckbox(
        this,
        0,
        -40,
        150,
        'Disable Narrator',
        () => {
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
  }
}
