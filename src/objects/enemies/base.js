import Phaser from 'phaser'
import COLLISION_CATEGORIES from "../../collision-categories.js";
import TEXTS from "../../texts.js";

export default class BaseEnemy {
  constructor(scene, room, dieCallback, hp, xp, damage, name, width, height, originX, originY) {
    this.scene = scene
    this.room = room
    this.name = name
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback
    this.dead = false

    const x = this.scene.tileToWorldX(Phaser.Math.Between(this.room.left + 2, this.room.right - 2))
    const y = this.scene.tileToWorldY(Phaser.Math.Between(this.room.top + 5, this.room.bottom - 2))

    this.hp = hp
    this.xp = xp
    this.damage = damage

    this.sprite = this.scene.matter.add.sprite(x, y, 'sprites', 'enemies/' + this.name + '/walk/down/1')
    this.sprite.setData('name', this.name)
    this.setCollision(x, y, width, height, originX, originY)

    this.sprite.on('pointerover', () => {
      this.sprite.setTint(0xFF0000)
    })
    this.sprite.on('pointerout', () => {
      this.sprite.clearTint()
    })
    this.sprite.on('pointerdown', () => {
      this.scene.sounds.play('clickMinor')
    })

    this.walk()

    // enemy touches hero
    this.scene.matterCollision.addOnCollideActive({
      objectA: this.scene.hero.container,
      objectB: this.sprite,
      callback: (collision) => {
        if (!this.scene.hero.underAttack && !this.scene.hero.dead && !this.dead && !collision.bodyA.isSensor) {
          this.scene.cameras.main.shake(500, .002)
          this.scene.hero.underAttack = true
          this.scene.hero.takeDamage(this.damage)
        }
      }
    })

    // enemy bounces off of wall
    this.scene.matterCollision.addOnCollideStart({
      objectA: this.scene.walls,
      objectB: this.sprite,
      callback: (collision) => {
        const bounds = collision.bodyA.bounds
        const dimensions = this.scene.getDimensionsByVertices([bounds.max.x, bounds.max.y, bounds.min.x, bounds.min.y])
        if (dimensions.width > dimensions.height) {
          this.directionY = this.directionY === 'up' ? 'down' : 'up'
        } else {
          this.directionX = this.directionX === 'right' ? 'left' : 'right'
        }
      }
    })

    // hero attacks enemy
    this.scene.matterCollision.addOnCollideActive({
      objectA: this.scene.hero.container,
      objectB: this.sprite,
      callback: (collision) => {
        if (
          this.scene.hero.attacking &&
          !this.underAttack &&
          !this.scene.hero.dead &&
          collision.bodyA.isSensor &&
          this.scene.hero.getDamagingAttackFrames().includes(this.scene.hero.sprite.anims.currentFrame.index) &&
          (this.scene.hero.hasItem('sword') ? '' : 'punch-') + this.scene.hero.lastDirection === collision.bodyA.label
        ) {
          this.scene.cameras.main.shake(500, .002)
          this.underAttack = true
          this.scene.hero.playHitSound()
          this.takeDamage(
            this.scene.hero.hasItem('sword')
              ? this.scene.registry.get('damage') * 2
              : this.scene.registry.get('damage')
          )
        }
      }
    })

    // sounds
    this.scene.time.delayedCall(Phaser.Math.Between(0, 5000), () => {
      this.sound = this.scene.time.addEvent({
        delay: 10000,
        callback: () => {
          if (this.scene.currentRoom === this.room) {
            this.scene.sounds.play(this.name + Phaser.Math.Between(1, 2))
          }
        },
        loop: true
      })
    })
  }

  setCollision(x, y, width, height, originX, originY) {
    const interactionX = this.sprite.width * originX - width / 2
    const interactionY = this.sprite.height * originY - height / 2
    this.sprite
      .setExistingBody(Phaser.Physics.Matter.Matter.Bodies.rectangle(x, y, width, height, { label: 'enemy-' + this.name }))
      .setCollisionCategory(COLLISION_CATEGORIES.ENEMY)
      .setCollidesWith([COLLISION_CATEGORIES.WALL, COLLISION_CATEGORIES.HERO, COLLISION_CATEGORIES.FIREBALL])
      .setOrigin(originX, originY)
      .setFixedRotation()
      .setInteractive(new Phaser.Geom.Rectangle(interactionX - width * 1.5, interactionY - height * 1.5, width * 4, height * 4), Phaser.Geom.Rectangle.Contains)
  }

  playAnim(name, direction) {
    if (!direction) {
      direction = 'down'
    }
    const slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''

    this.sprite.anims.play(this.name + '-' + name + '-' + direction + slowmo, true)
    return this.scene.anims.get(this.name + '-' + name + '-' + direction + slowmo)
  }

  walk(direction) {
    return this.playAnim('walk', direction)
  }

  die(direction) {
    return this.playAnim('die', direction)
  }

