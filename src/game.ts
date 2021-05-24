import CursorScene from './scenes/cursor.js'
import LoginScene from './scenes/login.js'
import MenuScene from './scenes/menu.js'
import MenuBgScene from './scenes/menu-bg.js'
import LeaderboardScene from './scenes/leaderboard.js'
import ControlsScene from './scenes/controls.js'
import SettingsScene from './scenes/settings.js'
import CreditsScene from './scenes/credits.js'
import PreloadScene from './scenes/preload.js'
import MatterDebugConfig from './matter-debug-config.js'
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
  dom: {
    createContainer: true
  },
  scene: [PreloadScene, LoginScene, MenuBgScene, MenuScene, LeaderboardScene, ControlsScene, SettingsScene, CreditsScene, CursorScene],
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      // debug: MatterDebugConfig
    }
  },
  plugins: {
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
