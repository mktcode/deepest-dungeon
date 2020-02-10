import Phaser from "phaser";
import Hero from "../objects/hero.js";

export default class GuiScene extends Phaser.Scene {
  constructor() {
    super('Gui')

    this.lastTorchPickedUpAt = 0
  }

  create() {
    this.addCharacterInfo()
    this.addLowHealthAnimation()
    this.addLetterBoxes()
    this.addSubtitle()

    this.scale.on('resize', this.resize, this)
    this.registry.events.on('changedata', this.update, this)
    this.update()
  }

  addCharacterInfo() {
    this.centerX = 120
    this.centerY = 55

    this.anims.create({
      key: "guiHeroIdle",
      frames: this.anims.generateFrameNumbers("guiHero", { start: 0, end: 19 }),
      frameRate: 12,
      repeat: -1
    })
    this.anims.create({
      key: "guiHeroLookAround",
      frames: this.anims.generateFrameNumbers("guiHero", { start: 20, end: 63 }),
      frameRate: 12,
      repeat: 0
    })

    this.guiHero = this.add.sprite(-65, 0, "guiHero", 0)
    this.guiHero.anims.play('guiHeroIdle')
    this.time.addEvent({
      delay: 15000,
      callback: () => {
        this.guiHero.anims.play('guiHeroLookAround')
        const anim = this.anims.get('guiHeroLookAround')
        anim.on('complete', () => {
          this.guiHero.anims.play('guiHeroIdle')
        })
      },
      loop: true
    })

    this.guiHeroOrb = this.add.image(-65, 0, "guiOrb")
    this.guiHeroOrbReflection = this.add.image(-55, -10, "guiOrbReflection")
    this.guiLevelOrb = this.add.image(-33, 0, "guiOrbLevel")
    this.guiTorchOrb = this.add.image(-80, 30, "guiOrbTorch").setAlpha(0)
    this.guiTorchOrbCooldown = this.add.image(-80, 30, "guiOrbCooldown").setAlpha(0)
    this.guiShieldOrb = this.add.image(-50, 30, "guiOrbShield").setAlpha(0)
    this.guiShieldOrbCooldown = this.add.image(-50, 30, "guiOrbCooldown").setAlpha(0)
    this.guiLevelNum = this.add.text(-41, -6, '1', { font: "10px monospace", fill: "#857562" }).setFixedSize(16, 16).setAlign("center")
    this.guiBars = this.add.image(60, 0, "guiBars")
    this.guiHealth = this.add.image(60, -12, "guiHealth")
    this.guiMana = this.add.image(60, 12, "guiMana")
    this.guiXp = this.add.image(60, 0, "guiXp")

    this.characterInfo = this.add.container(this.centerX, this.centerY).setAlpha(0)
    this.characterInfo.add([
      this.guiHealth,
      this.guiMana,
      this.guiBars,
      this.guiXp,
      this.guiHeroOrb,
      this.guiHero,
      this.guiHeroOrbReflection,
      this.guiLevelOrb,
      this.guiLevelNum,
      this.guiTorchOrb,
      this.guiTorchOrbCooldown,
      this.guiShieldOrb,
      this.guiShieldOrbCooldown
    ])
  }

  addLetterBoxes() {
    this.letterBoxHeight = this.game.scale.height / 5
    this.letterBoxY1 = -(this.letterBoxHeight / 2)
    this.letterBoxY2 = this.game.scale.height + this.letterBoxHeight / 2
    this.letterBox1 = this.add.rectangle(this.game.scale.width / 2, this.letterBoxY1, this.game.scale.width, this.letterBoxHeight, 0x000000).setDepth(20)
    this.letterBox2 = this.add.rectangle(this.game.scale.width / 2, this.letterBoxY2, this.game.scale.width, this.letterBoxHeight, 0x000000).setDepth(20)
  }

  showLetterBoxes() {
    this.tweens.add({
      targets: this.letterBox1,
      y: { from: this.letterBoxY1, to: this.letterBoxY1 + this.letterBoxHeight}
    })
    this.tweens.add({
      targets: this.letterBox2,
      y: { from: this.letterBoxY2, to: this.letterBoxY2 - this.letterBoxHeight}
    })
  }
  hideLetterBoxes() {
    this.tweens.add({
      targets: this.letterBox1,
      y: { from: this.letterBoxY1 + this.letterBoxHeight, to: this.letterBoxY1}
    })
    this.tweens.add({
      targets: this.letterBox2,
      y: { from: this.letterBoxY2 - this.letterBoxHeight, to: this.letterBoxY2}
    })
  }

