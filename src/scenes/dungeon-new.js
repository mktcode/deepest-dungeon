import Phaser from 'phaser'
import MapScene from './map.js'
import Narrator from '../narrator.js'
import Sounds from '../sounds.js'
import LightManager from '../light-manager.js'
import Hero from '../objects/hero'

export default class DungeonNewScene extends MapScene {
  constructor() {
    super('DungeonNew')
  }

  create() {
    this.prepareMap()
    this.addAmbientParticles()
    this.addFog()

    this.narrator = new Narrator(this)
    this.sounds = new Sounds(this)
    this.lightManager = new LightManager(this)
    this.hero = new Hero(this, 20 * 16, 42 * 16)

    this.cameras.main.setZoom(this.registry.get('zoom'))
    this.cameras.main.fadeIn(2000, 0, 0, 0)
  }

  prepareMap() {
    this.map = this.make.tilemap({ key: 'map' })
    const tileset = this.map.addTilesetImage('dungeon', 'tileset')
    this.layers = {
      wallsBelowFloor: this.map.createStaticLayer('wallsBelowFloor', tileset),
      floor1: this.map.createStaticLayer('floor1', tileset),
      floor2: this.map.createStaticLayer('floor2', tileset),
      wallsAboveFloor1: this.map.createDynamicLayer('wallsAboveFloor1', tileset),
      wallsAboveFloor2: this.map.createStaticLayer('wallsAboveFloor2', tileset),
      objects: this.map.createStaticLayer('objects', tileset),
      shadow: this.map.createDynamicLayer('shadow', tileset)
    }
    this.map.setCollisionByProperty({ collides: true })
    console.log(this.layers.wallsAboveFloor1.getTilesWithin().filter(t => t.index === 301))
    this.matter.world.convertTilemapLayer(this.layers.wallsAboveFloor1)

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
  }

  addAmbientParticles() {
    const ambientParticle = this.add.particles('particle').setDepth(9)
    ambientParticle.createEmitter({
      x: 0,
      y: 0,
      tint: [0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.5, end: 0 },
      alpha: { start: (Math.min(0.5, this.dungeonNumber / 10)), end: 0 },
      speed: 5,
      quantity: 5,
      frequency: 50,
      lifespan: 2000,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, this.game.scale.width, this.game.scale.height),
        type: 'random',
        quantity: 40
      }
    })
  }

  addFog() {
    const fogParticle = this.add.particles('fog').setDepth(9)
    fogParticle.createEmitter({
      x: 0,
      y: 0,
      tint: [0xFFFFFF],
      blendMode: 'SCREEN',
      alpha: (particle, key, time, value) => time < 0.5 ? time : 1 - time,
      angle: 0,
      speed: 50,
      quantity: 1,
      frequency: 250,
      lifespan: 6000,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, this.game.scale.width, this.game.scale.height),
        type: 'random',
        quantity: 1
      }
    })
  }
}
