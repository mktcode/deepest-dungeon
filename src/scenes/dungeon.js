import Phaser from 'phaser'
import MapScene from './map.js'
import Dungeon from '@mikewesthad/dungeon'
import Hero from '../objects/hero.js'
import Guard from '../objects/guard.js'
import Zombie from '../objects/enemies/zombie.js'
import Spider from '../objects/enemies/spider.js'
import TILES from '../tile-mapping.js'
import COLLISION_CATEGORIES from '../collision-categories.js'
import TEXTS from '../texts.js'
import LightManager from '../light-manager.js'
import Narrator from '../narrator.js'
import Sounds from '../sounds.js'
import { API_URL, getLevelByXp } from '../helper.js'
import PathFinder from 'pathfinding'
import { Slice } from 'polyk'
import axios from 'axios'

// assets
import tileset from '../assets/dungeon-tileset-extruded.png'
import swordSprite from '../assets/sword.png'
import torchSprite from '../assets/torch.png'
import candlestandSprite from '../assets/candlestand.png'
import pathSprite from '../assets/path.png'
import pathfinderSprite from '../assets/pathfinder.png'
import scroll from '../assets/scroll.png'

export default class DungeonScene extends MapScene {
  constructor(dungeonNumber, startInSafeRoom) {
    super('Dungeon' + dungeonNumber)
    this.dungeonNumber = dungeonNumber
    this.startInSafeRoom = startInSafeRoom
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
    this.safeRoom = null

    this.sword = null
    this.torch = null
    this.pathfinder = null
    this.fireTraps = []
    this.candlestands = []

    this.safeRoomActivated = false
    this.dungeonVisits = 1

    this.enemies = []
    this.healthOrbs = []
    this.manaOrbs = []
    this.xpOrbs = []
    this.xpOrbSound = 1
    this.xpOrbSoundResetTimeout = null

    this.isStatic = { isStatic: true }
    this.wallPhysics = { isStatic: true, collisionFilter: { category: COLLISION_CATEGORIES.WALL }, label: 'wall' }
  }

  static preload(scene) {
    scene.load.image('tileset', tileset)
    scene.load.spritesheet('sword', swordSprite, { frameWidth: 31, frameHeight: 31 })
    scene.load.spritesheet('torch', torchSprite, { frameWidth: 8, frameHeight: 18 })
    scene.load.spritesheet('candlestand', candlestandSprite, { frameWidth: 16, frameHeight: 40 })
    scene.load.spritesheet('path', pathSprite, { frameWidth: 6, frameHeight: 6 })
    scene.load.spritesheet('pathfinder', pathfinderSprite, { frameWidth: 24, frameHeight: 24 })
    scene.load.image('scroll', scroll)
  }

  create() {
    // prepare
    this.narrator = new Narrator(this)
    this.sounds = new Sounds(this)
    this.music = this.registry.get('ambientMusic')
    this.music.setRate(1)
    this.safeRoom = this.getSafeRoom()
    this.registry.set('currentDungeon', this.dungeonNumber)
    this.registry.set('playersDeepestDungeon', this.dungeonNumber)

    // particles
    this.interactionParticle = this.add.particles('particle').setDepth(5)
    this.interactionParticleAbove = this.add.particles('particle').setDepth(7)
    this.ambientParticle = this.add.particles('particle').setDepth(9)
    this.fogParticle = this.add.particles('fog').setDepth(9)
    this.fireParticle = this.add.particles('particle').setDepth(7)
    this.fireParticleAbove = this.add.particles('particle').setDepth(10)
    this.orbParticle = this.add.particles('particle').setDepth(7)

    // build dungeon
    this.prepareMap()
    this.prepareRooms()
    this.addStairs()
    this.prepareSafeRoom()
    this.addAmbientParticles()
    this.addFog()

    // add hero
    this.hero = new Hero(this, this.startInSafeRoom && this.safeRoom ? this.safeRoom : this.startRoom)

    // if we are in the deepest dungeon, then add guard
    axios.get(API_URL + '/api/players/' + this.registry.get('credentials').name + '/guard').then(res => {
      if (this.dungeonNumber >= res.data.deepestDungeon && this.endRoom) {
        this.guard = new Guard(this, this.endRoom)
        this.guard.uuid = res.data.uuid
        this.guard.runOrWalk = 'walk'
        this.guard.set('level', getLevelByXp(res.data.xp))
        this.guard.set('xp', res.data.xp)
        this.guard.set('health', res.data.maxHealth)
        this.guard.set('maxHealth', res.data.maxHealth)
        this.guard.set('mana', res.data.maxMana)
        this.guard.set('maxMana', res.data.maxMana)
        this.guard.set('damage', res.data.damage)
        this.guard.set('torchIntensity', this.hero.get('torchIntensity'))
        this.guard.set('torchDuration', this.hero.get('torchDuration'))
        this.guard.set('shieldDamage', this.hero.get('shieldDamage'))
        this.guard.set('shieldDuration', this.hero.get('shieldDuration'))
        this.guard.set('fireballSize', this.hero.get('fireballSize'))

        const items = JSON.parse(res.data.items)
        if (items && items.length) {
          items.forEach(item => this.guard.addItem(item))
        }
      }
    })

    // add objects
    this.addEnemies()
    this.addObjects()

    this.addControls()
    this.addClickAnimation()
    this.addOverlayText()

    // when we come back to this dungeon after dying and when we leave it
    this.events.on('wake', () => this.wake())
    this.events.on('sleep', () => this.sleep())

    this.start()
  }

