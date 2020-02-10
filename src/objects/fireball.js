import Phaser from "phaser"
import LightManager from "../light-manager.js";
import COLLISION_CATEGORIES from "../collision-categories.js";

export default class Fireball {
  constructor(scene, target, caster) {
    this.scene = scene
    this.target = target
    this.caster = caster

    this.size = 1
    this.damage = 5
    this.animationComplete = false
    this.rightButtonReleased = false

    this.positionOffset = this.getPositionOffset(this.caster.lastDirection)

    this.container = this.scene.add.container(this.caster.container.x, this.caster.container.y)

    this.particle1 = this.scene.add.particles('particle')
    this.particle2 = this.scene.add.particles('particle')

    this.container.add(this.particle2)
    this.scene.matter.add.gameObject(this.container)

    this.container
      .setExistingBody(
        Phaser.Physics.Matter.Matter.Bodies.circle(
          this.caster.container.x + this.positionOffset.x,
          this.caster.container.y + this.positionOffset.y,
          5,
          { isSensor: true }
        )
      )
      .setFixedRotation()
      .setRotation(0)
      .setCollisionCategory(COLLISION_CATEGORIES.FIREBALL)
      .setCollidesWith([COLLISION_CATEGORIES.WALL, COLLISION_CATEGORIES.HERO, COLLISION_CATEGORIES.ENEMY])

    this.createEmitters()
    this.createCollisions()
    this.start()

    this.scene.registry.set('mana', this.scene.registry.get('mana') - 1)
  }

