import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import LightManager from "../light-manager.js";
import TILES from "../tile-mapping.js";
import COLLISION_CATEGORIES from "../collision-categories.js";
import TEXTS from "../texts.js";

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
    this.shieldActive = false

    this.addToScene(x, y)
    this.prepareShield()
    this.prepareLevelUpAnimation()
    this.prepareSpeedBoostAnimation()

    this.keys.shift.on('down', () => {
      this.useShield()
    })

    // attack
    this.keys.space.on('down', () => {
      if (!this.attacking) {
        const gui = this.scene.scene.get('Gui')
        if (gui.subtitle.text === TEXTS.SPACE_TO_ATTACK) {
          gui.showSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 3))
        }
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

    this.scene.sounds.play('running', 0, false, true)
    this.scene.sounds.play('walking', 0, false, true)
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

  prepareShield() {
    this.shieldParticle = this.scene.add.particles('particle')
    this.container.add(this.shieldParticle)
    this.shieldParticles = this.shieldParticle.createEmitter({
      on: false,
      y: 10,
      tint: [0x0088FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.5 },
      alpha: (particle, key, time, value) => {
        if (time > 0.5) {
          particle.accelerationY = 50
          if (particle.x < 0) {
            particle.accelerationX = 100
          } else {
            particle.accelerationX = -100
          }
        } else {
          particle.accelerationX = 0
          particle.accelerationY = -100
        }
        return Math.min(1 - time)
      },
      frequency: 50,
      speed: 20,
      lifespan: 1000,
      quantity: 20,
      angle: { min: 180, max: 360 },
      emitZone: {
        source: new Phaser.Geom.Ellipse(0, 0, 100, 50),
        type: 'edge',
        quantity: 18
      }
    })
    this.shieldParticle2 = this.scene.add.particles('particle')
    this.container.add(this.shieldParticle2)
    this.container.sendToBack(this.shieldParticle2)
    this.shieldParticles2 = this.shieldParticle2.createEmitter({
      on: false,
      y: 10,
      tint: [0x0088FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.5 },
      frequency: 50,
      speed: 5,
      lifespan: 500,
      quantity: 40,
      angle: { min: 180, max: 360 },
      emitZone: {
        source: new Phaser.Geom.Ellipse(0, 0, 100, 50),
        type: 'edge',
        quantity: 18
      }
    })
  }

  useShield() {
    const currentMana = this.scene.registry.get('mana')
    if (this.scene.registry.get('items').includes('shield') && !this.shieldActive && currentMana) {
      this.scene.registry.set('mana', currentMana - 1)
      this.shieldActive = true
      this.shieldParticles.start()
      this.shieldParticles2.start()
      this.scene.lightManager.lights.push({
        key: 'shield',
        x: () => this.scene.worldToTileX(this.container.x),
        y: () => this.scene.worldToTileX(this.container.y),
        intensity: () => LightManager.flickering(1)
      })
      this.scene.time.delayedCall(3000, () => {
        this.shieldActive = false
        this.shieldParticles.stop()
        this.shieldParticles2.stop()
        this.scene.lightManager.removeLightByKey('shield')
      })
    }
  }

  useStairs() {
    if (this.scene.narrator.playing && this.scene.narrator.blockStairs) return
    if (this.isNear([
      ...TILES.STAIRS.OPEN[0],
      ...TILES.STAIRS.OPEN[1],
      ...TILES.STAIRS.OPEN[2],
      ...TILES.STAIRS.OPEN[3],
      ...TILES.STAIRS.OPEN[4]
    ])) {
      this.freeze()
      this.scene.scene.get('Gui').hideSubtitle(TEXTS.E_TO_USE_STAIRS)
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
      this.scene.scene.get('Gui').hideSubtitle(TEXTS.E_TO_ACTIVATE_CHECKPOINT)
      const healthDiff = this.scene.registry.get('maxHealth') - this.scene.registry.get('health')
      if (healthDiff) {
        for (let i = 0; i < healthDiff; i++) {
          this.scene.emitHealthOrb(
            this.scene.tileToWorldX(this.scene.safeRoom.centerX),
            this.scene.tileToWorldY(this.scene.safeRoom.centerY),
            true
          )
        }
      }
      const manaDiff = this.scene.registry.get('maxMana') - this.scene.registry.get('mana')
      if (manaDiff) {
        for (let i = 0; i < manaDiff; i++) {
          this.scene.emitManaOrb(
            this.scene.tileToWorldX(this.scene.safeRoom.centerX),
            this.scene.tileToWorldY(this.scene.safeRoom.centerY),
            true
          )
        }
      }
    }
  }

  prepareSpeedBoostAnimation() {
    this.speedBoostAnimation = this.scene.interactionParticle.createEmitter({
      on: false,
      blendMode: 'SCREEN',
      scale: { start: 0.7, end: 0.2 },
      alpha: { start: 1, end: 0 },
      speed: 75,
      quantity: 2,
      frequency: 50,
      lifespan: 300,
      follow: this.container,
      angle: (particle) => {
        if (this.lastDirection === 'up-left') {
          return 45
        }
        if (this.lastDirection === 'up') {
          return 90
        }
        if (this.lastDirection === 'up-right') {
          return 135
        }
        if (this.lastDirection === 'right') {
          return 180
        }
        if (this.lastDirection === 'down-right') {
          return 225
        }
        if (this.lastDirection === 'down') {
          return 270
        }
        if (this.lastDirection === 'down-left') {
          return 315
        }
        if (this.lastDirection === 'left') {
          return 360
        }
        return 0
      },
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 10),
        type: 'random',
        quantity: 2
      }
    })
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
      this.scene.worldToTileX(this.container.x) - 2,
      this.scene.worldToTileY(this.container.y) - 2,
      5, 5
    )

    return tiles.find(tile => tileNumbers.includes(tile.index))
  }

  addToScene(x, y) {
    this.container = this.scene.add.container(x, y).setDepth(6)
    this.scene.matter.add.gameObject(this.container)

    this.sprites.hero = this.scene.add.sprite(0, -10, 'sprites', 'hero/with-weapon/walk/down/1')
    this.container.add(this.sprites.hero)

    const { Body, Bodies } = Phaser.Physics.Matter.Matter
    const compoundBody = Body.create({ parts: [
      // hero
      Bodies.rectangle(0, 0, 16, 18, { chamfer: { radius: 10 }, collisionFilter: { category: COLLISION_CATEGORIES.HERO, mask: COLLISION_CATEGORIES.WALL & COLLISION_CATEGORIES.ENEMY } }),
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
    this.container
      .setExistingBody(compoundBody)
      .setFixedRotation()
      .setFriction(20)
      .setPosition(x, y)
      .setDepth(6)
    this.scene.cameras.main.startFollow(this.container, true, 0.1, 0.1)
  }

  prepareLevelUpAnimation() {
    this.levelUpParticle = this.scene.add.particles('particle').setDepth(7)
    this.container.add(this.levelUpParticle)
    this.levelUpParticleEmitter = this.levelUpParticle.createEmitter({
      tint: [0xFF00FF, 0x0088FF, 0xFF00FF, 0x0088FF, 0xFFFFFF],
      on: false,
      x: 0,
      y: 5,
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.5 },
      alpha: { start: 1, end: 0 },
      speed: 60,
      quantity: 40,
      frequency: 100,
      lifespan: 1800,
    })
    this.levelUpParticleWell = this.levelUpParticle.createGravityWell({
        x: 0,
        y: -20,
        power: 1,
        epsilon: 100,
        gravity: 40
    });
  }

  levelUpAnimation() {
    this.scene.sounds.play('levelUp')
    this.levelUpParticleEmitter.start()
    this.scene.lightManager.lights.push({
      key: 'levelUp',
      x: () => this.scene.worldToTileX(this.container.x),
      y: () => this.scene.worldToTileY(this.container.y),
      intensity: () => LightManager.flickering(1)
    })
    this.scene.time.delayedCall(2000, () => {
      this.levelUpParticleEmitter.stop()
      this.scene.time.delayedCall(1000, () => {
        this.scene.lightManager.removeLightByKey('levelUp')
      })
    })
  }

  jumpTo(x, y) {
    this.container.setX(x).setY(y)
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
    this.scene.startIdleTimer()
    this.scene.playIdleNarrativeFollowUp()
    return this.playAnim('walk', direction)
  }

  run(direction) {
    this.scene.startIdleTimer()
    this.scene.playIdleNarrativeFollowUp()
    return this.playAnim('run', direction)
  }

  attack(direction) {
    this.scene.startIdleTimer()
    this.scene.registry.get('weapon')
      ? this.scene.sounds.play('attackSound', 0, this.scene.narrator.slowmo)
      : this.scene.sounds.play('attackPunchSound', 0, this.scene.narrator.slowmo)
    return this.playAnim('attack', direction)
  }

  die(direction) {
    this.scene.startIdleTimer()
    return this.playAnim('die', direction)
  }

  playHitSound() {
    this.scene.sounds.play(
      this.scene.registry.get('weapon') ? 'attackHitSound' : 'attackPunchHitSound',
      0,
      this.scene.narrator.slowmo)
  }

  getDamagingAttackFrames() {
    return this.scene.registry.get('weapon') ? [12, 13, 14, 15, 16] : [5, 6]
  }

  takeDamage(damage) {
    let heroHp = this.scene.registry.get('health')
    heroHp -= damage
    this.scene.registry.set('health', heroHp)
    this.scene.flashSprite(this.sprites.hero)
    this.scene.popupDamageNumber(damage, this.container.x, this.container.y, '#CC0000')
    this.scene.scene.get('Gui').playHealthAnimation()

    if (heroHp <= 0) {
      this.die()
      this.scene.sounds.play('die')
      this.scene.sounds.running.setVolume(0)
      this.scene.sounds.walking.setVolume(0)
      this.freeze()
      this.dead = true
      const lastLevelXp = this.constructor.getXpForLevelUp(this.scene.registry.get('level'))
      const lostXp = this.scene.registry.get('xp') - lastLevelXp
      for (let i = 0; i < lostXp; i++) {
        this.scene.emitXpOrb(this.container.x, this.container.y, false)
      }
      this.scene.registry.set('xp', lastLevelXp)
      this.scene.cameras.main.fadeOut(2000, 0, 0, 0, (camera, progress) => {
        if (progress === 1) {
          this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
          this.scene.scene.sleep()
          this.scene.scene.wake('Dungeon' + this.scene.registry.get('minDungeon'))
        }
      })
    } else {
      this.scene.sounds.play('takeHit')
    }

    this.scene.time.delayedCall(1500, () => {
      this.underAttack = false
      this.burning = false
    })
  }

  freeze() {
    this.container.body.isStatic = true
  }

  unfreeze() {
    this.container.body.isStatic = false
  }

  isDirectionKeyDown(direction) {
    return this.keys[direction].isDown || this.wasdKeys[direction].isDown || this.joystickCursorKeys[direction].isDown
  }

  update() {
    if (!this.dead) {
      // Stop any previous movement from the last frame
      this.container.setVelocity(0)
      this.scene.sounds.running.setVolume(0)
      this.scene.sounds.walking.setVolume(0)

      const runOrWalk = this.scene.narrator.forceWalk ? 'walk' : 'run'

      this.baseSpeed = 2
      if (this.scene.dungeonVisits > 1 && this.scene.dungeonNumber !== this.scene.registry.get('playersDeepestDungeon')) {
        this.baseSpeed = 3
        if (!this.speedBoostAnimation.on) {
          this.speedBoostAnimation.start()
        }
      } else {
        if (this.speedBoostAnimation.on) {
          this.speedBoostAnimation.stop()
        }
      }

      if (this.scene.narrator.slowmo) this.baseSpeed = 0.6
      if (this.scene.narrator.freeze || this.container.body.isStatic || this.attacking) this.baseSpeed = 0

      if (runOrWalk === 'walk') this.baseSpeed /= 2

      // Horizontal movement
      const sound = runOrWalk === 'run' ? this.scene.sounds.running : this.scene.sounds.walking
      if (this.isDirectionKeyDown('left')) {
        this.container.setVelocityX(-this.baseSpeed);
      } else if (this.isDirectionKeyDown('right')) {
        this.container.setVelocityX(this.baseSpeed);
      }

      // Vertical movement
      if (this.isDirectionKeyDown('up')) {
        this.container.setVelocityY(-this.baseSpeed);
      } else if (this.isDirectionKeyDown('down')) {
        this.container.setVelocityY(this.baseSpeed);
      }

      // movement sound
      if (
        this.isDirectionKeyDown('left') ||
        this.isDirectionKeyDown('right') ||
        this.isDirectionKeyDown('up') ||
        this.isDirectionKeyDown('down')
      ) {
        sound.setVolume(this.baseSpeed ? 0.15 : 0)
      }

      // Normalize and scale the velocity so that sprite can't move faster along a diagonal
      const vector = new Phaser.Math.Vector2(this.container.body.velocity)
      vector.normalize().scale(this.baseSpeed)
      this.container.setVelocity(vector.x, vector.y);

      // Update the animation last and give left/right/down animations precedence over up animations
      // Do nothing if slashing animation is playing
      if (!this.attacking) {
        if (!this.container.body.isStatic && !this.scene.narrator.freeze) {
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
  }
}
