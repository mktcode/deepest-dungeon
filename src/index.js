/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tileset, Michele "Buch" Bucelli (tileset artist) & Abram Connelly (tileset sponsor):
 *     https://opengameart.org/content/top-down-dungeon-tileset
 *  - Character, Michele "Buch" Bucelli:
 *      https://opengameart.org/content/a-platformer-in-the-forest
 */

import Phaser from "phaser";
import DungeonScene from "./dungeon-scene.js";
import './assets/style.sass'

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  backgroundColor: "#000",
  parent: "body",
  pixelArt: true,
  scene: DungeonScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  audio: {
    disableWebAudio: true
  }
};

let game;
window.addEventListener("click", event => {
  if (!game) {
    game = new Phaser.Game(config);
  }
})

window.addEventListener('resize', event => {
  game.scale.resize(window.innerWidth, window.innerHeight)
  game.canvas.style.width = window.innerWidth + 'px'
  game.canvas.style.height = window.innerHeight + 'px'
})
