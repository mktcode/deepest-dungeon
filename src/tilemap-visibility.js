/**
 * A small helper class that can take control of our shadow tilemap layer. It keeps track of which
 * room is currently active.
 */
export default class TilemapVisibility {
  constructor(shadowLayer, roomShadowLayer, restRoom, hero, level) {
    this.shadowLayer = shadowLayer;
    this.roomShadowLayer = roomShadowLayer;
    this.restRoom = restRoom;
    this.hero = hero;
    this.level = level;
    this.activeRoom = null;
  }

  // Helper to set the alpha on all tiles
  setShadow() {
    this.shadowLayer.forEachTile(
      (t) => {
        const heroVector = new Phaser.Math.Vector2(
          this.shadowLayer.worldToTileX(this.hero.sprites.hero.x),
          this.shadowLayer.worldToTileX(this.hero.sprites.hero.y)
        );
        const distance = heroVector.distance({x: t.x, y: t.y})
        t.alpha = this.restRoom === this.activeRoom ? 0 : 1 - 1 / Math.max(1, distance + this.level - 4)
      },
      this
    );
  }

  setActiveRoom(room) {
    // We only need to update the tiles if the active room has changed
    if (room !== this.activeRoom) {
      this.setRoomAlpha(room, 0); // Make the new room visible
      if (this.activeRoom) this.setRoomAlpha(this.activeRoom, Math.min(1, this.level / 5)); // Dim the old room
      this.activeRoom = room;
    }
  }

  // Helper to set the alpha on all tiles within a room
  setRoomAlpha(room, alpha) {
    this.roomShadowLayer.forEachTile(
      t => (t.alpha = alpha),
      this,
      room.x,
      room.y,
      room.width,
      room.height
    );
  }
}
