import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Hero from "../objects/hero.js";
import Deamon from "../objects/enemies/deamon.js";
import Zombie from "../objects/enemies/zombie.js";
import Spider from "../objects/enemies/spider.js";
import TILES from "../tile-mapping.js";
import LightManager from "../light-manager.js";
import Narrator from '../narrator.js'
import Sounds from '../sounds.js'
import PathFinder from 'pathfinding'
import { Slice } from 'polyk'

// assets
import tileset from "../assets/dungeon-tileset-extruded.png";
import swordSprite from "../assets/sword.png";
import torchSprite from "../assets/torch.png";
import pathSprite from "../assets/path.png";
import pathfinderSprite from "../assets/pathfinder.png";
import particle from "../assets/particle.png";

export default class DungeonScene extends Phaser.Scene {
  constructor(dungeonNumber) {
    super('Dungeon' + dungeonNumber)
    this.dungeonNumber = dungeonNumber
    this.dungeon = new Dungeon({
      randomSeed: 'Dungeon' + this.dungeonNumber,
      width: Math.min(200, 65 + this.dungeonNumber),
      height: Math.min(200, 65 + this.dungeonNumber),
      doorPadding: 4,
      rooms: {
        width: { min: 17, max: 27, onlyOdd: true },
        height: { min: 15, max: 27, onlyOdd: true },
        maxArea: 961
      }
    })
    const rooms = this.dungeon.rooms.slice()
    this.otherRooms = rooms
    this.startRoom = this.getStartRoom()
    this.visitedRooms = [this.startRoom]
    this.currentRoom = this.startRoom
    this.endRoom = this.getEndRoom()
    this.safeRoom = this.getSafeRoom()

    this.sword = null
    this.torch = null
    this.pathfinder = null
    this.pathSprites = []
    this.safeRoomActivated = false

    this.enemies = []
    this.xpOrbs = []

    this.isStatic = { isStatic: true }

    this.nextOuttake = 1

    this.xpOrbSound = 1
    this.xpOrbSoundResetTimeout = null
  }

  static preload(scene) {
    scene.load.image("tileset", tileset)
    scene.load.spritesheet('sword', swordSprite, { frameWidth: 31, frameHeight: 31 })
    scene.load.spritesheet('torch', torchSprite, { frameWidth: 8, frameHeight: 18 })
    scene.load.spritesheet('path', pathSprite, { frameWidth: 6, frameHeight: 6 })
    scene.load.spritesheet('pathfinder', pathfinderSprite, { frameWidth: 24, frameHeight: 24 })
    scene.load.image('particle', particle)
  }

