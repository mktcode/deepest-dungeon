import Phaser from 'phaser'

// assets
import deamonSprite from "../../assets/deamon.png";
import poroSprite from "../../assets/poro.png";

export default class Deamon {
  constructor(dungeon, room, dieCallback) {
    this.dungeon = dungeon
    this.room = room
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback

    const x = this.dungeon.tileToWorldX(Phaser.Math.Between(room.left + 2, room.right - 2))
    const y = this.dungeon.tileToWorldY(Phaser.Math.Between(room.top + 5, room.bottom - 2))

    const sprite = this.dungeon.dungeonNumber === 12 ? 'poro' : 'deamon'
    this.hp = 12
    this.xp = 12
    this.damage = 3
    this.sprite = this.dungeon.matter.add.sprite(x, y, sprite, 1)
      .setCollisionGroup(-1)
      .setFixedRotation()
      .setDepth(6)
    this.sprite.anims.play(sprite + "-idle")
    this.dungeon.lightManager.lights.push({
      sprite: this.sprite,
      intensity: () => 2
    })

    // enemy touches hero
    this.dungeon.matterCollision.addOnCollideActive({
      objectA: this.dungeon.hero.sprites.hero,
      objectB: this.sprite,
      callback: (collision) => {
        if (!this.dungeon.hero.underAttack && !this.dungeon.hero.dead && !collision.bodyA.isSensor) {
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
  }

  static preload(scene) {
    scene.load.spritesheet(
      "deamon",
      deamonSprite,
      {
        frameWidth: 61,
        frameHeight: 59
      }
    )
    scene.load.spritesheet(
      "poro",
      poroSprite,
      {
        frameWidth: 61,
        frameHeight: 59
      }
    )
  }

  takeDamage(damage) {
    this.hp -= damage
    this.dungeon.popupDamageNumber(damage, this.sprite.x, this.sprite.y, '#CCCCCC')
    this.dungeon.flashSprite(this.sprite)
    this.sprite.setVelocity(0)
    if (this.hp <= 0) {
      for (let i = 0; i < this.xp; i++) {
        this.dungeon.emitXpOrb(this.sprite.x, this.sprite.y, true)
      }
      this.dungeon.lightManager.removeLight(this.sprite)
      this.sprite.destroy()
      if (this.dieCallback) {
        this.dieCallback(this)
      }
    }

    this.dungeon.time.delayedCall(500, () => {
      this.underAttack = false
      this.burning = false
    })
  }

  update() {
    if (!this.underAttack) {
      const sprite = this.sprite;
      const vector = new Phaser.Math.Vector2(sprite.x, sprite.y);
      const distance = vector.distance({x: this.dungeon.hero.sprites.hero.x, y: this.dungeon.hero.sprites.hero.y})
      if (this.room === this.dungeon.currentRoom && distance < 50 && this.dungeon.dungeonNumber > 5) {
        this.dungeon.moveToObject(this.sprite, this.dungeon.hero.sprites.hero, 0.6)
        sprite.setFlipX(sprite.body.velocity.x < 0)
      } else {
        const speed = 0.5;

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

        // horizontal movement
        if (this.directionX === 'left') {
          sprite.setVelocityX(-speed)
          sprite.setFlipX(true)
        }
        if (this.directionX === 'right') {
          sprite.setVelocityX(speed)
          sprite.setFlipX(false)
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
