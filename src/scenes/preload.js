import Phaser from "phaser"
import Hero from "../objects/hero.js"
import Enemy from "../objects/enemy.js"
import Narrator from "../narrator.js"
import Animations from "../animations.js"

// assets
import themeMp3 from "../assets/audio/kai-engel-downfall.mp3"
import tileset from "../assets/dungeon-extruded.png";
import introGround from "../assets/intro-ground.png";
import enemies from "../assets/enemies.png";

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload")
  }

  preload() {
    this.load.audio("ambientMusik", themeMp3)
    this.load.image("tileset", tileset)
    this.load.spritesheet(
      "intro-ground",
      introGround,
      {
        frameWidth: 192,
        frameHeight: 192
      }
    );

    Hero.preload(this)
    Enemy.preload(this)
    Narrator.preload(this)

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
        .text(centerX, centerY, 'Play', {
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
    Animations.intro(this.anims)
    Animations.hero(this.anims)
    Animations.enemies(this.anims)
  }
}