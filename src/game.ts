import MenuScene from './scenes/menu.js'
import PreloadScene from './scenes/preload.js'
import VirtualJoyStickPlugin from './plugins/rexvirtualjoystickplugin.min.js'
import PhaserMatterCollisionPlugin from 'phaser-matter-collision-plugin'

const config: GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  backgroundColor: '#000',
  parent: 'body',
  pixelArt: true,
  scene: [PreloadScene, MenuScene],
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 }
    }
  },
  audio: {
    disableWebAudio: true
  },
  plugins: {
    global: [{
        key: 'joystick',
        plugin: VirtualJoyStickPlugin,
        start: true
    }],
    scene: [
      {
        key: 'matterCollision',
        plugin: PhaserMatterCollisionPlugin,
        mapping: 'matterCollision'
      }
    ]
  },
  disableContextMenu: true
}

const game = new Phaser.Game(config)
