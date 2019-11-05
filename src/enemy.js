/**
 * A class that wraps up our top down player logic. It creates, animates and moves a sprite in
 * response to WASD keys. Call its update method from the scene's update and call its destroy
 * method when you're done with the player.
 */
export default class Enemy {
  constructor(scene, map, room) {
    this.scene = scene;
    this.map = map;
    this.room = room;
    this.directionX = ['left', 'right'][Math.floor(Math.random() * 2)]
    this.directionY = ['up', 'down'][Math.floor(Math.random() * 2)]

    const anims = scene.anims;
    anims.create({
      key: "enemy-walk",
      frames: anims.generateFrameNumbers("characters", { start: 69, end: 72 }),
      frameRate: 4,
      repeat: -1
    });

    this.sprite = scene.physics.add
      .sprite(map.tileToWorldX(this.room.centerX), map.tileToWorldY(this.room.centerY), "characters", 0)
      .setSize(27, 28)
      .setOffset(20, 35);

    this.sprite.anims.play("enemy-walk");
  }

  update() {
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

  destroy() {
    this.sprite.destroy();
  }
}
