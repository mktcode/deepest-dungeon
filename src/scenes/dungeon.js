import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Hero from "../objects/hero.js";
import Enemy from "../objects/enemy.js";
import TILES from "../tile-mapping.js";
import LightManager from "../light-manager.js";
import Narrator from '../narrator.js'
import PathFinder from 'pathfinding'

// assets
import torchSprite from "../assets/torch.png";
import pathSprite from "../assets/path.png";
import pathfinderSprite from "../assets/pathfinder.png";

export default class DungeonScene extends Phaser.Scene {
  constructor(dungeonNumber) {
    super('Dungeon' + dungeonNumber)
    this.dungeonNumber = dungeonNumber
    this.dungeon = new Dungeon({
      randomSeed: 'Dungeon' + this.dungeonNumber,
      width: this.getWidthHeight(),
      height: this.getWidthHeight(),
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true }
      }
    })
    const rooms = this.dungeon.rooms.slice()
    this.startRoom = rooms.shift()
    this.endRoom = rooms.splice(this.dungeon.r.randomInteger(0, rooms.length - 1), 1)[0]
    this.restRoom = null
    // add rest room every 5 dungeons (first room with only one door)
    if (this.dungeonNumber >= 5 && !(this.dungeonNumber % 5)) {
      this.restRoom = rooms.splice(rooms.findIndex(room => room.getDoorLocations().length === 1), 1)[0]
    }
    this.otherRooms = rooms

    this.sword = null
    this.torch = null
    this.pathfinder = null
    this.pathSprites = []
    this.restRoomActivated = false
  }

  getWidthHeight() {
    return Math.min(100, 30 + this.dungeonNumber)
  }

  static preload(scene) {
    scene.load.spritesheet(
      "torch",
      torchSprite,
      {
        frameWidth: 48,
        frameHeight: 48
      }
    );
    scene.load.spritesheet(
      "path",
      pathSprite,
      {
        frameWidth: 18,
        frameHeight: 18
      }
    );
    scene.load.spritesheet(
      "pathfinder",
      pathfinderSprite,
      {
        frameWidth: 48,
        frameHeight: 48
      }
    );
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0)
    this.narrator = new Narrator(this)
    this.registry.set('currentDungeon', this.dungeonNumber)

    this.prepareMap()
    this.prepareRooms()
    this.addHero()
    this.addEnemies()
    this.addItems()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(250, 0, 0, 0)
      this.registry.set('currentDungeon', this.dungeonNumber)

      // keyboard bug workaround
      this.hero.keys.up.isDown = false
      this.hero.keys.down.isDown = false
      this.hero.keys.left.isDown = false
      this.hero.keys.right.isDown = false
      this.hero.keys.space.isDown = false
      this.hero.keys.shift.isDown = false

      if (this.restRoom && this.registry.get('wakeupInRestRoom')) {
        this.registry.set('wakeupInRestRoom', false)
        // place hero in rest room
        this.hero.jumpTo(
          this.map.tileToWorldX(this.restRoom.centerX),
          this.map.tileToWorldY(this.restRoom.centerY)
        )
      } else {
        // place hero in startroom
        this.hero.jumpTo(
          this.map.tileToWorldX(this.startRoom.centerX),
          this.map.tileToWorldY(this.startRoom.centerY)
        )
      }

      this.hero.unfreeze()
    })

    this.narrator.dungeonIntro(
      this.dungeonNumber,
      this.startRoom.getDoorLocations().length
    )
  }

  prepareMap() {
    // Creating a blank tilemap with dimensions matching the dungeon
    const tileWidthHeight = 48;
    this.map = this.make.tilemap({
      tileWidth: tileWidthHeight,
      tileHeight: tileWidthHeight,
      width: this.dungeon.width,
      height: this.dungeon.height
    });
    const tilesetImage = this.dungeonNumber === 25 ? "tilesetMc" : "tileset"
    this.tileset = this.map.addTilesetImage(tilesetImage, null, tileWidthHeight, tileWidthHeight, 1, 2); // 1px margin, 2px spacing

    this.groundLayer = this.map.createBlankDynamicLayer("Ground", this.tileset).fill(TILES.BLANK).setDepth(3);
    this.stuffLayer = this.map.createBlankDynamicLayer("Stuff", this.tileset).setDepth(4);
    this.shadowLayer = this.map.createBlankDynamicLayer("Shadow", this.tileset).fill(TILES.BLANK).setDepth(10);

    // add shadows and set active room
    this.lightManager = new LightManager(this);
    this.lightManager.setShadow()
    this.lightManager.setActiveRoom(this.startRoom)

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
  }

  prepareRooms() {
    // Use the array of rooms generated to place tiles in the map
    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor
      this.groundLayer.fill(TILES.FLOOR, left + 1, top + 1, width - 2, height - 2);

      // Place the room corners tiles
      this.groundLayer.weightedRandomize(left, top, 1, 1, TILES.WALL.TOP_LEFT);
      this.groundLayer.weightedRandomize(right, top, 1, 1, TILES.WALL.TOP_RIGHT);
      this.groundLayer.weightedRandomize(right, bottom, 1, 1, TILES.WALL.BOTTOM_RIGHT);
      this.groundLayer.weightedRandomize(left, bottom, 1, 1, TILES.WALL.BOTTOM_LEFT);

      // Fill the walls
      this.groundLayer.fill(TILES.WALL.TOP, left + 1, top, width - 2, 1);
      this.groundLayer.fill(TILES.WALL.BOTTOM, left + 1, bottom, width - 2, 1);
      this.groundLayer.fill(TILES.WALL.LEFT, left, top + 1, 1, height - 2);
      this.groundLayer.fill(TILES.WALL.RIGHT, right, top + 1, 1, height - 2);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location
      var doors = room.getDoorLocations();
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].y === room.height - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].x === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
        }
      }
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
      this.groundLayer.fill(TILES.FLOOR_LIGHT, this.restRoom.left + 1, this.restRoom.top + 1, this.restRoom.width - 2, this.restRoom.height - 2);
      let restRoomDoor = this.restRoom.getDoorLocations()[0]
      if (restRoomDoor.y === 0) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.Y, this.restRoom.x + restRoomDoor.x, this.restRoom.y - 1);
        this.stuffLayer.putTileAt(TILES.SHRINE.BOTTOM[0], this.restRoom.centerX, this.restRoom.bottom);
        this.stuffLayer.putTileAt(TILES.SHRINE.BOTTOM[1], this.restRoom.centerX, this.restRoom.bottom - 1);
      } else if (restRoomDoor.y === this.restRoom.height - 1) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.Y, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y + 1);
        this.groundLayer.getTileAt(this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y + 1).setFlipY(true)
        this.stuffLayer.putTileAt(TILES.SHRINE.TOP[0], this.restRoom.centerX, this.restRoom.top);
        this.stuffLayer.putTileAt(TILES.SHRINE.TOP[1], this.restRoom.centerX, this.restRoom.top + 1);
      } else if (restRoomDoor.x === 0) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.X, this.restRoom.x - 1, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.getTileAt(this.restRoom.x - 1, this.restRoom.y + restRoomDoor.y).setFlipX(true)
        this.stuffLayer.putTileAt(TILES.SHRINE.RIGHT[0], this.restRoom.right, this.restRoom.centerY);
        this.stuffLayer.putTileAt(TILES.SHRINE.RIGHT[1], this.restRoom.right - 1, this.restRoom.centerY);
      } else if (restRoomDoor.x === this.restRoom.width - 1) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.X, this.restRoom.x + restRoomDoor.x + 1, this.restRoom.y + restRoomDoor.y);
        this.stuffLayer.putTileAt(TILES.SHRINE.LEFT[0], this.restRoom.left, this.restRoom.centerY);
        this.stuffLayer.putTileAt(TILES.SHRINE.LEFT[1], this.restRoom.left + 1, this.restRoom.centerY);
      }
    }

    // set collision tiles
    this.groundLayer.setCollisionByExclusion([7, 90, 91, 97]);
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
          return torches.length
        }
        return 0
      }
    })

    // Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(this.hero.sprites.hero, this.groundLayer);
    this.physics.add.collider(this.hero.sprites.hero, this.stuffLayer);
  }

  addEnemies() {
    this.enemies = [];
    const maxEnemies = Math.min(10, this.dungeonNumber - 1)
    if (this.dungeonNumber > 1) {
      this.otherRooms.forEach(room => {
        const num = this.dungeon.r.randomInteger(1, maxEnemies)
        for (let i = 1; i <= num; i++) {
          this.enemies.push(new Enemy(this, this.map, room, 'snake', (enemy) => {
            Phaser.Utils.Array.Remove(this.enemies, enemy)
          }));
        }
      })

      if (this.restRoom) {
        this.enemies.push(new Enemy(this, this.map, this.endRoom, 'deamon', (enemy) => {
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

  addItems() {
    // sword
    if (this.dungeonNumber >= 3 && this.dungeonNumber % 3 && !this.registry.get('items').includes('sword')) {
      const swordRoom = this.dungeon.r.randomPick(this.otherRooms)
      this.sword = this.physics.add.sprite(
        this.map.tileToWorldX(swordRoom.centerX),
        this.map.tileToWorldY(swordRoom.centerY),
        'sword',
        20
      ).setSize(32, 32).setDepth(6)
      this.tweens.add({
        targets: this.sword,
        yoyo: true,
        repeat: -1,
        y: '+=5'
      })
      this.physics.add.collider(this.hero.sprites.hero, this.sword, () => {
        this.registry.set('weapon', 'sword')
        const items = this.registry.get('items')
        items.push('sword')
        this.registry.set('items', items)
        this.sword.destroy()
      });
    }

    // torches
    if (this.dungeonNumber >= 5 && this.dungeonNumber % 2) {
      const torchRoom = this.dungeon.r.randomPick(this.otherRooms)
      this.torch = this.physics.add.sprite(
        this.map.tileToWorldX(Phaser.Utils.Array.GetRandom([torchRoom.left + 1, torchRoom.right - 1])) + 24,
        this.map.tileToWorldY(Phaser.Utils.Array.GetRandom([torchRoom.top + 1, torchRoom.bottom - 1])) + 24,
        'torch',
        0
      ).setSize(48, 48).setDepth(6)
      this.lightManager.lights.push({
        sprite: this.torch,
        intensity: () => 1
      })
      this.torch.anims.play('torch', true)

      this.physics.add.collider(this.hero.sprites.hero, this.torch, () => {
        const items = this.registry.get('items')
        items.push('torch')
        this.registry.set('items', items)
        this.scene.get('Gui').removeTorchDelayed()
        this.torch.destroy()
        this.lightManager.removeLight(this.torch)
        this.torch = null
      });
    }

    // pathfinder
    if (this.dungeonNumber >= 10 && this.dungeonNumber % 4 && !this.registry.get('items').includes('pathfinder')) {
      const pathFinderRoom = this.dungeon.r.randomPick(this.otherRooms)
      this.pathfinder = this.physics.add.sprite(
        this.map.tileToWorldX(Phaser.Utils.Array.GetRandom([pathFinderRoom.left + 1, pathFinderRoom.right - 1])) + 24,
        this.map.tileToWorldY(Phaser.Utils.Array.GetRandom([pathFinderRoom.top + 1, pathFinderRoom.bottom - 1])) + 24,
        'pathfinder',
        0
      ).setSize(48, 48).setDepth(6)
      this.lightManager.lights.push({
        sprite: this.pathfinder,
        intensity: () => 1
      })
      this.pathfinder.anims.play('pathfinder', true)

      this.physics.add.collider(this.hero.sprites.hero, this.pathfinder, () => {
        const items = this.registry.get('items')
        items.push('pathfinder')
        this.registry.set('items', items)
        this.pathfinder.destroy()
        this.lightManager.removeLight(this.pathfinder)
        this.pathfinder = null
      });
    }
  }

  showPath() {
    if (!this.pathSprites.length) {
      const finder = new PathFinder.AStarFinder()
      const path = finder.findPath(
        this.groundLayer.worldToTileX(this.hero.sprites.hero.x),
        this.groundLayer.worldToTileY(this.hero.sprites.hero.y),
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
          this.groundLayer.tileToWorldX(tile[0]) + 24,
          this.groundLayer.tileToWorldY(tile[1]) + 24,
          "path",
          0
        ))
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

  update() {
    this.hero.update()
    this.enemies.forEach(e => e.update())
    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerRoom = this.dungeon.getRoomAt(
      this.groundLayer.worldToTileX(this.hero.sprites.hero.x),
      this.groundLayer.worldToTileY(this.hero.sprites.hero.y)
    );
    this.lightManager.setActiveRoom(playerRoom)
    this.lightManager.setShadow();

    if (playerRoom === this.restRoom) {
      this.narrator.sayOnce('restRoom')
    }
  }
}
