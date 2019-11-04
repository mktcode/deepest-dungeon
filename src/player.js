/**
 * A class that wraps up our top down player logic. It creates, animates and moves a sprite in
 * response to WASD keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */
export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    let moveFrameRate = 8

    const anims = scene.anims;
    anims.create({
      key: "player-walk-up",
      frames: anims.generateFrameNumbers("hero", { start: 10, end: 13 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-up-left",
      frames: anims.generateFrameNumbers("hero", { start: 5, end: 8 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-up-right",
      frames: anims.generateFrameNumbers("hero", { start: 0, end: 3 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-down",
      frames: anims.generateFrameNumbers("hero", { start: 35, end: 38 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-down-left",
      frames: anims.generateFrameNumbers("hero", { start: 30, end: 33 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-down-right",
      frames: anims.generateFrameNumbers("hero", { start: 25, end: 28 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-left",
      frames: anims.generateFrameNumbers("hero", { start: 20, end: 23 }),
      frameRate: moveFrameRate,
      repeat: -1
    });
    anims.create({
      key: "player-walk-right",
      frames: anims.generateFrameNumbers("hero", { start: 15, end: 18 }),
      frameRate: moveFrameRate,
      repeat: -1
    });

    this.sprite = scene.physics.add
      .sprite(x, y, "hero", 0)
      .setSize(22, 33)
      .setOffset(23, 27);

    this.sprite.anims.play("player-walk-down");

    this.keys = scene.input.keyboard.createCursorKeys();
  }

  freeze() {
    this.sprite.body.moves = false;
  }

  unfreeze() {
    this.sprite.body.moves = true;
  }

  update() {
    const keys = this.keys;
    const sprite = this.sprite;
    const speed = 150;
    const prevVelocity = sprite.body.velocity.clone();

    // Stop any previous movement from the last frame
    sprite.body.setVelocity(0);

    // Horizontal movement
    if (keys.left.isDown) {
      sprite.body.setVelocityX(-speed);
    } else if (keys.right.isDown) {
      sprite.body.setVelocityX(speed);
    }

    // Vertical movement
    if (keys.up.isDown) {
      sprite.body.setVelocityY(-speed);
    } else if (keys.down.isDown) {
      sprite.body.setVelocityY(speed);
    }

    // Normalize and scale the velocity so that sprite can't move faster along a diagonal
    sprite.body.velocity.normalize().scale(speed);

    // Update the animation last and give left/right/down animations precedence over up animations
    if (keys.up.isDown) {
      if (keys.left.isDown) {
        sprite.anims.play("player-walk-up-left", true);
      } else if (keys.right.isDown) {
        sprite.anims.play("player-walk-up-right", true);
      } else {
        sprite.anims.play("player-walk-up", true);
      }
    } else if (keys.down.isDown) {
      if (keys.left.isDown) {
        sprite.anims.play("player-walk-down-left", true);
      } else if (keys.right.isDown) {
        sprite.anims.play("player-walk-down-right", true);
      } else {
        sprite.anims.play("player-walk-down", true);
      }
    } else if (keys.left.isDown) {
      sprite.anims.play("player-walk-left", true);
    } else if (keys.right.isDown) {
      sprite.anims.play("player-walk-right", true);
    } else {
      sprite.anims.stop();

      // If we were moving & now we're not, then pick a single idle frame to use
      if (prevVelocity.y < 0) sprite.setTexture("hero", 12);
      else if (prevVelocity.y > 0) sprite.setTexture("hero", 37);
      else if (prevVelocity.x < 0) sprite.setTexture("hero", 20);
      else if (prevVelocity.x > 0) sprite.setTexture("hero", 15);
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
