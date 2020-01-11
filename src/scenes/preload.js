import Phaser from "phaser"
import GuiScene from "../scenes/gui.js"
import DungeonScene from "../scenes/dungeon.js"
import Hero from "../objects/hero.js"
import Deamon from "../objects/enemies/deamon.js"
import Narrator from "../narrator.js"
import Sounds from "../sounds.js"
import Animations from "../animations.js"

// assets
import spriteAtlas from "../assets/spriteatlas/spriteatlas.json"
import spriteAtlasImage from "../assets/spriteatlas/spriteatlas.png"
import themeMp3 from "../assets/audio/kai-engel-downfall.mp3"
import ui from "../assets/ui.png"

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload")
  }

  preload() {
    this.load.atlas('sprites', spriteAtlasImage, spriteAtlas)
    this.load.audio("ambientMusik", themeMp3)
    this.load.spritesheet(
      "ui",
      ui,
      {
        frameWidth: 16,
        frameHeight: 16
      }
    );

    Hero.preload(this)
    Deamon.preload(this)
    Narrator.preload(this)
    Sounds.preload(this)
    GuiScene.preload(this)
    DungeonScene.preload(this)

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height / 2

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(centerX - 160, centerY, 320, 50);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(centerX - 150, centerY + 10, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      const playButton = this.add
        .text(centerX - 49, centerY, 'Play', {
          font: "24px monospace",
          fill: "#000000",
          padding: { x: 20, y: 10 },
          backgroundColor: "#ffffff"
        })
        .setInteractive();
      playButton.on('pointerup', () => {
        const cam = this.cameras.main;
        cam.fadeOut(250, 0, 0, 0);
        cam.once("camerafadeoutcomplete", () => {
          this.scene.shutdown('Preload')
          this.scene.start('Menu')
        });
      })
    });
  }

  create() {
    new Animations(this)
  }
}
