import Phaser from 'phaser'

export default class Spider {
  constructor(dungeon, room, dieCallback) {
    this.dungeon = dungeon
    this.room = room
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback

    const x = this.dungeon.tileToWorldX(Phaser.Math.Between(room.left + 2, room.right - 2))
    const y = this.dungeon.tileToWorldY(Phaser.Math.Between(room.top + 5, room.bottom - 2))

    this.dead = false
    this.hp = 6
    this.xp = 6
    this.damage = 2
    this.sprite = this.dungeon.matter.add.sprite(x, y, 'sprites', 0)
      .setRectangle(12, 16)
      .setCollisionGroup(-1)
      .setOrigin(0.5, 0.6)
      .setFixedRotation()
      .setDepth(6)
    this.walk()

    // enemy touches hero
    this.dungeon.matterCollision.addOnCollideActive({
      objectA: this.dungeon.hero.sprites.hero,
      objectB: this.sprite,
      callback: (collision) => {
        if (!this.dungeon.hero.underAttack && !this.dungeon.hero.dead && !this.dead && !collision.bodyA.isSensor) {
          this.dungeon.cameras.main.shake(500, .002)
          this.dungeon.hero.underAttack = true
          this.dungeon.hero.takeDamage(this.damage)
        }
      }
    })

    // enemy bounces off of wall
    this.dungeon.matterCollision.addOnCollideStart({
      objectA: this.dungeon.walls,
      objectB: this.sprite,
      callback: (collision) => {
        const bounds = collision.bodyA.bounds
        const dimensions = this.dungeon.getDimensionsByVertices([bounds.max.x, bounds.max.y, bounds.min.x, bounds.min.y])
        if (dimensions.width > dimensions.height) {
          this.directionY = this.directionY === 'up' ? 'down' : 'up'
        } else {
          this.directionX = this.directionX === 'right' ? 'left' : 'right'
        }
      }
    })

    // hero attacks enemy
    this.dungeon.matterCollision.addOnCollideActive({
      objectA: this.dungeon.hero.sprites.hero,
      objectB: this.sprite,
      callback: (collision) => {
        if (
          this.dungeon.hero.attacking &&
          !this.underAttack &&
          !this.dungeon.hero.dead &&
          collision.bodyA.isSensor &&
          this.dungeon.hero.getDamagingAttackFrames().includes(this.dungeon.hero.sprites.hero.anims.currentFrame.index) &&
          (this.dungeon.registry.get('weapon') ? '' : 'punch-') + this.dungeon.hero.lastDirection === collision.bodyA.label
        ) {
          this.dungeon.cameras.main.shake(500, .002)
          this.underAttack = true
          this.dungeon.hero.playHitSound()
          this.takeDamage(
            this.dungeon.registry.get('weapon')
              ? this.dungeon.registry.get('damage') * 2
              : this.dungeon.registry.get('damage')
          )
        }
      }
    })

    // sounds
    this.dungeon.time.delayedCall(Phaser.Math.Between(0, 5000), () => {
      this.sound = this.dungeon.time.addEvent({
        delay: 10000,
        callback: () => {
          if (this.dungeon.currentRoom === this.room) {
            this.dungeon.sounds.play('spider' + Phaser.Math.Between(1, 2))
          }
        },
        loop: true
      })
    })
  }

  playAnim(name, direction) {
    if (!direction) {
      direction = 'down'
    }
    const slowmo = this.dungeon.narrator && this.dungeon.narrator.slowmo ? '-slowmo': ''

    this.sprite.anims.play('spider-' + name + '-' + direction + slowmo, true)
    return this.dungeon.anims.get('spider-' + name + '-' + direction + slowmo)
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
      this.dungeon.popupDamageNumber(damage, this.sprite.x, this.sprite.y, '#CCCCCC')
      this.dungeon.flashSprite(this.sprite)
      this.sprite.setVelocity(0)
      if (this.hp <= 0) {
        if (this.sound) this.sound.remove()
        this.dungeon.registry.set('enemiesKilled', this.dungeon.registry.get('enemiesKilled') + 1)
        if (this.dungeon.registry.get('enemiesKilled') === 3 && !this.dungeon.registry.get('items').includes('sword')) {
          this.dungeon.narrator.sayOnce('killingAllTheseEnemies')
        }
        this.dead = true
        this.die()
        for (let i = 0; i < this.xp; i++) {
          this.dungeon.emitXpOrb(this.sprite.x, this.sprite.y, true)
        }
        this.dungeon.time.delayedCall(1000, () => {
          this.dungeon.lightManager.removeLight(this.sprite)
          this.sprite.destroy()
          if (this.dieCallback) {
            this.dieCallback(this)
          }
        })
      }

      this.dungeon.time.delayedCall(500, () => {
        this.underAttack = false
        this.burning = false
      })
    }
  }

  update() {
    if (!this.underAttack && !this.dead) {
      const sprite = this.sprite;
      const vector = new Phaser.Math.Vector2(sprite.x, sprite.y);
      const distance = vector.distance({x: this.dungeon.hero.sprites.hero.x, y: this.dungeon.hero.sprites.hero.y})
      let speed = 0.5
      if (this.dungeon.narrator.slowmo) {
        speed *= 0.3
      }
      if (this.dungeon.narrator.freeze) {
        speed *= 0
      }
      if (this.room === this.dungeon.currentRoom && distance < 100 && this.dungeon.dungeonNumber > 4) {
        if (this.dungeon.dungeonNumber > 8) speed *= 1.5
        this.dungeon.moveToObject(this.sprite, this.dungeon.hero.sprites.hero, speed)
        if (this.sprite.body.velocity.y < 0 && Math.abs(this.sprite.body.velocity.x) < this.sprite.body.velocity.y * -1 / 2) {
          this.walk('up')
        } else if (this.sprite.body.velocity.y > 0 && Math.abs(this.sprite.body.velocity.x) < this.sprite.body.velocity.y / 2) {
          this.walk('down')
        } else if (this.sprite.body.velocity.x > 0 && Math.abs(this.sprite.body.velocity.y) < this.sprite.body.velocity.x / 2) {
          this.walk('right')
        } else if (this.sprite.body.velocity.x > 0 && this.sprite.body.velocity.y > this.sprite.body.velocity.x / 2) {
          this.walk('down-right')
        } else if (this.sprite.body.velocity.x > 0 && this.sprite.body.velocity.y < -(this.sprite.body.velocity.x / 2)) {
          this.walk('up-right')
        } else if (this.sprite.body.velocity.x < 0 && Math.abs(this.sprite.body.velocity.y) < this.sprite.body.velocity.x * -1 / 2) {
          this.walk('left')
        } else if (this.sprite.body.velocity.x < 0 && this.sprite.body.velocity.y > this.sprite.body.velocity.x * -1 / 2) {
          this.walk('down-left')
        } else if (this.sprite.body.velocity.x < 0 && this.sprite.body.velocity.y < -(this.sprite.body.velocity.x * -1 / 2)) {
          this.walk('up-left')
        }
      } else {
        sprite.setVelocity(0)
        if (this.room.left + 2 >= this.dungeon.worldToTileX(this.sprite.x)) {
          this.directionX = 'right'
        }
        if (this.room.right - 2 <= this.dungeon.worldToTileX(this.sprite.x)) {
          this.directionX = 'left'
        }
        if (this.room.top + 5 >= this.dungeon.worldToTileY(this.sprite.y)) {
          this.directionY = 'down'
        }
        if (this.room.bottom - 2 <= this.dungeon.worldToTileY(this.sprite.y)) {
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
