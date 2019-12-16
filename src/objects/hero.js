import Phaser from "phaser"
import DungeonScene from "../scenes/dungeon.js"
import TILES from "../tile-mapping.js";

// assets
import hero from "../assets/hero.png";
import heroSword from "../assets/hero-sword.png";
import levelUp from "../assets/levelUp.png";
import xpDust from "../assets/xp-dust.png";

export default class Hero {
  constructor(scene, x, y) {
    this.scene = scene
    this.sprites = {
      hero: null,
      sword: null,
      levelUp: null
    }
    this.keys = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
    this.scene.input.addPointer(1)
    this.joystick = this.scene.plugins.get('joystick').add(this.scene, {
      base: this.scene.add.circle(0, 0, 80).setStrokeStyle(3, 0xffffff, 0),
      thumb: this.scene.add.circle(0, 0, 70).setFillStyle(0xffffff, 0),
      x: this.scene.game.scale.width / 4,
      y: this.scene.game.scale.height - 140,
      radius: 80,
      forceMin: 20
    })
    this.joystickCursorKeys = this.joystick.createCursorKeys()
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.x < this.scene.game.scale.width / 2) {
        this.joystick.setPosition(pointer.x, pointer.y)
      }
    })

    if (this.scene.scene.key.startsWith('Dungeon')) {
      const attackBtn = this.scene.add.rectangle(
        this.scene.game.scale.width * 0.75,
        this.scene.game.scale.height / 2,
        this.scene.game.scale.width / 2,
        this.scene.game.scale.height
      ).setStrokeStyle(3, 0xffffff, 0).setInteractive().setDepth(7).setScrollFactor(0)
      attackBtn.on('pointerdown', () => {
        if (this.scene.registry.get('weapon')) {
          this.attacking = true
          this.attack(this.lastDirection).once('complete', () => {
            this.attacking = false
          })
        }
      }, this)
    }

    this.attacking = false
    this.underAttack = false
    this.burning = false
    this.dead = false
    this.lastDirection = 'down'

    this.addToScene(x, y)

    // attack
    this.keys.space.on('down', () => {
      if (this.scene.registry.get('weapon')) {
        this.attacking = true
        this.attack(this.lastDirection).once('complete', () => {
          this.attacking = false
        })
      }
    })

    // use
    this.scene.input.keyboard.on('keyup-E', () => {
      this.useStairs()
      this.useShrine()
    });

    // show path
    this.scene.input.keyboard.on('keyup-Q', () => {
      this.usePathfinder()
    });
  }

  static preload(scene) {
    scene.load.spritesheet(
      "hero",
      hero,
      {
        frameWidth: 32,
        frameHeight: 32
      }
    );
    scene.load.spritesheet(
      "levelUp",
      levelUp,
      {
        frameWidth: 64,
        frameHeight: 64
      }
    );
    scene.load.spritesheet(
      "heroSword",
      heroSword,
      {
        frameWidth: 64,
        frameHeight: 64
      }
    );
    scene.load.spritesheet(
      "xpDust",
      xpDust,
      {
        frameWidth: 52,
        frameHeight: 22
      }
    );
  }

  static getLevelByXp(xp) {
    // required xp for level up: current level * 50
    // https://gamedev.stackexchange.com/questions/110431/how-can-i-calculate-current-level-from-total-xp-when-each-level-requires-propor
    return Math.floor((1 + Math.sqrt(1 + 8 * xp / 50)) / 2)
  }

  static getXpForLevelUp(level) {
    return ((Math.pow(level, 2) - level) * 50) / 2
  }

  hasItem(item) {
    return this.scene.registry.get('items').includes(item)
  }

  resetKeys() {
    this.keys.up.isDown = false
    this.keys.down.isDown = false
    this.keys.left.isDown = false
    this.keys.right.isDown = false
    this.keys.space.isDown = false
    this.keys.shift.isDown = false
    this.wasdKeys.up.isDown = false
    this.wasdKeys.down.isDown = false
    this.wasdKeys.left.isDown = false
    this.wasdKeys.right.isDown = false
  }

  useStairs() {
    if (this.isNear([
      ...TILES.STAIRS.OPEN[0],
      ...TILES.STAIRS.OPEN[1],
      ...TILES.STAIRS.OPEN[2],
      ...TILES.STAIRS.OPEN[3],
      ...TILES.STAIRS.OPEN[4]
    ])) {
      const nextDungeon = this.scene.dungeonNumber + 1
      this.scene.scene.sleep()
      if (this.scene.scene.get('Dungeon' + nextDungeon)) {
        this.scene.scene.wake('Dungeon' + nextDungeon)
      } else {
        this.scene.scene.add('Dungeon' + nextDungeon, new DungeonScene(nextDungeon), true)
        this.scene.scene.swapPosition('Gui', 'Dungeon' + nextDungeon);
      }
    }
  }

  useShrine() {
    if (this.isNear([TILES.SHRINE.TOP[0], TILES.SHRINE.BOTTOM[0], TILES.SHRINE.LEFT[0], TILES.SHRINE.RIGHT[0]])) {
      this.scene.safeRoomActivated = true
      this.scene.registry.set('minDungeon', this.scene.dungeonNumber)
      this.scene.scene.run('Character')
      this.scene.scene.bringToTop('Character')
    }
  }

  usePathfinder() {
    if (
      this.scene.registry.get('items').includes('pathfinder') &&
      !this.scene.registry.get('pathfinderCooldown')
    ) {
      this.scene.showPath()
    }
  }

  isNear(tileNumbers) {
    if (!Array.isArray(tileNumbers)) {
      tileNumbers = [tileNumbers]
    }

    const tiles = this.scene.stuffLayer.getTilesWithin(
      this.scene.worldToTileX(this.sprites.hero.x) - 1,
      this.scene.worldToTileY(this.sprites.hero.y) - 1,
      3, 3
    )

    return tiles.find(tile => tileNumbers.includes(tile.index))
  }

  addToScene(x, y) {
    this.sprites.hero = this.scene.matter.add
      .sprite(x, y, 'hero', 35)
      .setRectangle(8, 8)
      .setFixedRotation()
      .setOrigin(0.5, 0.7)
      .setDepth(6);
    this.scene.cameras.main.startFollow(this.sprites.hero, true, 0.1, 0.1)

    this.sprites.levelUp = this.scene.matter.add.sprite(x, y, "levelUp", 0).setDepth(6);
    this.sprites.sword = this.scene.matter.add.sprite(x, y, "heroSword", 0).setDepth(6);
    this.setSwordHitBox('down')
  }

  jumpTo(x, y) {
    this.sprites.hero.setX(x).setY(y)
    this.sprites.sword.setX(x + 9).setY(y + 6)
  }

  walk(direction) {
    if (!direction) {
      direction = this.lastDirection
    }
    this.setSwordHitBox(direction)
    let slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    this.sprites.hero.anims.play('walk-' + direction + slowmo, true)
  }

  attack(direction) {
    if (!direction) {
      direction = this.lastDirection
    }
    let slowmo = this.scene.narrator && this.scene.narrator.slowmo ? '-slowmo': ''
    this.sprites.hero.anims.play('attack-' + direction + slowmo, true)
    this.sprites.sword.anims.play('sword-' + direction + slowmo, true)
    return this.scene.anims.get('attack-' + direction + slowmo)
  }

  takeDamage(damage) {
    const hero = this.sprites.hero
    let heroHp = this.scene.registry.get('health')
    heroHp -= damage
    this.scene.registry.set('health', heroHp)
    this.scene.flashSprite(hero)
    this.scene.popupDamageNumber(damage, hero, '#CC0000')

    if (hero.body.touching.up) {
      hero.body.setVelocityY(300)
    } else if (hero.body.touching.down) {
      hero.body.setVelocityY(-300)
    } else if (hero.body.touching.left) {
      hero.body.setVelocityX(300)
    } else if (hero.body.touching.right) {
      hero.body.setVelocityX(-300)
    }

    if (heroHp <= 0) {
      this.dead = true
      this.scene.cameras.main.fadeOut(1000, 0, 0, 0)
      this.scene.time.delayedCall(600, () => {
        const x = this.sprites.hero.body.x
        const y = this.sprites.hero.body.y
        if (this.hasItem('sword')) {
          this.scene.addSword(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15))
        }
        if (this.hasItem('pathfinder')) {
          this.scene.addPathfinder(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15))
        }
        this.scene.registry.set('items', [])
        this.scene.registry.set('weapon', null)
        const lastLevelXp = this.constructor.getXpForLevelUp(this.scene.registry.get('level'))
        const lostXp = this.scene.registry.get('xp') - lastLevelXp
        const lostSkillPoints = this.scene.registry.get('skillPoints') - this.scene.registry.get('skillPointsSpent')
        this.scene.registry.set('skillPoints', this.scene.registry.get('skillPointsSpent'))
        if (lostXp || lostSkillPoints) {
          this.scene.addXpDust(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15), lostXp, lostSkillPoints)
        }

        this.scene.registry.set('xp', lastLevelXp)
        this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
        this.scene.hero.freeze()
        this.scene.scene.sleep()
        this.scene.scene.wake('Dungeon' + this.scene.registry.get('minDungeon'))
      })
    }

    this.scene.time.delayedCall(300, () => {
      this.cantMove = false
    })
    this.scene.time.delayedCall(1500, () => {
      this.underAttack = false
      this.burning = false
    })
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
    // if (direction === 'down') {
    //   this.sprites.sword.setSize(50, 30).setOffset(40, 87)
    // } else if (direction === 'down-left') {
    //   this.sprites.sword.setSize(50, 30).setOffset(25, 87)
    // } else if (direction === 'down-right') {
    //   this.sprites.sword.setSize(50, 30).setOffset(55, 87)
    // } else if (direction === 'up') {
    //   this.sprites.sword.setSize(50, 30).setOffset(40, 28)
    // } else if (direction === 'up-left') {
    //   this.sprites.sword.setSize(50, 30).setOffset(25, 28)
    // } else if (direction === 'up-right') {
    //   this.sprites.sword.setSize(50, 30).setOffset(55, 28)
    // } else if (direction === 'left') {
    //   this.sprites.sword.setSize(30, 50).setOffset(24, 47)
    // } else if (direction === 'right') {
    //   this.sprites.sword.setSize(30, 50).setOffset(76, 47)
    // }
  }

  isDirectionKeyDown(direction) {
    return this.keys[direction].isDown || this.wasdKeys[direction].isDown || this.joystickCursorKeys[direction].isDown
  }

  update() {
    if (!this.cantMove) {
      // Stop any previous movement from the last frame
      this.sprites.hero.setVelocity(0);

      this.baseSpeed = this.scene.narrator.slowmo ? 0.5 : 2

      if (this.joystick.force >= this.joystick.touchCursor.forceMin) {
        // this.scene.physics.velocityFromRotation(
        //   this.joystick.rotation,
        //   Math.min(this.baseSpeed, this.baseSpeed * (this.joystick.force / 50)),
        //   this.sprites.hero.body.velocity
        // )
      } else {
        // Horizontal movement
        if (this.isDirectionKeyDown('left')) {
          this.sprites.hero.setVelocityX(-this.baseSpeed);
        } else if (this.isDirectionKeyDown('right')) {
          this.sprites.hero.setVelocityX(this.baseSpeed);
        }

        // Vertical movement
        if (this.isDirectionKeyDown('up')) {
          this.sprites.hero.setVelocityY(-this.baseSpeed);
        } else if (this.isDirectionKeyDown('down')) {
          this.sprites.hero.setVelocityY(this.baseSpeed);
        }

        // Normalize and scale the velocity so that sprite can't move faster along a diagonal
        const vector = new Phaser.Math.Vector2(this.sprites.hero.body.velocity)
        vector.normalize().scale(this.baseSpeed)
        this.sprites.hero.setVelocity(vector.x, vector.y);
      }

      // Update the animation last and give left/right/down animations precedence over up animations
      // Do nothing if slashing animation is playing
      if (!this.attacking) {
        if (this.isDirectionKeyDown('up')) {
          this.lastDirection = 'up'
          if (this.isDirectionKeyDown('left')) {
            this.walk("up-left");
          } else if (this.isDirectionKeyDown('right')) {
            this.walk("up-right");
          } else {
            this.walk("up");
          }
        } else if (this.isDirectionKeyDown('down')) {
          this.lastDirection = 'down'
          if (this.isDirectionKeyDown('left')) {
            this.walk("down-left");
          } else if (this.isDirectionKeyDown('right')) {
            this.walk("down-right");
          } else {
            this.walk("down");
          }
        } else if (this.isDirectionKeyDown('left')) {
          this.lastDirection = 'left'
          this.walk("left");
        } else if (this.isDirectionKeyDown('right')) {
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
    }

    this.sprites.sword.setX(this.sprites.hero.body.x + 9).setY(this.sprites.hero.body.y + 6)
    this.sprites.levelUp.setX(this.sprites.hero.body.x + 9).setY(this.sprites.hero.body.y + 6)
  }
}