  createEmitters() {
    this.emitter1 = this.particle1.createEmitter({
      on: false,
      tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
      blendMode: 'SCREEN',
      scale: { start: 0.1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      speed: 5,
      quantity: 5,
      frequency: 50,
      lifespan: 1000,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 3),
        type: 'random',
        quantity: 10
      },
      follow: this.container
    })
    this.emitter2 = this.particle2.createEmitter({
      on: false,
      tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.3 },
      alpha: { start: 1, end: 0 },
      speed: 2,
      quantity: 5,
      frequency: 30,
      lifespan: 750,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 2),
        type: 'edge',
        quantity: 20
      }
    })
  }

  createCollisions() {
    this.scene.matterCollision.addOnCollideStart({
      objectA: this.container,
      objectB: this.scene.walls,
      callback: (collision) => {
        this.explode()
      }
    })

    this.getPotentialTargets().forEach(target => {
      this.scene.matterCollision.addOnCollideStart({
        objectA: this.container,
        objectB: target.container || target.sprite,
        callback: (collision) => {
          if (collision.bodyB.isSensor) return
          target.takeDamage(this.damage)
          const nearestTarget = this.findNearestTarget()
          if (nearestTarget && this.size > 1) {
            this.setSize(this.size - 1)
            this.target = nearestTarget
            this.scene.sounds.play('fireball')
          } else {
            this.explode()
          }
        }
      })
    })
  }

  findNearestTarget() {
    const targetsByDistance = this.getPotentialTargets().map(t => t.container || t.sprite).sort((a, b) => {
      const distanceA = Phaser.Math.Distance.Between(a.x, a.y, this.container.x, this.container.y)
      const distanceB = Phaser.Math.Distance.Between(b.x, b.y, this.container.x, this.container.y)
      return distanceA - distanceB
    })

    return targetsByDistance.length ? targetsByDistance[0] : null
  }

  getPotentialTargets() {
    const targets = [...this.scene.enemies.filter(e => !e.isDead)]

    if (this.caster !== this.scene.hero && !this.scene.hero.isDead) targets.push(this.scene.hero)
    if (this.scene.guard && this.caster !== this.scene.guard && !this.scene.guard.isDead) targets.push(this.scene.guard)

    return targets
  }

  start() {
    this.backgroundSound = this.scene.sounds.play('fireball2')
    this.scene.time.delayedCall(500, () => {
      this.emitter1.start()
      this.emitter2.start()
      this.scene.lightManager.lights.push({
        sprite: this.container,
        intensity: () => LightManager.flickering(1)
      })
      this.grow()
    })
  }

  grow() {
    this.scene.time.addEvent({
      delay: 500,
      repeat: 2,
      callback: () => {
        if (!this.isReleased()) {
          if (this.size === 1) {
            this.setSize(2)
          } else if (this.size === 2) {
            this.setSize(3)
          }
        }
      }
    })
  }

  setSize(size) {
    this.size = size
    if (this.size === 1) {
      this.emitter1.setEmitZone({
        source: new Phaser.Geom.Circle(0, 0, 3),
        type: 'random',
        quantity: 10
      })
      this.emitter1.setSpeed(5)
      this.emitter1.setQuantity(5)

      this.emitter2.setEmitZone({
        source: new Phaser.Geom.Circle(0, 0, 2),
        type: 'edge',
        quantity: 20
      })
      this.emitter2.setSpeed(2)
      this.emitter2.setQuantity(5)
      this.emitter2.setFrequency(30)
      this.emitter2.setLifespan(750)
      this.damage = 5
    }

    if (this.size === 2) {
      this.emitter1.setEmitZone({
        source: new Phaser.Geom.Circle(0, 0, 6),
        type: 'random',
        quantity: 40
      })
      this.emitter1.setSpeed(10)
      this.emitter1.setQuantity(10)

      this.emitter2.setEmitZone({
        source: new Phaser.Geom.Circle(0, 0, 4),
        type: 'edge',
        quantity: 40
      })
      this.emitter2.setSpeed(3)
      this.emitter2.setQuantity(8)
      this.emitter2.setFrequency(10)
      this.emitter2.setLifespan(750)
      this.damage = 10
    }

    if (this.size === 3) {
      this.emitter1.setEmitZone({
        source: new Phaser.Geom.Circle(0, 0, 10),
        type: 'random',
        quantity: 80
      })
      this.emitter1.setSpeed(15)
      this.emitter1.setQuantity(15)

      this.emitter2.setEmitZone({
        source: new Phaser.Geom.Circle(0, 0, 6),
        type: 'edge',
        quantity: 80
      })
      this.emitter2.setSpeed(5)
      this.emitter2.setQuantity(10)
      this.emitter2.setFrequency(8)
      this.emitter2.setLifespan(1100)
      this.damage = 15
    }
  }

  isReleased() {
    return this.animationComplete && this.rightButtonReleased
  }

  getPositionOffset(direction) {
    let positionOffset = { x: 0, y: 0 }
    if (direction === 'up') positionOffset = { x: -5, y: -25 }
    else if (direction === 'up-right') positionOffset = { x: 10, y: -22 }
    else if (direction === 'right') positionOffset = { x: 15, y: -15 }
    else if (direction === 'down-right') positionOffset = { x: 17, y: -7 }
    else if (direction === 'down') positionOffset = { x: 7, y: 2 }
    else if (direction === 'down-left') positionOffset = { x: -10, y: 0 }
    else if (direction === 'left') positionOffset = { x: -15, y: -10 }
    else if (direction === 'up-left') positionOffset = { x: -15, y: -17 }

    return positionOffset
  }

  explode() {
    Phaser.Utils.Array.Remove(this.caster.fireballs, this)
    this.container.setVelocity(0)
    this.emitter1.explode()
    this.emitter2.stop()
    this.scene.sounds.play('fireball')
    this.scene.time.delayedCall(200, () => {
      this.backgroundSound.stop()
    })
    this.scene.time.delayedCall(this.emitter2.lifespan.propertyValue, () => {
      this.scene.lightManager.removeLight(this.container)
      this.container.destroy()
    })
  }

  static canCast(caster) {
    return (
      (!this.getLast(caster) || this.getLast(caster).isReleased()) &&
      caster.get('mana') &&
      caster.hasItem('fireball')
    )
  }

  static cast(scene, caster, target) {
    const newFireball = new Fireball(scene, target, caster)

    const anim = caster.castSpell()
    anim.on('complete', () => {
      newFireball.animationComplete = true
    })

    caster.fireballs.push(newFireball)
  }

  static isCasting(caster) {
    return Fireball.getLast(caster) && !Fireball.getLast(caster).isReleased()
  }

  static release(caster, target) {
    const fireball = this.getLast(caster)
    if (fireball) {
      if (target) {
        fireball.target = target
      }
      fireball.rightButtonReleased = true
    }
  }

  static getLast(caster) {
    return caster.fireballs[caster.fireballs.length - 1]
  }

  update() {
    const depth = this.scene.convertYToDepth(this.container.y, 6)
    this.container.setDepth(depth)
    this.particle1.setDepth(depth)
    this.particle2.setDepth(depth)

    this.container.setRotation(this.container.rotation + 0.05)
    if (this.isReleased()) {
      if (Phaser.Math.Distance.BetweenPoints(this.container, this.target) < 2) {
        this.explode()
      } else {
        this.scene.moveToObject(this.container, this.target, 3)
      }
    }
  }
}
