import Phaser from 'phaser'
import enemies from '../assets/enemies.png'

export default class Enemy {
  constructor(dungeon, map, room) {
    this.dungeon = dungeon;
    this.map = map;
    this.room = room;
    this.directionX = ['left', 'right'][Phaser.Math.Between(0, 1)]
    this.directionY = ['up', 'down'][Phaser.Math.Between(0, 1)]
    this.underAttack = false
    this.hp = 3

    const x = map.tileToWorldX(Phaser.Math.Between(room.left + 1, room.right - 1))
    const y = map.tileToWorldX(Phaser.Math.Between(room.top + 1, room.bottom - 1))

    this.sprite = this.dungeon.physics.add
      .sprite(x, y, "enemies", 0)
      .setSize(27, 28)
      .setOffset(20, 35);

    this.sprite.anims.play("enemy-walk");

    this.dungeon.physics.add.collider(this.sprite, this.dungeon.groundLayer);

    this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.hero, this.sprite, (hero, enemy) => {
      if (!this.dungeon.hero.underAttack) {
        this.dungeon.hero.underAttack = true
        let heroHp = this.dungeon.registry.get('hp')
        heroHp--
        this.dungeon.registry.set('hp', heroHp)
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
          this.dungeon.registry.set('hp', 3)
          this.dungeon.hero.freeze()
          this.dungeon.scene.sleep()
          this.dungeon.scene.wake('Dungeon' + this.dungeon.registry.get('minLevel'))
        }
      }
    });
    this.dungeon.physics.add.overlap(this.dungeon.hero.sprites.sword, this.sprite, (hero, enemy) => {
      if (this.dungeon.hero.attacking && !this.underAttack) {
        this.underAttack = true
        this.hp--
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
      if (sprite.body.x <= this.map.tileToWorldX(this.room.x + 2)) {
        this.directionX = 'right'
      }
      if (sprite.body.x >= this.map.tileToWorldX(this.room.x + this.room.width - 2)) {
        this.directionX = 'left'
      }

      // vertical movement
      if (this.directionY === 'up') {
        sprite.body.setVelocityY(speed);
      }
      if (this.directionY === 'down') {
        sprite.body.setVelocityY(-speed);
      }
      if (sprite.body.y <= this.map.tileToWorldY(this.room.y + 2)) {
        this.directionY = 'up'
      }
      if (sprite.body.y >= this.map.tileToWorldY(this.room.y + this.room.height - 2)) {
        this.directionY = 'down'
      }

      // Normalize and scale the velocity so that sprite can't move faster along a diagonal
      sprite.body.velocity.normalize().scale(speed);
    }
  }
}
