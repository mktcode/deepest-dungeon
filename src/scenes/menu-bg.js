export default class MenuBgScene extends Phaser.Scene {
  constructor() {
    super("MenuBg")
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0)

    this.addBackgroundAnimation()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(250, 0, 0, 0);
    })
    this.events.on('sleep', () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
    })
  }

  update() {
    this.scene.bringToTop()
  }

  addBackgroundAnimation() {
    const fireParticle = this.add.particles('particle').setDepth(-2)
    fireParticle.createEmitter({
      tint: [0xff8800, 0x880000, 0x880000],
      x: -4,
      y: 10,
      blendMode: 'SCREEN',
      scale: { start: 2, end: 1 },
      alpha: { start: 0.1, end: 0 },
      angle: { min: -60, max: -120 },
      rotate: { min: 0, max: 180 },
      speed: 40,
      quantity: 10,
      frequency: 200,
      lifespan: 10000,
      emitZone: {
        source: new Phaser.Geom.Line(0, this.game.scale.height, this.game.scale.width, this.game.scale.height),
        type: 'edge',
        quantity: 30
      }
    })
    fireParticle.createEmitter({
      tint: [0xff8800, 0x880000, 0x880000],
      x: -4,
      y: 10,
      blendMode: 'SCREEN',
      scale: { start: 0.5, end: 1 },
      alpha: { start: 0.2, end: 0 },
      angle: { min: -60, max: -120 },
      rotate: { min: 0, max: 180 },
      speed: 80,
      quantity: 10,
      frequency: 200,
      lifespan: 6000,
      emitZone: {
        source: new Phaser.Geom.Line(0, this.game.scale.height, this.game.scale.width, this.game.scale.height),
        type: 'edge',
        quantity: 30
      }
    })
    fireParticle.createEmitter({
      tint: [0xff8800, 0x880000, 0x880000],
      x: -4,
      y: 10,
      blendMode: 'SCREEN',
      scale: { start: 4, end: 1 },
      alpha: { start: 0.1, end: 0 },
      angle: { min: -60, max: -120 },
      rotate: { min: 0, max: 180 },
      speed: 40,
      quantity: 10,
      frequency: 100,
      lifespan: 3000,
      emitZone: {
        source: new Phaser.Geom.Line(0, this.game.scale.height, this.game.scale.width, this.game.scale.height),
        type: 'edge',
        quantity: 50
      }
    })

    const fogParticle = this.add.particles('fog').setDepth(-1)
    fogParticle.createEmitter({
      x: 0,
      y: 0,
      tint: [0xFFFFFF],
      blendMode: 'SCREEN',
      alpha: (particle, key, time, value) => {
        const alpha = time < 0.5 ? time : 1 - time
        return alpha / 3
      },
      scale: 3,
      angle: 0,
      speed: 30,
      quantity: 1,
      frequency: 3000,
      lifespan: 10000,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, this.game.scale.width, this.game.scale.height),
        type: 'random',
        quantity: 1
      }
    })

    const ambientParticle = this.add.particles('particle').setDepth(-2)
    ambientParticle.createEmitter({
      x: 0,
      y: 0,
      tint: [0xFFFFFF],
      blendMode: 'SCREEN',
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.15, end: 0 },
      speed: 5,
      quantity: 1,
      frequency: 50,
      lifespan: 4000,
      emitZone: {
        source: new Phaser.Geom.Rectangle(0, 0, this.game.scale.width, this.game.scale.height),
        type: 'random',
        quantity: 20
      }
    })
  }
}
