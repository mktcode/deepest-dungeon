import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import LightManager from "../light-manager.js";
import PathFinder from 'pathfinding'
import TILES from "../tile-mapping.js";
import COLLISION_CATEGORIES from "../collision-categories.js";
import TEXTS from "../texts.js";
import Fireball from "./fireball.js";

export default class Hero {
  constructor(scene, x, y) {
    this.scene = scene

    this.keys = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })

    this.attacking = false
    this.underAttack = false
    this.targetedEnemy = null
    this.burning = false
    this.dead = false
    this.lastDirection = 'down'
    this.shieldActive = false
    this.speed = 2
    this.speedBoost = false
    this.fireballs = []

    this.addToScene(x, y)
    this.prepareShield()
    this.prepareLevelUpAnimation()
    this.prepareSpeedBoostAnimation()
    this.addControls()

    this.runningSound = this.scene.sounds.play('running', 0, false, true, 0)
    this.walkingSound = this.scene.sounds.play('walking', 0, false, true, 0)
  }

  addControls() {
    // move by click and spell attack
    this.scene.input.on('pointerdown', (pointer, currentlyOver) => {
      const targetedEnemy = currentlyOver.find(co => ['spider', 'zombie'].includes(co.getData('name')))
      if (pointer.leftButtonDown()) {
        if (targetedEnemy) {
          this.moveTo = null
          this.targetedEnemy = targetedEnemy
        } else {
          this.targetedEnemy = null
          this.moveTo = this.scene.findClosestWalkablePoint(pointer.worldX, pointer.worldY)
        }
      } else if (pointer.rightButtonDown() && this.canCastFireball()) {
        let target = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
        let from = new Phaser.Math.Vector2(this.container.x, this.container.y)

        this.lastDirection = this.scene.getDirectionFromVector(target.clone().subtract(from))

        if (targetedEnemy) {
          target = targetedEnemy
        }

        const newFireball = new Fireball(this.scene, target, this)

        const anim = this.castSpellAnimation()
        anim.on('complete', () => {
          newFireball.animationComplete = true
        })

        this.fireballs.push(newFireball)
      }
    })

    this.scene.input.on('pointerup', (pointer, currentlyOver) => {
      if (pointer.rightButtonReleased() && this.getLastFireball()) {
        const targetedEnemy = currentlyOver.find(co => ['spider', 'zombie'].includes(co.getData('name')))
        if (targetedEnemy) {
          this.getLastFireball().target = targetedEnemy
        }
        this.getLastFireball().rightButtonReleased = true
      }
    })

    // attack
    this.keys.space.on('down', () => {
      this.doAttack()
    })

    // shield
    this.keys.shift.on('down', () => {
      if (this.dead) return

      this.useShield()
    })

    // use
    this.scene.input.keyboard.on('keyup-E', () => {
      if (this.dead) return

      this.useStairs()
      this.useShrine()
      this.improveSkill()
    })

    // show path
    this.scene.input.keyboard.on('keyup-Q', () => {
      if (this.dead) return

      this.usePathfinder()
    })
  }

  canCastFireball() {
    return (
      (!this.getLastFireball() || this.getLastFireball().isReleased()) &&
      this.scene.registry.get('mana') &&
      this.scene.registry.get('items').includes('fireball')
    )
  }

  getLastFireball() {
    return this.fireballs[this.fireballs.length - 1]
  }

  doAttack() {
    if (this.dead) return
    if (this.attacking) return

    const gui = this.scene.scene.get('Gui')
    if (gui.subtitle.text === TEXTS.SPACE_TO_ATTACK) {
      gui.showSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 3))
    }
    this.attacking = true
    this.attack(this.lastDirection).once('complete', () => {
      this.attacking = false
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
      this.shieldActive = new Date().getTime()
      this.shieldParticles.start()
      this.shieldParticles2.start()
      this.scene.lightManager.lights.push({
        key: 'shield',
        x: () => this.scene.worldToTileX(this.container.x),
        y: () => this.scene.worldToTileX(this.container.y),
        intensity: () => LightManager.flickering(1)
      })
      this.scene.time.delayedCall(this.scene.registry.get('shieldDuration') * 1000, () => {
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
      Bodies.rectangle(16, 12, 24, 16, { isSensor: true, angle: -2.5, label: 'punch-down-right' })
    ] })
    this.container
      .setExistingBody(compoundBody)
      .setCollisionCategory(COLLISION_CATEGORIES.HERO)
      .setCollidesWith([COLLISION_CATEGORIES.WALL, COLLISION_CATEGORIES.ENEMY, COLLISION_CATEGORIES.TIMEBOMB])
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

    this.sprite.anims.play(name + '-' + withSword + direction + slowmo, true)
    return this.scene.anims.get(name + '-' + withSword + direction + slowmo)
  }

  updateSubtitles() {
    const gui = this.scene.scene.get('Gui')
    if (gui.subtitle.text === TEXTS.WASD_TO_MOVE) {
      gui.hideSubtitle(TEXTS.WASD_TO_MOVE)
      gui.showSubtitle(TEXTS.FIND_THE_STAIRS)
      this.scene.time.delayedCall(10000, () => {
        if (gui.subtitle.text === TEXTS.FIND_THE_STAIRS) {
          gui.hideSubtitle(TEXTS.FIND_THE_STAIRS)
        }
      })
    }
  }

  move(direction) {
    this.updateSubtitles()

    this.lastDirection = direction
    this.run(direction)

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
    this.updateSubtitles()

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

    if (this.targetedEnemy && Phaser.Math.Distance.Between(x, y, this.container.x, this.container.y) < 30) {
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
          this.run(this.lastDirection)
          this.playWalkingSound()
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
    if (this.speedBoost) speed *= 1.5

    if (this.scene.narrator.slowmo) speed *= 0.3
    if (this.scene.narrator.forceWalk) speed *= 0.5
    if (this.scene.narrator.freeze || this.container.body.isStatic || this.attacking) speed = 0

    return speed
  }

  setSpeedBoost(active) {
    if (this.speedBoost !== active) {
      this.speedBoost = active
      if (this.speedBoost) this.speedBoostAnimation.start()
      else this.speedBoostAnimation.stop()
    }
  }

  idle(direction) {
    const now = new Date().getTime() / 1000
    if (now - this.scene.idleTimer > 5 && !Math.floor((now - this.scene.idleTimer) % 10)) {
      this.looking = true
    }
    if (this.looking) {
      const anim = this.lookAround()
      anim.on('complete', () => this.looking = false)
      return anim
    } else {
      return this.playAnim('idle', direction)
    }
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

  lookAround(direction) {
    return this.playAnim('look-around', direction)
  }

  castSpellAnimation(direction) {
    return this.playAnim('start-cast-spell', direction)
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
    this.scene.flashSprite(this.sprite)
    this.scene.popupDamageNumber(damage, this.container.x, this.container.y, '#CC0000')

    if (heroHp <= 0) {
      this.die()
      this.scene.sounds.play('die')
      this.runningSound.setVolume(0)
      this.walkingSound.setVolume(0)
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
    return this.keys[direction].isDown || this.wasdKeys[direction].isDown
  }

  isCasting() {
    return this.getLastFireball() && !this.getLastFireball().isReleased()
  }

  update() {
    // Stop any previous movement from the last frame
    this.container.setVelocity(0)
    // stop sound from last frame
    this.runningSound.setVolume(0)
    this.walkingSound.setVolume(0)

    this.fireballs.forEach(fireball => fireball.update())

    if (this.dead || this.attacking || this.isCasting()) return

    if (!this.scene.narrator.freeze && !this.container.body.isStatic) {
      const directions = []
      if (this.isDirectionKeyDown('up')) directions.push('up')
      else if (this.isDirectionKeyDown('down')) directions.push('down')
      if (this.isDirectionKeyDown('left')) directions.push('left')
      else if (this.isDirectionKeyDown('right')) directions.push('right')

      const hasSpeedBoost = this.scene.dungeonNumber < this.scene.registry.get('playersDeepestDungeon')

      if (directions.length) {
        this.moveTo = null
        this.targetedEnemy = null
        this.move(directions.join('-'))
        this.setSpeedBoost(hasSpeedBoost)
      } else if (this.moveTo) {
        this.moveToXY(this.moveTo.x, this.moveTo.y)
        this.setSpeedBoost(hasSpeedBoost)
      } else if (this.targetedEnemy) {
        this.moveToXY(this.targetedEnemy.x, this.targetedEnemy.y)
        this.setSpeedBoost(hasSpeedBoost)
      } else {
        this.idle()
        this.setSpeedBoost(false)
      }
    }
  }
}
