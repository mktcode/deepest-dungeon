import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import LightManager from "../light-manager.js";
import PathFinder from 'pathfinding'
import TILES from "../tile-mapping.js";
import COLLISION_CATEGORIES from "../collision-categories.js";
import TEXTS from "../texts.js";
import Fireball from "./fireball.js";

export default class CharacterBase {
  constructor(scene, room) {
    this.scene = scene
    this.room = room

    this.runOrWalk = 'run'

    this.level = 1
    this.xp = 0
    this.health = 5
    this.maxHealth = 5
    this.mana = 5
    this.maxMana = 5
    this.damage = 1
    this.items = []
    this.torchIntensity = 1
    this.torchDuration = 60
    this.shieldDamage = 0
    this.shieldDuration = 10
    this.fireballSize = 1
    this.speed = 2

    this.isAttacking = false
    this.isUnderAttack = false
    this.isBurning = false
    this.isDead = false
    this.isMoving = false
    this.isLookingAround = false
    this.isShieldActive = false
    this.isSpeedBoostActive = false

    this.idleTimer = new Date().getTime()
    this.lastDirection = 'down'
    this.blockedDirections = []
    this.fireballs = []
    this.targetedEnemy = null

    this.addToScene()
    this.prepareShield()
    this.prepareLevelUpAnimation()
    this.prepareSpeedBoostAnimation()
    this.startIdleTimer()
    this.startLookAroundInterval()

    this.runningSound = this.scene.sounds.play('running', 0, false, true, 0)
    this.walkingSound = this.scene.sounds.play('walking', 0, false, true, 0)
  }

  get(key) {
    return this[key]
  }

  set(key, val) {
    this[key] = val
  }

  changeHealth(amount) {
    this.set('health', this.get('health') + amount)
  }

  changeMana(amount) {
    this.set('mana', this.get('mana') + amount)
  }

  addItem(item) {
    this.set('items', this.get('items').push(item))
  }

  doAttack() {
    if (this.isDead) return
    if (this.isAttacking) return

    this.isAttacking = true
    this.attack(this.lastDirection).once('complete', () => {
      this.isAttacking = false
    })
  }

  static getLevelByXp(xp) {
    // required xp for level up: current level * 50
    // https://gamedev.stackexchange.com/questions/110431/how-can-i-calculate-current-level-from-total-xp-when-each-level-requires-propor
    return Math.floor((1 + Math.sqrt(1 + 8 * xp / 50)) / 2)
  }

  static getXpForLevelUp(level) {
    return ((Math.pow(level, 2) - level) * 50) / 2
  }

  addItem(item) {
    this.items.push(item)
  }

  getItems() {
    return this.items
  }

