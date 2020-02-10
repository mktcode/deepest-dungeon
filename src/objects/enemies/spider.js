import Phaser from 'phaser'
import BaseEnemy from "./base.js"

export default class Spider extends BaseEnemy {
  constructor(scene, room, dieCallback) {
    super(scene, room, dieCallback, 6, 6, 2, 'spider', 16, 16, 0.5, 0.65)

    this.walkingPattern = Phaser.Utils.Array.Shuffle([true, true, true, false, false, false, false, false, false, false])
  }

  isWalkingPatternActive() {
    const time = new Date()
    return this.walkingPattern[time.getTime().toString()[time.getTime().toString().length - 4]]
  }

  update() {
    this.sprite.setDepth(this.scene.convertYToDepth(this.sprite.y, 6))

    if (!this.isUnderAttack && !this.isDead) {
      const sprite = this.sprite;
      const vector = new Phaser.Math.Vector2(sprite.x, sprite.y);
      const distance = vector.distance({x: this.scene.hero.container.x, y: this.scene.hero.container.y})
      const distanceX = vector.distance({x: this.scene.hero.container.x, y: sprite.y})
      const distanceY = vector.distance({x: sprite.x, y: this.scene.hero.container.y})
      let speed = 1.5
      if (this.scene.narrator.slowmo) {
        speed *= 0.5
      }
      if (this.scene.narrator.freeze) {
        speed = 0
      }
      if (this.room === this.scene.currentRoom && distance < 100 && this.scene.dungeonNumber > 4) {
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

        if (this.scene.hero.isShieldActive) {
          if (distanceY < 40 && distanceX < 55) {
            sprite.setVelocityX(sprite.body.velocity.x * -5)
            sprite.setVelocityY(sprite.body.velocity.y * -5)
          } else if (distanceY < 45 && distanceX < 60) {
            sprite.setVelocityX(sprite.body.velocity.x = 0)
            sprite.setVelocityY(sprite.body.velocity.y = 0)
          }
        }
      } else {
        sprite.setVelocity(0)

        // make movement run in intervals (creepily lurking spider)
        if (this.isWalkingPatternActive()) {
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
}
