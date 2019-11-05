/**
 * A class that wraps up our top down player logic. It creates, animates and moves a sprite in
 * response to WASD keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */
export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    let moveFrameRate = 8
    let swordFrameRate = 12

    const anims = scene.anims;
    anims.create({
      key: "walk-up",
      frames: anims.generateFrameNumbers("hero", { start: 10, end: 13 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-up-left",
      frames: anims.generateFrameNumbers("hero", { start: 5, end: 8 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-up-right",
      frames: anims.generateFrameNumbers("hero", { start: 0, end: 3 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-down",
      frames: anims.generateFrameNumbers("hero", { start: 35, end: 38 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-down-left",
      frames: anims.generateFrameNumbers("hero", { start: 30, end: 33 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-down-right",
      frames: anims.generateFrameNumbers("hero", { start: 25, end: 28 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-left",
      frames: anims.generateFrameNumbers("hero", { start: 20, end: 23 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "walk-right",
      frames: anims.generateFrameNumbers("hero", { start: 15, end: 18 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "slash-up",
      frames: anims.generateFrameNumbers("hero", { start: 40, end: 44 }),
      frameRate: moveFrameRate,
      repeat: 0
    });
    anims.create({
      key: "slash-down",
      frames: anims.generateFrameNumbers("hero", { start: 55, end: 59 }),
      frameRate: moveFrameRate,
      repeat: 0
    });
    anims.create({
      key: "slash-left",
      frames: anims.generateFrameNumbers("hero", { start: 45, end: 49 }),
      frameRate: moveFrameRate,
      repeat: 0
    });
    anims.create({
      key: "slash-right",
      frames: anims.generateFrameNumbers("hero", { start: 50, end: 54 }),
      frameRate: moveFrameRate,
      repeat: 0
    });
    anims.create({
      key: "sword-up",
      frames: anims.generateFrameNumbers("sword", { start: 0, end: 4 }),
      frameRate: swordFrameRate,
      repeat: 0,
      hideOnComplete: true,
      showOnStart: true
    });
    anims.create({
      key: "sword-down",
      frames: anims.generateFrameNumbers("sword", { start: 15, end: 19 }),
      frameRate: swordFrameRate,
      repeat: 0,
      hideOnComplete: true,
      showOnStart: true
    });
    anims.create({
      key: "sword-left",
      frames: anims.generateFrameNumbers("sword", { start: 5, end: 9 }),
      frameRate: swordFrameRate,
      repeat: 0,
      hideOnComplete: true,
      showOnStart: true
    });
    anims.create({
      key: "sword-right",
      frames: anims.generateFrameNumbers("sword", { start: 10, end: 14 }),
      frameRate: swordFrameRate,
      repeat: 0,
      hideOnComplete: true,
      showOnStart: true
    });

    this.hero = scene.physics.add
      .sprite(x, y, "hero", 1)
      .setSize(20, 27)
      .setOffset(23, 27);
    this.sword = scene.physics.add
      .sprite(x, y, "sword", 0)
      .setSize(64, 64)
      .setOffset(64, 0);

    this.hero.anims.play("walk-down");
    this.lastDirection = 'down'

    this.keys = scene.input.keyboard.createCursorKeys();

    anims.get('sword-up').on('complete', () => {
      this.slashing = false
      this.hero.setTexture("hero", 12)
    })
    anims.get('sword-down').on('complete', () => {
      this.slashing = false
      this.hero.setTexture("hero", 37)
    })
    anims.get('sword-left').on('complete', () => {
      this.slashing = false
      this.hero.setTexture("hero", 20)
    })
    anims.get('sword-right').on('complete', () => {
      this.slashing = false
      this.hero.setTexture("hero", 15)
    })
    this.keys.space.on('down', () => {
      this.slashing = true
      if (this.lastDirection === 'up') {
        this.hero.anims.play('slash-up', true)
        this.sword.anims.play('sword-up', true)
      } else if (this.lastDirection === 'down') {
        this.hero.anims.play('slash-down', true)
        this.sword.anims.play('sword-down', true)
      } else if (this.lastDirection === 'left') {
        this.hero.anims.play('slash-left', true)
        this.sword.anims.play('sword-left', true)
      } else if (this.lastDirection === 'right') {
        this.hero.anims.play('slash-right', true)
        this.sword.anims.play('sword-right', true)
      }
    })
  }

  freeze() {
    this.hero.body.moves = false;
  }

  unfreeze() {
    this.hero.body.moves = true;
  }

  update() {
    const keys = this.keys;
    const hero = this.hero;
    const sword = this.sword;
    const speed = 150;

    // Stop any previous movement from the last frame
    hero.body.setVelocity(0);

    // Horizontal movement
    if (keys.left.isDown) {
      hero.body.setVelocityX(-speed);
    } else if (keys.right.isDown) {
      hero.body.setVelocityX(speed);
    }

    // Vertical movement
    if (keys.up.isDown) {
      hero.body.setVelocityY(-speed);
    } else if (keys.down.isDown) {
      hero.body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that sprite can't move faster along a diagonal
    hero.body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right/down animations precedence over up animations
    // Do nothing if slashing animation is playing
    if (!this.slashing) {
      if (keys.up.isDown) {
        this.lastDirection = 'up'
        if (keys.left.isDown) {
          hero.anims.play("walk-up-left", true);
        } else if (keys.right.isDown) {
          hero.anims.play("walk-up-right", true);
        } else {
          hero.anims.play("walk-up", true);
        }
      } else if (keys.down.isDown) {
        this.lastDirection = 'down'
        if (keys.left.isDown) {
          hero.anims.play("walk-down-left", true);
        } else if (keys.right.isDown) {
          hero.anims.play("walk-down-right", true);
        } else {
          hero.anims.play("walk-down", true);
        }
      } else if (keys.left.isDown) {
        this.lastDirection = 'left'
        hero.anims.play("walk-left", true);
      } else if (keys.right.isDown) {
        this.lastDirection = 'right'
        hero.anims.play("walk-right", true);
      } else {
        hero.anims.stop();

        // If we were moving & now we're not, then pick a single idle frame to use
        if (this.lastDirection === 'up') hero.setTexture("hero", 12);
        else if (this.lastDirection === 'down') hero.setTexture("hero", 37);
        else if (this.lastDirection === 'left') hero.setTexture("hero", 20);
        else if (this.lastDirection === 'right') hero.setTexture("hero", 15);
      }
    }

    sword.setX(hero.body.x + 9).setY(hero.body.y + 6)
  }

  destroy() {
    this.hero.destroy();
  }
}
