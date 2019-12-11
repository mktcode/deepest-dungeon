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
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.sound.play("ambientMusik", { volume: 0.3, loop: true })

    this.centerX = this.game.scale.width / 2
    this.centerY = this.game.scale.height / 2

    this.setRegistryDefaults()
    this.addTitle()
    this.addLogoAnimation()
    this.addDisableNarratorButton()
    this.addNewGameButton()
  }

  setRegistryDefaults() {
    this.registry.set('currentDungeon', 1)
    this.registry.set('minDungeon', 1)
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
  }

  addTitle() {
    this.add.text(this.centerX - 163, this.centerY - 170, 'Infinite Dungeons', {
      font: "30px monospace",
      fill: "#FFFFFF"
    })
  }

  addLogoAnimation() {
    const ground = this.add.sprite(this.centerX, this.centerY, "introGround")
    ground.anims.play('intro-ground')
    const hero = new Hero(this, this.centerX, this.centerY)
    hero.walk('down')

    const directions = ['down', 'left', 'right']
    this.time.addEvent({
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
  }

  addDisableNarratorButton() {
    this.disableNarratorText = this.add.text(this.centerX - 65, this.centerY + 150, 'Disable Narrator', {
      font: "16px monospace",
      fill: "#FFFFFF"
    }).setInteractive()
    this.disableNarratorCheckbox = this.add.sprite(this.centerX - 81, this.centerY + 160, "ui", 0).setInteractive()
    this.disableNarratorText.on("pointerup", this.disableNarrator, this)
    this.disableNarratorCheckbox.on("pointerup", this.disableNarrator, this)
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

  addNewGameButton() {
    const newGame = this.add.text(this.centerX - 55, this.centerY + 110, 'New Game', {
      font: "24px monospace",
      fill: "#FFFFFF"
    }).setInteractive()

    newGame.on('pointerup', () => {
      this.scene.sleep()
      this.scene.add('Dungeon1', new DungeonScene(this.registry.get('currentDungeon')), true)
      this.scene.add('Gui', new GuiScene(), true)
      this.scene.add('Character', new CharacterScene())
    })
  }
}
