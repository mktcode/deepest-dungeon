import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Hero from "../objects/hero.js";
import Enemy from "../objects/enemy.js";
import TILES from "../tile-mapping.js";
import LightManager from "../light-manager.js";
import Narrator from '../narrator.js'
import PathFinder from 'pathfinding'
import { Slice } from 'polyk'

// assets
import tileset from "../assets/dungeon-tileset-extruded.png";
import tilesetMc from "../assets/dungeon-mc-extruded.png";
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
      width: Math.min(200, 60 + this.dungeonNumber),
      height: Math.min(200, 60 + this.dungeonNumber),
      doorPadding: 4,
      rooms: {
        width: { min: 15, max: 31, onlyOdd: true },
        height: { min: 15, max: 31, onlyOdd: true },
        maxArea: 961
      }
    })
    const rooms = this.dungeon.rooms.slice()
    this.startRoom = rooms.shift()
    // add end room (must not have door in the top cause the exit will go there)
    this.endRoom = rooms.splice(rooms.findIndex(room => !room.getDoorLocations().find(d => d.y === 0)), 1)[0]
    this.otherRooms = rooms
    // add rest room every 5 dungeons (smallest room with only one door)
    this.safeRoom = this.getSafeRoom()
    this.currentRoom = this.startRoom
    this.visitedRooms = [this.startRoom]

    this.sword = null
    this.torch = null
    this.pathfinder = null
    this.pathSprites = []
    this.safeRoomActivated = false

    this.isStatic = { isStatic: true }
  }

  static preload(scene) {
    scene.load.image("tileset", tileset)
    scene.load.image("tilesetMc", tilesetMc)
    scene.load.spritesheet('torch', torchSprite, { frameWidth: 48, frameHeight: 48 });
    scene.load.spritesheet('path', pathSprite, { frameWidth: 18, frameHeight: 18 });
    scene.load.spritesheet('pathfinder', pathfinderSprite, { frameWidth: 48, frameHeight: 48 });
    scene.load.image('particle', particle);
  }

  create() {
    this.cameras.main.setZoom(2)
    this.cameras.main.fadeIn(250, 0, 0, 0)
    this.narrator = new Narrator(this)
    this.registry.set('currentDungeon', this.dungeonNumber)
    this.interactionParticle = this.add.particles('particle').setDepth(7)
    this.fireParticle = this.add.particles('particle').setDepth(7)
    // this.matter.world.createDebugGraphic()

    this.prepareMap()
    this.prepareRooms()
    this.addStairs()
    this.addHero()
    this.addEnemies()
    this.addItems()
    this.addFireTraps()
    this.addTimebomb()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(250, 0, 0, 0)
      this.registry.set('currentDungeon', this.dungeonNumber)

      // keyboard bug workaround
      this.hero.resetKeys()

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

      this.hero.unfreeze()
    })

    this.events.on('sleep', () => {
      this.countdown = null
      if (this.countdownText) {
        this.countdownText.destroy()
      }
      if (this.heroParticles) {
        this.heroParticles.stop()
      }
    })

    this.narrator.dungeonIntro(
      this.dungeonNumber,
      this.startRoom.getDoorLocations().length
    )
  }

  getSafeRoom() {
    if (!(this.dungeonNumber % 4)) {
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
    const tilesetImage = this.dungeonNumber === 25 ? "tilesetMc" : "tileset"
    this.tileset = this.map.addTilesetImage(tilesetImage, null, this.tileSize, this.tileSize, 1, 2); // 1px margin, 2px spacing

    this.floorLayer = this.map.createBlankDynamicLayer("Floor", this.tileset).fill(TILES.BLANK).setDepth(1);
    this.wallLayer = this.map.createBlankDynamicLayer("Wall", this.tileset).setDepth(2);
    this.wallAboveLayer = this.map.createBlankDynamicLayer("WallAbove", this.tileset).setDepth(8);
    this.stuffLayer = this.map.createBlankDynamicLayer("Stuff", this.tileset).setDepth(3);
    this.shadowLayer = this.map.createBlankDynamicLayer("Shadow", this.tileset).fill(TILES.BLANK).setDepth(10);
    this.lightManager = new LightManager(this);

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
  }

  prepareRooms() {
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
          this.wallLayer.removeTileAt(tile.x, tile.y)
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
          this.matter.add.rectangle(topDoorLeft - 2, worldTop - 20, 5, 40, this.isStatic)
          this.matter.add.rectangle(topDoorRight + 2, worldTop - 20, 5, 40, this.isStatic)
        }
        if (door.x === 0) {
          const leftDoorTop = this.tileToWorldY(top + door.y) + 22
          const leftDoorBottom = this.tileToWorldY(top + door.y) + 62
          this.matter.add.rectangle(worldLeft - 16, leftDoorTop, 40, 5, this.isStatic)
          this.matter.add.rectangle(worldLeft - 16, leftDoorBottom, 40, 5, this.isStatic)
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
        this.matter.add.fromVertices(worldLeft + center.x, worldTop + center.y, rect, this.isStatic)
      }
    })
  }

  addStairs() {
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
    this.stairParticles = this.interactionParticle.createEmitter({
      x: x - width / 2,
      y: y - height / 2,
      blendMode: 'SCREEN',
      scale: { start: 0, end: 0.75 },
      alpha: { start: 1, end: 0 },
      speed: 10,
      quantity: 40,
      frequency: 200,
      lifespan: 500,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, width, height),
        type: 'edge',
        quantity: 40
      },
      emitCallback: (particle) => {
        this.lightManager.lights.push({
          sprite: particle,
          intensity: () => 0.3
        })
      },
      deathCallback: (particle) => {
        this.lightManager.removeLight(particle)
      }
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

  updateStairParticles() {
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
          return torches.length - 1 + LightManager.flickering()
        }
        return 0
      }
    })
  }

  addEnemies() {
    this.enemies = [];
    const maxEnemies = Math.min(10, this.dungeonNumber - 1)
    if (this.dungeonNumber > 1) {
      this.otherRooms.forEach(room => {
        const num = this.dungeon.r.randomInteger(1, maxEnemies)
        for (let i = 1; i <= num; i++) {
          this.enemies.push(new Enemy(this, room, 'snake', (enemy) => {
            Phaser.Utils.Array.Remove(this.enemies, enemy)
          }));
        }
      })

      if (this.safeRoom) {
        this.enemies.push(new Enemy(this, this.endRoom, 'deamon', (enemy) => {
          this.lightManager.removeLight(enemy.sprite)
          Phaser.Utils.Array.Remove(this.enemies, enemy)
          this.stuffLayer.putTileAt(
            TILES.STAIRS.OPEN,
            this.endRoom.centerX,
            this.endRoom.centerY
          );
        }));
      }
    }
  }

  addFireTraps() {
    this.fireTraps = []
    if (this.dungeonNumber > 5) {
      const allowedTiles = [TILES.WALL.TOP, TILES.WALL.BOTTOM, TILES.WALL.LEFT, TILES.WALL.RIGHT]
      this.otherRooms.forEach((room, i) => {
        if (i % 3) return
        const count = this.dungeon.r.randomInteger(1, 4)
        const walls = []
        const availableWalls = ['top', 'bottom', 'left', 'right']
        while (walls.length < count) {
          walls.push(Phaser.Utils.Array.RemoveAt(availableWalls, this.dungeon.r.randomInteger(0, availableWalls.length - 1)))
        }

        walls.forEach(wall => {
          let x, y, angle
          if (wall === 'top') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.top, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: 80, max: 100}
            }
          } else if (wall === 'bottom') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.bottom, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -80, max: -100}
            }
          } else if (wall === 'left') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.top, 1, room.height).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -10, max: 10}
            }
          } else if (wall === 'right') {
            const tiles = this.wallLayer.getTilesWithin(room.right, room.top, 1, room.height).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -190, max: -170}
            }
          }

          this.add.rectangle(x, y, 8, 8, 0x000000).setDepth(6)

          const fireTrap = this.fireParticle.createEmitter({
            x: x,
            y: y,
            on: false,
            tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
            blendMode: 'SCREEN',
            scale: { start: 1, end: 3 },
            alpha: { start: 1, end: 0 },
            rotate: { min: 0, max: 180 },
            speed: 150,
            quantity: 9,
            frequency: 60,
            lifespan: 1000,
            angle: angle,
            emitCallback: (particle) => {
              this.lightManager.lights.push({
                sprite: particle,
                intensity: () => Math.max(0.5, particle.alpha)
              })
            },
            deathCallback: (particle) => {
              this.lightManager.removeLight(particle)
            }
          })

          this.time.addEvent({
            delay: 2000 * this.dungeon.r.randomInteger(1, 5),
            callback: () => {
              fireTrap.start()
              this.time.delayedCall(1000, () => {
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
          particle.x > this.hero.sprites.hero.body.left &&
          particle.x < this.hero.sprites.hero.body.right &&
          particle.y > this.hero.sprites.hero.body.top &&
          particle.y < this.hero.sprites.hero.body.bottom &&
          !this.hero.burning
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
    if (this.dungeonNumber >= 2 && !this.hero.hasItem('sword')) {
      this.addSword()
    }

    if (this.dungeonNumber >= 5 && this.dungeonNumber % 2) {
      this.addTorch()
    }

    if (this.dungeonNumber >= 8 && !this.hero.hasItem('pathfinder')) {
      this.addPathfinder()
    }
  }

  addSword(x, y) {
    if (!x && !y) {
      const swordRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(swordRoom.centerX)
      y = this.tileToWorldY(swordRoom.centerY)
    }

    this.sword = this.matter.add.sprite(x, y, 'sword', 20, this.isStatic).setSize(32, 32).setDepth(8)
    const tween = this.tweens.add({
      targets: this.sword,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: this.sword,
      callback: () => {
        if (this.hero.dead) return

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
      const torchRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(Phaser.Utils.Array.GetRandom([torchRoom.left + 1, torchRoom.right - 1])) + 24
      y = this.tileToWorldY(Phaser.Utils.Array.GetRandom([torchRoom.top + 1, torchRoom.bottom - 1])) + 24
    }
    this.torch = this.matter.add.sprite(x, y, 'torch', 0, this.isStatic).setSize(48, 48).setDepth(7)
    const tween = this.tweens.add({
      targets: this.torch,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.lightManager.lights.push({
      sprite: this.torch,
      intensity: () => LightManager.flickering()
    })
    this.torch.anims.play('torch', true)

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: this.torch,
      callback: () => {
        if (this.hero.dead) return
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
      const pathFinderRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(Phaser.Utils.Array.GetRandom([pathFinderRoom.left + 1, pathFinderRoom.right - 1])) + 24
      y = this.tileToWorldY(Phaser.Utils.Array.GetRandom([pathFinderRoom.top + 1, pathFinderRoom.bottom - 1])) + 24
    }
    this.pathfinder = this.matter.add.sprite(x, y, 'pathfinder', 0, this.isStatic).setSize(48, 48).setDepth(8)
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
      callback: () => {
        if (this.hero.dead) return
        const items = this.registry.get('items')
        items.push('pathfinder')
        this.registry.set('items', items)
        tween.remove()
        this.pathfinder.destroy()
        this.lightManager.removeLight(this.pathfinder)
      }
    });
  }

  addXpDust(x, y, xp, points) {
    this.xpDust = this.matter.add.sprite(x, y, 'xpDust', 0, this.isStatic).setSize(52, 22).setDepth(7)
    this.lightManager.lights.push({
      sprite: this.xpDust,
      intensity: () => 1
    })
    this.xpDust.anims.play('xpDust', true)

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.sprites.hero,
      objectB: this.xpDust,
      callback: () => {
        if (this.hero.dead) return
        this.xpDust.destroy()
        this.lightManager.removeLight(this.xpDust)
        if (xp) {
          this.registry.set('xp', this.registry.get('xp') + xp)
        }
        if (points) {
          this.registry.set('skillPoints', this.registry.get('skillPoints') + points)
        }
      }
    });
  }

  updateShrineParticles() {
    const tile = this.hero.isNear([
      TILES.STAIRS.OPEN,
      TILES.SHRINE.TOP[0],
      TILES.SHRINE.BOTTOM[0],
      TILES.SHRINE.LEFT[0],
      TILES.SHRINE.RIGHT[0]
    ])
    if (tile) {
      if (this.interactionParticles.on === false) {
        this.interactionParticles.setPosition(
          this.tileToWorldX(tile.x),
          this.tileToWorldY(tile.y)
        )
        this.interactionParticles.start()
      }
    } else {
      this.interactionParticles.stop()
    }
  }

  addTimebomb() {
    if (this.dungeonNumber >= 11) {
      this.timebombRoom = this.dungeon.r.randomPick(this.otherRooms)
      this.timebomb = this.matter.add.rectangle(this.tileToWorldX(this.timebombRoom.centerX), this.tileToWorldY(this.timebombRoom.centerY), 8, 8, 0xffffff).setDepth(6)
      // this.physics.add.collider(this.timebomb, this.wallLayer)
      this.timebombParticles = this.particle.createEmitter({
        blendMode: 'SCREEN',
        scale: { start: 0.5, end: 1.5 },
        alpha: { start: 1, end: 0 },
        speed: 20,
        quantity: 10,
        frequency: 50,
        lifespan: 2000,
        emitCallback: (particle) => {
          this.lightManager.lights.push({
            sprite: particle,
            intensity: () => Math.max(0, particle.alpha - 0.5)
          })
        },
        deathCallback: (particle) => {
          this.lightManager.removeLight(particle)
        }
      })

      this.matterCollision.addOnCollideStart({
        objectA: this.timebomb,
        objectB: this.hero.sprites.hero,
        callback: () => {
          this.timebomb.destroy()
          this.timebombParticles.stop()
          this.heroParticles = this.interactionParticle.createEmitter({
            tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
            blendMode: 'SCREEN',
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 1, end: 0 },
            speed: 20,
            quantity: 10,
            frequency: 50,
            lifespan: 2000,
            emitCallback: (particle) => {
              this.lightManager.lights.push({
                sprite: particle,
                intensity: () => Math.max(0, particle.alpha - 0.5)
              })
            },
            deathCallback: (particle) => {
              this.lightManager.removeLight(particle)
            }
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
    const vector = new Phaser.Math.Vector2(this.timebomb.x, this.timebomb.y);
    const distance = vector.distance({x: this.hero.sprites.hero.body.x, y: this.hero.sprites.hero.body.y})
    if (this.currentRoom === this.safeRoom) {
      this.timebombFollows = false
      this.timebomb.body.setVelocity(0)
    } else if (this.timebombRoom === this.currentRoom && distance < 200) {
      this.timebombFollows = true
    }
    if (this.timebombFollows) {
      const tileX = this.worldToTileX(this.timebomb.x)
      const tileY = this.worldToTileY(this.timebomb.y)
      this.timebombRoom = this.dungeon.getRoomAt(tileX, tileY)
      const vector = new Phaser.Math.Vector2(this.timebomb.x, this.timebomb.y)
      if (this.timebombRoom === this.currentRoom && tileX > this.timebombRoom.left && tileX < this.timebombRoom.right && tileY > this.timebombRoom.top && tileY < this.timebombRoom.bottom) {
        this.timebomb.applyForce(vector.distance({ x: this.hero.sprites.hero.x, y: this.hero.sprites.hero.y }))
      } else {
        const finder = new PathFinder.AStarFinder({ allowDiagonal: true, dontCrossCorners: true })
        const path = PathFinder.Util.compressPath(finder.findPath(
          this.worldToTileX(this.timebomb.x),
          this.worldToTileY(this.timebomb.y),
          this.worldToTileX(this.hero.sprites.hero.x),
          this.worldToTileY(this.hero.sprites.hero.y),
          new PathFinder.Grid(
            this.dungeon.tiles.map(
              row => row.map(field => field === 2 || field === 3 ? 0 : 1)
            )
          )
        ))
        if (path.length > 1) {
          this.timebomb.applyForce(vector.distance({ x: this.tileToWorldX(path[1][0]) + 24, y: this.tileToWorldY(path[1][1]) + 24 }))
        }
      }
    }
  }

  checkHeroParticlesCollision() {
    if (this.heroParticles) {
      this.heroParticles.forEachAlive((particle) => {
        this.enemies.forEach((enemy) => {
          if (
            particle.x > enemy.sprite.body.left &&
            particle.x < enemy.sprite.body.right &&
            particle.y > enemy.sprite.body.top &&
            particle.y < enemy.sprite.body.bottom &&
            !enemy.burning
          ) {
            enemy.burning = true
            enemy.takeDamage(1)
            this.time.delayedCall(1000, () => {
              enemy.burning = false
            })
          }
        })
      })
    }
  }

  startCountdown(seconds) {
    this.countdown = new Date().getTime() / 1000 + seconds
    this.countdownText = this.add.text(25, 25, '1:00', {
      font: "15px monospace",
      fill: "#FFFFFF"
    }).setDepth(11).setScrollFactor(0)
  }

  updateCountdown() {
    const currentTime = new Date().getTime() / 1000
    if (this.countdown && this.countdown > currentTime) {
      const diff = this.countdown - currentTime
      const minutes = Math.floor(diff / 60)
      const seconds = Math.floor(diff % 60)
      this.countdownText.setText(minutes + ':' + seconds)
      if (minutes === 0 && seconds === 0) {
        this.countdown = null
        this.countdownText.destroy()
        this.cameras.main.shake(1000, 0.005)
        this.heroParticles.stop()
        this.hero.takeDamage(this.registry.get('maxHealth'))
      }
    }
  }

  showPath() {
    if (!this.pathSprites.length) {
      const finder = new PathFinder.AStarFinder()
      const path = finder.findPath(
        this.worldToTileX(this.hero.sprites.hero.x),
        this.worldToTileY(this.hero.sprites.hero.y),
        this.endRoom.centerX,
        this.endRoom.centerY,
        new PathFinder.Grid(
          this.dungeon.tiles.map(
            row => row.map(field => field === 2 || field === 3 ? 0 : 1)
          )
        )
      )

      // remove first and last point
      path.splice(0, 1)
      path.splice(path.length - 1, 1)

      path.forEach((tile) => {
        this.pathSprites.push(this.add.sprite(
          this.tileToWorldX(tile[0]) + 24,
          this.tileToWorldY(tile[1]) + 24,
          "path",
          0
        ).setDepth(6))
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

  popupDamageNumber(damage, sprite, color) {
    const damageText = this.add.text(sprite.body.x, sprite.body.y, '-' + damage, {
      font: '8px monospace',
      fill: color
    }).setDepth(10)
    this.tweens.add({
      targets: damageText,
      alpha: { start: 0, from: 1, to: 0 },
      scale: { from: 1.5, to: 2 },
      duration: 2500,
      ease: 'Cubic',
      y: '-=50'
    }).on('complete', () => {
      damageText.destroy()
    })
  }

  setCurrentRoom() {
    this.currentRoom = this.dungeon.getRoomAt(
      this.worldToTileX(this.hero.sprites.hero.x),
      this.worldToTileY(this.hero.sprites.hero.y)
    )
    this.visitedRooms.push(this.currentRoom)
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
    this.hero.update()
    this.enemies.forEach(e => e.update())
    this.setCurrentRoom()
    this.updateStairParticles()
    this.lightManager.update()
    this.checkFireTrapCollision()
    this.checkHeroParticlesCollision()
    this.updateCountdown()
    this.updateTimebomb()
  }
}
