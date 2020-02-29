export default class MapScene extends Phaser.Scene {
  constructor(key) {
    super(key)
    this.updaters = []
  }

  cameraFollow(object) {
    this.cameras.main.startFollow(object, true, 0.1, 0.1)
  }

  stopCameraFollow() {
    this.cameras.main.stopFollow()
  }

  cameraPan(x, y) {
    return new Promise(resolve => {
      if (this.registry.get('disableNarrator')) {
        resolve()
      } else {
        this.cameras.main.pan(x, y, 1000, 'Linear', false, (cam, progress) => {
          if (progress === 1) resolve()
        })
      }
    })
  }

  findClosestWalkablePoint(x, y) {
    const tileX = this.worldToTileX(x)
    const tileY = this.worldToTileX(y)

    const walkables = []
    this.getPathGrid().nodes.forEach((node) => {
      walkables.push(...node.filter(n => n.walkable))
    })

    // if clicked tile is walkable return point immediately
    if (walkables.find(t => t.x === tileX && t.y === tileY)) {
      return { x, y }
    }

    // otherwise get closest walkable tile and return center point of it
    // TODO: consider each corner of tile for being the closest point
    walkables.sort((a, b) => {
      return Phaser.Math.Distance.Between(a.x, a.y, tileX, tileY) - Phaser.Math.Distance.Between(b.x, b.y, tileX, tileY)
    })

    return { x: this.tileToWorldX(walkables[0].x) + this.tileSize / 2, y: this.tileToWorldY(walkables[0].y) + this.tileSize / 2 }
  }

  convertYToDepth(y, base) {
    return base + y / (y + 1)
  }

  tileToWorldX(x) {
    return this.map.tileToWorldX(x)
  }

  tileToWorldY(y) {
    return this.map.tileToWorldY(y)
  }

  worldToTileX(x) {
    return this.map.worldToTileX(x)
  }

  worldToTileY(y) {
    return this.map.worldToTileY(y)
  }

  getDirectionFromVector(vector) {
    return [
      'right',
      'down-right',
      'down',
      'down-left',
      'left',
      'up-left',
      'up',
      'up-right'
    ][((Math.round(Math.atan2(vector.y, vector.x) / (2 * Math.PI / 8))) + 8) % 8]
  }

  addUpdater(updater, context) {
    this.updaters.push(updater.bind(context))
  }

  update() {
    this.updaters.forEach(updater => updater())
  }
}
