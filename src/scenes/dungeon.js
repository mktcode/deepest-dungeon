import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Hero from "../objects/hero.js";
import Enemy from "../objects/enemy.js";
import TILES from "../tile-mapping.js";
import LightManager from "../light-manager.js";
import Narrator from '../narrator.js'
import PathFinder from 'pathfinding'

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
        height: { min: 15, max: 31, onlyOdd: true }
      }
    })
    const rooms = this.dungeon.rooms.slice()
    this.startRoom = rooms.shift()
    this.endRoom = rooms.splice(this.dungeon.r.randomInteger(0, rooms.length - 1), 1)[0]
    // add rest room every 5 dungeons (first room with only one door)
    this.restRoom = !(this.dungeonNumber % 4) ? rooms.splice(rooms.findIndex(room => room.getDoorLocations().length === 1), 1)[0] : null
    this.otherRooms = rooms
    this.currentRoom = this.startRoom
    this.visitedRooms = [this.startRoom]

    this.sword = null
    this.torch = null
    this.pathfinder = null
    this.pathSprites = []
    this.restRoomActivated = false
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
    this.particle = this.add.particles('particle').setDepth(7)

    this.prepareMap()
    this.prepareRooms()
    this.addHero()
    this.addEnemies()
    this.addItems()
    this.addFireTraps()
    this.addInteractionParticles()
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
          this.map.tileToWorldX(this.restRoom && this.restRoomActivated ? this.restRoom.centerX : this.startRoom.centerX),
          this.map.tileToWorldY(this.restRoom && this.restRoomActivated ? this.restRoom.centerY : this.startRoom.centerY)
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
    this.stuffLayer = this.map.createBlankDynamicLayer("Stuff", this.tileset).setDepth(3);
    this.shadowLayer = this.map.createBlankDynamicLayer("Shadow", this.tileset).fill(TILES.BLANK).setDepth(10);
    this.lightManager = new LightManager(this);

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
  }

  prepareRooms() {
    // Use the array of rooms generated to place tiles in the map
    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor
      this.floorLayer.weightedRandomize(left, top, width, height, TILES.FLOOR);

      // Place the room corners tiles
      this.wallLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top, 1, 1);
      this.wallLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top, 1, 1);
      this.wallLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom, 1, 1);
      this.wallLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom, 1, 1);

      // Fill the walls
      // top
      this.wallLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP[0]);
      this.wallLayer.weightedRandomize(left + 1, top + 1, width - 2, 1, TILES.WALL.TOP[1]);
      this.wallLayer.weightedRandomize(left + 1, top + 2, width - 2, 1, TILES.WALL.TOP[2]);
      this.wallLayer.weightedRandomize(left + 1, top + 3, width - 2, 1, TILES.WALL.TOP[3]);
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

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location
      var doors = room.getDoorLocations();
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.wallLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 2, y + doors[i].y);
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

      this.wallLayer.setCollisionByExclusion(TILES.NONCOLLIDING)
    });

    // Place the stairs
    this.stuffLayer.putTileAt(
      this.restRoom ? TILES.STAIRS.CLOSED : TILES.STAIRS.OPEN,
      this.endRoom.centerX,
      this.endRoom.centerY
    );
    this.input.on('pointerup', (pointer) => {
      const tile = this.stuffLayer.getTileAtWorldXY(pointer.worldX, pointer.worldY)
      if (tile && tile.index === TILES.STAIRS.OPEN) {
        this.hero.useStairs()
      }
      if (tile && [TILES.SHRINE.TOP[0], TILES.SHRINE.BOTTOM[0], TILES.SHRINE.LEFT[0], TILES.SHRINE.RIGHT[0]].includes(tile.index)) {
        this.hero.useShrine()
      }
    })

    // prepare rest room if exists
    if (this.restRoom) {
      this.floorLayer.fill(TILES.FLOOR_LIGHT, this.restRoom.left + 1, this.restRoom.top + 1, this.restRoom.width - 2, this.restRoom.height - 2);
      let restRoomDoor = this.restRoom.getDoorLocations()[0]
      if (restRoomDoor.y === 0) {
        this.floorLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y);
        this.floorLayer.putTileAt(TILES.LIGHT_ENTRANCE.Y, this.restRoom.x + restRoomDoor.x, this.restRoom.y - 1);
        this.stuffLayer.putTileAt(TILES.SHRINE.BOTTOM[0], this.restRoom.centerX, this.restRoom.bottom);
        this.stuffLayer.putTileAt(TILES.SHRINE.BOTTOM[1], this.restRoom.centerX, this.restRoom.bottom - 1);
      } else if (restRoomDoor.y === this.restRoom.height - 1) {
        this.floorLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y);
        this.floorLayer.putTileAt(TILES.LIGHT_ENTRANCE.Y, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y + 1);
        this.floorLayer.getTileAt(this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y + 1).setFlipY(true)
        this.stuffLayer.putTileAt(TILES.SHRINE.TOP[0], this.restRoom.centerX, this.restRoom.top);
        this.stuffLayer.putTileAt(TILES.SHRINE.TOP[1], this.restRoom.centerX, this.restRoom.top + 1);
      } else if (restRoomDoor.x === 0) {
        this.floorLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x, this.restRoom.y + restRoomDoor.y);
        this.floorLayer.putTileAt(TILES.LIGHT_ENTRANCE.X, this.restRoom.x - 1, this.restRoom.y + restRoomDoor.y);
        this.floorLayer.getTileAt(this.restRoom.x - 1, this.restRoom.y + restRoomDoor.y).setFlipX(true)
        this.stuffLayer.putTileAt(TILES.SHRINE.RIGHT[0], this.restRoom.right, this.restRoom.centerY);
        this.stuffLayer.putTileAt(TILES.SHRINE.RIGHT[1], this.restRoom.right - 1, this.restRoom.centerY);
      } else if (restRoomDoor.x === this.restRoom.width - 1) {
        this.floorLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y);
        this.floorLayer.putTileAt(TILES.LIGHT_ENTRANCE.X, this.restRoom.x + restRoomDoor.x + 1, this.restRoom.y + restRoomDoor.y);
        this.stuffLayer.putTileAt(TILES.SHRINE.LEFT[0], this.restRoom.left, this.restRoom.centerY);
        this.stuffLayer.putTileAt(TILES.SHRINE.LEFT[1], this.restRoom.left + 1, this.restRoom.centerY);
      }
    }
  }

  addHero() {
    // Place the player in the first room
    this.hero = new Hero(
      this,
      this.map.tileToWorldX(this.startRoom.centerX) + 16,
      this.map.tileToWorldY(this.startRoom.centerY) + 19
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

    this.physics.add.collider(this.hero.sprites.hero, this.wallLayer);
    this.physics.add.collider(this.hero.sprites.hero, this.stuffLayer);
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

      if (this.restRoom) {
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
              x = this.wallLayer.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.wallLayer.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: 80, max: 100}
            }
          } else if (wall === 'bottom') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.bottom, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.wallLayer.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.wallLayer.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -80, max: -100}
            }
          } else if (wall === 'left') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.top, 1, room.height).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.wallLayer.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.wallLayer.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -10, max: 10}
            }
          } else if (wall === 'right') {
            const tiles = this.wallLayer.getTilesWithin(room.right, room.top, 1, room.height).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.wallLayer.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.wallLayer.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -190, max: -170}
            }
          }

          this.add.rectangle(x, y, 8, 8, 0x000000).setDepth(6)

          const fireTrap = this.particle.createEmitter({
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
      x = this.map.tileToWorldX(swordRoom.centerX)
      y = this.map.tileToWorldY(swordRoom.centerY)
    }

    this.sword = this.physics.add.sprite(x, y, 'sword', 20).setSize(32, 32).setDepth(8)
    this.tweens.add({
      targets: this.sword,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.physics.add.collider(this.hero.sprites.hero, this.sword, () => {
      if (this.hero.dead) return

      this.registry.set('weapon', 'sword')
      const items = this.registry.get('items')
      items.push('sword')
      this.registry.set('items', items)
      this.sword.destroy()
    });
  }

  addTorch(x, y) {
    if (!x && !y) {
      const torchRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.map.tileToWorldX(Phaser.Utils.Array.GetRandom([torchRoom.left + 1, torchRoom.right - 1])) + 24
      y = this.map.tileToWorldY(Phaser.Utils.Array.GetRandom([torchRoom.top + 1, torchRoom.bottom - 1])) + 24
    }
    this.torch = this.physics.add.sprite(x, y, 'torch', 0).setSize(48, 48).setDepth(7)
    this.tweens.add({
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

    this.physics.add.collider(this.hero.sprites.hero, this.torch, () => {
      if (this.hero.dead) return
      const items = this.registry.get('items')
      items.push('torch')
      this.registry.set('items', items)
      this.scene.get('Gui').removeTorchDelayed()
      this.torch.destroy()
      this.lightManager.removeLight(this.torch)
      this.torch = null
    });
  }

  addPathfinder(x, y) {
    if (!x && !y) {
      const pathFinderRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.map.tileToWorldX(Phaser.Utils.Array.GetRandom([pathFinderRoom.left + 1, pathFinderRoom.right - 1])) + 24
      y = this.map.tileToWorldY(Phaser.Utils.Array.GetRandom([pathFinderRoom.top + 1, pathFinderRoom.bottom - 1])) + 24
    }
    this.pathfinder = this.physics.add.sprite(x, y, 'pathfinder', 0).setSize(48, 48).setDepth(8)
    this.tweens.add({
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

    this.physics.add.collider(this.hero.sprites.hero, this.pathfinder, () => {
      if (this.hero.dead) return
      const items = this.registry.get('items')
      items.push('pathfinder')
      this.registry.set('items', items)
      this.pathfinder.destroy()
      this.lightManager.removeLight(this.pathfinder)
      this.pathfinder = null
    });
  }

  addXpDust(x, y, xp, points) {
    this.xpDust = this.physics.add.sprite(x, y, 'xpDust', 0).setSize(52, 22).setDepth(7)
    this.lightManager.lights.push({
      sprite: this.xpDust,
      intensity: () => 1
    })
    this.xpDust.anims.play('xpDust', true)

    this.physics.add.collider(this.hero.sprites.hero, this.xpDust, () => {
      if (this.hero.dead) return
      this.xpDust.destroy()
      this.lightManager.removeLight(this.xpDust)
      if (xp) {
        this.registry.set('xp', this.registry.get('xp') + xp)
      }
      if (points) {
        this.registry.set('skillPoints', this.registry.get('skillPoints') + points)
      }
    });
  }

  addInteractionParticles() {
    this.interactionParticles = this.particle.createEmitter({
      blendMode: 'SCREEN',
      scale: { start: 0, end: 1.5 },
      alpha: { start: 1, end: 0 },
      speed: 10,
      quantity: 20,
      frequency: 200,
      lifespan: 500,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, this.tileSize, this.tileSize),
        type: 'edge',
        quantity: 20
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
  }

  updateParticles() {
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
          this.map.tileToWorldX(tile.x),
          this.map.tileToWorldY(tile.y)
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
      this.timebomb = this.add.rectangle(this.map.tileToWorldX(this.timebombRoom.centerX), this.map.tileToWorldY(this.timebombRoom.centerY), 8, 8, 0xffffff).setDepth(6)
      this.physics.add.existing(this.timebomb)
      this.physics.add.collider(this.timebomb, this.wallLayer)
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

      this.physics.add.collider(this.timebomb, this.hero.sprites.hero, () => {
        this.timebomb.destroy()
        this.timebombParticles.stop()
        this.heroParticles = this.particle.createEmitter({
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
      })

      this.timebombParticles.startFollow(this.timebomb)
      this.timebombFollows = false
    }
  }

  updateTimebomb() {
    if (!this.timebomb || !this.timebomb.active) return
    const vector = new Phaser.Math.Vector2(this.timebomb.x, this.timebomb.y);
    const distance = vector.distance({x: this.hero.sprites.hero.body.x, y: this.hero.sprites.hero.body.y})
    if (this.currentRoom === this.restRoom) {
      this.timebombFollows = false
      this.timebomb.body.setVelocity(0)
    } else if (this.timebombRoom === this.currentRoom && distance < 200) {
      this.timebombFollows = true
    }
    if (this.timebombFollows) {
      const tileX = this.wallLayer.worldToTileX(this.timebomb.x)
      const tileY = this.wallLayer.worldToTileY(this.timebomb.y)
      this.timebombRoom = this.dungeon.getRoomAt(tileX, tileY)
      if (this.timebombRoom === this.currentRoom && tileX > this.timebombRoom.left && tileX < this.timebombRoom.right && tileY > this.timebombRoom.top && tileY < this.timebombRoom.bottom) {
        this.physics.moveToObject(this.timebomb, this.hero.sprites.hero)
      } else {
        const finder = new PathFinder.AStarFinder({ allowDiagonal: true, dontCrossCorners: true })
        const path = PathFinder.Util.compressPath(finder.findPath(
          this.map.worldToTileX(this.timebomb.x),
          this.map.worldToTileY(this.timebomb.y),
          this.map.worldToTileX(this.hero.sprites.hero.x),
          this.map.worldToTileY(this.hero.sprites.hero.y),
          new PathFinder.Grid(
            this.dungeon.tiles.map(
              row => row.map(field => field === 2 || field === 3 ? 0 : 1)
            )
          )
        ))
        if (path.length > 1) {
          this.physics.moveTo(this.timebomb, this.wallLayer.tileToWorldX(path[1][0]) + 24, this.wallLayer.tileToWorldY(path[1][1]) + 24)
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
        this.floorLayer.worldToTileX(this.hero.sprites.hero.x),
        this.floorLayer.worldToTileY(this.hero.sprites.hero.y),
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
          this.floorLayer.tileToWorldX(tile[0]) + 24,
          this.floorLayer.tileToWorldY(tile[1]) + 24,
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
      this.floorLayer.worldToTileX(this.hero.sprites.hero.x),
      this.floorLayer.worldToTileY(this.hero.sprites.hero.y)
    )
    this.visitedRooms.push(this.currentRoom)
  }

  update() {
    this.hero.update()
    this.enemies.forEach(e => e.update())
    this.setCurrentRoom()
    this.updateParticles()
    this.lightManager.update()
    this.checkFireTrapCollision()
    this.checkHeroParticlesCollision()
    this.updateCountdown()
    this.updateTimebomb()
  }
}
