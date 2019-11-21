import Phaser from 'phaser'
import TILES from '../tile-mapping.js'

// assets
import enemies from '../assets/enemies.png'
import deamonSprite from "../assets/deamon.png";

export default class Enemy {
  constructor(dungeon, map, room, type, dieCallback) {
    this.dungeon = dungeon
    this.map = map
    this.room = room
    this.type = type
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.dieCallback = dieCallback

    const x = map.tileToWorldX(Phaser.Math.Between(room.left + 1, room.right - 1))
    const y = map.tileToWorldX(Phaser.Math.Between(room.top + 1, room.bottom - 1))

    if (this.type === 'deamon') {
      this.hp = 10
      this.xp = 10
      this.sprite = this.dungeon.physics.add.sprite(x, y, 'deamon', 1).setSize(75, 90).setOffset(23, 19)
      this.sprite.anims.play("deamon-idle")
      this.dungeon.tilemapVisibility.lights.push({
        sprite: this.sprite,
        darkness: () => 3
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
    }

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

    this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.hero, this.sprite, (hero, enemy) => {
      if (!this.dungeon.hero.underAttack) {
        this.dungeon.hero.underAttack = true
        let heroHp = this.dungeon.registry.get('health')
        heroHp--
        this.dungeon.registry.set('health', heroHp)
        if (heroHp) {
          if (hero.body.touching.up) {
            hero.body.setVelocityY(300)
          } else if (hero.body.touching.down) {
            hero.body.setVelocityY(-300)
          } else if (hero.body.touching.left) {
            hero.body.setVelocityX(300)
          } else if (hero.body.touching.right) {
            hero.body.setVelocityX(-300)
          }
          this.dungeon.time.delayedCall(750, () => {
            this.dungeon.hero.underAttack = false
          });
        } else {
          if (this.dungeon.registry.get('minLevel') >= 5) {
            this.dungeon.registry.set('wakeupInRestRoom', true)
          }
          this.dungeon.hero.underAttack = false
          this.dungeon.registry.set('health', this.dungeon.registry.get('maxHealth'))
          this.dungeon.hero.freeze()
          this.dungeon.scene.sleep()
          this.dungeon.scene.wake('Dungeon' + this.dungeon.registry.get('minLevel'))
        }
      }
    });
    this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.sword, this.sprite, (hero, enemy) => {
      if (this.dungeon.hero.attacking && !this.underAttack) {
        this.dungeon.cameras.main.shake(500, .002)
        this.underAttack = true
        this.hp--
        if (this.hp) {
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
        } else if (this.dieCallback) {
          this.dungeon.registry.set('xp', this.dungeon.registry.get('xp') + this.xp)
          this.sprite.destroy()
          this.dieCallback(this)
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