  hasItem(item) {
    return this.getItems().includes(item)
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
        source: new Phaser.Geom.Ellipse(0, 0, 80, 40),
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
        source: new Phaser.Geom.Ellipse(0, 0, 80, 40),
        type: 'edge',
        quantity: 18
      }
    })
  }

  useShield() {
    if (this.hasItem('shield') && !this.isShieldActive && this.get('mana')) {
      this.changeMana(-1)
      this.isShieldActive = new Date().getTime()
      this.shieldParticles.start()
      this.shieldParticles2.start()
      this.scene.lightManager.lights.push({
        key: 'shield',
        x: () => this.scene.worldToTileX(this.container.x),
        y: () => this.scene.worldToTileX(this.container.y),
        intensity: () => LightManager.flickering(1)
      })
      this.scene.time.delayedCall(this.get('shieldDuration') * 1000, () => {
        this.isShieldActive = false
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
      const healthDiff = this.get('maxHealth') - this.get('health')
      if (healthDiff) {
        for (let i = 0; i < healthDiff; i++) {
          this.scene.emitHealthOrb(
            this.scene.tileToWorldX(this.scene.safeRoom.centerX),
            this.scene.tileToWorldY(this.scene.safeRoom.centerY),
            true
          )
        }
      }
      const manaDiff = this.get('maxMana') - this.get('mana')
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
        if (this.lastDirection === 'up-left') return 45
        if (this.lastDirection === 'up') return 90
        if (this.lastDirection === 'up-right') return 135
        if (this.lastDirection === 'right') return 180
        if (this.lastDirection === 'down-right') return 225
        if (this.lastDirection === 'down') return 270
        if (this.lastDirection === 'down-left') return 315
        if (this.lastDirection === 'left') return 360
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
      if (this.get('skillPoints') > this.get('skillPointsSpent')) {
        if (this.scene.worldToTileX(this.scene.healthSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.sounds.play('skillUp')
          this.set('skillPointsSpent', this.get('skillPointsSpent') + 1)
          this.set('maxHealth', this.get('maxHealth') + 1)
          this.set('health', this.get('maxHealth'))
        }
        if (this.scene.worldToTileX(this.scene.damageSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.sounds.play('skillUp')
          this.set('skillPointsSpent', this.get('skillPointsSpent') + 1)
          this.set('damage', this.get('damage') + 1)
        }
        if (this.scene.worldToTileX(this.scene.torchSkillParticles.x.propertyValue) === xPosition + 1) {
          this.scene.sounds.play('skillUp')
          this.set('skillPointsSpent', this.get('skillPointsSpent') + 1)
          this.set('torchDuration', this.get('torchDuration') + 30)
          this.set('torchIntensity', this.get('torchIntensity') + 1)
        }
      }
    }
  }

  usePathfinder() {
    console.log('test')
    if (
      this.hasItem('pathfinder') && !this.get('pathfinderCooldown')
    ) {
      this.scene.showPath(this.container)
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

  addToScene() {
    const x = this.scene.tileToWorldX(this.room.centerX) + 16
    const y = this.scene.tileToWorldY(this.room.centerY) + 19

    this.container = this.scene.add.container(x, y)
    this.scene.matter.add.gameObject(this.container)

    this.sprite = this.scene.add.sprite(0, -10, 'sprites', 'hero/with-weapon/walk/down/1')
    this.container.add(this.sprite)

    const { Body, Bodies } = Phaser.Physics.Matter.Matter
    const compoundBody = Body.create({ parts: [
      // hero
      Bodies.rectangle(0, 0, 16, 18, { chamfer: { radius: 8 } }),
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
      Bodies.rectangle(16, 12, 24, 16, { isSensor: true, angle: -2.5, label: 'punch-down-right' }),
      // wall sensors
      Bodies.rectangle(0, -10, 16, 5, { isSensor: true, label: 'wall-up' }),
      Bodies.rectangle(0, 10, 16, 5, { isSensor: true, label: 'wall-down' }),
      Bodies.rectangle(-10, 0, 5, 16, { isSensor: true, label: 'wall-left' }),
      Bodies.rectangle(10, 0, 5, 16, { isSensor: true, label: 'wall-right' }),
    ] })
    this.container
      .setExistingBody(compoundBody)
      .setCollisionCategory(COLLISION_CATEGORIES.HERO)
      .setCollidesWith([COLLISION_CATEGORIES.WALL, COLLISION_CATEGORIES.HERO, COLLISION_CATEGORIES.ENEMY, COLLISION_CATEGORIES.TIMEBOMB])
      .setFixedRotation()
      .setFriction(20)
      .setPosition(x, y)

    // hero touches wall -> stop movement in that direction (matter js issue workaround)
    this.scene.matterCollision.addOnCollideStart({
      objectA: this.container,
      objectB: this.scene.walls,
      callback: (collision) => {
        if (collision.bodyA.isSensor && collision.bodyA.label.startsWith('wall-')) {
          this.blockedDirections.push(collision.bodyA.label.replace('wall-', ''))
        }
      }
    })
    this.scene.matterCollision.addOnCollideEnd({
      objectA: this.container,
      objectB: this.scene.walls,
      callback: (collision) => {
        if (collision.bodyA.isSensor && collision.bodyA.label.startsWith('wall-')) {
          this.blockedDirections = this.blockedDirections.filter(d => d !== collision.bodyA.label.replace('wall-', ''))
        }
      }
    })

    // light
    this.scene.lightManager.lights.push({
      sprite: this.container,
      intensity: () => {
        const torches = this.get('items').filter(item => item === 'torch')

        if (torches && torches.length) {
          return LightManager.flickering((this.get('torchIntensity') - 1) / 2 + torches.length - 0.5)
        }
        return 0
      }
    })
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
    const withSword = this.hasItem('sword') ? 'with-sword-': ''

    this.sprite.anims.play(name + '-' + withSword + direction + slowmo, true)

    return this.scene.anims.get(name + '-' + withSword + direction + slowmo)
  }

  move(direction) {
    this.lastDirection = direction
    if (this.runOrWalk === 'walk') {
      this.walk(direction)
    } else {
      this.run(direction)
    }

    // horizontal
    if (['left', 'up-left', 'down-left'].includes(direction)) {
      this.container.setVelocityX(-this.getSpeed())
    } else if (['right', 'up-right', 'down-right'].includes(direction)) {
      this.container.setVelocityX(this.getSpeed())
    }

    // vertical
    if (['up', 'up-left', 'up-right'].includes(direction)) {
      this.container.setVelocityY(-this.getSpeed())
    } else if (['down', 'down-left', 'down-right'].includes(direction)) {
      this.container.setVelocityY(this.getSpeed())
    }

    this.normalizeSpeed()

    this.playWalkingSound()
  }

  moveToXY(x, y) {
    // pixel distance
    const pixelFromVector = new Phaser.Math.Vector2({ x: this.container.x, y: this.container.y })
    const pixelTargetVector = new Phaser.Math.Vector2({ x: x, y: y })
    const pixelDistance = pixelFromVector.distance(pixelTargetVector)

    // tilebased pathfinding
    const finder = new PathFinder.AStarFinder({ allowDiagonal: true, dontCrossCorners: true })
    const tileFromVector = new Phaser.Math.Vector2({ x: this.scene.worldToTileX(this.container.x), y: this.scene.worldToTileY(this.container.y) })
    const tileTargetVector = new Phaser.Math.Vector2({ x: this.scene.worldToTileX(x), y: this.scene.worldToTileY(y) })
    const path = finder.findPath(
      tileFromVector.x,
      tileFromVector.y,
      tileTargetVector.x,
      tileTargetVector.y,
      this.scene.getPathGrid()
    )

    if (this.targetedEnemy && Phaser.Math.Distance.Between(x, y, this.container.x, this.container.y) < (this.hasItem('sword') ? 40 : 30)) {
      const direction = this.scene.getDirectionFromVector({ x: this.targetedEnemy.x - this.container.x, y: this.targetedEnemy.y - this.container.y })
      this.lastDirection = direction
      this.doAttack()
    } else {
      let diff = null
      if (path.length > 1) {
        const nextTileTargetVector = new Phaser.Math.Vector2({ x: path[1][0], y: path[1][1] })
        diff = nextTileTargetVector.subtract(tileFromVector)
      } else if (pixelDistance > 6) { // arbitrary value to avoid overshooting and wiggeling
        diff = pixelTargetVector.subtract(pixelFromVector)
      }

      // set velocity based on diff vector
      if (diff) {
        if (Math.abs(diff.x)) {
          this.container.setVelocityX(diff.x > 0 ? this.getSpeed() : -this.getSpeed())
        }
        if (Math.abs(diff.y)) {
          this.container.setVelocityY(diff.y > 0 ? this.getSpeed() : -this.getSpeed())
        }

        this.normalizeSpeed()

        const direction = this.scene.getDirectionFromVector(this.container.body.velocity)
        if (direction) {
          this.setLastDirectionDelayed(direction)
          this.playWalkingSound()
          if (this.runOrWalk === 'walk') {
            this.walk(this.lastDirection)
          } else {
            this.run(this.lastDirection)
          }
        }
      } else {
        this.moveTo = null
      }
    }
  }

  setLastDirectionDelayed(direction) {
    if (!this.lastDirectionLastSet || new Date().getTime() - this.lastDirectionLastSet.getTime() > 100) {
      this.lastDirectionLastSet = new Date()
      this.lastDirection = direction
    }
  }

  playWalkingSound() {
    this.scene.narrator.forceWalk
      ? this.walkingSound.setVolume(this.speed ? 0.15 : 0)
      : this.runningSound.setVolume(this.speed ? 0.15 : 0)
  }

  normalizeSpeed() {
    // Normalize and scale the velocity so that sprite can't move faster along a diagonal
    const vector = new Phaser.Math.Vector2(this.container.body.velocity)
    vector.normalize().scale(this.getSpeed())
    this.container.setVelocity(vector.x, vector.y)
  }

  getSpeed() {
    let speed = this.speed
    if (this.isSpeedBoostActive) speed *= 1.5

    if (this.scene.narrator.slowmo) speed *= 0.3
    if (this.scene.narrator.forceWalk || this.runOrWalk === 'walk') speed *= 0.5
    if (this.scene.narrator.freeze || this.container.body.isStatic || this.isAttacking) speed = 0

    return speed
  }

  setSpeedBoost(active) {
    if (this.isSpeedBoostActive !== active) {
      this.isSpeedBoostActive = active
      if (this.isSpeedBoostActive) this.speedBoostAnimation.start()
      else this.speedBoostAnimation.stop()
    }
  }

  startIdleTimer() {
    this.idleTimer = new Date().getTime() / 1000
  }

  idle(direction) {
    const now = new Date().getTime() / 1000

    if (this.isLookingAround) {
      const anim = this.lookAround()
      anim.on('complete', () => this.isLookingAround = false)
      return anim
    } else {
      return this.playAnim('idle', direction)
    }
  }

  walk(direction) {
    this.startIdleTimer()
    return this.playAnim('walk', direction)
  }

  run(direction) {
    this.startIdleTimer()
    return this.playAnim('run', direction)
  }

  attack(direction) {
    this.startIdleTimer()
    this.hasItem('sword')
      ? this.scene.sounds.play('attackSound', 0, this.scene.narrator.slowmo)
      : this.scene.sounds.play('attackPunchSound', 0, this.scene.narrator.slowmo)
    return this.playAnim('attack', direction)
  }

  die(direction) {
    this.startIdleTimer()
    return this.playAnim('die', direction)
  }

  lookAround(direction) {
    return this.playAnim('look-around', direction)
  }

  startLookAroundInterval() {
    this.scene.time.addEvent({
      delay: 10000,
      callback: () => {
        this.isLookingAround = true
      },
      loop: true
    })
  }

  castSpell(direction) {
    return this.playAnim('start-cast-spell', direction)
  }

  playHitSound() {
    this.scene.sounds.play(
      this.hasItem('sword') ? 'attackHitSound' : 'attackPunchHitSound',
      0,
      this.scene.narrator.slowmo)
  }

  getDamagingAttackFrames() {
    return this.hasItem('sword') ? [12, 13, 14, 15, 16] : [5, 6]
  }

  isPlayer() {
    return this.scene.hero === this
  }

  takeDamage(damage) {
    if (!this.isDead) {
      this.changeHealth(-damage)
      this.scene.flashSprite(this.sprite)
      const color = this.isPlayer() ? '#CC0000' : '#CCCCCC'
      this.scene.popupDamageNumber(damage, this.container.x, this.container.y, color)

      if (this.health <= 0) {
        this.die()
        this.scene.sounds.play('die')
        this.runningSound.setVolume(0)
        this.walkingSound.setVolume(0)
        this.freeze()
        this.isDead = true
        this.dropXp()
      } else {
        this.scene.sounds.play('takeHit')
      }

      this.scene.time.delayedCall(1500, () => {
        this.isUnderAttack = false
        this.isBurning = false
      })
    }
  }

  dropXp() {
    const lastLevelXp = this.constructor.getXpForLevelUp(this.get('level'))
    const lostXp = this.get('xp') - lastLevelXp

    // drop a maximum of 10 orbs and increase xp per orb instead to avoid too many light sources
    if (lostXp > 10) {
      for (let i = 0; i < 10; i++) {
        this.scene.emitXpOrb(this.container.x, this.container.y, !this.isPlayer(), lostXp / 10)
      }
    } else {
      for (let i = 0; i < lostXp; i++) {
        this.scene.emitXpOrb(this.container.x, this.container.y, !this.isPlayer(), 1)
      }
    }

    this.set('xp', lastLevelXp)
  }

  freeze() {
    this.container.body.isStatic = true
  }

  unfreeze() {
    this.container.body.isStatic = false
  }

  hasSpeedBoost() {
    return this.scene.dungeonNumber < this.get('playersDeepestDungeon')
  }

  handleAutoMovement() {
    if (!this.scene.narrator.freeze && !this.container.body.isStatic) {
      if (this.moveTo) {
        this.moveToXY(this.moveTo.x, this.moveTo.y)
        this.setSpeedBoost(this.hasSpeedBoost())
        this.isMoving = true
      } else if (this.targetedEnemy) {
        this.moveToXY(this.targetedEnemy.x, this.targetedEnemy.y)
        this.setSpeedBoost(this.hasSpeedBoost())
        this.isMoving = true
      }
    }
  }

  updateRoom() {
    const currentRoom = this.scene.dungeon.getRoomAt(
      this.scene.worldToTileX(this.container.x),
      this.scene.worldToTileY(this.container.y)
    )
    if (currentRoom && currentRoom !== this.room) {
      this.room = currentRoom
    }
  }

  update(callback) {
    this.updateRoom()
    // set depth based on y
    this.container.setDepth(this.scene.convertYToDepth(this.container.y, 6))
    // Stop any previous movement from the last frame
    this.isMoving = false
    this.container.setVelocity(0)
    // stop sound from last frame
    this.runningSound.setVolume(0)
    this.walkingSound.setVolume(0)
    // update fireballs
    this.fireballs.forEach(fireball => fireball.update())
    // don't do anything else if dead or currently attacking
    if (this.isDead || this.isAttacking || Fireball.isCasting(this)) return

    this.handleAutoMovement()

    if (callback) callback()

    if (!this.isMoving) {
      this.idle()
      this.setSpeedBoost(false)
    }
  }
}
