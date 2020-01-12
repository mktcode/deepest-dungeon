import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import TILES from "../tile-mapping.js";

// assets
import xpDust from "../assets/xp-dust.png";

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
      if (!this.attacking) {
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
  }

  static preload(scene) {
    scene.load.spritesheet(
      "xpDust",
      xpDust,
      {
        frameWidth: 52,
        frameHeight: 22
      }
    )
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
    if (this.scene.narrator.playing) return
    if (this.isNear([
      ...TILES.STAIRS.OPEN[0],
      ...TILES.STAIRS.OPEN[1],
      ...TILES.STAIRS.OPEN[2],
      ...TILES.STAIRS.OPEN[3],
      ...TILES.STAIRS.OPEN[4]
    ])) {
      const nextDungeon = this.scene.dungeonNumber + 1
      this.scene.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
        if (progress === 1) {
          this.scene.scene.sleep()
          if (this.scene.scene.get('Dungeon' + nextDungeon)) {
            this.scene.scene.wake('Dungeon' + nextDungeon)
          } else {
            this.scene.scene.add('Dungeon' + nextDungeon, new DungeonScene(nextDungeon), true)
            this.scene.scene.swapPosition('Gui', 'Dungeon' + nextDungeon);
          }
        }
      })
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
          this.scene.sounds.play('skillUp')
          this.scene.registry.set('skillPointsSpent', this.scene.registry.get('skillPointsSpent') + 1)
          this.scene.registry.set('maxHealth', this.scene.registry.get('maxHealth') + 1)
          this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
        }
        if (this.scene.worldToTileX(this.scene.damageSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.sounds.play('skillUp')
          this.scene.registry.set('skillPointsSpent', this.scene.registry.get('skillPointsSpent') + 1)
          this.scene.registry.set('damage', this.scene.registry.get('damage') + 1)
        }
        if (this.scene.worldToTileX(this.scene.torchSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.sounds.play('skillUp')
          this.scene.registry.set('skillPointsSpent', this.scene.registry.get('skillPointsSpent') + 1)
          this.scene.registry.set('torchDuration', this.scene.registry.get('torchDuration') + 30)
          this.scene.registry.set('torchIntensity', this.scene.registry.get('torchIntensity') + 1)
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
    this.sprites.hero = this.scene.matter.add.sprite(x, y, 'sprites', 'hero/with-weapon/walk/down/1')

    const { Body, Bodies } = Phaser.Physics.Matter.Matter
    const mainBody = Bodies.rectangle(0, 0, 16, 16, { chamfer: { radius: 10 } })
    const compoundBody = Body.create({ parts: [
      mainBody,
      // sword
      Bodies.rectangle(0, -28, 16, 30, { isSensor: true, label: 'up' }),
      Bodies.rectangle(0, 28, 16, 30, { isSensor: true, label: 'down' }),
      Bodies.rectangle(-32, 4, 45, 16, { isSensor: true, label: 'left' }),
      Bodies.rectangle(32, 4, 45, 16, { isSensor: true, label: 'right' }),
      Bodies.rectangle(-24, -10, 45, 16, { isSensor: true, angle: -2.5, label: 'up-left' }),
      Bodies.rectangle(24, -10, 45, 16, { isSensor: true, angle: 2.5, label: 'up-right' }),
      Bodies.rectangle(-24, 20, 45, 16, { isSensor: true, angle: 2.5, label: 'down-left' }),
      Bodies.rectangle(24, 20, 45, 16, { isSensor: true, angle: -2.5, label: 'down-right' }),
      // punch
      Bodies.rectangle(0, -20, 16, 16, { isSensor: true, label: 'punch-up' }),
      Bodies.rectangle(0, 20, 16, 16, { isSensor: true, label: 'punch-down' }),
      Bodies.rectangle(-22, 4, 24, 16, { isSensor: true, label: 'punch-left' }),
      Bodies.rectangle(22, 4, 24, 16, { isSensor: true, label: 'punch-right' }),
      Bodies.rectangle(-16, -12, 24, 16, { isSensor: true, angle: -2.5, label: 'punch-up-left' }),
      Bodies.rectangle(16, -12, 24, 16, { isSensor: true, angle: 2.5, label: 'punch-up-right' }),
      Bodies.rectangle(-16, 12, 24, 16, { isSensor: true, angle: 2.5, label: 'punch-down-left' }),
      Bodies.rectangle(16, 12, 24, 16, { isSensor: true, angle: -2.5, label: 'punch-down-right' })
    ] })
    this.sprites.hero
      .setExistingBody(compoundBody)
      .setOrigin(0.5, 0.6)
      .setFixedRotation()
      .setFriction(20)
      .setPosition(x, y)
      .setDepth(6)
    this.scene.cameras.main.startFollow(this.sprites.hero, true, 0.1, 0.1)
  }

  prepareLevelUpAnimation() {
    this.levelUpParticle = this.scene.add.particles('particle').setDepth(7)
    this.levelUpParticleEmitter = this.levelUpParticle.createEmitter({
      tint: [0xFF00FF, 0x0088FF, 0xFF00FF, 0x0088FF, 0xFFFFFF],
      on: false,
      x: this.sprites.hero.x,
      y: this.sprites.hero.y,
      blendMode: 'SCREEN',
      scale: { start: 0.5, end: 1 },
      alpha: { start: 1, end: 0 },
      speed: 50,
      quantity: 10,
      frequency: 100,
      lifespan: 1000,
    })
    this.levelUpParticleWell = this.levelUpParticle.createGravityWell({
        x: this.sprites.hero.x,
        y: this.sprites.hero.y - 20,
        power: 1,
        epsilon: 100,
        gravity: 50
    });
  }

  levelUpAnimation() {
    this.scene.sounds.play('levelUp')
    this.levelUpParticleEmitter.start()
    this.scene.lightManager.lights.push({
      key: 'levelUp',
      x: () => this.scene.worldToTileX(this.sprites.hero.x),
      y: () => this.scene.worldToTileY(this.sprites.hero.y),
      intensity: () => 1
    })
    this.scene.time.delayedCall(1000, () => {
      this.levelUpParticleEmitter.stop()
      this.scene.lightManager.removeLightByKey('levelUp')
    })
  }

  jumpTo(x, y) {
    this.sprites.hero.setX(x).setY(y)
  }

  playAnim(name, direction) {
    if (!direction) {
      direction = this.lastDirection
    }
    const slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    const withSword = this.scene.registry.get('weapon') ? 'with-sword-': ''

    this.sprites.hero.anims.play(name + '-' + withSword + direction + slowmo, true)
    return this.scene.anims.get(name + '-' + withSword + direction + slowmo)
  }

  idle(direction) {
    return this.playAnim('idle', direction)
  }

  walk(direction) {
    return this.playAnim('walk', direction)
  }

  run(direction) {
    return this.playAnim('run', direction)
  }

  attack(direction) {
    this.scene.registry.get('weapon')
      ? this.scene.sounds.play('attackSound', 0, this.scene.narrator.slowmo)
      : this.scene.sounds.play('attackPunchSound', 0, this.scene.narrator.slowmo)
    return this.playAnim('attack', direction)
  }

  playHitSound() {
    this.scene.sounds.play(
      this.scene.registry.get('weapon') ? 'attackHitSound' : 'attackPunchHitSound',
      0,
      this.scene.narrator.slowmo)
  }

  die(direction) {
    return this.playAnim('die', direction)
  }

  getDamagingAttackFrames() {
    return this.scene.registry.get('weapon') ? [12, 13, 14, 15, 16] : [5, 6]
  }

  takeDamage(damage) {
    const hero = this.sprites.hero
    let heroHp = this.scene.registry.get('health')
    heroHp -= damage
    this.scene.registry.set('health', heroHp)
    this.scene.flashSprite(hero)
    this.scene.popupDamageNumber(damage, hero.x, hero.y, '#CC0000')
    this.scene.scene.get('Gui').playHealthAnimation()

    if (heroHp <= 0) {
      this.die()
      this.freeze()
      this.dead = true
      this.scene.cameras.main.fadeOut(2000, 0, 0, 0)
      this.scene.time.delayedCall(2000, () => {
        const x = hero.x
        const y = hero.y
        const lastLevelXp = this.constructor.getXpForLevelUp(this.scene.registry.get('level'))
        const lostXp = this.scene.registry.get('xp') - lastLevelXp
        if (lostXp) {
          this.scene.addXpDust(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15), lostXp)
        }

        this.scene.registry.set('xp', lastLevelXp)
        this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
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

      const runOrWalk = this.keys.shift.isDown || this.scene.narrator.forceWalk ? 'walk' : 'run'
      this.baseSpeed = runOrWalk === 'run' ? 2 : 1
      if (this.attacking) this.baseSpeed *= 0.1
      if (this.scene.narrator.slowmo) {
        this.baseSpeed *= 0.3
      }
      if (this.scene.narrator.freeze) {
        this.baseSpeed *= 0
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
        if (!this.sprites.hero.body.isStatic && !this.scene.narrator.freeze) {
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
        } else {
          this.idle()
        }
      }
    }

    this.levelUpParticleEmitter.setPosition(this.sprites.hero.x, this.sprites.hero.y)
    this.levelUpParticleWell.x = this.sprites.hero.x
    this.levelUpParticleWell.y = this.sprites.hero.y - 20
  }
}