  takeDamage(damage) {
    if (!this.dead) {
      this.hp -= damage
      this.scene.popupDamageNumber(damage, this.sprite.x, this.sprite.y, '#CCCCCC')
      this.scene.flashSprite(this.sprite)
      this.sprite.setVelocity(0)
      if (this.hp <= 0) {
        this.sprite.disableInteractive()
        if (this.scene.hero.targetedEnemy === this.sprite) {
          this.scene.hero.targetedEnemy = null
        }
        if (this.sound) this.sound.remove()

        let enemiesKilled = this.scene.registry.get('enemiesKilled')
        enemiesKilled++
        this.scene.registry.set('enemiesKilled', enemiesKilled)

        const gui = this.scene.scene.get('Gui')

        if (!this.scene.registry.get('items').includes('sword')) {
          if (enemiesKilled === 1) {
            gui.showSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 2))
          } else if (enemiesKilled === 2) {
            gui.subtitle.setText(TEXTS.KILL_X_UNDEAD.replace('{num}', 1))
          } else if (enemiesKilled === 3) {
            gui.hideSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 1))
            this.scene.playStoryElementOnce('killingAllTheseEnemies').then(() => {
              gui.showSubtitle(TEXTS.FIND_A_SWORD, 12000)
            })
          }
        }

        this.dead = true
        this.die()
        for (let i = 0; i < this.xp; i++) {
          this.scene.emitXpOrb(this.sprite.x, this.sprite.y, true, 1)
        }
        if (this.scene.registry.get('health') < this.scene.registry.get('maxHealth') && !Phaser.Math.Between(0, 8)) {
          this.scene.emitHealthOrb(this.sprite.x, this.sprite.y, true)
        }
        if (this.scene.registry.get('mana') < this.scene.registry.get('maxMana') && !Phaser.Math.Between(0, 8)) {
          this.scene.emitManaOrb(this.sprite.x, this.sprite.y, true)
        }
        this.scene.time.delayedCall(1000, () => {
          this.scene.lightManager.removeLight(this.sprite)
          this.sprite.destroy()
          if (this.dieCallback) {
            this.dieCallback(this)
          }
        })
      }

      this.scene.time.delayedCall(500, () => {
        this.underAttack = false
        this.burning = false
      })
    }
  }

  update() {
    this.sprite.setDepth(this.scene.convertYToDepth(this.sprite.y, 6))

    if (!this.underAttack && !this.dead) {
      const sprite = this.sprite;
      const vector = new Phaser.Math.Vector2(sprite.x, sprite.y);
      const distance = vector.distance({x: this.scene.hero.container.x, y: this.scene.hero.container.y})
      const distanceX = vector.distance({x: this.scene.hero.container.x, y: sprite.y})
      const distanceY = vector.distance({x: sprite.x, y: this.scene.hero.container.y})
      let speed = 0.5
      if (this.scene.narrator.slowmo) {
        speed *= 0.3
      }
      if (this.scene.narrator.freeze) {
        speed = 0
      }
      if (this.room === this.scene.currentRoom && distance < 100 && this.scene.dungeonNumber > 4) {
        if (this.scene.dungeonNumber > 8) speed *= 1.5
        this.scene.moveToObject(sprite, this.scene.hero.container, speed)
        if (sprite.body.velocity.y < 0 && Math.abs(sprite.body.velocity.x) < sprite.body.velocity.y * -1 / 2) {
          this.walk('up')
        } else if (sprite.body.velocity.y > 0 && Math.abs(sprite.body.velocity.x) < sprite.body.velocity.y / 2) {
          this.walk('down')
        } else if (sprite.body.velocity.x > 0 && Math.abs(sprite.body.velocity.y) < sprite.body.velocity.x / 2) {
          this.walk('right')
        } else if (sprite.body.velocity.x > 0 && sprite.body.velocity.y > sprite.body.velocity.x / 2) {
          this.walk('down-right')
        } else if (sprite.body.velocity.x > 0 && sprite.body.velocity.y < -(sprite.body.velocity.x / 2)) {
          this.walk('up-right')
        } else if (sprite.body.velocity.x < 0 && Math.abs(sprite.body.velocity.y) < sprite.body.velocity.x * -1 / 2) {
          this.walk('left')
        } else if (sprite.body.velocity.x < 0 && sprite.body.velocity.y > sprite.body.velocity.x * -1 / 2) {
          this.walk('down-left')
        } else if (sprite.body.velocity.x < 0 && sprite.body.velocity.y < -(sprite.body.velocity.x * -1 / 2)) {
          this.walk('up-left')
        }

        if (this.scene.hero.shieldActive) {
          if (distanceY < 30 && distanceX < 45) {
            sprite.setVelocityX(sprite.body.velocity.x * -5)
            sprite.setVelocityY(sprite.body.velocity.y * -5)
          } else if (distanceY < 45 && distanceX < 50) {
            sprite.setVelocityX(sprite.body.velocity.x = 0)
            sprite.setVelocityY(sprite.body.velocity.y = 0)
          }
        }
      } else {
        sprite.setVelocity(0)
        if (this.room.left + 2 >= this.scene.worldToTileX(sprite.x)) {
          this.directionX = 'right'
        }
        if (this.room.right - 2 <= this.scene.worldToTileX(sprite.x)) {
          this.directionX = 'left'
        }
        if (this.room.top + 5 >= this.scene.worldToTileY(sprite.y)) {
          this.directionY = 'down'
        }
        if (this.room.bottom - 2 <= this.scene.worldToTileY(sprite.y)) {
          this.directionY = 'up'
        }

        if (this.directionY === 'up' && this.directionX === 'right') {
          this.walk('up-right')
        }
        if (this.directionY === 'up' && this.directionX === 'left') {
          this.walk('up-left')
        }
        if (this.directionY === 'down' && this.directionX === 'right') {
          this.walk('down-right')
        }
        if (this.directionY === 'down' && this.directionX === 'left') {
          this.walk('down-left')
        }

        // horizontal movement
        if (this.directionX === 'left') {
          sprite.setVelocityX(-speed)
        }
        if (this.directionX === 'right') {
          sprite.setVelocityX(speed)
        }

        // vertical movement
        if (this.directionY === 'up') {
          sprite.setVelocityY(-speed)
        }
        if (this.directionY === 'down') {
          sprite.setVelocityY(speed)
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        const vector = new Phaser.Math.Vector2(sprite.body.velocity)
        vector.normalize().scale(speed)
        sprite.setVelocity(vector.x, vector.y)
      }
    }
  }
}
