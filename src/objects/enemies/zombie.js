import Phaser from 'phaser'

export default class Zombie {
  constructor(dungeon, room, dieCallback) {
    this.dungeon = dungeon
    this.room = room
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback

    const x = this.dungeon.tileToWorldX(Phaser.Math.Between(room.left + 2, room.right - 2))
    const y = this.dungeon.tileToWorldY(Phaser.Math.Between(room.top + 4, room.bottom - 2))

    this.dead = false
    this.hp = 3
    this.xp = 3
    this.sprite = this.dungeon.matter.add.sprite(x, y, 'sprites', 0, { collisionFilter: { group: -1 } })
      .setRectangle(12, 16)
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
          this.dungeon.hero.takeDamage(1)
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
        const damagingFrames = this.dungeon.registry.get('weapon') ? [12, 13, 14, 15, 16, 17, 18] : [5, 6, 7, 8]
        if (
          this.dungeon.hero.attacking &&
          !this.underAttack &&
          !this.dungeon.hero.dead &&
          collision.bodyA.isSensor &&
          damagingFrames.includes(this.dungeon.hero.sprites.hero.anims.currentFrame.index) &&
          (this.dungeon.registry.get('weapon') ? '' : 'punch-') + this.dungeon.hero.lastDirection === collision.bodyA.label
        ) {
          this.dungeon.cameras.main.shake(500, .002)
          this.underAttack = true
          this.takeDamage(
            this.dungeon.registry.get('weapon')
              ? this.dungeon.registry.get('damage') * 2
              : this.dungeon.registry.get('damage')
          )
        }
      }
    })
  }

  playAnim(name, direction) {
    if (!direction) {
      direction = 'down'
    }
    const slowmo = this.dungeon.narrator && this.dungeon.narrator.slowmo ? '-slowmo': ''

    this.sprite.anims.play('zombie-' + name + '-' + direction + slowmo, true)
    return this.dungeon.anims.get('zombie-' + name + '-' + direction + slowmo)
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
        this.dead = true
        this.die()
        this.dungeon.registry.set('xp', this.dungeon.registry.get('xp') + this.xp)
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
      if (this.room === this.dungeon.currentRoom && distance < 100 && this.dungeon.dungeonNumber > 5) {
        this.dungeon.moveToObject(this.sprite, this.dungeon.hero.sprites.hero, 0.6)
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
        const speed = 0.5;

        sprite.setVelocity(0)
        if (this.room.left + 1 >= this.dungeon.worldToTileX(this.sprite.x)) {
          this.directionX = 'right'
        }
        if (this.room.right - 1 <= this.dungeon.worldToTileX(this.sprite.x)) {
          this.directionX = 'left'
        }
        if (this.room.top + 3 >= this.dungeon.worldToTileY(this.sprite.y)) {
          this.directionY = 'down'
        }
        if (this.room.bottom - 1 <= this.dungeon.worldToTileY(this.sprite.y)) {
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