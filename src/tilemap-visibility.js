/**
 * A small helper class that can take control of our shadow tilemap layer. It keeps track of which
 * room is currently active and what light intensity to apply to each tile.
 */
export default class TilemapVisibility {
  constructor(scene) {
    this.scene = scene
    this.activeRoom = null
    this.lights = []
  }

  removeLight(sprite) {
    const removeIndex = this.lights.findIndex(l => l.sprite === sprite)
    if (removeIndex !== -1) {
      this.lights.splice(removeIndex, 1)
    }
  }

  // Helper to set the alpha on all tiles
  setShadow() {
    const maxDarkness = 35
    this.scene.shadowLayer.forEachTile(
      (t) => {
        const alphaValues = []

        this.lights.forEach((light) => {
          const room = this.scene.dungeon.getRoomAt(
            this.scene.groundLayer.worldToTileX(light.sprite.x),
            this.scene.groundLayer.worldToTileY(light.sprite.y)
          );
          if (t.x >= room.left && t.x <= room.right && t.y >= room.top && t.y <= room.bottom) {
            const vector = new Phaser.Math.Vector2(
              this.scene.shadowLayer.worldToTileX(light.sprite.x),
              this.scene.shadowLayer.worldToTileX(light.sprite.y)
            );
            alphaValues.push(
              this.scene.restRoom === this.activeRoom && this.scene.restRoomActivated
              ? 0
              : 1 - 1 / Math.max(1, (Math.max(1, vector.distance({x: t.x, y: t.y})) + Math.min(maxDarkness, light.darkness()) - 4))
            )
          }
        })
        t.alpha = Math.min(...alphaValues)
      },
      this
    );
  }

  setActiveRoom(room) {
    // We only need to update the tiles if the active room has changed
    if (room !== this.activeRoom) {
      this.setRoomAlpha(room, 0); // Make the new room visible
      if (this.activeRoom) this.setRoomAlpha(this.activeRoom, Math.min(1, this.scene.level / 15)); // Dim the old room
      this.activeRoom = room;
    }
  }

  // Helper to set the alpha on all tiles within a room
  setRoomAlpha(room, alpha) {
    this.scene.roomShadowLayer.forEachTile(
      t => (t.alpha = alpha),
      this,
      room.x,
      room.y,
      room.width,
      room.height
    );
  }
}
