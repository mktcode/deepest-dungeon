import DungeonScene from "../scenes/dungeon.js"
import TILES from "../tile-mapping.js";

// assets
import hero from "../assets/hero.png";
import sword from "../assets/sword.png";

export default class Hero {
  constructor(scene, x, y) {
    this.scene = scene
    this.sprites = {
      hero: null,
      sword: null
    }
    this.keys = this.scene.input.keyboard.createCursorKeys();
    this.speed = 150
    this.attacking = false
    this.lastDirection = 'down'

    this.addToScene(x, y)

    // attack
    this.keys.space.on('down', () => {
      this.attacking = true
      this.setSwordHitBox(this.lastDirection)
      this.attack(this.lastDirection).once('complete', () => {
        this.attacking = false
      })
    })

    // use
    this.scene.input.keyboard.on('keyup-E', () => {
      // stairs
      const tile = this.scene.stuffLayer.getTileAtWorldXY(this.sprites.hero.body.x, this.sprites.hero.body.y)
      if (tile && tile.index === TILES.STAIRS) {
        const nextLevel = this.scene.level + 1
        this.scene.scene.sleep()
        if (this.scene.scene.get('Dungeon' + nextLevel)) {
          this.scene.scene.wake('Dungeon' + nextLevel)
        } else {
          this.scene.scene.add('Dungeon' + nextLevel, new DungeonScene(nextLevel), true)
        }
      }
    });
  }

  static preload(scene) {
    scene.load.spritesheet(
      "hero",
      hero,
      {
        frameWidth: 64,
        frameHeight: 64
      }
    );
    scene.load.spritesheet(
      "sword",
      sword,
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );
  }

  addToScene(x, y) {
    this.sprites.hero = this.scene.physics.add
      .sprite(x, y, "hero", 35)
      .setSize(20, 27)
      .setOffset(23, 27);
    this.scene.cameras.main.startFollow(this.sprites.hero)

    this.sprites.sword = this.scene.physics.add.sprite(x, y, "sword", 0);
    this.setSwordHitBox('down')
  }

  jumpTo(x, y) {
    this.sprites.hero.setX(x).setY(y)
    this.sprites.sword.setX(x + 9).setY(y + 6)
  }

  walk(direction) {
    this.sprites.hero.anims.play('walk-' + direction, true)
  }

  attack(direction) {
    this.setSwordHitBox(direction)
    this.sprites.hero.anims.play('attack-' + direction, true)
    this.sprites.sword.anims.play('sword-' + direction, true)
    return this.scene.anims.get('attack-' + direction)
  }

  stop() {
    this.sprites.hero.anims.stop()
  }

  freeze() {
    this.sprites.hero.body.moves = false
  }

  unfreeze() {
    this.sprites.hero.body.moves = true
  }

  setSwordHitBox(direction) {
    if (direction === 'down') {
      this.sprites.sword.setSize(50, 30).setOffset(40, 87)
    } else if (direction === 'up') {
      this.sprites.sword.setSize(50, 30).setOffset(40, 28)
    } else if (direction === 'left') {
      this.sprites.sword.setSize(30, 50).setOffset(24, 47)
    } else if (direction === 'right') {
      this.sprites.sword.setSize(30, 50).setOffset(76, 47)
    }
  }

  update() {
    // Stop any previous movement from the last frame
    this.sprites.hero.body.setVelocity(0);

    // Horizontal movement
    if (this.keys.left.isDown) {
      this.sprites.hero.body.setVelocityX(-this.speed);
    } else if (this.keys.right.isDown) {
      this.sprites.hero.body.setVelocityX(this.speed);
    }

    // Vertical movement
    if (this.keys.up.isDown) {
      this.sprites.hero.body.setVelocityY(-this.speed);
    } else if (this.keys.down.isDown) {
      this.sprites.hero.body.setVelocityY(this.speed);
    }

    // Normalize and scale the velocity so that sprite can't move faster along a diagonal
    this.sprites.hero.body.velocity.normalize().scale(this.speed);

    // Update the animation last and give left/right/down animations precedence over up animations
    // Do nothing if slashing animation is playing
    if (!this.attacking) {
      if (this.keys.up.isDown) {
        this.lastDirection = 'up'
        if (this.keys.left.isDown) {
          this.walk("up-left");
        } else if (this.keys.right.isDown) {
          this.walk("up-right");
        } else {
          this.walk("up");
        }
      } else if (this.keys.down.isDown) {
        this.lastDirection = 'down'
        if (this.keys.left.isDown) {
          this.walk("down-left");
        } else if (this.keys.right.isDown) {
          this.walk("down-right");
        } else {
          this.walk("down");
        }
      } else if (this.keys.left.isDown) {
        this.lastDirection = 'left'
        this.walk("left");
      } else if (this.keys.right.isDown) {
        this.lastDirection = 'right'
        this.walk("right");
      } else {
        this.stop()

        // If we were moving & now we're not, then pick a single idle frame to use
        if (this.lastDirection === 'up') this.sprites.hero.setTexture("hero", 12);
        else if (this.lastDirection === 'down') this.sprites.hero.setTexture("hero", 37);
        else if (this.lastDirection === 'left') this.sprites.hero.setTexture("hero", 20);
        else if (this.lastDirection === 'right') this.sprites.hero.setTexture("hero", 15);
      }
    }

    this.sprites.sword.setX(this.sprites.hero.body.x + 9).setY(this.sprites.hero.body.y + 6)
  }
}
