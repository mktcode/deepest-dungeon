import Phaser from 'phaser'
import BaseEnemy from "./base.js"

export default class Zombie extends BaseEnemy {
  constructor(dungeon, room, dieCallback) {
    super(dungeon, room, dieCallback, 3, 3, 1, 'zombie', 10, 16, 0.5, 0.6)
  }
}
