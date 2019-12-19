import Phaser from 'phaser'
import TILES from '../tile-mapping.js'

// assets
import snakeSprite from '../assets/snake.png'
import deamonSprite from "../assets/deamon.png";

export default class Enemy {
  constructor(dungeon, room, type, dieCallback) {
    this.dungeon = dungeon
    this.room = room
    this.type = type
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback

    const x = this.dungeon.tileToWorldX(Phaser.Math.Between(room.left + 2, room.right - 2))
    const y = this.dungeon.tileToWorldY(Phaser.Math.Between(room.top + 2, room.bottom - 2))

    if (this.type === 'deamon') {
      this.hp = 10
      this.xp = 10
      this.sprite = this.dungeon.matter.add.sprite(x, y, 'deamon', 1).setFixedRotation()
      this.sprite.anims.play("deamon-idle")
      this.dungeon.lightManager.lights.push({
        sprite: this.sprite,
        intensity: () => 2
      })
    }
    if (this.type === 'snake') {
      this.hp = 3
      this.xp = 3
      this.sprite = this.dungeon.matter.add.sprite(x, y, "snake", 0).setFixedRotation()
      this.sprite.anims.play("snake-walk")
      this.dungeon.lightManager.lights.push({
        sprite: this.sprite,
        intensity: () => 0.04
      })
    }
    this.sprite.setDepth(6)

    // this.dungeon.physics.add.collider(this.sprite, this.dungeon.wallLayer)
    //
    // this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.hero, this.sprite, (hero, enemy) => {
    //   if (!this.dungeon.hero.underAttack && !this.dungeon.hero.dead) {
    //     this.dungeon.cameras.main.shake(500, .002)
    //     this.dungeon.hero.underAttack = true
    //     this.dungeon.hero.cantMove = true
    //     this.dungeon.hero.takeDamage(1)
    //   }
    // });
    // this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.sword, this.sprite, (hero, enemy) => {
    //   if (this.dungeon.hero.attacking && !this.underAttack && !this.dungeon.hero.dead) {
    //     this.dungeon.cameras.main.shake(500, .002)
    //     this.underAttack = true
    //     this.takeDamage(this.dungeon.registry.get('damage'))
    //   }
    // });
  }

  static preload(scene) {
    scene.load.spritesheet(
      "snake",
      snakeSprite,
      {
        frameWidth: 18,
        frameHeight: 15
      }
    );
    scene.load.spritesheet(
      "deamon",
      deamonSprite,
      {
        frameWidth: 122,
        frameHeight: 118
      }
    );
  }

  takeDamage(damage) {
    this.hp -= damage
    this.dungeon.popupDamageNumber(damage, this.sprite, '#CCCCCC')
    if (this.hp > 0) {
      this.dungeon.flashSprite(this.sprite)
      if (this.dungeon.hero.lastDirection === 'up') {
        this.sprite.setVelocityY(-300)
      } else if (this.dungeon.hero.lastDirection === 'down') {
        this.sprite.setVelocityY(300)
      } else if (this.dungeon.hero.lastDirection === 'left') {
        this.sprite.setVelocityX(-300)
      } else if (this.dungeon.hero.lastDirection === 'right') {
        this.sprite.setVelocityX(300)
      }
    } else {
      this.dungeon.registry.set('xp', this.dungeon.registry.get('xp') + this.xp)
      this.sprite.destroy()
      if (this.dieCallback) {
        this.dieCallback(this)
      }
    }

    this.dungeon.time.delayedCall(1500, () => {
      this.underAttack = false
      this.burning = false
    })
  }

  update() {
    if (!this.underAttack) {
      const sprite = this.sprite;
      const vector = new Phaser.Math.Vector2(sprite.x, sprite.y);
      const distance = vector.distance({x: this.dungeon.hero.sprites.hero.body.x, y: this.dungeon.hero.sprites.hero.body.y})
      if (this.room === this.dungeon.currentRoom && distance < 100 && this.dungeon.dungeonNumber > 5) {
        // this.dungeon.physics.moveToObject(this.sprite, this.dungeon.hero.sprites.hero)
        // sprite.setFlipX(this.sprite.body.velocity.x < 0);
      } else {
        const speed = 1;

        sprite.setVelocity(0);

        if (this.room.left + 1 >= this.dungeon.worldToTileX(this.sprite.x)) {
          this.directionX = 'right'
        }
        if (this.room.right - 1 <= this.dungeon.worldToTileX(this.sprite.x)) {
          this.directionX = 'left'
        }
        if (this.room.top + 1 >= this.dungeon.worldToTileY(this.sprite.y)) {
          this.directionY = 'down'
        }
        if (this.room.bottom - 1 <= this.dungeon.worldToTileY(this.sprite.y)) {
          this.directionY = 'up'
        }

        // horizontal movement
        if (this.directionX === 'left') {
          sprite.setVelocityX(-speed);
          sprite.setFlipX(true);
        }
        if (this.directionX === 'right') {
          sprite.setVelocityX(speed);
          sprite.setFlipX(false);
        }

        // vertical movement
        if (this.directionY === 'up') {
          sprite.setVelocityY(-speed);
        }
        if (this.directionY === 'down') {
          sprite.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        const vector = new Phaser.Math.Vector2(sprite.body.velocity)
        vector.normalize().scale(speed)
        sprite.setVelocity(vector.x, vector.y);
      }
    }
  }
}
