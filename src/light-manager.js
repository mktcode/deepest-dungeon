/**
 * A small helper class that can take control of our shadow tilemap layer. It keeps track of which
 * room is currently active and what light intensity to apply to each tile.
 */
export default class LightManager {
  constructor(scene) {
    this.scene = scene
    this.lights = []
  }

  removeLight(sprite) {
    const removeIndex = this.lights.findIndex(l => l.sprite === sprite)
    if (removeIndex !== -1) {
      this.lights.splice(removeIndex, 1)
    }
  }

  getLightsByRoom(room) {
    return this.lights.filter(light => {
      return room === this.scene.dungeon.getRoomAt(
        this.scene.floorLayer.worldToTileX(light.sprite.x),
        this.scene.floorLayer.worldToTileY(light.sprite.y)
      );
    })
  }

  getTilesByRoom(room) {
    return this.scene.shadowLayer.getTilesWithin(room.x, room.y, room.width, room.height)
  }

  static flickering() {
    const time = new Date()
    return [0.5, 0.5, 0.4, 0.4, 0.5, 0.6, 0.5, 0.5, 0.6, 0.7][time.getTime().toString()[time.getTime().toString().length - 3]]
  }

  // Helper to set the alpha on all tiles
  update() {
    const minLight = Math.max(0.03, 1 / this.scene.dungeonNumber)
    this.scene.dungeon.rooms.forEach(room => {
      const lights = this.getLightsByRoom(room)
      const tiles = this.getTilesByRoom(room)

      if (room === this.scene.currentRoom) {
        tiles.forEach((tile) => {
          if (room === this.scene.restRoom && this.scene.restRoomActivated) {
            tile.alpha = 0
          } else {
            const lightValues = []
            lights.forEach((light) => {
              const vector = new Phaser.Math.Vector2(
                this.scene.shadowLayer.worldToTileX(light.sprite.x),
                this.scene.shadowLayer.worldToTileX(light.sprite.y)
              );
              const distance = Math.max(1, vector.distance({x: tile.x, y: tile.y}))
              const lightValue = Math.max(minLight, 1 / distance * light.intensity())

              lightValues.push(lightValue)
            })
            const targetAlpha = 1 - Math.max(...lightValues)
            // smooth out the alpha difference to have a more fade-like effect
            let alphaDiff = targetAlpha - tile.alpha
            if (alphaDiff > 0.02) alphaDiff = 0.02
            if (alphaDiff < -0.02) alphaDiff = -0.02
            tile.alpha += alphaDiff
          }
        })
      } else if (this.scene.visitedRooms.includes(room)) {
        tiles.forEach((tile) => {
          tile.alpha = 1 - minLight / 2
        })
      } else {

      }
    })
  }
}
