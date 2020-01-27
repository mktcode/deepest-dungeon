import Phaser from 'phaser'
import COLLISION_CATEGORIES from "../../collision-categories.js";
import TEXTS from "../../texts.js";

export default class BaseEnemy {
  constructor(dungeon, room, dieCallback, hp, xp, damage, name, width, height, originX, originY) {
    this.dungeon = dungeon
    this.room = room
    this.name = name
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback
    this.dead = false

    const x = this.dungeon.tileToWorldX(Phaser.Math.Between(this.room.left + 2, this.room.right - 2))
    const y = this.dungeon.tileToWorldY(Phaser.Math.Between(this.room.top + 5, this.room.bottom - 2))

    this.hp = hp
    this.xp = xp
    this.damage = damage

    this.sprite = this.dungeon.matter.add.sprite(x, y, 'sprites', 'enemies/' + this.name + '/walk/down/1')
    this.sprite.setData('name', this.name)
    this.setCollision(x, y, width, height, originX, originY)

    this.sprite.on('pointerover', () => {
      this.sprite.setTint(0xFF0000)
    })
    this.sprite.on('pointerout', () => {
      this.sprite.clearTint()
    })

    this.walk()

    // enemy touches hero
    this.dungeon.matterCollision.addOnCollideActive({
      objectA: this.dungeon.hero.container,
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
      objectA: this.dungeon.hero.container,
      objectB: this.sprite,
      callback: (collision) => {
        if (
          this.dungeon.hero.attacking &&
          !this.underAttack &&
          !this.dungeon.hero.dead &&
          collision.bodyA.isSensor &&
          this.dungeon.hero.getDamagingAttackFrames().includes(this.dungeon.hero.sprite.anims.currentFrame.index) &&
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
            this.dungeon.sounds.play(this.name + Phaser.Math.Between(1, 2))
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
      .setInteractive(new Phaser.Geom.Rectangle(interactionX - width * 0.25, interactionY - height * 0.25, width * 1.5, height * 1.5), Phaser.Geom.Rectangle.Contains)
      .setDepth(6)
  }

  playAnim(name, direction) {
    if (!direction) {
      direction = 'down'
    }
    const slowmo = this.dungeon.narrator && this.dungeon.narrator.slowmo ? '-slowmo': ''

    this.sprite.anims.play(this.name + '-' + name + '-' + direction + slowmo, true)
    return this.dungeon.anims.get(this.name + '-' + name + '-' + direction + slowmo)
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
        this.sprite.disableInteractive()
        if (this.dungeon.hero.targetedEnemy === this.sprite) {
          this.dungeon.hero.targetedEnemy = null
        }
        if (this.sound) this.sound.remove()

        let enemiesKilled = this.dungeon.registry.get('enemiesKilled')
        enemiesKilled++
        this.dungeon.registry.set('enemiesKilled', enemiesKilled)

        const gui = this.dungeon.scene.get('Gui')

        if (!this.dungeon.registry.get('items').includes('sword')) {
          if (enemiesKilled === 1) {
            gui.showSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 2))
          } else if (enemiesKilled === 2) {
            gui.subtitle.setText(TEXTS.KILL_X_UNDEAD.replace('{num}', 1))
          } else if (enemiesKilled === 3) {
            gui.hideSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 1))
            this.dungeon.playStoryElementOnce('killingAllTheseEnemies').then(() => {
              gui.showSubtitle(TEXTS.FIND_A_SWORD, 12000)
            })
          }
        }

        this.dead = true
        this.die()
        for (let i = 0; i < this.xp; i++) {
          this.dungeon.emitXpOrb(this.sprite.x, this.sprite.y, true)
        }
        if (this.dungeon.registry.get('health') < this.dungeon.registry.get('maxHealth') && !Phaser.Math.Between(0, 15)) {
          this.dungeon.emitHealthOrb(this.sprite.x, this.sprite.y, true)
        }
        if (this.dungeon.registry.get('mana') < this.dungeon.registry.get('maxMana') && !Phaser.Math.Between(0, 15)) {
          this.dungeon.emitManaOrb(this.sprite.x, this.sprite.y, true)
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
      const distance = vector.distance({x: this.dungeon.hero.container.x, y: this.dungeon.hero.container.y})
      const distanceX = vector.distance({x: this.dungeon.hero.container.x, y: sprite.y})
      const distanceY = vector.distance({x: sprite.x, y: this.dungeon.hero.container.y})
      let speed = 0.5
      if (this.dungeon.narrator.slowmo) {
        speed *= 0.3
      }
      if (this.dungeon.narrator.freeze) {
        speed = 0
      }
      if (this.room === this.dungeon.currentRoom && distance < 100 && this.dungeon.dungeonNumber > 4) {
        if (this.dungeon.dungeonNumber > 8) speed *= 1.5
        this.dungeon.moveToObject(sprite, this.dungeon.hero.container, speed)
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

        if (this.dungeon.hero.shieldActive) {
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
        if (this.room.left + 2 >= this.dungeon.worldToTileX(sprite.x)) {
          this.directionX = 'right'
        }
        if (this.room.right - 2 <= this.dungeon.worldToTileX(sprite.x)) {
          this.directionX = 'left'
        }
        if (this.room.top + 5 >= this.dungeon.worldToTileY(sprite.y)) {
          this.directionY = 'down'
        }
        if (this.room.bottom - 2 <= this.dungeon.worldToTileY(sprite.y)) {
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
