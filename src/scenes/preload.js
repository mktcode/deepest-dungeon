import Phaser from "phaser"
import GuiScene from "../scenes/gui.js"
import DungeonScene from "../scenes/dungeon.js"
import Narrator from "../narrator.js"
import Sounds from "../sounds.js"
import Animations from "../animations.js"

// assets
import spriteAtlas from "../assets/spriteatlas/spriteatlas.json"
import spriteAtlasImage from "../assets/spriteatlas/spriteatlas.png"
import themeMp3 from "../assets/audio/kai-engel-downfall.mp3"
import menuMp3 from "../assets/audio/kai-engel-crying-earth.mp3"
import clickMajorMp3 from "../assets/audio/sounds/click-major.mp3"

import guiHero from "../assets/gui/hero.png"
import guiOrb from "../assets/gui/orb.png"
import guiOrbReflection from "../assets/gui/orb-reflection.png"
import guiOrbSmall from "../assets/gui/orb-small.png"
import guiBars from "../assets/gui/bars.png"
import guiHealth from "../assets/gui/health.png"
import guiMana from "../assets/gui/mana.png"
import guiXp from "../assets/gui/xp.png"

import guiContainerCorner from "../assets/gui/container-corner.png"
import guiContainerEdgeV from "../assets/gui/container-edge-v.png"
import guiContainerEdgeH from "../assets/gui/container-edge-h.png"
import guiContainerBg from "../assets/gui/container-bg.png"
import guiButtonLeftRight from "../assets/gui/button-left-right.png"
import guiButtonTopBottom from "../assets/gui/button-top-bottom.png"
import guiButtonBg from "../assets/gui/button-bg.png"
import guiCheckbox from "../assets/gui/checkbox.png"

import guiCursor from "../assets/gui/cursor.png"

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload")
  }

  preload() {
    this.load.atlas('sprites', spriteAtlasImage, spriteAtlas)
    this.load.audio("ambientMusic", themeMp3)
    this.load.audio("menuMusic", menuMp3)
    this.load.audio("clickMajor", clickMajorMp3)

    this.load.spritesheet("guiHero", guiHero, { frameWidth: 63, frameHeight: 63 })
    this.load.image("guiOrb", guiOrb)
    this.load.image("guiOrbReflection", guiOrbReflection)
    this.load.image("guiOrbSmall", guiOrbSmall)
    this.load.image("guiBars", guiBars)
    this.load.image("guiHealth", guiHealth)
    this.load.image("guiMana", guiMana)
    this.load.image("guiXp", guiXp)
    this.load.image("guiContainerCorner", guiContainerCorner)
    this.load.image("guiContainerEdgeV", guiContainerEdgeV)
    this.load.image("guiContainerEdgeH", guiContainerEdgeH)
    this.load.image("guiContainerBg", guiContainerBg)
    this.load.image("guiButtonLeftRight", guiButtonLeftRight)
    this.load.image("guiButtonTopBottom", guiButtonTopBottom)
    this.load.spritesheet("guiButtonBg", guiButtonBg, { frameWidth: 250, frameHeight: 23 })
    this.load.spritesheet("guiCheckbox", guiCheckbox, { frameWidth: 27, frameHeight: 27 })
    this.load.spritesheet("guiCursor", guiCursor, { frameWidth: 42, frameHeight: 46 })

    Narrator.preload(this)
    Sounds.preload(this)
    DungeonScene.preload(this)

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height / 2

    const progressText = this.add.text(centerX - 55, centerY + 15, 'loading game...', { font: "11px monospace", fill: "#3a352a" })
    const progressBar = this.add.graphics().setDepth(10);
    const progressBox = this.add.graphics().setDepth(5);
    progressBox.fillStyle(0x3a352a);
    progressBox.fillRect(centerX - 160, centerY, 300, 10);


    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x601309, 1);
      progressBar.fillRect(centerX - 158, centerY + 3, 296 * value, 4);
    });

    this.load.on('complete', () => {
      const cam = this.cameras.main;
      cam.fadeOut(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        progressText.destroy();
        progressBar.destroy();
        progressBox.destroy();

        this.scene.shutdown('Preload')
        this.scene.start('Menu')
      })
    })
  }

  create() {
    new Animations(this)
  }
}