  create() {
    this.cameras.main.setZoom(2)
    this.cameras.main.fadeIn(1000, 0, 0, 0)
    this.narrator = new Narrator(this)
    this.sounds = new Sounds(this)
    this.music = this.registry.get('music')
    this.music.setRate(1)
    this.registry.set('currentDungeon', this.dungeonNumber)
    this.interactionParticle = this.add.particles('particle').setDepth(5)
    this.interactionParticleAbove = this.add.particles('particle').setDepth(7)
    this.fireParticle = this.add.particles('particle').setDepth(7)
    this.fireParticleAbove = this.add.particles('particle').setDepth(10)
    this.xpParticle = this.add.particles('particle').setDepth(7)
    // this.matter.world.createDebugGraphic()

    this.prepareMap()
    this.prepareRooms()
    this.prepareSafeRoom()
    this.addStairs()
    this.addHero()
    this.addEnemies()
    this.addItems()
    this.addFireTraps()
    this.addTimebomb()
    this.addOverlayText()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(1000, 0, 0, 0)
      this.cameras.main.shake(1000, 0, true) // interrupt shake if dungeon was shaking when leaving it
      this.music.setRate(1)
      this.sounds.running.setVolume(0)
      this.sounds.walking.setVolume(0)
      this.registry.set('currentDungeon', this.dungeonNumber)
      this.addEnemies(true)

      // keyboard bug workaround
      this.hero.resetKeys()

      if (this.dungeonNumber === 1) {
        if (this.registry.get('narratorSaid').includes('whenHeWasDefeated')) {
          this.narrator.sayOnce('againEmptiness')
        } else {
          this.narrator.sayOnce('whenHeWasDefeated')
        }
      }

      // place hero
      this.hero.sprites.hero.visible = false
      this.hero.freeze()
      this.time.delayedCall(1000, () => {
        this.hero.sprites.hero.visible = true
        this.hero.dead = false
        this.hero.unfreeze()
        this.hero.jumpTo(
          this.tileToWorldX(this.safeRoom && this.safeRoomActivated ? this.safeRoom.centerX : this.startRoom.centerX),
          this.tileToWorldY(this.safeRoom && this.safeRoomActivated ? this.safeRoom.centerY : this.startRoom.centerY)
        )
      })
    })

    this.events.on('sleep', () => {
      this.sounds.stop('ticking')
      this.sounds.stop('tickingFast')
      this.sounds.running.setVolume(0)
      this.sounds.walking.setVolume(0)
      this.countdown = null
      if (this.countdownText) {
        this.countdownText.destroy()
      }
      if (this.heroParticles) {
        this.heroParticles.stop()
      }
    })

    if (this.dungeonNumber === 1) {
      this.narrator.freezeStart()
      this.narrator.sayOnce('whereAmI', 1).then(() => this.narrator.freezeEnd())
    }

    if (this.dungeonNumber === 3) {
      this.narrator.slowmoStart()
      this.narrator.sayOnce('maybeAboutDecisions', 1).then(() => this.narrator.slowmoEnd())
    }

    if (this.dungeonNumber === 5) {
      this.narrator.slowmoStart()
      this.narrator.sayOnce('theDeeperHeWent', 1).then(() => this.narrator.slowmoEnd())
    }

    if (this.dungeonNumber === 11) {
      this.narrator.slowmoStart()
      this.narrator.sayOnce('slowlyHeBeganToQuestion', 1).then(() => this.narrator.slowmoEnd())
    }

    if (this.dungeonNumber === 12) {
      this.narrator.freezeStart()
      this.narrator.sayOnce('theEnd', 1).then(() => {
        this.narrator.freezeEnd()
        const items = this.registry.get('items')
        items.push('sword')
        items.push('torch')
        items.push('torch')
        this.registry.set('items', items)
        this.registry.set('weapon', 'sword')
        this.registry.set('health', 30)
        this.registry.set('maxHealth', 30)
        this.registry.set('damage', 1337 / 2)
      })
    }

    if (this.dungeonNumber >= 12) {
      this.addCreditsToRandomRoom('Support me!' + "\n" + 'patreon.com/mkt' + "\n" + '...or below the game! ;)')
      this.addCreditsToRandomRoom('Music:' + "\n" + 'Kai Engel' + "\n" +  'kai-engel.com')
      this.addCreditsToRandomRoom('Dungeon Design:' + "\n" + 'Szadi art.' + "\n" +  'szadiart.itch.io')
      this.addCreditsToRandomRoom('Character Design:' + "\n" + 'Robert Ramsay' + "\n" +  'robertramsay.co.uk')
      this.addCreditsToRandomRoom('Other Stuff:' + "\n" + 'opengameart.org' + "\n" +  'freesound.org')
    }

    this.input.keyboard.on('keyup-ESC', () => {
      this.scene.pause()
      if (this.narrator.playing) this.narrator.playing.pause()
      this.scene.run('Pause')
    })
  }

  addCreditsToRandomRoom(text) {
    const room = this.dungeon.r.randomPick(this.otherRooms)
    Phaser.Utils.Array.Remove(this.otherRooms, room)
    this.add.text(
      this.tileToWorldX(room.centerX) - 25,
      this.tileToWorldY(room.centerY),
      text,
      {
        font: "10px monospace",
        fill: "#FFFFFF"
      }
    ).setDepth(5).setAlpha(0.5).setAlign('center')
  }

  getStartRoom() {
    if (this.startRoom) return this.startRoom
    return this.otherRooms.shift()
  }

  getEndRoom() {
    if (this.endRoom) return this.endRoom

    // for the first level the endroom will be the last one that is entered
    if (this.dungeonNumber === 1) {
      if (this.visitedRooms.length === this.dungeon.rooms.length - 1) {
        this.endRoom = this.otherRooms.find(r => !this.visitedRooms.includes(r))
        this.addStairs()
      }
      return null
    } else {
      const roomsWithOneDoor = this.otherRooms.filter(r => r.getDoorLocations().length === 1)
      const endRoom = roomsWithOneDoor.sort((a, b) => a.width * a.height - b.width * b.height)[0]
      Phaser.Utils.Array.Remove(this.otherRooms, endRoom)
      return endRoom
    }
  }

  getSafeRoom() {
    if (!(this.dungeonNumber % 4)) {
      if (this.safeRoom) return this.safeRoom

      const roomsWithOneDoor = this.otherRooms.filter(r => r.getDoorLocations().length === 1)
      const safeRoom = roomsWithOneDoor.sort((a, b) => a.width * a.height - b.width * b.height)[0]
      Phaser.Utils.Array.Remove(this.otherRooms, safeRoom)
      return safeRoom
    }

    return null
  }

  prepareMap() {
    // Creating a blank tilemap with dimensions matching the dungeon
    this.tileSize = 16
    this.map = this.make.tilemap({
      tileWidth: this.tileSize,
      tileHeight: this.tileSize,
      width: this.dungeon.width,
      height: this.dungeon.height
    });
    this.tileset = this.map.addTilesetImage('tileset', null, this.tileSize, this.tileSize, 1, 2); // 1px margin, 2px spacing

    this.floorLayer = this.map.createBlankDynamicLayer("Floor", this.tileset).fill(TILES.BLANK).setDepth(1);
    this.wallLayer = this.map.createBlankDynamicLayer("Wall", this.tileset).fill(TILES.BLANK).setDepth(2);
    this.wallAboveLayer = this.map.createBlankDynamicLayer("WallAbove", this.tileset).fill(TILES.BLANK).setDepth(8);
    this.stuffLayer = this.map.createBlankDynamicLayer("Stuff", this.tileset).setDepth(5);
    this.stuffLayerAbove = this.map.createBlankDynamicLayer("StuffAbove", this.tileset).setDepth(9);
    this.shadowLayer = this.map.createBlankDynamicLayer("Shadow", this.tileset).fill(TILES.SHADOW).setDepth(10);
    this.lightManager = new LightManager(this);

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
  }

  prepareRooms() {
    this.walls = []
    // Use the array of rooms generated to place tiles in the map
    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;
      const doors = room.getDoorLocations();

      let floorTiles = TILES.FLOOR
      let topWallTiles = TILES.WALL.TOP
      let topDoorTiles = TILES.DOOR.TOP
      if (room === this.safeRoom) {
        floorTiles = TILES.FLOOR_ALT
        topWallTiles = TILES.WALL.TOP_ALT
        topDoorTiles = TILES.DOOR.TOP_ALT
      }
      // Fill the floor
      this.floorLayer.weightedRandomize(left, top, width, height, floorTiles)

      // Place the room corners tiles
      this.wallLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top, 1, 1);
      this.wallLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top, 1, 1);
      this.wallLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom, 1, 1);
      this.wallLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom, 1, 1);

      // Fill the walls
      // top
      this.wallLayer.weightedRandomize(left + 1, top, width - 2, 1, topWallTiles[0]);
      this.wallLayer.weightedRandomize(left + 1, top + 1, width - 2, 1, topWallTiles[1]);
      this.wallLayer.weightedRandomize(left + 1, top + 2, width - 2, 1, topWallTiles[2]);
      this.wallLayer.weightedRandomize(left + 1, top + 3, width - 2, 1, topWallTiles[3]);
      // bottom
      this.wallLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
      // left
      this.wallLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT[0]);
      this.wallLayer.putTileAt(TILES.WALL.LEFT[1][0], left + 1, top + 3, 1, height - 2);
      this.wallLayer.weightedRandomize(left + 1, top + 4, 1, height - 5, TILES.WALL.LEFT[1][1]);
      // right
      this.wallLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT[0]);
      this.wallLayer.putTileAt(TILES.WALL.RIGHT[1][0], right - 1, top + 3, 1, height - 2);
      this.wallLayer.weightedRandomize(right - 1, top + 4, 1, height - 5, TILES.WALL.RIGHT[1][1]);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the room's location
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.wallLayer.putTilesAt(topDoorTiles, x + doors[i].x - 2, y + doors[i].y);
        } else if (doors[i].y === room.height - 1) {
          this.wallLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 2, y + doors[i].y);
        } else if (doors[i].x === 0) {
          this.wallLayer.putTilesAt(TILES.DOOR.LEFT[0], x + doors[i].x, y + doors[i].y - 2);
          this.wallLayer.putTilesAt(TILES.DOOR.LEFT[1], x + doors[i].x + 1, y + doors[i].y + 1);
        } else if (doors[i].x === room.width - 1) {
          this.wallLayer.putTilesAt(TILES.DOOR.RIGHT[0], x + doors[i].x, y + doors[i].y - 2);
          this.wallLayer.putTilesAt(TILES.DOOR.RIGHT[1], x + doors[i].x - 1, y + doors[i].y + 1);
        }
      }

      // fill above layer
      this.wallLayer.forEachTile(tile => {
        if (
          TILES.WALL.TOP[0].find(t => t.index === tile.index) ||
          TILES.WALL.TOP_ALT[0].find(t => t.index === tile.index) ||
          TILES.WALL.BOTTOM.find(t => t.index === tile.index) ||
          TILES.WALL.LEFT[0].find(t => t.index === tile.index) ||
          TILES.WALL.RIGHT[0].find(t => t.index === tile.index) ||
          TILES.WALL.TOP_LEFT === tile.index ||
          TILES.WALL.TOP_RIGHT === tile.index ||
          TILES.DOOR.TOP[0][0] === tile.index ||
          TILES.DOOR.TOP[0][4] === tile.index ||
          TILES.DOOR.BOTTOM[0] === tile.index ||
          TILES.DOOR.BOTTOM[4] === tile.index
        ) {
          this.wallLayer.removeTileAt(tile.x, tile.y, false)
          this.wallAboveLayer.putTileAt(tile.index, tile.x, tile.y)
        }
      })

      // set collision
      const hasTopDoors = doors.find(d => d.y === 0)
      const hasBottomDoors = doors.find(d => d.y === height - 1)
      const hasLeftDoors = doors.find(d => d.x === 0)
      const hasRightDoors = doors.find(d => d.x === width - 1)
      const worldTop = this.tileToWorldY(top + 3) + 5
      const worldBottom = this.tileToWorldY(bottom + 2) - 3
      const worldLeft = this.tileToWorldX(left + 1)
      const worldRight = this.tileToWorldX(right)

      // inside of doors
      doors.forEach(door => {
        if (door.y === 0) {
          const topDoorLeft = this.tileToWorldX(left + door.x) - 10
          const topDoorRight = this.tileToWorldX(left + door.x) + 26
          this.walls.push(this.matter.add.rectangle(topDoorLeft - 2, worldTop - 20, 5, 40, this.isStatic))
          this.walls.push(this.matter.add.rectangle(topDoorRight + 2, worldTop - 20, 5, 40, this.isStatic))
        }
        if (door.x === 0) {
          const leftDoorTop = this.tileToWorldY(top + door.y) + 22
          const leftDoorBottom = this.tileToWorldY(top + door.y) + 62
          this.walls.push(this.matter.add.rectangle(worldLeft - 16, leftDoorTop, 40, 5, this.isStatic))
          this.walls.push(this.matter.add.rectangle(worldLeft - 16, leftDoorBottom, 40, 5, this.isStatic))
        }
      })

      // walls
      let wallColliders = [
        [0, 0, (width - 2) * this.tileSize, 0, (width - 2) * this.tileSize, 5, 0, 5],
        [0, (height - 3) * this.tileSize + 2, (width - 2) * this.tileSize, (height - 3) * this.tileSize + 2, (width - 2) * this.tileSize, (height - 3) * this.tileSize + 7, 0, (height - 3) * this.tileSize + 7],
        [0, 0, 5, 0, 5, (height - 3) * this.tileSize, 0, (height - 3) * this.tileSize],
        [(width - 2) * this.tileSize - 5, 0, (width - 2) * this.tileSize, 0, (width - 2) * this.tileSize, (height - 3) * this.tileSize, (width - 2) * this.tileSize - 5, (height - 3) * this.tileSize],
      ]
      // slicing out doors
      doors.forEach(door => {
        const sliced = []
        wallColliders.forEach(part => {
          const dimensions = this.getDimensionsByVertices(part)
          let slices
          if (dimensions.width > dimensions.height) {
            slices = Slice(part, this.tileSize * door.x, this.tileSize * door.y - 32, this.tileSize * door.x, this.tileSize * door.y + 32)
            if (slices.length > 1) {
              slices[0][0] += 10
              slices[0][6] += 10
              slices[1][6] -= 26
              slices[1][0] -= 26
            }
          } else {
            slices = Slice(part, this.tileSize * door.x - 32, this.tileSize * door.y, this.tileSize * door.x + 32, this.tileSize * door.y)
            if (slices.length > 1) {
              slices[0][1] -= 30
              slices[0][7] -= 30
              slices[1][7] += 8
              slices[1][1] += 8
            }
          }
          sliced.push(...slices)
        })
        wallColliders = sliced
      })

      // placing
      for (let i = 0; i < wallColliders.length; i++) {
        const part = wallColliders[i]
        const x = i ? wallColliders[i - 1][2] : worldLeft
        const rect = Phaser.Physics.Matter.Matter.Vertices.clockwiseSort([{ x: part[0], y: part[1] }, { x: part[2], y: part[3] }, { x: part[4], y: part[5] }, { x: part[6], y: part[7] }])
        const center = Phaser.Physics.Matter.Matter.Vertices.centre(rect)
        this.walls.push(this.matter.add.fromVertices(worldLeft + center.x, worldTop + center.y, rect, this.isStatic))
      }
    })
  }

  particleEmitterAddLights(particle, rareness, intensity) {
    if (!Phaser.Math.Between(0, rareness)) {
      intensity = intensity || 0
      this.lightManager.lights.push({
        sprite: particle,
        intensity: () => intensity + Math.max(0, particle.alpha)
      })
    }
  }

  particleEmitterRemoveLights(particle) {
    this.time.delayedCall(1000, this.lightManager.removeLight(particle))
  }

  addStairs() {
    if (this.endRoom) {
      const x = this.tileToWorldX(this.endRoom.centerX) + this.tileSize / 2
      const y = this.tileToWorldY(this.endRoom.centerY + 2) + this.tileSize / 2
      const width = this.tileSize * 3.5
      const height = width

      // tiles
      this.stuffLayer.putTilesAt(
        TILES.STAIRS.OPEN,
        this.endRoom.centerX - 2,
        this.endRoom.centerY
      )
      // collision
      this.matter.add.rectangle(x, y, width, height, this.isStatic)
      // particle emitter
      let particleCount = 0
      this.stairParticles = this.interactionParticle.createEmitter({
        on: false,
        x: x - width / 2 - 4,
        y: y - height / 2 - 4,
        blendMode: 'SCREEN',
        scale: { start: 0, end: 0.75 },
        alpha: { start: 1, end: 0 },
        speed: 10,
        quantity: 40,
        frequency: 200,
        lifespan: 500,
        emitZone: {
          source: new Phaser.Geom.Rectangle(0, 0, width + 8, height + 8),
          type: 'edge',
          quantity: 40
        },
        emitCallback: particle => this.particleEmitterAddLights(particle, 15, 1),
        deathCallback: particle => this.particleEmitterRemoveLights(particle)
      })

      this.input.on('pointerup', (pointer) => {
        const tile = this.stuffLayer.getTileAtWorldXY(pointer.worldX, pointer.worldY)
        if (tile && [
          ...TILES.STAIRS.OPEN[0],
          ...TILES.STAIRS.OPEN[1],
          ...TILES.STAIRS.OPEN[2],
          ...TILES.STAIRS.OPEN[3],
          ...TILES.STAIRS.OPEN[4]
        ].includes(tile.index)) {
          this.hero.useStairs()
        }
      })
    }
  }

  updateStairParticles() {
    if (this.stairParticles) {
      const tile = this.hero.isNear([
        ...TILES.STAIRS.OPEN[0],
        ...TILES.STAIRS.OPEN[1],
        ...TILES.STAIRS.OPEN[2],
        ...TILES.STAIRS.OPEN[3],
        ...TILES.STAIRS.OPEN[4]
      ])
      if (tile) {
        if (this.stairParticles.on === false) {
          this.stairParticles.start()
        }
      } else {
        this.stairParticles.stop()
      }
    }
  }

  prepareSafeRoom() {
    if (this.safeRoom) {
      // shrine
      const x = this.tileToWorldX(this.safeRoom.centerX)
      const y = this.tileToWorldY(this.safeRoom.centerY + 1) + this.tileSize / 2 - 4
      const width = this.tileSize * 2 + 10
      const height = this.tileSize * 2 + 9

      this.stuffLayer.putTilesAt(TILES.SHRINE, this.safeRoom.centerX - 1, this.safeRoom.centerY)
      this.matter.add.rectangle(x, y, width, height + 10, this.isStatic)

      // shrine particle emitter
      let particleCount = 0
      this.shrineParticles = this.interactionParticle.createEmitter({
        on: false,
        x: x - width / 2,
        y: y + 10,
        blendMode: 'SCREEN',
        scale: { start: 0, end: 0.75 },
        alpha: { start: 1, end: 0 },
        speed: 10,
        quantity: 40,
        frequency: 200,
        lifespan: 500,
        emitZone: {
          source: new Phaser.Geom.Rectangle(0, 0, width, height / 2),
          type: 'edge',
          quantity: 40
        },
        emitCallback: particle => this.particleEmitterAddLights(particle, 10, 1),
        deathCallback: particle => this.particleEmitterRemoveLights(particle)
      })

      // lights
      const doors = this.safeRoom.getDoorLocations()
      let doorLightX1, doorLightY1, doorLightX2, doorLightY2
      if (doors[0].x === 0) {
        doorLightX1 = this.safeRoom.x
        doorLightY1 = this.safeRoom.y + doors[0].y + 2
        doorLightX2 = this.safeRoom.x - 1
        doorLightY2 = this.safeRoom.y + doors[0].y + 2
      } else if (doors[0].x === this.safeRoom.width - 1) {
        doorLightX1 = this.safeRoom.x + doors[0].x
        doorLightY1 = this.safeRoom.y + doors[0].y + 2
        doorLightX2 = this.safeRoom.x + doors[0].x + 1
        doorLightY2 = this.safeRoom.y + doors[0].y + 2
      } else if (doors[0].y === 0) {
        doorLightX1 = this.safeRoom.x + doors[0].x
        doorLightY1 = this.safeRoom.y
        doorLightX2 = this.safeRoom.x + doors[0].x
        doorLightY2 = this.safeRoom.y - 1
      } else if (doors[0].y === this.safeRoom.height - 1) {
        doorLightX1 = this.safeRoom.x + doors[0].x
        doorLightY1 = this.safeRoom.y + doors[0].y
        doorLightX2 = this.safeRoom.x + doors[0].x
        doorLightY2 = this.safeRoom.y + doors[0].y - 1
      }

      this.lightManager.lights.push({
        x: () => doorLightX1,
        y: () => doorLightY1,
        intensity: () => 3
      })
      this.lightManager.lights.push({
        x: () => doorLightX2,
        y: () => doorLightY2,
        intensity: () => 3
      })

      // skills
      const topAltTiles = TILES.WALL.TOP_ALT[1].map(t => t.index)
      let xPositions = Phaser.Utils.Array.Shuffle(
        this.wallLayer.getTilesWithin(
          this.safeRoom.left,
          this.safeRoom.top + 1,
          this.safeRoom.width,
          1
        )
          .filter(t => topAltTiles.includes(t.index))
          .map(t => t.x)
      )

      this.skillShrinePositions = []
      xPositions.forEach(x => {
        if (xPositions.includes(x + 1) && !this.skillShrinePositions.includes(x) && !this.skillShrinePositions.includes(x + 1)) {
          this.skillShrinePositions.push(x)
          this.skillShrinePositions.push(x + 1)
        }
      })

      this.skillShrinePositions = this.skillShrinePositions.filter((x, i) => !(i % 2)).slice(0, 3)
      this.skillShrinePositions.forEach((x, i) => {
        this.stuffLayer.putTilesAt(TILES.SKILLBG.CLOSED, x, this.safeRoom.y + 1)
        const particleConfig = {
          on: false,
          x: this.tileToWorldX(x + 1),
          y: this.tileToWorldY(this.safeRoom.y + 2),
          blendMode: 'SCREEN',
          scale: { start: 1.5, end: 2 },
          alpha: { start: 0.5, end: 0 },
          speed: 5,
          quantity: 1,
          frequency: 300,
          lifespan: 1000
        }
        if (i === 0) {
          particleConfig.tint = 0xFF0000
          this.healthSkillParticles = this.interactionParticleAbove.createEmitter(particleConfig)
        } else if (i === 1) {
          particleConfig.tint = 0xFFFFFF
          this.damageSkillParticles = this.interactionParticleAbove.createEmitter(particleConfig)
        } else if (i === 2) {
          particleConfig.tint = [0x888800, 0xff8800, 0xff8800, 0xffffff, 0x880000, 0x880000]
          this.torchSkillParticles = this.interactionParticleAbove.createEmitter(particleConfig)
        }
      })

      this.skillInteractionParticles = this.interactionParticleAbove.createEmitter({
        on: false,
        x: 0,
        y: this.tileToWorldY(this.safeRoom.y + 3),
        scale: { start: 0, end: 0.75 },
        alpha: { start: 1, end: 0 },
        speed: 10,
        quantity: 20,
        frequency: 200,
        lifespan: 500,
        emitZone: {
          source: new Phaser.Geom.Rectangle(0, 0, this.tileSize * 2, 1),
          type: 'edge',
          quantity: 40
        }
      })
    }
  }

  updateSkillInteractions() {
    if (this.skillInteractionParticles) {
      const tile = this.hero.isNear(TILES.SKILLBG.OPEN[1][0])
      if (tile) {
        this.skillInteractionParticles.setPosition(this.tileToWorldX(tile.x), this.tileToWorldY(this.safeRoom.y + 3))
        if (this.skillInteractionParticles.on === false) {
          this.skillInteractionParticles.start()
        }
        const xPosition = tile.x
        this.overlayText.setPosition(this.tileToWorldX(xPosition) + this.tileSize - 75, this.tileToWorldY(this.safeRoom.y + 4))
        const availableSkillPoints = '(Points: ' + (this.registry.get('skillPoints') - this.registry.get('skillPointsSpent')) + ')'
        if (this.worldToTileX(this.healthSkillParticles.x.propertyValue) === xPosition + 1) {
          const currentHealth = this.registry.get('maxHealth')
          this.overlayText.setText('Health:' + "\n" + currentHealth + ' +1' + "\n" + availableSkillPoints)
        }
        if (this.worldToTileX(this.damageSkillParticles.x.propertyValue) === xPosition + 1) {
          const currentDamage = this.registry.get('damage')
          this.overlayText.setText('Damage:' + "\n" + currentDamage + ' +1' + "\n" + availableSkillPoints)
        }
        if (this.worldToTileX(this.torchSkillParticles.x.propertyValue) === xPosition + 1) {
          const currentTorchDuration = this.registry.get('torchDuration')
          const currentTorchIntensity = this.registry.get('torchIntensity')
          this.overlayText.setText('Torch duration:' + "\n" + currentTorchDuration + 's +30s' + "\n" + 'Intensity: ' + "\n" + currentTorchIntensity + ' +1' + "\n" + availableSkillPoints)
        }
      } else {
        this.skillInteractionParticles.stop()
        this.overlayText.setPosition(0, 0)
        this.overlayText.setText('')
      }
    }
  }

  updateShrineParticles() {
    if (this.shrineParticles) {
      const tile = this.hero.isNear([
        TILES.STAIRS.OPEN,
        ...TILES.SHRINE[0],
        ...TILES.SHRINE[1],
        ...TILES.SHRINE[2]
      ])
      if (tile) {
        if (this.shrineParticles.on === false) {
          this.shrineParticles.start()
        }
      } else {
        this.shrineParticles.stop()
      }
    }
  }

  activateSafeRoom() {
    if (!this.safeRoomActivated) {
      this.sounds.play('activateSafeRoom')
      this.safeRoomActivated = true
      this.registry.set('minDungeon', this.dungeonNumber)
      this.skillShrinePositions.forEach(x => {
        this.stuffLayer.putTilesAt(TILES.SKILLBG.OPEN, x, this.safeRoom.y + 1)
      })
      this.healthSkillParticles.start()
      this.damageSkillParticles.start()
      this.torchSkillParticles.start()
    }
  }

  getDimensionsByVertices(vertices) {
    const xValues = vertices.filter((v, i) => !(i % 2))
    const yValues = vertices.filter((v, i) => i % 2)

    return {
      width: Math.abs(Math.max(...xValues) - Math.min(...xValues)),
      height: Math.abs(Math.max(...yValues) - Math.min(...yValues)),
    }
  }

  addHero() {
    // Place the player in the first room
    this.hero = new Hero(
      this,
      this.tileToWorldX(this.startRoom.centerX) + 16,
      this.tileToWorldY(this.startRoom.centerY) + 19
    );
    this.lightManager.lights.push({
      sprite: this.hero.sprites.hero,
      intensity: () => {
        const torches = this.registry.get('items').filter(item => item === 'torch')

        if (torches && torches.length) {
          return LightManager.flickering((this.registry.get('torchIntensity') - 1) / 2 + torches.length - 1)
        }
        return 0
      }
    })
  }

  addEnemies(revisit) {
    const maxEnemies = Math.min(10, this.dungeonNumber - 1)
    if (this.dungeonNumber > 1) {
      this.otherRooms.forEach(room => {
        const num = this.dungeon.r.randomInteger(1, maxEnemies)
        for (let i = 1; i <= num; i++) {
          if (this.dungeonNumber > 6) {
            if (Phaser.Math.Between(0, 2)) {
              this.enemies.push(new Zombie(this, room, (enemy) => {
                Phaser.Utils.Array.Remove(this.enemies, enemy)
              }))
            } else {
              this.enemies.push(new Spider(this, room, (enemy) => {
                Phaser.Utils.Array.Remove(this.enemies, enemy)
              }))
            }
          } else {
            this.enemies.push(new Zombie(this, room, (enemy) => {
              Phaser.Utils.Array.Remove(this.enemies, enemy)
            }))
          }
        }
      })

      if (this.safeRoom && !revisit) {
        this.enemies.push(new Deamon(this, this.endRoom, (enemy) => {
          this.lightManager.removeLight(enemy.sprite)
          Phaser.Utils.Array.Remove(this.enemies, enemy)
          this.stuffLayer.putTileAt(
            TILES.STAIRS.OPEN,
            this.endRoom.centerX,
            this.endRoom.centerY
          )
        }))
      }
    }
  }

  emitXpOrb(x, y, following) {
    let particleCount = 0
    x += Phaser.Math.Between(-25, 25)
    y += Phaser.Math.Between(-25, 25)
    const xpOrb = this.matter.add.image(x, y, 'particle', 0).setDepth(6).setRectangle(5, 5).setSensor(true).setData('following', following)
    const xpOrbParticles = this.xpParticle.createEmitter({
      tint: [0xFF00FF, 0x0088FF, 0xFF00FF, 0x0088FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.3, end: 1 },
      alpha: { start: 1, end: 0 },
      speed: 10,
      quantity: 3,
      frequency: 100,
      lifespan: 500,
      emitCallback: particle => this.particleEmitterAddLights(particle, 15),
      deathCallback: particle => this.particleEmitterRemoveLights(particle),
      following: following
    })

    xpOrbParticles.startFollow(xpOrb)
    const tween1 = this.tweens.add({
      duration: 500,
      targets: xpOrb,
      yoyo: true,
      repeat: 0,
      ease: 'Cubic',
      y: '-=20',
      onComplete: () => {
        tween1.remove()
        this.xpOrbs.push(xpOrb)
      }
    })
    const tween2 = this.tweens.add({
      duration: 1000,
      targets: xpOrb,
      repeat: 0,
      ease: 'Linear',
      x: x + Phaser.Math.Between(-25, 25),
      onComplete: () => {
        tween2.remove()
      }
    })

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: xpOrb,
      callback: (collision) => {
        if (this.hero.dead || collision.bodyA.isSensor) return
        tween1.remove()
        tween2.remove()
        Phaser.Utils.Array.Remove(this.xpOrbs, xpOrb)
        xpOrb.destroy()
        xpOrbParticles.stop()
        this.registry.set('xp', this.registry.get('xp') + 1)
        this.sounds.play('xpPing' + this.xpOrbSound)
        this.xpOrbSound = Math.min(8, this.xpOrbSound + 1)
        clearTimeout(this.xpOrbSoundResetTimeout)
        this.xpOrbSoundResetTimeout = setTimeout(() => {
          this.xpOrbSound = 1
        }, 3000)
      }
    })
  }

  updateXpOrbs() {
    if (this.hero.dead) return

    this.xpOrbs.forEach(orb => {
      if (orb.getData('following')) {
        this.moveToObject(orb, this.hero.sprites.hero, 2.5)
      } else {
        const vector = new Phaser.Math.Vector2(orb.x, orb.y)
        const distance = vector.distance({ x: this.hero.sprites.hero.x, y: this.hero.sprites.hero.y })
        if (distance < 25) {
          this.moveToObject(orb, this.hero.sprites.hero, 2.5)
        }
      }
    })
  }

  addFireTraps() {
    this.fireTraps = []
    if (this.dungeonNumber > 5) {
      const allowedTiles = [
        ...TILES.WALL.TOP[2].map(t => t.index),
        ...TILES.WALL.BOTTOM.map(t => t.index),
        ...TILES.WALL.LEFT[0].map(t => t.index),
        ...TILES.WALL.RIGHT[0].map(t => t.index)
      ]
      this.otherRooms.forEach((room, i) => {
        if (i % 3) return
        room.hasFireTraps = true
        const count = this.dungeon.r.randomInteger(1, 4)
        const walls = []
        const availableWalls = ['top', 'bottom', 'left', 'right']
        while (walls.length < count) {
          walls.push(Phaser.Utils.Array.RemoveAt(availableWalls, this.dungeon.r.randomInteger(0, availableWalls.length - 1)))
        }

        walls.forEach(wall => {
          let x, y, angle
          let fireParticle = this.fireParticleAbove
          if (wall === 'top') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.top + 2, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2 - 3
              angle = { min: 80, max: 100}
              this.stuffLayer.putTilesAt(TILES.PILLAR.TOP, tile.x - 1, tile.y - 2)
            }
          } else if (wall === 'bottom') {
            const tiles = this.wallAboveLayer.getTilesWithin(room.left, room.bottom, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -80, max: -100}
              fireParticle = this.fireParticle
              this.stuffLayerAbove.putTilesAt(TILES.PILLAR.BOTTOM, tile.x, tile.y - 1)
            }
          } else if (wall === 'left') {
            const tiles = this.wallAboveLayer.getTilesWithin(room.left, room.top + 4, 1, room.height - 4).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize * 1.5 - 3
              y = this.tileToWorldY(tile.y) + this.tileSize / 2 - 3
              angle = { min: -10, max: 10}
              this.stuffLayer.putTilesAt(TILES.PILLAR.LEFT, tile.x, tile.y - 1)
            }
          } else if (wall === 'right') {
            const tiles = this.wallAboveLayer.getTilesWithin(room.right, room.top + 4, 1, room.height - 4).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) - this.tileSize / 2 + 3
              y = this.tileToWorldY(tile.y) + this.tileSize / 2 - 3
              angle = { min: -190, max: -170}
              this.stuffLayer.putTilesAt(TILES.PILLAR.RIGHT, tile.x - 1, tile.y - 1)
            }
          }

          let particleCount = 0
          const fireTrap = fireParticle.createEmitter({
            x: x,
            y: y,
            on: false,
            tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
            blendMode: 'SCREEN',
            scale: { start: 0.3, end: 2 },
            alpha: { start: 1, end: 0 },
            rotate: { min: 0, max: 180 },
            speed: 100,
            quantity: 10,
            frequency: 50,
            lifespan: { min: 500, max: 1000 },
            angle: angle,
            emitCallback: particle => this.particleEmitterAddLights(particle, 30, 1),
            deathCallback: particle => this.particleEmitterRemoveLights(particle)
          })

          const interval = 1000 * this.dungeon.r.randomInteger(2, 5)
          const duration = Math.min(interval, 1000 * this.dungeon.r.randomInteger(2, 5)) - 1000
          this.time.addEvent({
            delay: interval,
            callback: () => {
              fireTrap.start()
              this.time.delayedCall(duration, () => {
                fireTrap.stop()
              })
            },
            loop: true
          })

          this.fireTraps.push(fireTrap)
        })
      })
    }
  }

  checkFireTrapCollision() {
    this.fireTraps.forEach(trap => {
      trap.forEachAlive((particle) => {
        if (
          particle.x > this.hero.sprites.hero.body.parts[1].bounds.min.x &&
          particle.x < this.hero.sprites.hero.body.parts[1].bounds.max.x &&
          particle.y > this.hero.sprites.hero.body.parts[1].bounds.min.y &&
          particle.y < this.hero.sprites.hero.body.parts[1].bounds.max.y &&
          !this.hero.burning &&
          !this.hero.dead
        ) {
          this.hero.burning = true
          this.hero.takeDamage(1)
          this.time.delayedCall(1000, () => {
            this.hero.burning = false
          })
        }
      })
    })
  }

  flashSprite(sprite) {
    this.time.addEvent({
      delay: 150,
      callback: () => {
        sprite.setTintFill(0xffffff)
        this.time.delayedCall(75, () => {
          sprite.clearTint()
        })
      },
      repeat: 3
    })
  }

  addItems() {
    if (this.dungeonNumber >= 3 && !this.hero.hasItem('sword')) {
      this.addSword()
    }

    if (this.dungeonNumber >= 5 && this.dungeonNumber % 2) {
      this.addTorch()
    }

    if (this.dungeonNumber >= 7 && !this.hero.hasItem('pathfinder')) {
      this.addPathfinder()
    }
  }

  addSword(x, y) {
    if (!x && !y) {
      this.swordRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(this.swordRoom.centerX)
      y = this.tileToWorldY(this.swordRoom.centerY)
    }

    this.sword = this.matter.add.sprite(x, y, 'sword', 0, { isStatic: true, collisionFilter: { group: -1 } }).setDepth(8)
    const tween = this.tweens.add({
      targets: this.sword,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: this.sword,
      callback: (collision) => {
        if (this.hero.dead || collision.bodyA.isSensor) return

        this.registry.set('weapon', 'sword')
        const items = this.registry.get('items')
        items.push('sword')
        this.registry.set('items', items)
        tween.remove()
        this.sword.destroy()
      }
    })
  }

  addTorch(x, y) {
    if (!x && !y) {
      this.torchRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(Phaser.Utils.Array.GetRandom([this.torchRoom.left + 3, this.torchRoom.right - 2])) + 4
      y = this.tileToWorldY(Phaser.Utils.Array.GetRandom([this.torchRoom.top + 5, this.torchRoom.bottom - 2])) + 9
    }
    this.torch = this.matter.add.sprite(x, y, 'torch', 0, { isStatic: true, collisionFilter: { group: -1 } }).setSize(8, 24).setDepth(7)
    const tween = this.tweens.add({
      targets: this.torch,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.lightManager.lights.push({
      sprite: this.torch,
      intensity: () => LightManager.flickering(0)
    })
    this.torch.anims.play('torch', true)

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: this.torch,
      callback: (collision) => {
        if (this.hero.dead || collision.bodyA.isSensor) return
        const items = this.registry.get('items')
        items.push('torch')
        this.registry.set('items', items)
        this.scene.get('Gui').removeTorchDelayed()
        tween.remove()
        this.torch.destroy()
        this.lightManager.removeLight(this.torch)
      }
    })
  }

  addPathfinder(x, y) {
    if (!x && !y) {
      this.pathFinderRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(Phaser.Utils.Array.GetRandom([this.pathFinderRoom.left + 3, this.pathFinderRoom.right - 2])) + 12
      y = this.tileToWorldY(Phaser.Utils.Array.GetRandom([this.pathFinderRoom.top + 5, this.pathFinderRoom.bottom - 2])) + 12
    }
    this.pathfinder = this.matter.add.sprite(x, y, 'pathfinder', 0, { isStatic: true, collisionFilter: { group: -1 } }).setSize(24, 24).setDepth(8)
    const tween = this.tweens.add({
      targets: this.pathfinder,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.lightManager.lights.push({
      sprite: this.pathfinder,
      intensity: () => 1
    })
    this.pathfinder.anims.play('pathfinder', true)

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: this.pathfinder,
      callback: (collision) => {
        if (this.hero.dead || collision.bodyA.isSensor) return
        const items = this.registry.get('items')
        items.push('pathfinder')
        this.registry.set('items', items)
        tween.remove()
        this.pathfinder.destroy()
        this.lightManager.removeLight(this.pathfinder)
      }
    });
  }

  addTimebomb() {
    if (this.dungeonNumber >= 9) {
      this.timebombRoom = this.otherRooms.sort((a, b) => b.width * b.height - a.width * a.height)[0]
      this.timebomb = this.matter.add.image(
        this.tileToWorldX(this.timebombRoom.centerX),
        this.tileToWorldY(this.timebombRoom.centerY),
        'particle',
        0
      ).setDepth(6).setRectangle(10, 10).setCollisionGroup(-1)
      // this.physics.add.collider(this.timebomb, this.wallLayer)
      let particleCount = 0
      this.timebombParticles = this.interactionParticle.createEmitter({
        tint: [0xFFFFFF, 0x7777FF],
        blendMode: 'SCREEN',
        scale: { start: 0.3, end: 1 },
        alpha: { start: 1, end: 0 },
        speed: 20,
        quantity: 5,
        frequency: 50,
        lifespan: 2000,
        emitCallback: particle => this.particleEmitterAddLights(particle, 20),
        deathCallback: particle => this.particleEmitterRemoveLights(particle)
      })

      this.matterCollision.addOnCollideStart({
        objectA: this.hero.sprites.hero,
        objectB: this.timebomb,
        callback: (collision) => {
          if (this.hero.dead || collision.bodyA.isSensor) return
          this.timebomb.destroy()
          this.timebombParticles.stop()
          this.music.setSeek(40)
          this.music.setRate(1.5)
          this.sounds.play('ticking', 1.5, false, true)
          this.time.delayedCall(2000, () => this.narrator.sayOnce('timeeaterQuickNow'))
          this.heroParticles = this.interactionParticle.createEmitter({
            tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
            blendMode: 'SCREEN',
            scale: { start: 0.3, end: 1 },
            alpha: { start: 1, end: 0 },
            speed: 20,
            quantity: 5,
            frequency: 50,
            lifespan: 2000,
            emitCallback: particle => this.particleEmitterAddLights(particle, 15),
            deathCallback: particle => this.particleEmitterRemoveLights(particle)
          })
          this.heroParticles.startFollow(this.hero.sprites.hero)
          this.startCountdown(60)
        }
      })

      this.timebombParticles.startFollow(this.timebomb)
      this.timebombFollows = false
    }
  }

  updateTimebomb() {
    if (!this.timebomb || !this.timebomb.active) return
    const vector = new Phaser.Math.Vector2(this.timebomb.x, this.timebomb.y)
    const distance = vector.distance({ x: this.hero.sprites.hero.x, y: this.hero.sprites.hero.y })
    const speedFactor = (distance + 100) / 200
    this.timebomb.setVelocity(0)
    if (this.currentRoom === this.safeRoom) {
      this.timebombFollows = false
    } else if (this.timebombRoom === this.currentRoom && distance < 100) {
      this.timebombFollows = true
    }
    if (this.timebombFollows) {
      const tileX = this.worldToTileX(this.timebomb.x)
      const tileY = this.worldToTileY(this.timebomb.y)
      this.timebombRoom = this.dungeon.getRoomAt(tileX, tileY)
      if (this.timebombRoom === this.currentRoom && tileX > this.timebombRoom.left && tileX < this.timebombRoom.right && tileY > this.timebombRoom.top + 3 && tileY < this.timebombRoom.bottom) {
        this.moveToObject(this.timebomb, this.hero.sprites.hero, speedFactor)
      } else {
        const finder = new PathFinder.AStarFinder({ allowDiagonal: true, dontCrossCorners: true })
        const path = PathFinder.Util.compressPath(finder.findPath(
          this.worldToTileX(this.timebomb.x),
          this.worldToTileY(this.timebomb.y),
          this.worldToTileX(this.hero.sprites.hero.x),
          this.worldToTileY(this.hero.sprites.hero.y),
          this.getPathGrid()
        ))
        if (path.length > 1) {
          const pathVector = new Phaser.Math.Vector2(this.tileToWorldX(path[1][0]) + this.tileSize / 2, this.tileToWorldY(path[1][1]) + this.tileSize / 2)
          this.moveToObject(this.timebomb, pathVector, speedFactor)
        }
      }
    }
  }

  addOverlayText() {
    this.overlayText = this.add
      .text(0, 0, '', {
        font: "9px monospace",
        fill: "#ffffff",
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000',
          blur: 0,
          fill: '#000000'
        }
      }).setDepth(11).setAlign('center').setFixedSize(150, this.tileSize * 3)
  }

  moveToObject(moving, target, speed) {
    const movingVector = new Phaser.Math.Vector2(moving.x, moving.y)
    const targetVector = new Phaser.Math.Vector2(target.x, target.y)
    const movementVector = targetVector.subtract(movingVector).normalize().scale(speed)

    moving.setVelocity(movementVector.x, movementVector.y)
  }

  checkHeroParticlesCollision() {
    if (this.heroParticles) {
      this.heroParticles.forEachAlive((particle) => {
        this.enemies.forEach((enemy) => {
          if (
            particle.x > enemy.sprite.body.bounds.min.x &&
            particle.x < enemy.sprite.body.bounds.max.x &&
            particle.y > enemy.sprite.body.bounds.min.y &&
            particle.y < enemy.sprite.body.bounds.max.y &&
            !enemy.burning
          ) {
            enemy.burning = true
            enemy.takeDamage(1)
          }
        })
      })
    }
  }

  startCountdown(seconds) {
    this.cameras.main.shake(1000, 0.001)
    this.countdownText = this.scene.get('Gui').add.text(this.game.scale.width / 2, 50, '1:00', {
      font: "12px monospace",
      fill: "#FFFFFF"
    }).setDepth(11).setScrollFactor(0).setAlpha(0)
    const tween = this.tweens.add({
      targets: this.countdownText,
      duration: 2000,
      scale: { from: 6, to: 2},
      alpha: { from: 0, to: 1 },
      ease: 'Cubic',
      onComplete: () => {
        this.countdown = new Date().getTime() / 1000 + seconds
        tween.remove()
      }
    })
  }

  updateCountdown() {
    const currentTime = new Date().getTime() / 1000
    if (this.countdown && this.countdown > currentTime) {
      const diff = this.countdown - currentTime
      const minutes = Math.floor(diff / 60)
      const seconds = Math.floor(diff % 60)
      this.countdownText.setText(minutes + ':' + (seconds < 10 ? '0' : '') + seconds)

      if (minutes === 0 && seconds === 30) {
        this.cameras.main.shake(20000, 0.001)
        this.sounds.stop('ticking')
        this.sounds.play('tickingFast', 0.1, false, true)
        this.narrator.sayOnce('dungeonStartedToQuake')
      }
      if (minutes === 0 && seconds === 10) {
        this.cameras.main.shake(10000, 0.005)
      }
      if (minutes === 0 && seconds === 0) {
        this.countdown = null
        this.countdownText.destroy()
        this.cameras.main.shake(1000, 0.005)
        this.heroParticles.stop()
        this.hero.takeDamage(this.registry.get('maxHealth'))
      }
    }
  }

  getPathGrid() {
    const grid = this.dungeon.tiles.map(row => row.map(field => field === 2 || field === 3 ? 0 : 1))
    // remove tiles that are part of top wall
    this.wallLayer.forEachTile(tile => {
      if (![-1, TILES.BLANK].includes(tile.index)) {
        grid[tile.y][tile.x] = 1
      }
    })
    this.wallAboveLayer.forEachTile(tile => {
      if ([6, 15].includes(tile.index)) {
        grid[tile.y][tile.x] = 0
      }
    })

    return new PathFinder.Grid(grid)
  }

  showPath() {
    if (!this.pathSprites.length) {
      const finder = new PathFinder.AStarFinder()
      const path = finder.findPath(
        this.worldToTileX(this.hero.sprites.hero.x),
        this.worldToTileY(this.hero.sprites.hero.y),
        this.endRoom.centerX + 1,
        this.endRoom.centerY + 2,
        this.getPathGrid()
      )

      // remove first and last point
      path.splice(0, 1)
      path.splice(path.length - 1, 1)

      path.forEach((tile) => {
        this.pathSprites.push(this.add.sprite(
          this.tileToWorldX(tile[0]) + 8,
          this.tileToWorldY(tile[1]) + 8,
          "path",
          0
        ).setDepth(5).setAlpha(0.5))
      })
      if (this.pathSprites.length) {
        this.scene.get('Gui').startPathfinderCooldown()
        this.time.addEvent({
          delay: 300,
          callback: () => {
            const sprite = this.pathSprites.shift()
            if (sprite) {
              this.add.tween({
                targets: [sprite],
                ease: 'Sine.easeInOut',
                duration: 1000,
                alpha: {
                  getStart: () => 1,
                  getEnd: () => 0
                },
                onComplete: () => {
                  sprite.destroy()
                }
              });
            }
          },
          repeat: this.pathSprites.length - 1
        })
      }
    }
  }

  popupDamageNumber(damage, x, y, color) {
    const damageText = this.add.text(x, y, '-' + damage, {
      font: '8px monospace',
      fill: color
    }).setDepth(10)
    this.tweens.add({
      targets: damageText,
      alpha: { from: 0, to: 1 },
      scale: { from: 1, to: 2 },
      duration: 1000,
      ease: 'Back'
    }).on('complete', () => {
      this.tweens.add({
        targets: damageText,
        alpha: { from: 1, to: 0 },
        scale: { from: 2, to: 1.5 },
        duration: 1000
      }).on('complete', () => {
        damageText.destroy()
      })
    })
  }

  setCurrentRoom() {
    const currentRoom = this.dungeon.getRoomAt(
      this.worldToTileX(this.hero.sprites.hero.x),
      this.worldToTileY(this.hero.sprites.hero.y)
    )
    if (this.currentRoom !== currentRoom) {
      this.currentRoom = currentRoom
      if (!this.visitedRooms.includes(this.currentRoom)) {
        this.visitedRooms.push(this.currentRoom)

        if (this.dungeonNumber === 1 && this.currentRoom === this.endRoom) {
          this.narrator.slowmoStart()
          this.narrator.forceWalk = true
          this.narrator.sayOnce('finallySomeStairs').then(() => {
            this.narrator.slowmoEnd()
            this.narrator.forceWalk = false
          })
        }

        if (this.dungeonNumber === 1 && this.visitedRooms.length > this.dungeon.rooms.length / 2) {
          this.narrator.sayOnce('whatWasThisAbout')
        }

        if (this.dungeonNumber === 2 && this.enemies.find(e => e.room === this.currentRoom)) {
          this.narrator.sayOnce('undeadCreatures')
        }

        if (this.swordRoom && this.currentRoom === this.swordRoom) {
          this.narrator.sayOnce('thereItWasASword')
        }

        if (this.timebombRoom && this.currentRoom === this.timebombRoom && !this.registry.get('narratorSaid').includes('aTimeeater')) {
          this.narrator.slowmoStart()
          this.narrator.sayOnce('aTimeeater').then(() => {
            this.narrator.slowmoEnd()
          })
        }

        if (this.safeRoom && this.currentRoom === this.safeRoom && !this.registry.get('narratorSaid').includes('thisRoomWasDifferent')) {
          this.narrator.slowmoStart()
          this.narrator.sayOnce('thisRoomWasDifferent').then(() => {
            this.narrator.slowmoEnd()
          })
        }

        if (this.torchRoom && this.currentRoom === this.torchRoom) {
          this.narrator.sayOnce('torchPerfect')
        }

        if (this.currentRoom && this.currentRoom.hasFireTraps) {
          this.narrator.sayOnce('itsGettingHot')
        }

        if (this.pathFinderRoom && this.currentRoom === this.pathFinderRoom) {
          this.narrator.sayOnce('aScoutsEye')
        }

        if (this.dungeonNumber >= 12 && this.nextOuttake <= 8) {
          this.narrator.slowmoStart()
          this.narrator.sayOnce('outtake' + this.nextOuttake, 0, 1).then(() => {
            this.nextOuttake++
            this.narrator.slowmoEnd()
          })
        }
      }
    }
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

  update() {
    this.getEndRoom()
    this.hero.update()
    this.enemies.forEach(e => e.update())
    this.setCurrentRoom()
    this.updateStairParticles()
    this.updateShrineParticles()
    this.lightManager.update()
    this.checkFireTrapCollision()
    this.checkHeroParticlesCollision()
    this.updateCountdown()
    this.updateTimebomb()
    this.updateSkillInteractions()
    this.updateXpOrbs()
  }
}
