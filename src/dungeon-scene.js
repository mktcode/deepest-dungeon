import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Player from "./player.js";
import Enemy from "./enemy.js";
import Narrator from "./narrator.js";
import TILES from "./tile-mapping.js";
import TilemapVisibility from "./tilemap-visibility.js";
import tileset from "./assets/dungeon-extruded.png";
import characters from "./assets/buch-characters-64px-extruded.png";
import themeMp3 from "./assets/audio/kai-engel-downfall.mp3"

/**
 * Scene that generates a new dungeon
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super();
    this.level = 1;
    this.minLevel = 1;
    this.narrator = new Narrator()
    this.ambientMusik
  }

  preload() {
    this.narrator.preload(this)
    this.load.audio("ambientMusik", themeMp3)

    this.load.image("tileset", tileset)
    this.load.spritesheet(
      "characters",
      characters,
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
      }
    );
  }

  create() {
    this.narrator.create(this)

    if (!this.ambientMusik) {
      this.ambientMusik = this.sound.add("ambientMusik")
      this.ambientMusik.play({ volume: 0.3, loop: true });
    }

    this.hasPlayerReachedStairs = false;
    this.hasPlayerFoundEndRoom = false;
    this.hasPlayerDied = false;

    // Generate a random world with a few extra options:
    //  - Rooms should only have odd number dimensions so that they have a center tile.
    //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
    //    either side of the door location
    this.dungeon = new Dungeon({
      width: 25,
      height: 25,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true }
      }
    })

    // Creating a blank tilemap with dimensions matching the dungeon
    const tileWidthHeight = 48;
    const map = this.make.tilemap({
      tileWidth: tileWidthHeight,
      tileHeight: tileWidthHeight,
      width: this.dungeon.width,
      height: this.dungeon.height
    });
    const tileset = map.addTilesetImage("tileset", null, tileWidthHeight, tileWidthHeight, 1, 2); // 1px margin, 2px spacing
    this.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
    this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);

    // Use the array of rooms generated to place tiles in the map
    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor
      this.groundLayer.fill(TILES.FLOOR, left + 1, top + 1, width - 2, height - 2);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

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

    // Separate out the rooms into:
    //  - The starting room (index = 0)
    //  - A random room to be designated as the end room
    //  - A potential rest room
    //  - All other rooms
    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    this.endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms);
    this.restRoom = null;

    // prepare a rest room every five levels
    if (this.level >= 5 && !(this.level % 5)) {
      this.restRoom = otherRooms.find(room => room.getDoorLocations().length === 1)
      if (this.restRoom) {
        Phaser.Utils.Array.Remove(otherRooms, this.restRoom)
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
    }

    // Place the stairs
    this.stuffLayer.putTileAt(TILES.STAIRS, this.endRoom.centerX, this.endRoom.centerY);

    this.groundLayer.setCollisionByExclusion([7, 90, 91, 97]);

    this.stuffLayer.setTileIndexCallback(TILES.STAIRS, () => {
      this.stuffLayer.setTileIndexCallback(TILES.STAIRS, null);
      this.hasPlayerReachedStairs = true;
      this.level++;
      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        this.player.destroy();
        this.scene.restart();
      });
    });

    // Place the player in the first room
    this.player = new Player(
      this,
      map.tileToWorldX(startRoom.centerX),
      map.tileToWorldY(startRoom.centerY)
    );

    // place enemies
    this.enemies = [];
    if (this.level > 1) {
      this.enemyGroup = this.add.group();
      otherRooms.forEach(room => {
        let enemy = new Enemy(this, map, room)
        this.enemies.push(enemy);
        this.enemyGroup.add(enemy.sprite);
      })

      this.physics.add.collider(this.player.sprite, this.enemyGroup, () => {
        this.level = this.minLevel
        this.hasPlayerDied = true;
        this.player.freeze();
        const cam = this.cameras.main;
        cam.fade(250, 0, 0, 0);
        cam.once("camerafadeoutcomplete", () => {
          this.enemies.forEach(enemy => enemy.destroy());
          this.player.unfreeze()
          this.player.destroy();
          this.scene.restart();
          this.narrator.sayOnce("orientationLost")
        });
      });
    }

    const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);
    this.tilemapVisibility = new TilemapVisibility(shadowLayer, this.level);

    this.player.freeze()
    this.narrator.levelIntro(
      this.level,
      this.dungeon.rooms[0].getDoorLocations().length
    ).then(() => this.player.unfreeze())

    // Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.physics.add.collider(this.player.sprite, this.stuffLayer);

    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main;

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.player.sprite);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Find the stairs. Go deeper.\nCurrent level: ${this.level}`, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);
  }

  update(time, delta) {
    if (this.hasPlayerReachedStairs || this.hasPlayerDied) return;

    this.player.update();
    this.enemies.forEach(enemy => enemy.update());

    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerRoom = this.dungeon.getRoomAt(
      this.groundLayer.worldToTileX(this.player.sprite.x),
      this.groundLayer.worldToTileY(this.player.sprite.y)
    );

    this.tilemapVisibility.setActiveRoom(playerRoom);

    if (playerRoom === this.endRoom && !this.hasPlayerFoundEndRoom) {
      this.hasPlayerFoundEndRoom = true;
      let say;
      if (this.level === 1) {
        say = 'horribleJourney'
      } else if (this.level === 2) {
        say = 'againStairs'
      }
      if (say) {
        setTimeout(() => {
          this.player.freeze()
          this.narrator.sayOnce(say).then(() => this.player.unfreeze())
        }, 300)
      }
    }

    if (playerRoom === this.restRoom) {
      this.minLevel = this.level
      this.narrator.sayOnce("restRoom", 1)
    }
  }
}
