import Phaser from 'phaser'

/**
 * A small helper class that can take control of our shadow tilemap layer. It keeps track of which
 * room is currently active and what light intensity to apply to each tile.
 */
export default class LightManager {
  constructor(scene) {
    this.scene = scene
    this.scene.addUpdater(this.update, this)
    this.lights = []
    this.darkness = 5
    this.range = 15
    this.center = () => ({ x: 0, y: 0 })
  }

  removeLight(sprite) {
    const removeIndex = this.lights.findIndex(l => l.sprite === sprite)
    if (removeIndex !== -1) {
      this.lights.splice(removeIndex, 1)
    }
  }

  removeLightByKey(key) {
    const removeIndex = this.lights.findIndex(l => l.key === key)
    if (removeIndex !== -1) {
      this.lights.splice(removeIndex, 1)
    }
  }

  getLightsByRoom(room) {
    return this.lights.filter(light => {
      let tileX, tileY
      if (light.sprite) {
        tileX = this.scene.worldToTileX(light.sprite.x)
        tileY = this.scene.worldToTileY(light.sprite.y)
      } else {
        tileX = light.x()
        tileY = light.y()
      }
      return room === this.scene.dungeon.getRoomAt(tileX, tileY)
    })
  }

  getTilesByRoom(room) {
    return this.scene.layers.shadow.getTilesWithin(room.x, room.y, room.width, room.height)
  }

  getTilesInRange(range) {
    return this.scene.layers.shadow.getTilesWithin().filter(t => {
      const distance = Math.abs(Phaser.Math.Distance.Between(t.x, t.y, this.center().x, this.center().y))
      return distance <= range
    })
  }

  getTilesOutOfRange(range) {
    return this.scene.layers.shadow.getTilesWithin().filter(t => {
      const distance = Math.abs(Phaser.Math.Distance.Between(t.x, t.y, this.center().x, this.center().y))
      return distance > range
    })
  }

  static flickering(intensity) {
    const time = new Date()
    return (intensity || 0) + [0.5, 0.5, 0.4, 0.4, 0.5, 0.6, 0.5, 0.5, 0.6, 0.7][time.getTime().toString()[time.getTime().toString().length - 3]]
  }

  // Helper to set the alpha on all tiles
  update() {
    this.getTilesOutOfRange(this.range).forEach(t => t.alpha = 1)
    const minLight = 0 //Math.max(0.08, Math.min(1 / this.darkness, 0.7))
    this.getTilesInRange(this.range).forEach((tile) => {
      const lightValues = []
      this.lights.forEach((light) => {
        const vector = new Phaser.Math.Vector2(
          light.sprite ? this.scene.worldToTileX(light.sprite.x) : light.x(),
          light.sprite ? this.scene.worldToTileY(light.sprite.y) : light.y()
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
    })
  }
}
