import Phaser from "phaser"
import GuiScene from "../scenes/gui.js"
import DungeonScene from "../scenes/dungeon.js"
import Narrator from "../narrator.js"
import Sounds from "../sounds.js"
import Animations from "../animations.js"
import GuiButton from "../gui/button.js"
import axios from "axios"

// assets
import spriteAtlas from "../assets/spriteatlas/spriteatlas.json"
import spriteAtlasImage from "../assets/spriteatlas/spriteatlas.png"
import themeMp3 from "../assets/audio/kai-engel-downfall.mp3"
import menuMp3 from "../assets/audio/kai-engel-crying-earth.mp3"
import clickMajorMp3 from "../assets/audio/sounds/click-major.mp3"
import clickMinorMp3 from "../assets/audio/sounds/click-minor.mp3"

import guiHero from "../assets/gui/hero.png"
import guiOrb from "../assets/gui/orb.png"
import guiOrbReflection from "../assets/gui/orb-reflection.png"
import guiOrbLevel from "../assets/gui/orb-level.png"
import guiOrbTorch from "../assets/gui/orb-torch.png"
import guiOrbShield from "../assets/gui/orb-shield.png"
import guiOrbCooldown from "../assets/gui/orb-cooldown.png"
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

import particle from '../assets/particle.png'
import fog from '../assets/fog.png'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload")
  }

  preload() {
    this.load.atlas('sprites', spriteAtlasImage, spriteAtlas)
    this.load.audio("ambientMusic", themeMp3)
    this.load.audio("menuMusic", menuMp3)
    this.load.audio("clickMajor", clickMajorMp3)
    this.load.audio("clickMinor", clickMinorMp3)

    this.load.spritesheet("guiHero", guiHero, { frameWidth: 63, frameHeight: 63 })
    this.load.image("guiOrb", guiOrb)
    this.load.image("guiOrbReflection", guiOrbReflection)
    this.load.image("guiOrbLevel", guiOrbLevel)
    this.load.image("guiOrbTorch", guiOrbTorch)
    this.load.image("guiOrbShield", guiOrbShield)
    this.load.image("guiOrbCooldown", guiOrbCooldown)
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
    this.load.html('loginForm', "login.html")

    this.load.image('particle', particle)
    this.load.image('fog', fog)

    Narrator.preload(this)
    Sounds.preload(this)
    DungeonScene.preload(this)

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height / 2

    this.progressBar = this.add.container(centerX, centerY)
    const text = this.add.text(-55, 15, 'loading game...', { font: "11px monospace", fill: "#3a352a" })
    const progress = this.add.graphics()
    const background = this.add.graphics()
    background.fillStyle(0x3a352a)
    background.fillRect(-160, 0, 300, 10)

    this.progressBar.add([background, progress, text])

    this.load.on('progress', (value) => {
      progress.clear()
      progress.fillStyle(0x601309, 1)
      progress.fillRect(-158, 3, 296 * value, 4)
    });

    this.load.on('complete', () => {
      this.add.tween({
        targets: this.progressBar,
        alpha: { from: 1, to: 0 },
        duration: 500,
        onComplete: () => {
          const text = 'This is an experimental game and\nit has bugs! If you like it anyway,\ndon\'t forget to give a rating.\n\nSound required!'
          const infoText = this.add.text(centerX - 150, centerY - 50, text, { font: "13px monospace", fill: "#ffffff" })
            .setFixedSize(300, 100)
            .setAlign('center')
            .setAlpha(0)
          this.add.tween({
            targets: infoText,
            alpha: { from: 0, to: 1 },
            duration: 500,
            onComplete: () => {
              this.time.delayedCall(1000, () => {
                this.input.keyboard.on('keyup-ENTER', () => this.continue())
                const continueText = this.add.text(centerX - 50, centerY + 50, 'Press Enter', { font: "16px monospace", fill: "#ffffff" }).setAlpha(0)
                this.add.tween({
                  targets: continueText,
                  alpha: { from: 0, to: 1 },
                  duration: 500,
                  yoyo: true,
                  repeat: -1
                })
              })
            }
          })
        }
      })
    })
  }

  continue() {
    const cam = this.cameras.main;
    cam.fadeOut(250, 0, 0, 0);
    cam.once("camerafadeoutcomplete", () => {
      this.progressBar.destroy()

      this.scene.shutdown('Preload')
      this.scene.start('Login')
      this.scene.start('MenuBg')
      this.scene.start('Cursor')
    })
  }

  create() {
    new Animations(this)
    this.setRegistryDefaults()
  }

  setRegistryDefaults() {
    this.registry.set('menuMusic', this.sound.add('menuMusic', { loop: true  }))
    this.registry.set('ambientMusic', this.sound.add('ambientMusic', { loop: true  }))
    this.registry.set('currentDungeon', 1)
    this.registry.set('minDungeon', 1)
    this.registry.set('deepestDungeon', 1)
    this.registry.set('narratorSaid', [])
    this.registry.set('disableNarrator', false)
    this.registry.set('items', [])
    this.registry.set('torchDuration', 60)
    this.registry.set('torchIntensity', 1)
    this.registry.set('shieldDuration', 10)
    this.registry.set('shieldDamage', 0)
    this.registry.set('fireballSize', 1)
    this.registry.set('damage', 1)
    this.registry.set('health', 5)
    this.registry.set('maxHealth', 5)
    this.registry.set('mana', 5)
    this.registry.set('maxMana', 5)
    this.registry.set('level', 1)
    this.registry.set('xp', 0)
    this.registry.set('skillPoints', 0)
    this.registry.set('skillPointsSpent', 0)
    this.registry.set('enemiesKilled', 0)
    this.registry.set('zoom', this.game.device.os.desktop ? 2 : 1.3)
    this.registry.set('defaultZoom', this.game.device.os.desktop ? 2 : 1.3)
  }
}