  start() {
    this.cameras.main.setZoom(this.registry.get('zoom'))
    this.cameras.main.fadeIn(2000, 0, 0, 0)

    // ALERT: DIRTY WORKAROUND (setTimeout): Dungeon depends on Gui and vice verca on start up. Needs to be fixed.
    setTimeout(() => {
      const gui = this.scene.get('Gui')

      if (this.startInSafeRoom) {
        this.music.play()
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: [gui.characterInfo],
            alpha: { from: 0, to: 1 }
          })
        })
      }

      if (this.dungeonNumber === 2) {
        this.music.play()
        gui.showChapterIntroText(1, TEXTS.CHAPTER_ONE)
      }

      const narratorSaid = this.registry.get('narratorSaid')
      if (!narratorSaid.includes('whereAmI')) {
        this.playStoryElementOnce('whereAmI').then(() => {
          gui.showSubtitle(TEXTS.WASD_TO_MOVE)
          this.time.delayedCall(1000, () => {
            this.tweens.add({
              targets: [gui.characterInfo],
              alpha: { from: 0, to: 1 }
            })
          })
        })
      } else {
        if (
          narratorSaid.includes('aTimeeater') &&
          narratorSaid.includes('shieldSpell') &&
          narratorSaid.includes('aScoutsEye') &&
          this.registry.get('items').includes('fireball') &&
          !narratorSaid.includes('theEnd')
        ) {
          this.playStoryElementOnce('theEnd')
        }
      }
    }, 100)
  }

  wake() {
    this.cameras.main.fadeIn(1000, 0, 0, 0)
    this.cameras.main.shake(1000, 0, true) // interrupt shake if dungeon was shaking when leaving it
    this.cameras.main.setZoom(this.registry.get('zoom'))

    this.dungeonVisits++
    this.registry.set('currentDungeon', this.dungeonNumber)

    // resetting sounds and input
    this.music.setRate(1)
    this.hero.resetKeys()
    if (this.timebombTickingSound) {
      this.timebombTickingSound.stop()
    }

    // add new enemies
    this.addEnemies()
    this.hero.targetedEnemy = null

    // narrative
    if (this.dungeonNumber === this.registry.get('minDungeon')) {
      if (!this.registry.get('narratorSaid').includes('whenHeWasDefeated')) {
        this.playStoryElementOnce('whenHeWasDefeated')
      } else {
        this.playStoryElementOnce('againEmptiness')
      }
    }

    // unblock stairs while narrator is speaking
    this.narrator.blockStairs = false

    // place hero
    this.hero.sprite.visible = false
    this.hero.freeze()
    this.time.delayedCall(1000, () => {
      this.hero.sprite.visible = true
      this.hero.isDead = false
      this.hero.isUnderAttack = false
      this.hero.unfreeze()
      this.hero.jumpTo(
        this.tileToWorldX(this.safeRoom && this.safeRoomActivated ? this.safeRoom.centerX : this.startRoom.centerX),
        this.tileToWorldY(this.safeRoom && this.safeRoomActivated ? this.safeRoom.centerY : this.startRoom.centerY)
      )
    })

    // place guard
    if (this.guard) {
      this.guard.jumpTo(
        this.tileToWorldX(this.endRoom.centerX),
        this.tileToWorldY(this.endRoom.centerY)
      )
    }
  }

  sleep() {
    if (this.timebombTickingSound) {
      this.timebombTickingSound.stop()
    }
    this.countdown = null
    if (this.countdownText) {
      this.countdownText.destroy()
    }
    if (this.heroParticles) {
      this.heroParticles.stop()
    }
  }

  save() {
    const gui = this.scene.get('Gui')
    const savingText = gui.add.text(this.game.scale.width - 80, this.game.scale.height - 20, 'saving...', {
      font: '12px monospace',
      fill: '#CCCCCC'
    })

    const tween = this.tweens.add({
      duration: 250,
      targets: savingText,
      yoyo: true,
      repeat: -1,
      alpha: { from: 0, to: 1 }
    })

    const credentials = this.registry.get('credentials')
    axios.post(API_URL + '/api/save', {
      name: credentials.name,
      password: credentials.password,
      currentDungeon: this.registry.get('currentDungeon'),
      deepestDungeon: this.registry.get('playersDeepestDungeon'),
      minDungeon: this.registry.get('minDungeon'),
      items: this.registry.get('items'),
      maxHealth: this.registry.get('maxHealth'),
      maxMana: this.registry.get('maxMana'),
      damage: this.registry.get('damage'),
      xp: this.registry.get('xp'),
      enemiesKilled: this.registry.get('enemiesKilled'),
      narratorSaid: this.registry.get('narratorSaid')
    }).then(() => {
      setTimeout(() => {
        tween.remove()
        savingText.destroy()
      }, 2000)
    }).catch(e => {
      console.log('saving failed', e)
    })
  }

  addControls() {
    this.input.keyboard.on('keyup-ESC', () => this.pauseGame())
    this.input.on('wheel', (pointer, currentlyOver, dx, dy) => this.zoom(pointer, currentlyOver, dx, dy))
  }

  addClickAnimation() {
    this.clickAnimationParticle = this.add.particles('particle').setDepth(1)
    this.clickAnimation = this.clickAnimationParticle.createEmitter({
      on: false,
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.4 },
      alpha: { start: 0.5, end: 0 },
      speed: 5,
      quantity: 10,
      frequency: 200,
      lifespan: 750,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 5),
        type: 'edge',
        quantity: 10
      }
    })

    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (pointer.leftButtonDown()) {
        const targetedEnemy = currentlyOver.find(co => ['spider', 'zombie'].includes(co.getData('name')))
        this.clickAnimation.setTint(targetedEnemy ? 0xFF0000 : 0xFFFFFF)
        this.clickAnimation.setPosition(pointer.worldX, pointer.worldY)
        this.clickAnimation.explode()
      }
    })
  }

  pauseGame() {
    this.scene.pause()
    this.scene.get('Gui').scene.pause()
    if (this.narrator.playing) this.narrator.playing.pause()
    this.scene.run('Pause')
  }

  zoom(pointer, currentlyOver, dx, dy) {
    if (this.narrator.playing) return
    let zoom = this.registry.get('zoom')
    if (dy > 0) {
      zoom -= 0.05
    } else {
      zoom += 0.05
    }
    if (zoom < 1.3) zoom = 1.3
    if (zoom > 3.5) zoom = 3.5
    this.cameras.main.setZoom(zoom)
    this.registry.set('zoom', zoom)
  }

  addAmbientParticles() {
    this.ambientParticle.createEmitter({
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
        source: new Phaser.Geom.Rectangle(0, 0, this.dungeon.width * this.tileSize, this.dungeon.height * this.tileSize),
        type: 'random',
        quantity: 40
      }
    })
  }

  addFog() {
    if (this.dungeonNumber > 2) {
      this.fogParticle.createEmitter({
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
          source: new Phaser.Geom.Rectangle(0, 0, this.dungeon.width * this.tileSize, this.dungeon.height * this.tileSize),
          type: 'random',
          quantity: 1
        }
      })
    }
  }

  playStoryElement(key) {
    return new Promise((resolve, reject) => {
      if (key === 'whereAmI') {
        // in first dungeon wait for gui to be ready
        setTimeout(() => {
          this.narrator.freezeStart()
          this.narrator.sayOnce('whereAmI', 1).then(() => {
            this.narrator.freezeEnd()
            resolve()
          })
        }, 250)
      }

      if (key === 'whatWasThisAbout') {
        this.narrator.sayOnce('whatWasThisAbout').then(() => resolve())
      }

      if (key === 'whenHeWasDefeated') {
        this.narrator.sayOnce('whenHeWasDefeated').then(() => resolve())
      }

      if (key === 'againEmptiness') {
        this.narrator.sayOnce('againEmptiness').then(() => resolve())
      }

      if (key === 'finallySomeStairs') {
        this.narrator.freezeStart()
        this.stopCameraFollow()
        this.cameraPan(this.tileToWorldX(this.endRoom.centerX), this.tileToWorldY(this.endRoom.centerY))
        this.narrator.sayOnce('finallySomeStairs').then(() => {
          this.cameraPan(this.hero.container.x, this.hero.container.y).then(() => {
            this.cameraFollow(this.hero.container)
            this.narrator.freezeEnd()
            resolve()
          })
        })
      }

      if (key === 'undeadCreatures') {
        this.narrator.sayOnce('undeadCreatures').then(() => resolve())
      }

      if (key === 'killingAllTheseEnemies') {
        this.narrator.sayOnce('killingAllTheseEnemies').then(() => resolve())
      }

      if (key === 'thereItWasASword') {
        this.narrator.sayOnce('thereItWasASword').then(() => resolve())
      }

      if (key === 'torchPerfect') {
        this.narrator.sayOnce('torchPerfect').then(() => resolve())
      }

      if (key === 'thisRoomWasDifferent') {
        this.narrator.slowmoStart()
        this.narrator.sayOnce('thisRoomWasDifferent').then(() => {
          this.narrator.slowmoEnd()
          resolve()
        })
      }

      if (key === 'aTimeeater') {
        this.narrator.freezeStart()
        this.stopCameraFollow()
        this.cameraPan(this.timebomb.x, this.timebomb.y)
        this.narrator.sayOnce('aTimeeater').then(() => {
          this.cameraPan(this.hero.container.x, this.hero.container.y).then(() => {
            this.cameraFollow(this.hero.container)
            this.narrator.freezeEnd()
            resolve()
          })
        })
      }

      if (key === 'itsGettingHot') {
        this.narrator.sayOnce('itsGettingHot').then(() => resolve())
      }

      if (key === 'aScoutsEye') {
        this.narrator.sayOnce('aScoutsEye').then(() => resolve())
      }

      if (key === 'shieldSpell') {
        this.narrator.sayOnce('shieldSpell').then(() => resolve())
      }

      if (key === 'theEnd') {
        this.narrator.freezeStart()
        this.narrator.sayOnce('theEnd', 1).then(() => {
          this.narrator.freezeEnd()
          resolve()
        })
      }

      if (key === 'outtakes') {
        this.narrator.sayOnce('outtakes', 0, 1).then(() => resolve())
      }
    })
  }

  playStoryElementOnce(key) {
    return new Promise((resolve, reject) => {
      if (!this.registry.get('narratorSaid').includes(key)) {
        this.playStoryElement(key).then(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
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
    if (this.dungeonNumber >= 4 && !(this.dungeonNumber % 2)) {
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
          TILES.WALL.BOTTOM_LEFT === tile.index ||
          TILES.WALL.BOTTOM_RIGHT === tile.index ||
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
          this.walls.push(this.matter.add.rectangle(topDoorLeft - 2, worldTop - 20, 5, 40, this.wallPhysics))
          this.walls.push(this.matter.add.rectangle(topDoorRight + 2, worldTop - 20, 5, 40, this.wallPhysics))
        }
        if (door.x === 0) {
          const leftDoorTop = this.tileToWorldY(top + door.y) + 17
          const leftDoorBottom = this.tileToWorldY(top + door.y) + 62
          this.walls.push(this.matter.add.rectangle(worldLeft - 16, leftDoorTop, 40, 5, this.wallPhysics))
          this.walls.push(this.matter.add.rectangle(worldLeft - 16, leftDoorBottom, 40, 5, this.wallPhysics))
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
              slices[0][1] -= 35
              slices[0][7] -= 35
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
        this.walls.push(this.matter.add.fromVertices(worldLeft + center.x, worldTop + center.y, rect, this.wallPhysics))
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
          this.hero.moveTo = null
          this.hero.targetedEnemy = null
          this.hero.useStairs()
        }
      })
    }
  }

  updateStairs() {
    const tile = this.hero.isNear([
      ...TILES.STAIRS.OPEN[0],
      ...TILES.STAIRS.OPEN[1],
      ...TILES.STAIRS.OPEN[2],
      ...TILES.STAIRS.OPEN[3],
      ...TILES.STAIRS.OPEN[4]
    ])
    const gui = this.scene.get('Gui')
    // when near...
    if (tile) {
      // start stair particles
      if (this.stairParticles && this.stairParticles.on === false) {
        this.stairParticles.start()
      }

      // show help text
      if (this.dungeonNumber === 1 && this.dungeonVisits === 1) {
        gui.showSubtitle(TEXTS.E_TO_USE_STAIRS)
      }
    } else {
      // stop particles
      if (this.stairParticles && this.stairParticles.on) {
        this.stairParticles.stop()
      }

      // hide help text
      gui.hideSubtitle(TEXTS.E_TO_USE_STAIRS)
    }
  }

  prepareSafeRoom() {
    if (this.safeRoom) {
      // shrine
      const x = this.tileToWorldX(this.safeRoom.centerX + 1)
      const y = this.tileToWorldY(this.safeRoom.centerY + 1)
      const width = this.tileSize * 2 + 10
      const height = this.tileSize * 2 + 9

      const shrineBody = Phaser.Physics.Matter.Matter.Bodies.rectangle(x, y, 32, 16, { isStatic: true, chamfer: { radius: 2 } })
      this.safeRoomShrine = this.matter.add.sprite(x, y, 'shrine', 0)
        .setExistingBody(shrineBody)
        .setCollisionCategory(COLLISION_CATEGORIES.WALL)
        .setCollidesWith([COLLISION_CATEGORIES.HERO, COLLISION_CATEGORIES.ENEMY, COLLISION_CATEGORIES.FIREBALL])
        .setDepth(this.convertYToDepth(y, 6))
        .setOrigin(0.5, 0.7)
        .setInteractive()
      this.walls.push(this.safeRoomShrine)
      this.safeRoomBook = this.add.sprite(x - 2, y - 27, 'book', 0).setDepth(this.convertYToDepth(y, 6))

      // shrine particle emitter
      this.shrineParticles = this.interactionParticle.createEmitter({
        on: false,
        x: x - width / 2,
        y: y,
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

      this.safeRoomShrine.on('pointerup', () => {
        this.hero.moveTo = null
        this.hero.targetedEnemy = null
        this.hero.useShrine()
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
        doorLightY2 = this.safeRoom.y + doors[0].y + 2
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

      if (this.startInSafeRoom) {
        this.activateSafeRoom()
      }
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

  updateShrine() {
    const gui = this.scene.get('Gui')
    // when near...
    if (this.safeRoom && Phaser.Math.Distance.BetweenPoints(this.hero.container, this.safeRoomShrine) < 50) {
      // start shrine particles
      if (this.shrineParticles && this.shrineParticles.on === false) {
        this.shrineParticles.start()
      }

      // show help text if never used a shrine
      if (this.registry.get('minDungeon') === 1) {
        gui.showSubtitle(TEXTS.E_TO_ACTIVATE_CHECKPOINT)
      }
    } else {
      // stop particles
      if (this.shrineParticles && this.shrineParticles.on) {
        this.shrineParticles.stop()
      }

      // hide help text
      gui.hideSubtitle(TEXTS.E_TO_ACTIVATE_CHECKPOINT)
    }
  }

  activateSafeRoom() {
    if (this.safeRoom && !this.safeRoomActivated) {
      this.sounds.play('activateSafeRoom')
      this.sounds.play('book')
      this.safeRoomBook.anims.play('book')
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

  addEnemies() {
    const maxEnemies = Math.min(16, this.dungeonNumber)
    const minEnemies = Math.max(2, maxEnemies - 8)
    if (this.dungeonNumber > 1) {
      this.otherRooms.forEach(room => {
        const num = this.dungeon.r.randomInteger(minEnemies, maxEnemies)
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
    }
  }

  emitXpOrb(x, y, following, xp) {
    x += Phaser.Math.Between(-25, 25)
    y += Phaser.Math.Between(-25, 25)
    const xpOrb = this.matter.add.image(x, y, 'particle', 0).setScale(0.7).setDepth(6).setRectangle(5, 5).setSensor(true).setData('following', following)
    this.lightManager.lights.push({
      sprite: xpOrb,
      intensity: () => LightManager.flickering(0)
    })

    let size = 1
    if (xp > 3) size = 2
    if (xp > 6) size = 3
    if (xp > 10) size = 4
    if (xp > 15) size = 5

    const xpOrbParticles = this.orbParticle.createEmitter({
      tint: [0xFF00FF, 0x0088FF, 0xFF00FF, 0x0088FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.3 + size / 10, end: 0.6 + size / 10 },
      alpha: { start: 1, end: 0 },
      speed: 10,
      quantity: 10,
      frequency: 50,
      lifespan: 250 + size * 20,
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
      objectA: this.hero.container,
      objectB: xpOrb,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        tween1.remove()
        tween2.remove()
        Phaser.Utils.Array.Remove(this.xpOrbs, xpOrb)
        this.lightManager.removeLight(xpOrb)
        xpOrb.destroy()
        xpOrbParticles.stop()
        this.registry.set('xp', this.registry.get('xp') + xp)
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
    if (this.hero.isDead) return

    this.xpOrbs.forEach(orb => {
      if (orb.getData('following')) {
        this.moveToObject(orb, this.hero.container, 2.5)
      } else {
        const vector = new Phaser.Math.Vector2(orb.x, orb.y)
        const distance = vector.distance({ x: this.hero.container.x, y: this.hero.container.y })
        if (distance < 25) {
          this.moveToObject(orb, this.hero.container, 2.5)
        }
      }
    })
  }

  emitHealthOrb(x, y, following) {
    x += Phaser.Math.Between(-25, 25)
    y += Phaser.Math.Between(-25, 25)
    const orb = this.matter.add.image(x, y, 'particle', 0).setDepth(6).setRectangle(5, 5).setSensor(true).setData('following', following).setTint(0xFF0000)
    this.lightManager.lights.push({
      sprite: orb,
      intensity: () => LightManager.flickering(0)
    })
    const particles = this.orbParticle.createEmitter({
      tint: [0xFF0000, 0xFF0000, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0, end: 1 },
      speed: 10,
      quantity: 10,
      frequency: 50,
      lifespan: 250,
      following: following
    })

    particles.startFollow(orb)
    const tween1 = this.tweens.add({
      duration: 500,
      targets: orb,
      yoyo: true,
      repeat: 0,
      ease: 'Cubic',
      y: '-=20',
      scale: { from: 1, to: 3 },
      onComplete: () => {
        tween1.remove()
        this.healthOrbs.push(orb)
      }
    })
    const tween2 = this.tweens.add({
      duration: 1000,
      targets: orb,
      repeat: 0,
      ease: 'Linear',
      x: x + Phaser.Math.Between(-25, 25),
      onComplete: () => {
        tween2.remove()
      }
    })

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.container,
      objectB: orb,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        tween1.remove()
        tween2.remove()
        Phaser.Utils.Array.Remove(this.healthOrbs, orb)
        this.lightManager.removeLight(orb)
        orb.destroy()
        particles.stop()
        this.registry.set('health', this.registry.get('health') + 1)
        this.sounds.play('healthPing')
      }
    })
  }

  updateHealthOrbs() {
    if (this.hero.isDead) return

    this.healthOrbs.forEach(orb => {
      if (orb.getData('following')) {
        this.moveToObject(orb, this.hero.container, 2.5)
      } else {
        const vector = new Phaser.Math.Vector2(orb.x, orb.y)
        const distance = vector.distance({ x: this.hero.container.x, y: this.hero.container.y })
        if (distance < 25) {
          this.moveToObject(orb, this.hero.container, 2.5)
        }
      }
    })
  }

  emitManaOrb(x, y, following) {
    x += Phaser.Math.Between(-25, 25)
    y += Phaser.Math.Between(-25, 25)
    const orb = this.matter.add.image(x, y, 'particle', 0).setDepth(6).setRectangle(5, 5).setSensor(true).setData('following', following).setTint(0x0000FF)
    this.lightManager.lights.push({
      sprite: orb,
      intensity: () => LightManager.flickering(0)
    })
    const particles = this.orbParticle.createEmitter({
      tint: [0x0000FF, 0x0000FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0, end: 1 },
      speed: 10,
      quantity: 10,
      frequency: 50,
      lifespan: 250,
      following: following
    })

    particles.startFollow(orb)
    const tween1 = this.tweens.add({
      duration: 500,
      targets: orb,
      yoyo: true,
      repeat: 0,
      ease: 'Cubic',
      y: '-=20',
      scale: { from: 1, to: 3 },
      onComplete: () => {
        tween1.remove()
        this.manaOrbs.push(orb)
      }
    })
    const tween2 = this.tweens.add({
      duration: 1000,
      targets: orb,
      repeat: 0,
      ease: 'Linear',
      x: x + Phaser.Math.Between(-25, 25),
      onComplete: () => {
        tween2.remove()
      }
    })

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.container,
      objectB: orb,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        tween1.remove()
        tween2.remove()
        Phaser.Utils.Array.Remove(this.manaOrbs, orb)
        this.lightManager.removeLight(orb)
        orb.destroy()
        particles.stop()
        this.registry.set('mana', this.registry.get('mana') + 1)
        this.sounds.play('healthPing')
      }
    })
  }

  updateManaOrbs() {
    if (this.hero.isDead) return

    this.manaOrbs.forEach(orb => {
      if (orb.getData('following')) {
        this.moveToObject(orb, this.hero.container, 2.5)
      } else {
        const vector = new Phaser.Math.Vector2(orb.x, orb.y)
        const distance = vector.distance({ x: this.hero.container.x, y: this.hero.container.y })
        if (distance < 25) {
          this.moveToObject(orb, this.hero.container, 2.5)
        }
      }
    })
  }

  addFireTraps() {
    if (this.registry.get('narratorSaid').includes('torchPerfect')) {
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
          let x, y, angle, gravityX, gravityY
          let fireParticle = this.fireParticleAbove
          if (wall === 'top') {
            const tiles = this.wallLayer.getTilesWithin(room.left, room.top + 2, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2 - 3
              angle = { min: 80, max: 100}
              gravityX = 0
              gravityY = 50
              this.stuffLayer.putTilesAt(TILES.PILLAR.TOP, tile.x - 1, tile.y - 2)
            }
          } else if (wall === 'bottom') {
            const tiles = this.wallAboveLayer.getTilesWithin(room.left, room.bottom, room.width, 1).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize / 2
              y = this.tileToWorldY(tile.y) + this.tileSize / 2
              angle = { min: -80, max: -100}
              gravityX = 0
              gravityY = -50
              this.stuffLayerAbove.putTilesAt(TILES.PILLAR.BOTTOM, tile.x, tile.y - 1)
            }
          } else if (wall === 'left') {
            const tiles = this.wallAboveLayer.getTilesWithin(room.left, room.top + 4, 1, room.height - 4).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) + this.tileSize * 1.5 - 3
              y = this.tileToWorldY(tile.y) + this.tileSize / 2 - 3
              angle = { min: -10, max: 10}
              gravityX = 50
              gravityY = 0
              this.stuffLayer.putTilesAt(TILES.PILLAR.LEFT, tile.x, tile.y - 1)
            }
          } else if (wall === 'right') {
            const tiles = this.wallAboveLayer.getTilesWithin(room.right, room.top + 4, 1, room.height - 4).filter(t => allowedTiles.includes(t.index))
            if (tiles.length) {
              const tile = tiles[this.dungeon.r.randomInteger(0, tiles.length -1)]
              x = this.tileToWorldX(tile.x) - this.tileSize / 2 + 3
              y = this.tileToWorldY(tile.y) + this.tileSize / 2 - 3
              angle = { min: -190, max: -170}
              gravityX = -50
              gravityY = 0
              this.stuffLayer.putTilesAt(TILES.PILLAR.RIGHT, tile.x - 1, tile.y - 1)
            }
          }

          const emitter1 = fireParticle.createEmitter({
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
          const emitter2 = fireParticle.createEmitter({
            x: x,
            y: y,
            on: false,
            tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
            blendMode: 'SCREEN',
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 0, end: 1 },
            speed: 10,
            quantity: 2,
            frequency: 50,
            lifespan: { min: 500, max: 2000 },
            gravityX: gravityX,
            gravityY: gravityY
          })

          const interval = 1000 * this.dungeon.r.randomInteger(2, 5)
          const duration = Math.min(interval, 1000 * this.dungeon.r.randomInteger(2, 5)) - 1000
          this.time.addEvent({
            delay: interval,
            callback: () => {
              emitter1.start()
              emitter2.start()
              this.time.delayedCall(duration, () => {
                emitter1.stop()
              })
              this.time.delayedCall(duration - 500, () => {
                emitter2.stop()
              })
            },
            loop: true
          })

          this.fireTraps.push(emitter1)
        })
      })
    }
  }

  checkFireTrapCollision() {
    this.fireTraps.forEach(emitter => {
      emitter.forEachAlive((particle) => {
        if (
          particle.x > this.hero.container.body.parts[1].bounds.min.x &&
          particle.x < this.hero.container.body.parts[1].bounds.max.x &&
          particle.y > this.hero.container.body.parts[1].bounds.min.y &&
          particle.y < this.hero.container.body.parts[1].bounds.max.y &&
          !this.hero.isBurning &&
          !this.hero.isDead
        ) {
          this.hero.isBurning = true
          this.hero.takeDamage(1)
          this.time.delayedCall(1000, () => {
            this.hero.isBurning = false
          })
        }
      })
    })
  }

  flashSprite(sprite) {
    const originalTint = sprite.tintTopLeft
    this.time.addEvent({
      delay: 150,
      callback: () => {
        sprite.setTintFill(0xffffff)
        this.time.delayedCall(75, () => {
          if (originalTint) {
            sprite.setTint(originalTint)
          } else {
            sprite.clearTint()
          }
        })
      },
      repeat: 3
    })
  }

  addObjects() {
    const narratorSaid = this.registry.get('narratorSaid')
    const items = this.registry.get('items')

    this.addCandlestands()

    if (narratorSaid.includes('whereAmI')) {
      this.addTorch()
    }

    if ((narratorSaid.includes('killingAllTheseEnemies')) && !items.includes('sword')) {
      this.addSword()
    }

    if (narratorSaid.includes('torchPerfect')) {
      this.addFireTraps()
    }

    if (narratorSaid.includes('torchPerfect') && !items.includes('pathfinder')) {
      this.addPathfinder()
    }

    if (narratorSaid.includes('aScoutsEye') && !items.includes('shield')) {
      this.addShieldScroll()
    }

    if (narratorSaid.includes('shieldSpell')) {
      this.addTimebomb()
    }

    if (narratorSaid.includes('aTimeeater') && !items.includes('fireball')) {
      this.addFireballScroll()
    }
  }

  addCandlestands() {
    const room = this.startRoom
    this.addCandlestand(
      this.tileToWorldX(room.left + 2),
      this.tileToWorldY(room.top + 4)
    )
    this.addCandlestand(
      this.tileToWorldX(room.right - 1),
      this.tileToWorldY(room.top + 4)
    )
    this.addCandlestand(
      this.tileToWorldX(room.right - 1),
      this.tileToWorldY(room.bottom + 1)
    )
    this.addCandlestand(
      this.tileToWorldX(room.left + 2),
      this.tileToWorldY(room.bottom + 1)
    )
  }

  addCandlestand(x, y) {
    const body = Phaser.Physics.Matter.Matter.Bodies.rectangle(x, y, 10, 10, { inertia: Infinity, frictionAir: 1, chamfer: { radius: 2 } })
    const candlestand = this.matter.add.sprite(x, y, 'candlestand', 0)
    candlestand
      .setExistingBody(body)
      .setOrigin(0.5, 0.85)
    candlestand.anims.play('candlestand', true)
    this.lightManager.lights.push({
      x: () => this.worldToTileX(candlestand.x),
      y: () => this.worldToTileY(candlestand.y) - 2,
      intensity: () => LightManager.flickering(1)
    })
    this.candlestands.push(candlestand)
  }

  updateCandlestands() {
    this.candlestands.forEach(cs => {
      cs.setDepth(this.convertYToDepth(cs.y, 6))
    })
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
    this.lightManager.lights.push({
      sprite: this.sword,
      intensity: () => LightManager.flickering(0)
    })
    this.matterCollision.addOnCollideStart({
      objectA: this.hero.container,
      objectB: this.sword,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        this.hero.addItem('sword')
        tween.remove()
        this.sword.destroy()
        this.lightManager.removeLight(this.sword)
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
      objectA: this.hero.container,
      objectB: this.torch,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        this.hero.addItem('torch')
        this.scene.get('Gui').removeTorchDelayed()
        tween.remove()
        this.torch.destroy()
        this.lightManager.removeLight(this.torch)
      }
    })
  }

  addPathfinder(x, y) {
    if (!x && !y) {
      this.pathFinderRoom = this.otherRooms.find(r => !r.hasFireTraps)
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
      objectA: this.hero.container,
      objectB: this.pathfinder,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        this.hero.addItem('pathfinder')
        tween.remove()
        this.pathfinder.destroy()
        this.lightManager.removeLight(this.pathfinder)
        this.scene.get('Gui').showSubtitle(TEXTS.Q_TO_USE_PATHFINDER)
        this.time.delayedCall(5000, () => {
          this.scene.get('Gui').hideSubtitle(TEXTS.Q_TO_USE_PATHFINDER)
        })
      }
    });
  }

  addShieldScroll(x, y) {
    if (!x && !y) {
      this.shieldScrollRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(Phaser.Utils.Array.GetRandom([this.shieldScrollRoom.left + 3, this.shieldScrollRoom.right - 2])) + 12
      y = this.tileToWorldY(Phaser.Utils.Array.GetRandom([this.shieldScrollRoom.top + 5, this.shieldScrollRoom.bottom - 2])) + 12
    }
    this.shieldScroll = this.matter.add.sprite(x, y, 'scroll', 0, { isStatic: true, collisionFilter: { group: -1 } }).setSize(24, 24).setDepth(8)
    const tween = this.tweens.add({
      targets: this.shieldScroll,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.lightManager.lights.push({
      sprite: this.shieldScroll,
      intensity: () => 1
    })

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.container,
      objectB: this.shieldScroll,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        this.hero.addItem('shield')
        tween.remove()
        this.shieldScroll.destroy()
        this.lightManager.removeLight(this.shieldScroll)
        this.scene.get('Gui').showSubtitle(TEXTS.SHIFT_TO_USE_SHIELD)
        this.time.delayedCall(5000, () => {
          this.scene.get('Gui').hideSubtitle(TEXTS.SHIFT_TO_USE_SHIELD)
        })
      }
    });
  }

  addFireballScroll(x, y) {
    if (!x && !y) {
      this.fireballScrollRoom = this.dungeon.r.randomPick(this.otherRooms)
      x = this.tileToWorldX(Phaser.Utils.Array.GetRandom([this.fireballScrollRoom.left + 3, this.fireballScrollRoom.right - 2])) + 12
      y = this.tileToWorldY(Phaser.Utils.Array.GetRandom([this.fireballScrollRoom.top + 5, this.fireballScrollRoom.bottom - 2])) + 12
    }
    this.fireballScroll = this.matter.add.sprite(x, y, 'scroll', 0, { isStatic: true, collisionFilter: { group: -1 } }).setSize(24, 24).setDepth(8)
    const tween = this.tweens.add({
      targets: this.fireballScroll,
      yoyo: true,
      repeat: -1,
      y: '+=8'
    })
    this.lightManager.lights.push({
      sprite: this.fireballScroll,
      intensity: () => 1
    })

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.container,
      objectB: this.fireballScroll,
      callback: (collision) => {
        if (this.hero.isDead || collision.bodyA.isSensor) return
        this.hero.addItem('fireball')
        tween.remove()
        this.fireballScroll.destroy()
        this.lightManager.removeLight(this.fireballScroll)
        this.scene.get('Gui').showSubtitle(TEXTS.RIGHTCLICK_TO_USE_FIREBALL)
        this.time.delayedCall(5000, () => {
          this.scene.get('Gui').hideSubtitle(TEXTS.RIGHTCLICK_TO_USE_FIREBALL)
        })
      }
    });
  }

  addTimebomb() {
    this.timebombRoom = this.otherRooms.sort((a, b) => b.width * b.height - a.width * a.height)[0]

    this.timebomb = this.add.container(this.tileToWorldX(this.timebombRoom.centerX),this.tileToWorldY(this.timebombRoom.centerY))
    this.matter.add.gameObject(this.timebomb)
    this.timebomb
      .setDepth(6)
      .setRectangle(10, 10)
      .setSensor(true)
      .setFixedRotation()
      .setRotation(0)
      .setCollisionCategory(COLLISION_CATEGORIES.TIMEBOMB)
      .setCollidesWith([COLLISION_CATEGORIES.HERO, COLLISION_CATEGORIES.WALL])

    this.lightManager.lights.push({
      key: 'timebomb',
      sprite: this.timebomb,
      intensity: () => LightManager.flickering(1)
    })

    const timebombParticle = this.add.particles('particle').setDepth(7)
    const timebombParticle2 = this.add.particles('particle').setDepth(7)

    this.timebomb.add(timebombParticle2)

    const emitter1 = timebombParticle.createEmitter({
      tint: [0xFFFFFF, 0x7777FF],
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.4 },
      alpha: { start: 1, end: 0 },
      speed: 20,
      quantity: 5,
      frequency: 50,
      lifespan: 2000,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 50),
        type: 'random',
        quantity: 40
      },
      follow: this.timebomb
    })
    const emitter2 = timebombParticle2.createEmitter({
      tint: [0xFFFFFF, 0x7777FF],
      blendMode: 'SCREEN',
      scale: { start: 0.3, end: 0.6 },
      alpha: { start: 1, end: 0 },
      speed: 15,
      quantity: 40,
      frequency: 50,
      lifespan: 1000,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 15),
        type: 'edge',
        quantity: 40
      }
    })

    this.matterCollision.addOnCollideStart({
      objectA: this.hero.container,
      objectB: this.timebomb,
      callback: (collision) => {
        if (!this.timebombActive || this.hero.isDead || collision.bodyA.isSensor) return
        this.timebombActive = false
        this.lightManager.removeLightByKey('timebomb')
        emitter1.stop()
        emitter2.stop()
        this.music.setSeek(40)
        this.music.setRate(1.5)
        this.timebombTickingSound = this.sounds.play('ticking', 1.5, false, true)
        this.time.delayedCall(2000, () => this.narrator.sayOnce('timeeaterQuickNow'))
        this.heroParticles = this.interactionParticle.createEmitter({
          tint: [0x888800, 0xff8800, 0xff8800, 0xff8800, 0x880000],
          blendMode: 'SCREEN',
          scale: { start: 0.2, end: 0.4 },
          alpha: { start: 1, end: 0 },
          speed: 20,
          quantity: 5,
          frequency: 50,
          lifespan: 2000,
          emitZone: {
            source: new Phaser.Geom.Circle(0, 0, 50),
            type: 'random',
            quantity: 40
          },
          follow: this.hero.container,
          emitCallback: particle => this.particleEmitterAddLights(particle, 15),
          deathCallback: particle => this.particleEmitterRemoveLights(particle)
        })
        this.startCountdown(60)
      }
    })

    this.timebombActive = true
    this.timebombFollows = false
  }

  updateTimebomb() {
    if (!this.timebomb || !this.timebombActive) return
    this.timebomb.setRotation(this.timebomb.rotation + 0.05)
    const vector = new Phaser.Math.Vector2(this.timebomb.x, this.timebomb.y)
    const distance = vector.distance({ x: this.hero.container.x, y: this.hero.container.y })
    const speedFactor = (distance + 100) / 150
    this.timebomb.setVelocity(0)
    if (this.currentRoom === this.safeRoom) {
      this.timebombFollows = false
    } else if (this.timebombRoom === this.currentRoom && distance < 150) {
      this.timebombFollows = true
    }
    if (this.timebombFollows) {
      const tileX = this.worldToTileX(this.timebomb.x)
      const tileY = this.worldToTileY(this.timebomb.y)
      this.timebombRoom = this.dungeon.getRoomAt(tileX, tileY)
      if (this.timebombRoom === this.currentRoom && tileX > this.timebombRoom.left && tileX < this.timebombRoom.right && tileY > this.timebombRoom.top + 3 && tileY < this.timebombRoom.bottom) {
        this.moveToObject(this.timebomb, this.hero.container, speedFactor)
      } else {
        const finder = new PathFinder.AStarFinder({ allowDiagonal: true, dontCrossCorners: true })
        const path = PathFinder.Util.compressPath(finder.findPath(
          this.worldToTileX(this.timebomb.x),
          this.worldToTileY(this.timebomb.y),
          this.worldToTileX(this.hero.container.x),
          this.worldToTileY(this.hero.container.y),
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
            !enemy.isBurning
          ) {
            enemy.isBurning = true
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
        this.timebombTickingSound.stop()
        this.timebombTickingSound = this.sounds.play('tickingFast', 0.1, false, true)
        this.narrator.sayOnce('dungeonStartedToQuake')
      }
      if (minutes === 0 && seconds === 10) {
        this.cameras.main.shake(10000, 0.003)
      }
      if (minutes === 0 && seconds === 0) {
        this.countdown = null
        this.countdownText.destroy()
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

  showPath(from) {
    const dots = []
    const finder = new PathFinder.AStarFinder()
    const path = finder.findPath(
      this.worldToTileX(from.x),
      this.worldToTileY(from.y),
      this.endRoom.centerX + 1,
      this.endRoom.centerY + 2,
      this.getPathGrid()
    )

    // remove first and last point
    path.splice(0, 1)
    path.splice(path.length - 1, 1)

    path.forEach((tile) => {
      dots.push(this.add.sprite(
        this.tileToWorldX(tile[0]) + 8,
        this.tileToWorldY(tile[1]) + 8,
        "path",
        0
      ).setDepth(5).setAlpha(0.5))
    })
    if (dots.length) {
      this.scene.get('Gui').startPathfinderCooldown()
      this.time.addEvent({
        delay: 300,
        callback: () => {
          const dot = dots.shift()
          if (dot) {
            this.add.tween({
              targets: [dot],
              ease: 'Sine.easeInOut',
              duration: 1000,
              alpha: {
                getStart: () => 1,
                getEnd: () => 0
              },
              onComplete: () => {
                dot.destroy()
              }
            });
          }
        },
        repeat: dots.length - 1
      })
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

  updateCurrentRoom() {
    const currentRoom = this.dungeon.getRoomAt(
      this.worldToTileX(this.hero.container.x),
      this.worldToTileY(this.hero.container.y)
    )
    if (currentRoom && currentRoom !== this.currentRoom) {
      this.currentRoom = currentRoom
      if (!this.visitedRooms.includes(this.currentRoom)) {
        this.visitedRooms.push(this.currentRoom)
      }

      if (this.dungeonNumber === 1) {
        if (this.visitedRooms.length >= 4) {
          this.playStoryElementOnce('whatWasThisAbout')
        }

        if (this.currentRoom === this.endRoom) {
          this.playStoryElementOnce('finallySomeStairs')
        }
      }

      if (this.dungeonNumber === 2) {
        if (this.enemies.find(e => e.room === this.currentRoom) && !this.registry.get('narratorSaid').includes('undeadCreatures')) {
          this.playStoryElementOnce('undeadCreatures')
          this.scene.get('Gui').showSubtitle(TEXTS.SPACE_TO_ATTACK)
        }
      }

      if (this.swordRoom && this.currentRoom === this.swordRoom) {
        this.playStoryElementOnce('thereItWasASword')
        this.scene.get('Gui').hideSubtitle(TEXTS.FIND_A_SWORD)
      }

      if (this.torchRoom && this.currentRoom === this.torchRoom) {
        this.playStoryElementOnce('torchPerfect')
      }

      if (this.pathFinderRoom && this.currentRoom === this.pathFinderRoom) {
        this.playStoryElementOnce('aScoutsEye')
      }

      if (this.safeRoom && this.currentRoom === this.safeRoom && this.registry.get('minDungeon') === 1) {
        this.playStoryElementOnce('thisRoomWasDifferent')
      }

      if (this.timebombRoom && this.currentRoom === this.timebombRoom) {
        this.playStoryElementOnce('aTimeeater')
      }

      if (this.currentRoom.hasFireTraps) {
        this.playStoryElementOnce('itsGettingHot')
      }

      if (this.shieldScrollRoom && this.currentRoom === this.shieldScrollRoom) {
        this.playStoryElementOnce('shieldSpell')
      }
    }
  }

  update() {
    this.getEndRoom()
    this.hero.update()
    if (this.guard) this.guard.update()
    this.enemies.forEach(e => e.update())
    this.updateCurrentRoom()
    this.updateStairs()
    this.updateShrine()
    this.lightManager.update()
    this.checkFireTrapCollision()
    this.checkHeroParticlesCollision()
    this.updateCountdown()
    this.updateTimebomb()
    this.updateSkillInteractions()
    this.updateXpOrbs()
    this.updateHealthOrbs()
    this.updateManaOrbs()
    this.updateCandlestands()
  }
}
