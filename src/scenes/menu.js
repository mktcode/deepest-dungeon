import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import GuiScene from "../scenes/gui.js"
import CharacterScene from "../scenes/character.js"
import Hero from "../objects/hero.js"

// assets
import themeMp3 from "../assets/audio/kai-engel-downfall.mp3"
import tileset from "../assets/dungeon-extruded.png";
import introGround from "../assets/intro-ground.png";
import enemies from "../assets/enemies.png";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu")
  }

  create() {
    this.startDungeon = 1

    this.registry.set('minDungeon', 1)
    this.registry.set('currentDungeon', 1)
    this.registry.set('deepestDungeon', 25)
    this.registry.set('narratorSaid', [])
    this.registry.set('disableNarrator', false)
    this.registry.set('weapon', null)
    this.registry.set('items', [])
    this.registry.set('torchDuration', 60)
    this.registry.set('damage', 1)
    this.registry.set('health', 3)
    this.registry.set('maxHealth', 3)
    this.registry.set('mana', 0)
    this.registry.set('maxMana', 0)
    this.registry.set('level', 1)
    this.registry.set('xp', 0)
    this.registry.set('skillPoints', 0)
    this.registry.set('skillPointsSpent', 0)

    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.sound.play("ambientMusik", { volume: 0.3, loop: true })

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height / 2

    const title = this.add
      .text(centerX - 163, centerY - 200, 'Infinite Dungeons', {
        font: "30px monospace",
        fill: "#FFFFFF"
      })
      .setInteractive();

    let ground = this.add.sprite(centerX, centerY, "introGround")
    ground.anims.play('intro-ground')
    const hero = new Hero(this, centerX, centerY)
    hero.walk('down')

    const directions = ['down', 'left', 'right']
    var timer = this.time.addEvent({
      delay: 5000,
      callback: () => {
        const direction = directions.shift()
        directions.push(direction)
        hero.attack(direction).once('complete', () => {
          hero.walk('down')
        })
      },
      repeat: -1
    })

    this.disableNarratorText = this.add
      .text(centerX - 65, centerY + 120, 'Disable Narrator', {
        font: "16px monospace",
        fill: "#FFFFFF"
      }).setInteractive()
    this.disableNarratorCheckbox = this.add.sprite(centerX - 81, centerY + 130, "ui", 0).setInteractive()
    this.disableNarratorText.on("pointerup", this.disableNarrator, this)
    this.disableNarratorCheckbox.on("pointerup", this.disableNarrator, this)

    const newGame = this.add
      .text(centerX - 55, centerY + 160, 'New Game', {
        font: "24px monospace",
        fill: "#FFFFFF"
      })
      .setInteractive();
    newGame.on('pointerup', () => {
      this.scene.sleep()
      this.scene.add('Dungeon1', new DungeonScene(this.startDungeon), true)
      this.scene.add('Gui', new GuiScene(), true)
      this.scene.add('Character', new CharacterScene())
    })
    const loadGame = this.add
      .text(centerX - 61, centerY + 200, 'Load Game', {
        font: "24px monospace",
        fill: "#222222"
      })
      .setInteractive();
    const options = this.add
      .text(centerX - 48, centerY + 240, 'Options', {
        font: "24px monospace",
        fill: "#222222"
      })
      .setInteractive();
  }

  disableNarrator() {
    if (this.registry.get("disableNarrator")) {
      this.disableNarratorCheckbox.setTexture("ui", 0)
      this.registry.set("disableNarrator", false)
    } else {
      this.disableNarratorCheckbox.setTexture("ui", 1)
      this.registry.set("disableNarrator", true)
    }
  }
}
