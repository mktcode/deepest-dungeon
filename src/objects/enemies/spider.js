import Phaser from 'phaser'
import BaseEnemy from "./base.js"

export default class Zombie extends BaseEnemy {
  constructor(dungeon, room, dieCallback) {
    super(dungeon, room, dieCallback, 6, 6, 2, 'spider')
    this.setCollision(16, 16, 0.5, 0.65)
  }
}
