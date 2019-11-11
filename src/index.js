import Phaser from "phaser"
import MenuScene from "./scenes/menu.js"
import PreloadScene from "./scenes/preload.js"
import './assets/style.sass'

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  backgroundColor: "#000",
  parent: "body",
  pixelArt: true,
  scene: [PreloadScene, MenuScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  audio: {
    disableWebAudio: true
  }
})

window.addEventListener('resize', event => {
  game.scale.resize(window.innerWidth, window.innerHeight)
  game.canvas.style.width = window.innerWidth + 'px'
  game.canvas.style.height = window.innerHeight + 'px'
})
