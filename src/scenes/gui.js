import Phaser from "phaser";
import Hero from "../objects/hero.js";

// assets
import frame from "../assets/gui/frame.png";
import orbs from "../assets/gui/orbs.png";
import bars from "../assets/gui/bars.png";
import items from "../assets/gui/items.png";
import cursor from "../assets/gui/cursor.png";

export default class GuiScene extends Phaser.Scene {
  constructor() {
    super('Gui')
    this.items = {
      slot1: null,
      slot2: null,
      slot3: null,
      slot4: null,
      slot5: null,
      slot6: null,
      slot7: null,
      slot8: null,
      slot9: null
    }
  }

  static preload(scene) {
    scene.load.image("gui-frame", frame)
    scene.load.spritesheet("cursor", cursor, {
      frameWidth: 42,
      frameHeight: 46
    })
    scene.load.spritesheet(
      "gui-orbs",
      orbs,
      {
        frameWidth: 87,
        frameHeight: 75
      }
    );
    scene.load.spritesheet(
      "gui-bars",
      bars,
      {
        frameWidth: 348,
        frameHeight: 9
      }
    );
    scene.load.spritesheet(
      "gui-items",
      items,
      {
        frameWidth: 36,
        frameHeight: 36
      }
    );
  }

  create() {
    this.scale.on('resize', this.resize, this)

    this.centerX = this.game.scale.width / 2
    this.centerY = this.game.scale.height - 46

    this.container = this.add.container(this.centerX, this.centerY)
    this.frame = this.add.image(0, 0, "gui-frame").setInteractive()
    this.healthFill = this.add.sprite(-193, 0, "gui-orbs", 0)
    this.manaFill = this.add.sprite(193, 0, "gui-orbs", 1)
    this.dungeonProgressBar = this.add.sprite(0, -15, "gui-bars", 0)
    this.xpBar = this.add.sprite(0, -3, "gui-bars", 1)

    // items
    const itemsTextStyle = {
      font: "11px monospace",
      fill: "#FFFFFF"
    }
    this.items.slot1 = this.add.sprite(-156, 23, "gui-items", 0)
    this.items.slot2 = this.add.sprite(-156 + 39, 23, "gui-items", 1)
    this.items.slot3 = this.add.sprite(-156 + 2 * 39, 23, "gui-items", 2)
    this.items.slot4 = this.add.sprite(-156 + 3 * 39, 23, "gui-items", 3)
    this.items.slot5 = this.add.sprite(-156 + 4 * 39, 23, "gui-items", 4)
    this.items.slot6 = this.add.sprite(-156 + 5 * 39, 23, "gui-items", 5)
    this.items.slot7 = this.add.sprite(-156 + 6 * 39, 23, "gui-items", 6)
    this.items.slot8 = this.add.sprite(-156 + 7 * 39, 23, "gui-items", 7).setInteractive()
    this.items.slot9 = this.add.sprite(-156 + 8 * 39, 23, "gui-items", 8)
    this.items.slot9text = this.add.text(-171 + 8 * 39, 23 + 5, '', itemsTextStyle)

    this.items.slot8.on('pointerup', () => {
      const currentDungeon = this.scene.get('Dungeon' + this.registry.get('currentDungeon'))
      currentDungeon.hero.usePathfinder()
    })

    // selected item
    this.selectedItem = this.add.graphics();
    this.selectedItem.lineStyle(3, 0xffffff, 1);
    this.selectedItem.strokeRect(-173, 5, 34, 34);

    this.container.add([
      this.healthFill,
      this.manaFill,
      this.frame,
      this.dungeonProgressBar,
      this.xpBar,
      this.items.slot1,
      this.items.slot2,
      this.items.slot3,
      this.items.slot4,
      this.items.slot5,
      this.items.slot6,
      this.items.slot7,
      this.items.slot8,
      this.items.slot9,
      this.items.slot9text,
      this.selectedItem
    ])

    this.createCursor()

    this.addHealthAnimation()
    this.addManaAnimation()
    this.addLowHealthAnimation()
    this.addLetterBoxes()
    this.addSubtitle()

    // listen to changes
    this.registry.events.on('changedata', this.update, this)
    this.update()
  }

  update() {
    this.updateHealth()
    this.updateMana()
    this.updateDungeonProgress()
    this.updateXp()
    this.updateSelectedItem()
    this.updateItems()
    this.updateCursor()
  }

