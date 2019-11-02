import Phaser from "phaser";
import Dungeon from "@mikewesthad/dungeon";
import Player from "./player.js";
import Enemy from "./enemy.js";
import TILES from "./tile-mapping.js";
import TilemapVisibility from "./tilemap-visibility.js";
import tileset from "./assets/buch-tileset-48px-extruded.png";
import characters from "./assets/buch-characters-64px-extruded.png";
import theme from "./assets/kai-engel-downfall.mp3"
import emptyRoom from "./assets/empty-room.mp3"
import oneDoor from "./assets/with-one-door.mp3"
import twoDoors from "./assets/with-two-doors.mp3"
import threeDoors from "./assets/with-three-doors.mp3"
import fourDoors from "./assets/with-four-doors.mp3"
import fiveDoors from "./assets/with-five-doors.mp3"
import although from "./assets/although.mp3"
import horribleJourney from "./assets/horrible-journey.mp3"
import furtherDown from "./assets/further-down.mp3"
import againStairs from "./assets/again-stairs.mp3"
import theLight from "./assets/the-light.mp3"

/**
 * Scene that generates a new dungeon
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super();
    this.level = 1;
  }

  preload() {
    this.load.audio("ambient", theme)
    this.load.audio("emptyRoom", emptyRoom)
    this.load.audio("oneDoor", oneDoor)
    this.load.audio("twoDoors", twoDoors)
    this.load.audio("threeDoors", threeDoors)
    this.load.audio("fourDoors", fourDoors)
    this.load.audio("fiveDoors", fiveDoors)
    this.load.audio("although", although)
    this.load.audio("horribleJourney", horribleJourney)
    this.load.audio("furtherDown", furtherDown)
    this.load.audio("againStairs", againStairs)
    this.load.audio("theLight", theLight)
    this.load.image("tiles", tileset);
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

  playIntro() {
    this.player.freeze();
    const doorCount = this.dungeon.rooms[0].getDoorLocations().length;

    if (this.level === 1) {
      setTimeout(() => {
        this.player.unfreeze();
      }, 17000)
      this.sound.play("emptyRoom", { delay: 2 });
      if (doorCount === 1) {
        this.sound.play("oneDoor", { delay: 5.5 });
      } else if (doorCount === 2) {
        this.sound.play("twoDoors", { delay: 5.5 });
      } else if (doorCount === 3) {
        this.sound.play("threeDoors", { delay: 5.5 });
      } else if (doorCount === 4) {
        this.sound.play("fourDoors", { delay: 5.5 });
      } else if (doorCount === 5) {
        this.sound.play("fiveDoors", { delay: 5.5 });
      }
      this.sound.play("although", { delay: 8 });
    } else if (this.level === 2) {
      setTimeout(() => {
        this.player.unfreeze();
      }, 16500)
      this.sound.play("furtherDown", { delay: 2 });
      if (doorCount === 1) {
        this.sound.play("oneDoor", { delay: 13.5 });
      } else if (doorCount === 2) {
        this.sound.play("twoDoors", { delay: 13.5 });
      } else if (doorCount === 3) {
        this.sound.play("threeDoors", { delay: 13.5 });
      } else if (doorCount === 4) {
        this.sound.play("fourDoors", { delay: 13.5 });
      } else if (doorCount === 5) {
        this.sound.play("fiveDoors", { delay: 13.5 });
      }
    } else if (this.level === 5) {
      setTimeout(() => {
        this.player.unfreeze();
      }, 10500)
      this.sound.play("theLight", { delay: 2 });
    } else {
      this.player.unfreeze();
    }
  }

  create() {
    this.sound.play("ambient", { volume: 0.3, loop: true });

    this.hasPlayerReachedStairs = false;
    this.hasPlayerFoundEndRoom = false;
    this.hasPlayerDied = false;

    // Generate a random world with a few extra options:
    //  - Rooms should only have odd number dimensions so that they have a center tile.
    //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
    //    either side of the door location
    this.dungeon = new Dungeon({
      width: 50,
      height: 50,
      doorPadding: 2,
      rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true }
      }
    })

    // Creating a blank tilemap with dimensions matching the dungeon
    const map = this.make.tilemap({
      tileWidth: 48,
      tileHeight: 48,
      width: this.dungeon.width,
      height: this.dungeon.height
    });
    const tileset = map.addTilesetImage("tiles", null, 48, 48, 1, 2); // 1px margin, 2px spacing
    this.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
    this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);

    // Use the array of rooms generated to place tiles in the map
    // Note: using an arrow function here so that "this" still refers to our scene
    this.dungeon.rooms.forEach(room => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor with mostly clean tiles, but occasionally place a dirty tile
      // See "Weighted Randomize" example for more information on how to use weightedRandomize.
      this.groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles, but occasionally place a dirty tile
      this.groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP);
      this.groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
      this.groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT);
      this.groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT);

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
    //  - A random room to be designated as the end room (with stairs and nothing else)
    //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    this.endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);

    // Place the stairs
    this.stuffLayer.putTileAt(TILES.STAIRS, this.endRoom.centerX, this.endRoom.centerY);

    // Not exactly correct for the tileset since there are more possible floor tiles, but this will
    // do for the example.
    this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26, 63, 65]);
    this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

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
    const playerRoom = startRoom;
    const x = map.tileToWorldX(playerRoom.centerX);
    const y = map.tileToWorldY(playerRoom.centerY);
    this.player = new Player(this, x, y);

    // place enemies
    this.enemies = [];
    this.enemyGroup = this.add.group();
    otherRooms.forEach(room => {
      let enemy = new Enemy(this, map, room)
      this.enemies.push(enemy);
      this.enemyGroup.add(enemy.sprite);
    })

    this.physics.add.collider(this.player.sprite, this.enemyGroup, () => {
      this.hasPlayerDied = true;
      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        this.enemies.forEach(enemy => enemy.destroy());
        this.player.destroy();
        this.scene.restart();
      });
    });

    const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);
    this.tilemapVisibility = new TilemapVisibility(shadowLayer, this.level);

    this.playIntro()

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
    const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
    const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

    if (playerRoom === this.endRoom && !this.hasPlayerFoundEndRoom) {
      this.hasPlayerFoundEndRoom = true;
      let delay = 17000;
      if (this.level === 1) {
        this.sound.play("horribleJourney");
      } else if (this.level === 2) {
        this.sound.play("againStairs");
        delay = 10000;
      }
      if (this.level === 1 || this.level === 2) {
        setTimeout(() => {
          this.player.freeze()
        }, 250)
        setTimeout(() => {
          this.player.unfreeze()
        }, delay)
      }
    }

    this.tilemapVisibility.setActiveRoom(playerRoom);
  }
}
