import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Hero from "../objects/hero.js";
import Enemy from "../objects/enemy.js";
import TILES from "../tile-mapping.js";
import TilemapVisibility from "../tilemap-visibility.js";
import Narrator from '../narrator.js'

// assets
import torchSprite from "../assets/torch.png";

export default class DungeonScene extends Phaser.Scene {
  constructor(level) {
    super('Dungeon' + level)
    this.level = level
    this.dungeon = new Dungeon({
      width: 28,
      height: 28,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true }
      }
    })
    const rooms = this.dungeon.rooms.slice();
    this.startRoom = rooms.shift();
    this.endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    this.otherRooms = Phaser.Utils.Array.Shuffle(rooms);
    this.restRoom = null;
    this.swordRoom = null;
    this.torch = null

    // add rest room only every 5 levels
    if (this.level >= 5 && !(this.level % 5)) {
      this.restRoom = this.otherRooms.find(room => room.getDoorLocations().length === 1)
    }
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
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0)
    this.narrator = new Narrator(this)
    this.registry.set('currentLevel', this.level)

    this.prepareMap()
    this.prepareRooms()
    this.addShadowLayer()
    this.addHero()
    this.addEnemies()
    this.addItems()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(250, 0, 0, 0)
      this.registry.set('currentLevel', this.level)

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

    this.narrator.levelIntro(
      this.level,
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
    const tilesetImage = this.level === 25 ? "tilesetMc" : "tileset"
    this.tileset = this.map.addTilesetImage(tilesetImage, null, tileWidthHeight, tileWidthHeight, 1, 2); // 1px margin, 2px spacing
    this.groundLayer = this.map.createBlankDynamicLayer("Ground", this.tileset).fill(TILES.BLANK);
    this.stuffLayer = this.map.createBlankDynamicLayer("Stuff", this.tileset);
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
    this.stuffLayer.putTileAt(TILES.STAIRS, this.endRoom.centerX, this.endRoom.centerY);

    // prepare rest room if exists
    if (this.restRoom) {
      Phaser.Utils.Array.Remove(this.otherRooms, this.restRoom)
      this.groundLayer.fill(TILES.FLOOR_LIGHT, this.restRoom.left + 1, this.restRoom.top + 1, this.restRoom.width - 2, this.restRoom.height - 2);
      let restRoomDoor = this.restRoom.getDoorLocations()[0]
      if (restRoomDoor.y === 0) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.Y, this.restRoom.x + restRoomDoor.x, this.restRoom.y - 1);
      } else if (restRoomDoor.y === this.restRoom.height - 1) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.Y, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y + 1);
        this.groundLayer.getTileAt(this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y + 1).setFlipY(true)
      } else if (restRoomDoor.x === 0) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.X, this.restRoom.x - 1, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.getTileAt(this.restRoom.x - 1, this.restRoom.y + restRoomDoor.y).setFlipX(true)
      } else if (restRoomDoor.x === this.restRoom.width - 1) {
        this.groundLayer.putTileAt(TILES.FLOOR_LIGHT, this.restRoom.x + restRoomDoor.x, this.restRoom.y + restRoomDoor.y);
        this.groundLayer.putTileAt(TILES.LIGHT_ENTRANCE.X, this.restRoom.x + restRoomDoor.x + 1, this.restRoom.y + restRoomDoor.y);
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
    this.tilemapVisibility.lights.push({
      sprite: this.hero.sprites.hero,
      darkness: () => {
        let darkness = this.level
        const torches = this.registry.get('items').filter(item => item === 'torch')

        if (torches && torches.length) {
          darkness = Math.min(this.level, 5 - torches.length)
        }
        return darkness
      }
    })

    // Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(this.hero.sprites.hero, this.groundLayer);
    this.physics.add.collider(this.hero.sprites.hero, this.stuffLayer);
  }

  addEnemies() {
    this.enemies = [];
    const maxEnemies = Math.min(10, this.level - 1)
    if (this.level > 1) {
      this.otherRooms.forEach(room => {
        const num = Phaser.Math.Between(1, maxEnemies)
        for (let i = 1; i <= num; i++) {
          this.enemies.push(new Enemy(this, this.map, room));
        }
      })
    }
  }

  addItems() {
    // sword
    if (this.level >= 3 && this.level % 3 && !this.registry.get('weapon')) {
      this.swordRoom = Phaser.Utils.Array.GetRandom(this.otherRooms);
      const theSword = this.physics.add.sprite(
        this.map.tileToWorldX(this.swordRoom.centerX),
        this.map.tileToWorldY(this.swordRoom.centerY),
        'sword',
        20
      ).setSize(32, 32)
      this.tweens.add({
        targets: theSword,
        yoyo: true,
        repeat: -1,
        y: '+=5'
      })
      this.physics.add.collider(this.hero.sprites.hero, theSword, () => {
        this.registry.set('weapon', 'sword')
        const items = this.registry.get('items')
        items.push('sword')
        this.registry.set('items', items)
        theSword.destroy()
      });
    }

    // torches
    if (this.level >= 5 && this.level % 2) {
      const torchRoom = Phaser.Utils.Array.GetRandom(this.otherRooms);
      this.torch = this.physics.add.sprite(
        this.map.tileToWorldX(Phaser.Utils.Array.GetRandom([torchRoom.left + 1, torchRoom.right - 1])) + 24,
        this.map.tileToWorldY(Phaser.Utils.Array.GetRandom([torchRoom.top + 1, torchRoom.bottom - 1])) + 24,
        'torch',
        0
      ).setSize(48, 48)
      this.tilemapVisibility.lights.push({
        sprite: this.torch,
        darkness: () => 4
      })
      this.torch.anims.play('torch', true)

      this.physics.add.collider(this.hero.sprites.hero, this.torch, () => {
        const items = this.registry.get('items')
        items.push('torch')
        this.registry.set('items', items)
        this.scene.get('Gui').removeTorchDelayed()
        this.torch.destroy()
        this.tilemapVisibility.removeLight(this.torch)
        this.torch = null
      });
    }
  }

  addShadowLayer() {
    // add shadows and set active room
    const shadowLayer = this.map.createBlankDynamicLayer("Shadow", this.tileset).fill(TILES.BLANK).setDepth(5);
    const roomShadowLayer = this.map.createBlankDynamicLayer("RoomShadow", this.tileset).fill(TILES.BLANK).setDepth(5);
    this.tilemapVisibility = new TilemapVisibility(this, shadowLayer, roomShadowLayer, this.restRoom, this.hero, this.level);
    this.tilemapVisibility.setShadow()
    this.tilemapVisibility.setActiveRoom(this.startRoom)
  }

  update() {
    this.hero.update()
    this.enemies.forEach(e => {
      if (e.hp) {
        e.update()
      } else {
        e.sprite.destroy()
        Phaser.Utils.Array.Remove(this.enemies, e)
      }
    })
    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerRoom = this.dungeon.getRoomAt(
      this.groundLayer.worldToTileX(this.hero.sprites.hero.x),
      this.groundLayer.worldToTileY(this.hero.sprites.hero.y)
    );
    this.tilemapVisibility.setShadow();
    this.tilemapVisibility.setActiveRoom(playerRoom)

    if (playerRoom === this.restRoom) {
      this.narrator.sayOnce('restRoom')
      this.registry.set('minLevel', this.level)
    }
  }
}
