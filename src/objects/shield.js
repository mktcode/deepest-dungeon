import Phaser from "phaser"
import LightManager from "../light-manager.js";

export default class Shield {
  constructor(caster) {
    this.caster = caster
    this.scene = this.caster.scene
    this.isActiveSince = null

    this.shieldParticle = this.scene.add.particles('particle')
    this.caster.container.add(this.shieldParticle)
    this.shieldParticles = this.shieldParticle.createEmitter({
      on: false,
      y: 10,
      tint: [0x0088FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.5 },
      alpha: (particle, key, time, value) => {
        if (time > 0.5) {
          particle.accelerationY = 50
          if (particle.x < 0) {
            particle.accelerationX = 100
          } else {
            particle.accelerationX = -100
          }
        } else {
          particle.accelerationX = 0
          particle.accelerationY = -100
        }
        return Math.min(1 - time)
      },
      frequency: 50,
      speed: 20,
      lifespan: 1000,
      quantity: 20,
      angle: { min: 180, max: 360 },
      emitZone: {
        source: new Phaser.Geom.Ellipse(0, 0, 80, 40),
        type: 'edge',
        quantity: 18
      }
    })
    this.shieldParticle2 = this.scene.add.particles('particle')
    caster.container.add(this.shieldParticle2)
    caster.container.sendToBack(this.shieldParticle2)
    this.shieldParticles2 = this.shieldParticle2.createEmitter({
      on: false,
      y: 10,
      tint: [0x0088FF, 0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.2, end: 0.5 },
      frequency: 50,
      speed: 5,
      lifespan: 500,
      quantity: 40,
      angle: { min: 180, max: 360 },
      emitZone: {
        source: new Phaser.Geom.Ellipse(0, 0, 80, 40),
        type: 'edge',
        quantity: 18
      }
    })
  }

  use() {
    if (this.caster.hasItem('shield') && !this.isActiveSince && this.caster.get('mana')) {
      this.caster.changeMana(-1)
      this.isActiveSince = new Date().getTime()
      this.shieldParticles.start()
      this.shieldParticles2.start()
      this.scene.lightManager.lights.push({
        key: 'shield-' + this.caster.uuid,
        x: () => this.scene.worldToTileX(this.caster.container.x),
        y: () => this.scene.worldToTileX(this.caster.container.y),
        intensity: () => LightManager.flickering(1)
      })
      this.scene.time.delayedCall(this.caster.get('shieldDuration') * 1000, () => {
        this.isActiveSince = false
        this.shieldParticles.stop()
        this.shieldParticles2.stop()
        this.scene.lightManager.removeLightByKey('shield-' + this.caster.uuid)
      })
    }
  }
}
