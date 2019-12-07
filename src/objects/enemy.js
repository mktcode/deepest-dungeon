import Phaser from 'phaser'
import TILES from '../tile-mapping.js'

// assets
import enemies from '../assets/enemies.png'
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

    const x = this.dungeon.map.tileToWorldX(Phaser.Math.Between(room.left + 2, room.right - 2))
    const y = this.dungeon.map.tileToWorldX(Phaser.Math.Between(room.top + 2, room.bottom - 2))

    if (this.type === 'deamon') {
      this.hp = 10
      this.xp = 10
      this.sprite = this.dungeon.physics.add.sprite(x, y, 'deamon', 1).setSize(75, 90).setOffset(23, 19)
      this.sprite.anims.play("deamon-idle")
      this.dungeon.lightManager.lights.push({
        sprite: this.sprite,
        intensity: () => 2
      })
    }
    if (this.type === 'snake') {
      this.hp = 3
      this.xp = 3
      this.sprite = this.dungeon.physics.add
        .sprite(x, y, "enemies", 0)
        .setSize(27, 28)
        .setOffset(20, 35)
      this.sprite.anims.play("enemy-walk")
      this.dungeon.lightManager.lights.push({
        sprite: this.sprite,
        intensity: () => 0.04
      })
    }
    this.sprite.setDepth(6)

    this.dungeon.physics.add.collider(this.sprite, this.dungeon.groundLayer, (enemy, wall) => {
      if ([TILES.WALL.TOP, ...TILES.DOOR.TOP].includes(wall.index)) {
        this.directionY = 'down'
      }
      if ([TILES.WALL.RIGHT, ...TILES.DOOR.RIGHT[0]].includes(wall.index)) {
        this.directionX = 'left'
      }
      if ([TILES.WALL.BOTTOM, ...TILES.DOOR.BOTTOM].includes(wall.index)) {
        this.directionY = 'up'
      }
      if ([TILES.WALL.LEFT, ...TILES.DOOR.LEFT[0]].includes(wall.index)) {
        this.directionX = 'right'
      }
    });

    this.dungeon.physics.add.collider(this.dungeon.hero.sprites.hero, this.sprite, (hero, enemy) => {
      if (!this.dungeon.hero.underAttack) {
        this.dungeon.cameras.main.shake(500, .002)
        this.dungeon.hero.underAttack = true
        this.dungeon.hero.takeDamage(1)
      }
    });
    this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.sword, this.sprite, (hero, enemy) => {
      if (this.dungeon.hero.attacking && !this.underAttack) {
        this.dungeon.cameras.main.shake(500, .002)
        this.underAttack = true
        this.hp -= this.dungeon.registry.get('damage')
        this.dungeon.popupDamageNumber(this.dungeon.registry.get('damage'), this.sprite, '#CCCCCC')
        if (this.hp > 0) {
          this.dungeon.flashSprite(enemy)
          if (this.dungeon.hero.lastDirection === 'up') {
            enemy.body.setVelocityY(-300)
          } else if (this.dungeon.hero.lastDirection === 'down') {
            enemy.body.setVelocityY(300)
          } else if (this.dungeon.hero.lastDirection === 'left') {
            enemy.body.setVelocityX(-300)
          } else if (this.dungeon.hero.lastDirection === 'right') {
            enemy.body.setVelocityX(300)
          }
          this.dungeon.time.delayedCall(750, () => {
            this.underAttack = false
          });
        } else {
          this.dungeon.registry.set('xp', this.dungeon.registry.get('xp') + this.xp)
          this.sprite.destroy()
          if (this.dieCallback) {
            this.dieCallback(this)
          }
        }
      }
    });
  }

  static preload(scene) {
    scene.load.spritesheet(
      "enemies",
      enemies,
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
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

  update() {
    if (!this.underAttack) {
      const sprite = this.sprite;
      const vector = new Phaser.Math.Vector2(sprite.x, sprite.y);
      const distance = vector.distance({x: this.dungeon.hero.sprites.hero.body.x, y: this.dungeon.hero.sprites.hero.body.y})
      if (this.room === this.dungeon.currentRoom && distance < 200 && this.dungeon.dungeonNumber > 5) {
        this.dungeon.physics.moveToObject(this.sprite, this.dungeon.hero.sprites.hero)
        sprite.setFlipX(this.sprite.body.velocity.x < 0);
      } else {
        const speed = 50;

        sprite.body.setVelocity(0);

        // horizontal movement
        if (this.directionX === 'left') {
          sprite.body.setVelocityX(-speed);
          sprite.setFlipX(true);
        }
        if (this.directionX === 'right') {
          sprite.body.setVelocityX(speed);
          sprite.setFlipX(false);
        }

        // vertical movement
        if (this.directionY === 'up') {
          sprite.body.setVelocityY(-speed);
        }
        if (this.directionY === 'down') {
          sprite.body.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        sprite.body.velocity.normalize().scale(speed);
      }
    }
  }
}
