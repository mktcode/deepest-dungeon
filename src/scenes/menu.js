import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import GuiScene from "../scenes/gui.js"
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
    this.startLevel = 1
    this.registry.set('minLevel', 1)
    this.registry.set('narratorSaid', [])
    this.registry.set('disableNarrator', false)
    this.registry.set('weapon', null)
    this.registry.set('health', 3)
    this.registry.set('maxHealth', 3)
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.sound.play("ambientMusik", { volume: 0.3, loop: true })

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height / 2

    const title = this.add
      .text(centerX - 143, centerY - 200, 'To Dungeons Deep', {
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

    this.add
      .text(centerX - 65, centerY + 120, 'Disable Narrator', {
        font: "16px monospace",
        fill: "#FFFFFF"
      })
    const disableNarrator = this.add.sprite(centerX - 81, centerY + 130, "ui", 0).setInteractive()
    disableNarrator.on("pointerup", () => {
      if (this.registry.get("disableNarrator")) {
        disableNarrator.setTexture("ui", 0)
        this.registry.set("disableNarrator", false)
      } else {
        disableNarrator.setTexture("ui", 1)
        this.registry.set("disableNarrator", true)
      }
    })

    const newGame = this.add
      .text(centerX - 55, centerY + 160, 'New Game', {
        font: "24px monospace",
        fill: "#FFFFFF"
      })
      .setInteractive();
    newGame.on('pointerup', () => {
      this.scene.sleep()
      this.scene.add('Dungeon1', new DungeonScene(this.startLevel), true)
      this.scene.add('Gui', new GuiScene(), true)
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
}
