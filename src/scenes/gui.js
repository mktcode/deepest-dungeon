import Phaser from "phaser";
import Hero from "../objects/hero.js";

// assets
import frame from "../assets/gui/frame.png";
import orbs from "../assets/gui/orbs.png";
import bars from "../assets/gui/bars.png";
import items from "../assets/gui/items.png";

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

    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height - 46

    this.container = this.add.container(centerX, centerY)
    this.frame = this.add.image(0, 0, "gui-frame")
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
    this.items.slot8 = this.add.sprite(-156 + 7 * 39, 23, "gui-items", 7)
    this.items.slot9 = this.add.sprite(-156 + 8 * 39, 23, "gui-items", 8)
    this.items.slot9text = this.add.text(-171 + 8 * 39, 23 + 5, '', itemsTextStyle)

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
      currentDungeon.hero.sprites.levelUp.anims.play('levelUp')
      currentDungeon.lightManager.lights.push({
        sprite: currentDungeon.hero.sprites.levelUp,
        intensity: () => 1
      })
      currentDungeon.time.delayedCall(1000, () => {
        currentDungeon.lightManager.removeLight(currentDungeon.hero.sprites.levelUp)
      })
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
    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height - 46
    this.container.setPosition(centerX, centerY)
  }
}
