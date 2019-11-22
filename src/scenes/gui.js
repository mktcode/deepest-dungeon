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
    const centerX = this.game.scale.width / 2
    const centerY = this.game.scale.height - 46
    const leftOrbX = centerX - 193
    const rightOrbX = centerX + 193
    const dungeonProgressBarY = centerY - 15
    const xpBarY = centerY - 3

    // frame
    this.add.image(
      centerX,
      centerY,
      "gui-frame"
    ).setScrollFactor(0).setDepth(1);

    // health orb
    this.healthFill = this.add.sprite(
      leftOrbX,
      centerY,
      "gui-orbs",
      0
    ).setScrollFactor(0).setDepth(0);

    // mana orb
    this.manaFill = this.add.sprite(
      rightOrbX,
      centerY,
      "gui-orbs",
      1
    ).setScrollFactor(0).setDepth(0);

    // dungeon process bar
    this.dungeonProgressBar = this.add.sprite(
      centerX,
      dungeonProgressBarY,
      "gui-bars",
      0
    ).setScrollFactor(0).setDepth(2);

    // xp process bar
    this.xpBar = this.add.sprite(
      centerX,
      xpBarY,
      "gui-bars",
      1
    ).setScrollFactor(0).setDepth(2);

    // items
    const itemsY = this.game.scale.height - 23
    const itemsTextStyle = {
      font: "11px monospace",
      fill: "#FFFFFF"
    }
    this.items.slot1 = this.add.sprite(centerX - 156, itemsY, "gui-items", 0).setDepth(0)
    // this.items.slot1counter = this.add.text(centerX - 171, itemsY + 5, '1', itemsTextStyle).setDepth(0)
    this.items.slot2 = this.add.sprite(centerX - 156 + 39, itemsY, "gui-items", 1).setDepth(0)
    this.items.slot3 = this.add.sprite(centerX - 156 + 2 * 39, itemsY, "gui-items", 2).setDepth(0)
    this.items.slot4 = this.add.sprite(centerX - 156 + 3 * 39, itemsY, "gui-items", 3).setDepth(0)
    this.items.slot5 = this.add.sprite(centerX - 156 + 4 * 39, itemsY, "gui-items", 4).setDepth(0)
    this.items.slot6 = this.add.sprite(centerX - 156 + 5 * 39, itemsY, "gui-items", 5).setDepth(0)
    this.items.slot7 = this.add.sprite(centerX - 156 + 6 * 39, itemsY, "gui-items", 6).setDepth(0)
    this.items.slot8 = this.add.sprite(centerX - 156 + 7 * 39, itemsY, "gui-items", 7).setDepth(0)
    this.items.slot9 = this.add.sprite(centerX - 156 + 8 * 39, itemsY, "gui-items", 8).setDepth(0)
    this.items.slot9text = this.add.text(centerX - 171 + 8 * 39, itemsY + 5, '', itemsTextStyle).setDepth(0)

    // selected item
    this.selectedItem = this.add.graphics();
    this.selectedItem.setDepth(0)
    this.selectedItem.lineStyle(3, 0xffffff, 1);
    this.selectedItem.strokeRect(centerX - 172, this.game.scale.height - 40, 34, 34);

    // listen to changes
    this.registry.events.on('changedata-health', () => {
      this.updateHealth()
    })
    this.registry.events.on('changedata-maxHealth', () => {
      this.updateHealth()
    })

    this.registry.events.on('changedata-mana', () => {
      this.updateMana()
    })
    this.registry.events.on('changedata-maxMana', () => {
      this.updateMana()
    })

    this.registry.events.on('changedata-currentDungeon', () => {
      this.updateDungeonProgress()
    })
    this.registry.events.on('changedata-deepestDungeon', () => {
      this.updateDungeonProgress()
    })

    this.registry.events.on('changedata-xp', () => {
      this.updateXp()
    })

    this.registry.events.on('changedata-weapon', () => {
      this.updateSelectedItem()
    })

    this.registry.events.on('changedata-items', (parent, oldItems) => {
      this.updateItems()
    })

    this.updateHealth()
    this.updateMana()
    this.updateDungeonProgress()
    this.updateXp()
    this.updateSelectedItem()
    this.updateItems()
  }

  removeTorchDelayed() {
    this.time.delayedCall(60000, () => {
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
    }
    const lastMaxXp = Hero.getXpForLevelUp(xpBasedLevel)
    const currentMaxXp = Hero.getXpForLevelUp(xpBasedLevel + 1)
    const thisLevelXp = currentMaxXp - lastMaxXp
    const xp = totalXp - lastMaxXp

    this.xpBar.setCrop(0, 0, 348 * (xp / thisLevelXp), 9)
  }

  updateSelectedItem() {
    if (this.registry.get('weapon') === 'sword') {
      this.selectedItem.setDepth(3)
    } else {
      this.selectedItem.setDepth(0)
    }
  }

  updateItems() {
    const items = this.registry.get('items')
    if (items.includes('sword')) {
      this.items.slot1.setDepth(3)
    } else {
      this.items.slot1.setDepth(0)
    }
    if (items.includes('pathfinder')) {
      this.items.slot8.setDepth(3)
      this.items.slot8.setAlpha(this.registry.get('pathfinderCooldown') ? 0.3 : 1)
    } else {
      this.items.slot8.setDepth(0)
    }
    if (items.includes('torch')) {
      this.items.slot9.setDepth(3)
      this.items.slot9text.setDepth(3)
      const torchesNum = items.filter(i => i === 'torch').length
      this.items.slot9text.setText(torchesNum)
    } else {
      this.items.slot9.setDepth(0)
      this.items.slot9text.setDepth(0)
    }
  }
}
