import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import TILES from "../tile-mapping.js";

// assets
import hero from "../assets/hero.png";
import xpDust from "../assets/xp-dust.png";
import attackSound from "../assets/audio/attack.mp3";

export default class Hero {
  constructor(scene, x, y) {
    this.scene = scene
    this.sprites = {
      hero: null,
      sword: null
    }
    this.keys = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
    this.scene.input.addPointer(1)
    this.joystick = this.scene.plugins.get('joystick').add(this.scene, {
      base: this.scene.add.circle(0, 0, 80).setStrokeStyle(3, 0xffffff, 0),
      thumb: this.scene.add.circle(0, 0, 70).setFillStyle(0xffffff, 0),
      x: this.scene.game.scale.width / 4,
      y: this.scene.game.scale.height - 140,
      radius: 80,
      forceMin: 20
    })
    this.joystickCursorKeys = this.joystick.createCursorKeys()
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.x < this.scene.game.scale.width / 2) {
        this.joystick.setPosition(pointer.x, pointer.y)
      }
    })

    if (this.scene.scene.key.startsWith('Dungeon')) {
      const attackBtn = this.scene.add.rectangle(
        this.scene.game.scale.width * 0.75,
        this.scene.game.scale.height / 2,
        this.scene.game.scale.width / 2,
        this.scene.game.scale.height
      ).setStrokeStyle(3, 0xffffff, 0).setInteractive().setDepth(7).setScrollFactor(0)
      attackBtn.on('pointerdown', () => {
        if (this.scene.registry.get('weapon')) {
          this.attacking = true
          this.attack(this.lastDirection).once('complete', () => {
            this.attacking = false
          })
        }
      }, this)
    }

    this.attacking = false
    this.underAttack = false
    this.burning = false
    this.dead = false
    this.lastDirection = 'down'

    this.addToScene(x, y)
    this.prepareLevelUpAnimation()

    // attack
    this.keys.space.on('down', () => {
      if (this.scene.registry.get('weapon') && !this.attacking) {
        this.attacking = true
        this.attack(this.lastDirection).once('complete', () => {
          this.attacking = false
        })
      }
    })

    // use
    this.scene.input.keyboard.on('keyup-E', () => {
      this.useStairs()
      this.useShrine()
      this.improveSkill()
    });

    // show path
    this.scene.input.keyboard.on('keyup-Q', () => {
      this.usePathfinder()
    });

    this.attackSound = this.scene.sound.add("attackSound", {volume: 0.3})
  }

  static preload(scene) {
    scene.load.spritesheet(
      "hero",
      hero,
      {
        frameWidth: 125,
        frameHeight: 125
      }
    )
    scene.load.spritesheet(
      "xpDust",
      xpDust,
      {
        frameWidth: 52,
        frameHeight: 22
      }
    )
    scene.load.audio("attackSound", attackSound)
  }

  static getLevelByXp(xp) {
    // required xp for level up: current level * 50
    // https://gamedev.stackexchange.com/questions/110431/how-can-i-calculate-current-level-from-total-xp-when-each-level-requires-propor
    return Math.floor((1 + Math.sqrt(1 + 8 * xp / 50)) / 2)
  }

  static getXpForLevelUp(level) {
    return ((Math.pow(level, 2) - level) * 50) / 2
  }

  hasItem(item) {
    return this.scene.registry.get('items').includes(item)
  }

  resetKeys() {
    this.keys.up.isDown = false
    this.keys.down.isDown = false
    this.keys.left.isDown = false
    this.keys.right.isDown = false
    this.keys.space.isDown = false
    this.keys.shift.isDown = false
    this.wasdKeys.up.isDown = false
    this.wasdKeys.down.isDown = false
    this.wasdKeys.left.isDown = false
    this.wasdKeys.right.isDown = false
  }

  useStairs() {
    if (this.isNear([
      ...TILES.STAIRS.OPEN[0],
      ...TILES.STAIRS.OPEN[1],
      ...TILES.STAIRS.OPEN[2],
      ...TILES.STAIRS.OPEN[3],
      ...TILES.STAIRS.OPEN[4]
    ])) {
      const nextDungeon = this.scene.dungeonNumber + 1
      this.scene.scene.sleep()
      if (this.scene.scene.get('Dungeon' + nextDungeon)) {
        this.scene.scene.wake('Dungeon' + nextDungeon)
      } else {
        this.scene.scene.add('Dungeon' + nextDungeon, new DungeonScene(nextDungeon), true)
        this.scene.scene.swapPosition('Gui', 'Dungeon' + nextDungeon);
      }
    }
  }

  useShrine() {
    if (this.isNear([...TILES.SHRINE[0], ...TILES.SHRINE[1], ...TILES.SHRINE[2]])) {
      this.scene.activateSafeRoom()
      this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
      this.scene.registry.set('mana', this.scene.registry.get('maxMana'))
    }
  }

  improveSkill() {
    const tile = this.isNear(TILES.SKILLBG.OPEN[1][0])
    if (tile) {
      const xPosition = tile.x
      if (this.scene.registry.get('skillPoints') > this.scene.registry.get('skillPointsSpent')) {
        if (this.scene.worldToTileX(this.scene.healthSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.registry.set('skillPointsSpent', this.scene.registry.get('skillPointsSpent') + 1)
          this.scene.registry.set('maxHealth', this.scene.registry.get('maxHealth') + 1)
          this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
        }
        if (this.scene.worldToTileX(this.scene.damageSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.registry.set('skillPointsSpent', this.scene.registry.get('skillPointsSpent') + 1)
          this.scene.registry.set('damage', this.scene.registry.get('damage') + 1)
        }
        if (this.scene.worldToTileX(this.scene.torchSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.registry.set('skillPointsSpent', this.scene.registry.get('skillPointsSpent') + 1)
          this.scene.registry.set('torchDuration', this.scene.registry.get('torchDuration') + 30)
        }
      }
    }
  }

  usePathfinder() {
    if (
      this.scene.registry.get('items').includes('pathfinder') &&
      !this.scene.registry.get('pathfinderCooldown')
    ) {
      this.scene.showPath()
    }
  }

  isNear(tileNumbers) {
    if (!Array.isArray(tileNumbers)) {
      tileNumbers = [tileNumbers]
    }

    const tiles = this.scene.stuffLayer.getTilesWithin(
      this.scene.worldToTileX(this.sprites.hero.x) - 2,
      this.scene.worldToTileY(this.sprites.hero.y) - 2,
      5, 5
    )

    return tiles.find(tile => tileNumbers.includes(tile.index))
  }

  addToScene(x, y) {
    this.sprites.hero = this.scene.matter.add
      .sprite(x, y, 'hero', 132)
      .setRectangle(16, 24)
      .setFixedRotation()
      .setOrigin(0.5, 0.55)
      .setDepth(6);
    this.scene.cameras.main.startFollow(this.sprites.hero, true, 0.1, 0.1)
  }

  prepareLevelUpAnimation() {
    this.levelUpParticle = this.scene.add.particles('particle').setDepth(7)
    this.levelUpParticleEmitter = this.levelUpParticle.createEmitter({
      tint: [0xFF00FF, 0x0088FF],
      on: false,
      x: this.sprites.hero.x,
      y: this.sprites.hero.y,
      blendMode: 'SCREEN',
      scale: { start: 0.5, end: 1 },
      alpha: { start: 1, end: 0 },
      speed: 60,
      quantity: 10,
      frequency: 50,
      lifespan: 500,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 10),
        type: 'edge',
        quantity: 10
      }
    })
  }

  levelUpAnimation() {
    this.levelUpParticleEmitter.start()
    this.scene.lightManager.lights.push({
      key: 'levelUp',
      x: () => this.scene.worldToTileX(this.sprites.hero.x),
      y: () => this.scene.worldToTileY(this.sprites.hero.y),
      intensity: () => 0.5
    })
    this.scene.time.delayedCall(800, () => {
      this.levelUpParticleEmitter.stop()
      this.scene.lightManager.removeLightByKey('levelUp')
    })
  }

  jumpTo(x, y) {
    this.sprites.hero.setX(x).setY(y)
  }

  idle(direction) {
    if (!direction) {
      direction = this.lastDirection
    }
    let slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    this.sprites.hero.anims.play('idle-' + direction + slowmo, true)
  }

  walk(direction) {
    if (!direction) {
      direction = this.lastDirection
    }
    let slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    this.sprites.hero.anims.play('walk-' + direction + slowmo, true)
  }

  run(direction) {
    if (!direction) {
      direction = this.lastDirection
    }
    let slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    this.sprites.hero.anims.play('run-' + direction + slowmo, true)
  }

  attack(direction) {
    this.attackSound.play()
    if (!direction) {
      direction = this.lastDirection
    }
    let slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    this.sprites.hero.anims.play('attack-' + direction + slowmo, true)
    return this.scene.anims.get('attack-' + direction + slowmo)
  }

  takeDamage(damage) {
    const hero = this.sprites.hero
    let heroHp = this.scene.registry.get('health')
    heroHp -= damage
    this.scene.registry.set('health', heroHp)
    this.scene.flashSprite(hero)
    this.scene.popupDamageNumber(damage, hero.x, hero.y, '#CC0000')

    if (heroHp <= 0) {
      this.dead = true
      this.scene.cameras.main.fadeOut(1000, 0, 0, 0)
      this.scene.time.delayedCall(600, () => {
        const x = hero.x
        const y = hero.y
        if (this.hasItem('sword')) {
          this.scene.addSword(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15))
        }
        if (this.hasItem('pathfinder')) {
          this.scene.addPathfinder(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15))
        }
        this.scene.registry.set('items', [])
        this.scene.registry.set('weapon', null)
        const lastLevelXp = this.constructor.getXpForLevelUp(this.scene.registry.get('level'))
        const lostXp = this.scene.registry.get('xp') - lastLevelXp
        const lostSkillPoints = this.scene.registry.get('skillPoints') - this.scene.registry.get('skillPointsSpent')
        this.scene.registry.set('skillPoints', this.scene.registry.get('skillPointsSpent'))
        if (lostXp || lostSkillPoints) {
          this.scene.addXpDust(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15), lostXp, lostSkillPoints)
        }

        this.scene.registry.set('xp', lastLevelXp)
        this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
        this.scene.hero.freeze()
        this.scene.scene.sleep()
        this.scene.scene.wake('Dungeon' + this.scene.registry.get('minDungeon'))
      })
    }

    this.scene.time.delayedCall(1500, () => {
      this.underAttack = false
      this.burning = false
    })
  }

  freeze() {
    this.sprites.hero.body.isStatic = true
  }

  unfreeze() {
    this.sprites.hero.body.isStatic = false
  }

  isDirectionKeyDown(direction) {
    return this.keys[direction].isDown || this.wasdKeys[direction].isDown || this.joystickCursorKeys[direction].isDown
  }

  update() {
    if (!this.dead) {
      // Stop any previous movement from the last frame
      this.sprites.hero.setVelocity(0);

      const runOrWalk = this.keys.shift.isDown ? 'walk' : 'run'
      this.baseSpeed = runOrWalk === 'run' ? 2 : 1
      if (this.attacking) this.baseSpeed *= 0.1
      if (this.scene.narrator.slowmo) {
        this.baseSpeed *= this.scene.dungeonNumber === 1 ? 0 : 0.3
      }

      if (this.joystick.force >= this.joystick.touchCursor.forceMin) {
        // this.scene.physics.velocityFromRotation(
        //   this.joystick.rotation,
        //   Math.min(this.baseSpeed, this.baseSpeed * (this.joystick.force / 50)),
        //   this.sprites.hero.body.velocity
        // )
      } else {
        // Horizontal movement
        if (this.isDirectionKeyDown('left')) {
          this.sprites.hero.setVelocityX(-this.baseSpeed);
        } else if (this.isDirectionKeyDown('right')) {
          this.sprites.hero.setVelocityX(this.baseSpeed);
        }

        // Vertical movement
        if (this.isDirectionKeyDown('up')) {
          this.sprites.hero.setVelocityY(-this.baseSpeed);
        } else if (this.isDirectionKeyDown('down')) {
          this.sprites.hero.setVelocityY(this.baseSpeed);
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        const vector = new Phaser.Math.Vector2(this.sprites.hero.body.velocity)
        vector.normalize().scale(this.baseSpeed)
        this.sprites.hero.setVelocity(vector.x, vector.y);
      }

      // Update the animation last and give left/right/down animations precedence over up animations
      // Do nothing if slashing animation is playing
      if (!this.attacking) {
        if (this.isDirectionKeyDown('up')) {
          this.lastDirection = 'up'
          if (this.isDirectionKeyDown('left')) {
            this.lastDirection = 'up-left'
            this[runOrWalk]("up-left")
          } else if (this.isDirectionKeyDown('right')) {
            this.lastDirection = 'up-right'
            this[runOrWalk]("up-right")
          } else {
            this[runOrWalk]("up")
          }
        } else if (this.isDirectionKeyDown('down')) {
          this.lastDirection = 'down'
          if (this.isDirectionKeyDown('left')) {
            this.lastDirection = 'down-left'
            this[runOrWalk]("down-left")
          } else if (this.isDirectionKeyDown('right')) {
            this.lastDirection = 'down-right'
            this[runOrWalk]("down-right")
          } else {
            this[runOrWalk]("down")
          }
        } else if (this.isDirectionKeyDown('left')) {
          this.lastDirection = 'left'
          this[runOrWalk]("left")
        } else if (this.isDirectionKeyDown('right')) {
          this.lastDirection = 'right'
          this[runOrWalk]("right")
        } else {
          this.idle()
        }
      }
    }

    this.levelUpParticleEmitter.setPosition(this.sprites.hero.x, this.sprites.hero.y)
  }
}