  addSubtitle() {
    this.subtitleX = 0
    this.subtitleY = this.game.scale.height - this.game.scale.height * 0.2 + 10
    this.subtitle = this.add.text(this.subtitleX, this.subtitleY, '', {
      font: "9px monospace",
      fill: "#CCCCCC",
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000',
        blur: 0,
        fill: '#000000'
      }
    }).setDepth(25).setAlign('center').setScale(2).setFixedSize(this.game.scale.width / 2, 100)
  }

  showSubtitle(text, hideAfter) {
    if (text !== this.subtitle.text) {
      this.subtitle.setText(text)
      if (hideAfter) {
        this.time.delayedCall(hideAfter, () => {
          this.subtitle.setText('')
        })
      }
    }
  }

  hideSubtitle(text) {
    if (this.subtitle.text && (!text || text === this.subtitle.text)) {
      this.subtitle.setText('')
    }
  }

  showChapterIntroText(num, title) {
    this.time.delayedCall(1000, () => {
      const chapterNum = this.add.text(0, this.game.scale.height * 0.2 - 50, 'Chapter ' + num, {
        font: "8px monospace",
        fill: "#CCCCCC"
      }).setDepth(25).setAlign('center').setAlpha(0).setScale(3).setFixedSize(this.game.scale.width / 3, 200)
      const chapterTitle = this.add.text(0, this.game.scale.height * 0.2, title, {
        font: "16px monospace",
        fill: "#CCCCCC"
      }).setDepth(25).setAlign('center').setAlpha(0).setScale(3).setFixedSize(this.game.scale.width / 3, 200)

      this.tweens.add({
        targets: [chapterNum, chapterTitle],
        duration: 3000,
        scale: { from: 3, to: 4 },
        alpha: { from: 0, to: 1},
        x: '-=' + this.game.scale.width / 5.5,
        ease: 'Qubic',
        onComplete: () => {
          this.tweens.add({
            targets: [chapterNum, chapterTitle],
            duration: 3000,
            scale: { from: 4, to: 5 },
            alpha: { from: 1, to: 0},
            x: '-=' + this.game.scale.width / 5.5,
            onComplete: () => {
              chapterNum.destroy()
              chapterTitle.destroy()
            }
          })
        }
      })
    })
  }

  addLowHealthAnimation() {
    this.lowHealthAnimationParticle = this.add.particles('particle').setDepth(-1)
    this.lowHealthAnimation = this.lowHealthAnimationParticle.createEmitter({
      tint: [0x220000],
      on: false,
      x: -4,
      y: 10,
      blendMode: 'SCREEN',
      scale: { start: 10, end: 1 },
      alpha: { start: 1, end: 0 },
      speed: 100,
      quantity: 30,
      frequency: 200,
      lifespan: 2300,
      emitZone: {
        source: new Phaser.Geom.Line(0, this.game.scale.height, this.game.scale.width, this.game.scale.height),
        type: 'edge',
        quantity: 30
      }
    })

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        const currentDungeon = this.scene.get('Dungeon' + this.registry.get('currentDungeon'))
        if (this.registry.get('health') <= this.registry.get('maxHealth') / 3 && !currentDungeon.hero.isDead) {
          currentDungeon.sounds.play('heartBeat')
          this.lowHealthAnimation.start()
          this.time.delayedCall(250, () => {
            this.lowHealthAnimation.stop()
          })
        }
      },
      loop: true
    })
  }

  removeTorchDelayed() {
    this.lastTorchPickedUpAt = new Date().getTime()
    this.time.delayedCall(this.registry.get('torchDuration') * 1000, () => {
      const items = this.registry.get('items')
      const deleteIndex = items.findIndex((item) => item === 'torch')
      if (deleteIndex != -1) {
        items.splice(deleteIndex, 1)
        this.registry.set('items', items)
      }
    })
  }

  startPathfinderCooldown() {
    this.registry.set('pathfinderCooldown', true)
    this.time.delayedCall(120000, () => {
      this.registry.set('pathfinderCooldown', false)
    })
  }

  updateHealth() {
    const health = this.registry.get('health')
    const maxHealth = this.registry.get('maxHealth')

    this.guiHealth.setCrop(0, 0, 190 * (health / maxHealth), 12)
  }

  updateMana() {
    const mana = this.registry.get('mana')
    const maxMana = this.registry.get('maxMana')

    this.guiMana.setCrop(0, 0, 190 * (mana / maxMana), 12)
  }

  updateXp() {
    const totalXp = this.registry.get('xp')
    const currentLevel = this.registry.get('level')
    const xpBasedLevel = Hero.getLevelByXp(totalXp)
    if (currentLevel < xpBasedLevel) {
      this.registry.set('level', xpBasedLevel)
      this.registry.set('skillPoints', this.registry.get('skillPoints') + 1)
      const currentDungeon = this.scene.get('Dungeon' + this.registry.get('currentDungeon'))
      currentDungeon.hero.levelUpAnimation()
    }
    const lastMaxXp = Hero.getXpForLevelUp(xpBasedLevel)
    const currentMaxXp = Hero.getXpForLevelUp(xpBasedLevel + 1)
    const thisLevelXp = currentMaxXp - lastMaxXp
    const xp = totalXp - lastMaxXp

    this.guiXp.setCrop(0, 0, 190 * (xp / thisLevelXp), 2)
    this.guiLevelNum.setText(this.registry.get('level'))
  }

  updateTorchOrb() {
    if (this.registry.get('items').includes('torch')) {
      const torchActiveTime = ((new Date().getTime() - this.lastTorchPickedUpAt) / 1000) / this.registry.get('torchDuration')
      this.guiTorchOrbCooldown.setAlpha(1).setCrop(0, 25 * (1 - torchActiveTime), 25, 25)
      this.guiTorchOrb.setAlpha(1)
    } else {
      this.guiTorchOrb.setAlpha(0)
      this.guiTorchOrbCooldown.setAlpha(0)
    }
  }

  updateShieldOrb() {
    const currentDungeon = this.scene.get('Dungeon' + this.registry.get('currentDungeon'))
    if (currentDungeon.hero && currentDungeon.hero.shield && currentDungeon.hero.shield.isActiveSince) {
      const shieldActiveTime = ((new Date().getTime() - currentDungeon.hero.shield.isActiveSince) / 1000) / this.registry.get('shieldDuration')
      this.guiShieldOrbCooldown.setAlpha(1).setCrop(0, 25 * (1 - shieldActiveTime), 25, 25)
      this.guiShieldOrb.setAlpha(1)
    } else {
      this.guiShieldOrb.setAlpha(0)
      this.guiShieldOrbCooldown.setAlpha(0)
    }
  }

  resize() {}

  update() {
    this.updateHealth()
    this.updateMana()
    this.updateXp()
    this.updateTorchOrb()
    this.updateShieldOrb()
  }
}
