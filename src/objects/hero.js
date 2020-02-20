import CharacterBase from './character-base.js'
import Fireball from './fireball.js'
import Shield from './shield.js'
import TEXTS from "../texts.js";

export default class Hero extends CharacterBase {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.addControls()
    this.scene.cameraFollow(this.container)

    this.shield = new Shield(this)

    this.runningSound = this.scene.sounds.play('running', 0, false, true, 0.15)
    this.walkingSound = this.scene.sounds.play('walking', 0, false, true, 0.15)
    this.runningSound.pause()
    this.walkingSound.pause()
  }

  update() {
    super.update(() => {
      this.handleKeyboardMovement()
      this.handleMovementSound()
    })
  }

  get(key) {
    this[key] = this.scene.registry.get(key)
    return this[key]
  }

  addItem(item) {
    this.items.push(item)
    this.scene.registry.set('items', this.items)
  }

  getItems() {
    this.items = this.scene.registry.get('items')
    return this.items
  }

  set(key, val) {
    this[key] = val
    this.scene.registry.set(key, val)
  }

  addControls() {
    this.keys = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })

    // move by click and spell attack
    this.scene.input.on('pointerdown', (pointer, currentlyOver) => {
      const targetedEnemy = currentlyOver.find(co => ['spider', 'zombie', 'guard'].includes(co.getData('name')))
      if (pointer.leftButtonDown()) {
        if (targetedEnemy && (!this.lastTargetedEnemeyAt || new Date().getTime() - this.lastTargetedEnemeyAt > 250)) {
          this.lastTargetedEnemeyAt = new Date().getTime()
          this.moveTo = null
          this.targetedEnemy = targetedEnemy
        } else {
          this.targetedEnemy = null
          this.moveTo = this.scene.findClosestWalkablePoint(pointer.worldX, pointer.worldY)
        }
      } else if (pointer.rightButtonDown() && Fireball.canCast(this)) {
        let target = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
        let from = new Phaser.Math.Vector2(this.container.x, this.container.y)

        this.lastDirection = this.scene.getDirectionFromVector(target.clone().subtract(from))

        if (targetedEnemy) {
          target = targetedEnemy
        }

        Fireball.cast(this.scene, this, target)
      }
    })

    this.scene.input.on('pointerup', (pointer, currentlyOver) => {
      if (pointer.rightButtonReleased()) {
        const targetedEnemy = currentlyOver.find(co => ['spider', 'zombie'].includes(co.getData('name')))
        Fireball.release(this, targetedEnemy)
      }
    })

    // attack
    this.keys.space.on('down', () => {
      this.doAttack()
    })

    // shield
    this.keys.shift.on('down', () => {
      if (this.isDead) return

      this.shield.use()
    })

    // use
    this.scene.input.keyboard.on('keyup-E', () => {
      if (this.isDead) return

      this.useStairs()
      this.useShrine()
      this.improveSkill()
    })

    // show path
    this.scene.input.keyboard.on('keyup-Q', () => {
      if (this.isDead) return

      this.usePathfinder()
    })
  }

  handleKeyboardMovement() {
    if (!this.isFrozen()) {
      const directions = []
      if (this.isDirectionKeyDown('up') && !this.blockedDirections.includes('up')) directions.push('up')
      else if (this.isDirectionKeyDown('down') && !this.blockedDirections.includes('down')) directions.push('down')
      if (this.isDirectionKeyDown('left') && !this.blockedDirections.includes('left')) directions.push('left')
      else if (this.isDirectionKeyDown('right') && !this.blockedDirections.includes('right')) directions.push('right')

      if (directions.length) {
        this.moveTo = null
        this.targetedEnemy = null
        this.move(directions.join('-'))
        this.setSpeedBoost(this.hasSpeedBoost())
        this.isMoving = true
      }
    }
  }

  isDirectionKeyDown(direction) {
    return direction
      ? this.keys[direction].isDown || this.wasdKeys[direction].isDown
      : (
        this.keys['up'].isDown || this.wasdKeys['up'].isDown ||
        this.keys['down'].isDown || this.wasdKeys['down'].isDown ||
        this.keys['left'].isDown || this.wasdKeys['left'].isDown ||
        this.keys['right'].isDown || this.wasdKeys['right'].isDown
      )
  }

  resetKeys() {
    this.keys.up.isDown = false
    this.keys.down.isDown = false
    this.keys.left.isDown = false
    this.keys.right.isDown = false
    this.keys.space.isDown = false
    this.keys.shift.isDown = false
    this.wasdKeys.up.isDown = false
    this.wasdKeys.down.isDown = false
    this.wasdKeys.left.isDown = false
    this.wasdKeys.right.isDown = false
  }

  move(direction) {
    this.updateMoveSubtitles()
    super.move(direction)
  }

  moveToXY(x, y) {
    this.updateMoveSubtitles()
    super.moveToXY(x, y)
  }

  doAttack() {
    this.updateAttackSubtitles()
    super.doAttack()
  }

  updateAttackSubtitles() {
    const gui = this.scene.scene.get('Gui')
    if (gui.subtitle.text === TEXTS.SPACE_TO_ATTACK) {
      gui.showSubtitle(TEXTS.KILL_X_UNDEAD.replace('{num}', 3))
    }
  }

  updateMoveSubtitles() {
    const gui = this.scene.scene.get('Gui')
    if (gui.subtitle.text === TEXTS.WASD_TO_MOVE) {
      gui.hideSubtitle(TEXTS.WASD_TO_MOVE)
      gui.showSubtitle(TEXTS.FIND_THE_STAIRS)
      this.scene.time.delayedCall(10000, () => {
        if (gui.subtitle.text === TEXTS.FIND_THE_STAIRS) {
          gui.hideSubtitle(TEXTS.FIND_THE_STAIRS)
        }
      })
    }
  }

  takeDamage(damage) {
    super.takeDamage(damage)

    if (this.isDead) {
      this.scene.sounds.play('die')
      this.handleMovementSound()
      this.scene.cameras.main.fadeOut(2000, 0, 0, 0, (camera, progress) => {
        if (progress === 1) {
          this.scene.registry.set('health', this.scene.registry.get('maxHealth'))
          this.scene.scene.sleep()
          this.scene.scene.wake('Dungeon' + this.scene.registry.get('minDungeon'))
        }
      })
    } else {
      this.scene.sounds.play('takeHit')
    }
  }
}
