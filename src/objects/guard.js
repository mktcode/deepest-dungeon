import Phaser from 'phaser'
import CharacterBase from './character-base.js'
import Fireball from './fireball.js'
import Shield from './shield.js'

export default class Hero extends CharacterBase {
  constructor(scene, x, y) {
    super(scene, x, y)

    this.shield = new Shield(this)

    this.runningSound = this.scene.sounds.play('running', 0, false, true, 0.15)
    this.walkingSound = this.scene.sounds.play('walking', 0, false, true, 0.15)
    this.runningSound.pause()
    this.walkingSound.pause()

    this.tint = 0x888888
    this.sprite.setTint(this.tint)
    this.container.setData('name', 'guard')
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-32, -36, 64, 72),
      Phaser.Geom.Rectangle.Contains
    )

    this.container.on('pointerover', () => {
      this.sprite.setTint(0xFF0000)
    })
    this.container.on('pointerout', () => {
      this.sprite.setTint(this.tint)
    })
    this.container.on('pointerdown', () => {
      this.scene.sounds.play('clickMinor')
    })

    // hero attacks enemy
    this.scene.matterCollision.addOnCollideActive({
      objectA: this.scene.hero.container,
      objectB: this.container,
      callback: (collision) => {
        if (
          this.scene.hero.isAttacking &&
          !this.isUnderAttack &&
          !this.scene.hero.isDead &&
          collision.bodyA.isSensor &&
          !collision.bodyB.isSensor &&
          this.scene.hero.getDamagingAttackFrames().includes(this.scene.hero.sprite.anims.currentFrame.index) &&
          (this.scene.hero.hasItem('sword') ? '' : 'punch-') + this.scene.hero.lastDirection === collision.bodyA.label
        ) {
          this.scene.cameras.main.shake(500, .002)
          this.isUnderAttack = true
          this.scene.hero.playHitSound()
          this.takeDamage(
            this.scene.hero.hasItem('sword')
              ? this.scene.hero.get('damage') * 2
              : this.scene.hero.get('damage')
          )
        }
      }
    })

    // enemy attacks hero
    this.scene.matterCollision.addOnCollideActive({
      objectA: this.container,
      objectB: this.scene.hero.container,
      callback: (collision) => {
        if (
          this.isAttacking &&
          !this.scene.hero.isUnderAttack &&
          !this.isDead &&
          collision.bodyA.isSensor &&
          !collision.bodyB.isSensor &&
          this.getDamagingAttackFrames().includes(this.sprite.anims.currentFrame.index) &&
          (this.hasItem('sword') ? '' : 'punch-') + this.lastDirection === collision.bodyA.label
        ) {
          this.scene.cameras.main.shake(500, .002)
          this.scene.hero.isUnderAttack = true
          this.playHitSound()
          this.scene.hero.takeDamage(
            this.hasItem('sword')
              ? this.get('damage') * 2
              : this.get('damage')
          )
        }
      }
    })
  }

  update() {
    super.update(() => {
      this.runOrWalk = (
        this.scene.dungeon.getRoomAt(this.scene.worldToTileX(this.container.x), this.scene.worldToTileY(this.container.y))
        === this.scene.dungeon.getRoomAt(this.scene.worldToTileX(this.scene.hero.container.x), this.scene.worldToTileY(this.scene.hero.container.y))
      ) ? 'run' : 'walk'

      this.targetedEnemy = this.scene.hero.isDead ? null : this.scene.hero.container

      this.handleMovementSound()
    })
  }

  takeDamage(damage) {
    super.takeDamage(damage)

    if (this.isDead) {
      this.scene.sounds.play('die')
      this.handleMovementSound()
      if (this.scene.hero.targetedEnemy === this.container) {
        this.scene.hero.targetedEnemy = null
      }
      this.scene.time.delayedCall(1500, () => {
        this.scene.lightManager.removeLight(this.container)
        this.sprite.destroy()
      })
    } else {
      this.scene.sounds.play('takeHit')
    }
  }
}