  createCursor() {
    this.input.setDefaultCursor('none')
    this.cursor = this.add.sprite(0, 0, "cursor", 0)
    this.resetCursorIdleTime()
    this.input.on('pointermove', () => this.resetCursorIdleTime())
    this.input.on('pointerdown', () => {
      this.cursor.setFrame(1)
      this.resetCursorIdleTime()
    })
    this.input.on('pointerup', () => {
      this.cursor.setFrame(0)
      this.resetCursorIdleTime()
    })
  }

  resetCursorIdleTime() {
    this.cursorIdleTime = new Date().getTime()
  }

  updateCursor() {
    this.cursor.setX(this.input.activePointer.x + 18)
    this.cursor.setY(this.input.activePointer.y + 20)
    if ((new Date().getTime() - this.cursorIdleTime) / 1000 > 3) {
      this.cursor.setAlpha(0)
    } else {
      this.cursor.setAlpha(1)
    }
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

  addHealthAnimation() {
    this.healthAnimationParticle = this.add.particles('particle').setDepth(-1)
    this.healthAnimation = this.healthAnimationParticle.createEmitter({
      tint: [0xCC0000],
      on: false,
      x: this.centerX - 193,
      y: this.centerY,
      blendMode: 'SCREEN',
      scale: { start: 1, end: 2 },
      alpha: { start: 1, end: 0 },
      speed: 30,
      quantity: 40,
      frequency: 200,
      lifespan: 500,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 45),
        type: 'edge',
        quantity: 40
      }
    })
  }

  addManaAnimation() {
    this.manaAnimationParticle = this.add.particles('particle').setDepth(-1)
    this.manaAnimation = this.manaAnimationParticle.createEmitter({
      tint: [0x0000FF],
      on: false,
      x: this.centerX + 193,
      y: this.centerY,
      blendMode: 'SCREEN',
      scale: { start: 1, end: 2 },
      alpha: { start: 1, end: 0 },
      speed: 30,
      quantity: 40,
      frequency: 200,
      lifespan: 500,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 45),
        type: 'edge',
        quantity: 40
      }
    })
  }

  playHealthAnimation() {
    this.playOrbAnimation(this.healthAnimation)
  }

  playManaAnimation() {
    this.playOrbAnimation(this.manaAnimation)
  }

  playOrbAnimation(animation) {
    animation.start()
    this.time.delayedCall(250, () => {
      animation.stop()
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
        if (this.registry.get('health') <= this.registry.get('maxHealth') / 3 && !currentDungeon.hero.dead) {
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
    this.updateItems()
    this.time.delayedCall(120000, () => {
      this.registry.set('pathfinderCooldown', false)
      this.updateItems()
    })
  }

  updateHealth() {
    const health = this.registry.get('health')
    const maxHealth = this.registry.get('maxHealth')

    this.healthFill.setCrop(0, 90 - 90 * (health / maxHealth), 90, 90)
  }

  updateMana() {
    const mana = this.registry.get('mana')
    const maxMana = this.registry.get('maxMana')

    this.manaFill.setCrop(0, 90 - 90 * (mana / maxMana), 90, 90)
  }

  updateDungeonProgress() {
    const currentDungeon = this.registry.get('currentDungeon')
    const deepestDungeon = this.registry.get('deepestDungeon')

    this.dungeonProgressBar.setCrop(0, 0, 348 * (currentDungeon / deepestDungeon), 9)
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

    this.xpBar.setCrop(0, 0, 348 * (xp / thisLevelXp), 9)
  }

  updateSelectedItem() {
    if (this.registry.get('weapon') === 'sword') {
      this.container.bringToTop(this.selectedItem)
    } else {
      this.container.sendToBack(this.selectedItem)
    }
  }

  updateItems() {
    const items = this.registry.get('items')
    if (items.includes('sword')) {
      this.container.bringToTop(this.items.slot1)
    } else {
      this.container.sendToBack(this.items.slot1)
    }
    if (items.includes('pathfinder')) {
      this.container.bringToTop(this.items.slot8)
      this.items.slot8.setAlpha(this.registry.get('pathfinderCooldown') ? 0.3 : 1)
    } else {
      this.container.sendToBack(this.items.slot8)
    }
    if (items.includes('torch')) {
      this.container.bringToTop(this.items.slot9)
      this.container.bringToTop(this.items.slot9text)
      const torchesNum = items.filter(i => i === 'torch').length
      this.items.slot9text.setText(torchesNum)
    } else {
      this.container.sendToBack(this.items.slot9)
      this.container.sendToBack(this.items.slot9text)
    }
  }

  resize() {
    this.container.setPosition(this.centerX, this.centerY)
  }
}
