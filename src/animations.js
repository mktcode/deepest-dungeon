export default class Animations {
  constructor(scene) {
    this.anims = scene.anims
    this.textures = scene.textures

    this.createHeroAnim('idle', 0.7)
    this.createHeroAnim('walk', 1.5)
    this.createHeroAnim('run', 1.5)
    this.createHeroAnim('attack', 1.5)
    this.createHeroAnim('die', 1.5)
    this.createHeroAnim('look-around', 0.7)

    this.createHeroCastSpellAnim()

    this.createZombiAnim('walk', 1.5)
    this.createZombiAnim('die', 1.5)

    this.createSpiderAnim('walk', 1.5)
    this.createSpiderAnim('die', 1.5)

    this.anims.create({
      key: "torch",
      frames: this.anims.generateFrameNumbers("torch", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "candlestand",
      frames: this.anims.generateFrameNumbers("candlestand", { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: "pathfinder",
      frames: this.anims.generateFrameNumbers("pathfinder", { start: 0, end: 11 }),
      frameRate: 12,
      repeat: -1
    });
  }

  createHeroAnim(name, frameRateMod) {
    ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'].forEach(direction => {
      const withWeaponPrefix = 'hero/with-weapon/' + name + '/' + direction + '/'
      const withoutWeaponPrefix = 'hero/without-weapon/' + name + '/' + direction + '/'
      const allFrames = Object.keys(this.textures.list.sprites.frames)
      const numberOfFramesWithWeapon = allFrames.filter(key => key.startsWith(withWeaponPrefix)).length
      const numberOfFramesWithoutWeapon = allFrames.filter(key => key.startsWith(withoutWeaponPrefix)).length

      // normal speed
      this.anims.create({
        key: name + '-with-sword-' + direction,
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithWeapon, prefix: withWeaponPrefix }),
        frameRate: numberOfFramesWithWeapon * frameRateMod,
        repeat: 0
      })
      this.anims.create({
        key: name + '-' + direction,
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithoutWeapon, prefix: withoutWeaponPrefix }),
        frameRate: numberOfFramesWithoutWeapon * frameRateMod,
        repeat: 0
      })
      // slowmo
      this.anims.create({
        key: name + '-with-sword-' + direction + '-slowmo',
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithWeapon, prefix: withWeaponPrefix }),
        frameRate: numberOfFramesWithWeapon * frameRateMod / 3,
        repeat: 0
      })
      this.anims.create({
        key: name + '-' + direction + '-slowmo',
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithoutWeapon, prefix: withoutWeaponPrefix }),
        frameRate: numberOfFramesWithoutWeapon * frameRateMod / 3,
        repeat: 0
      })
    })
  }

  createHeroCastSpellAnim() {
    ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'].forEach(direction => {
      const prefix = 'hero/with-weapon/taunt/' + direction + '/'

      this.anims.create({
        key: 'start-cast-spell-with-sword-' + direction,
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: 19, prefix: prefix }),
        frameRate: 24,
        repeat: 0
      })
    })
  }

  createZombiAnim(name, frameRate) {
    ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'].forEach(direction => {
      const prefix = 'enemies/zombie/' + name + '/' + direction + '/'
      const allFrames = Object.keys(this.textures.list.sprites.frames)
      const numberOfFrames = allFrames.filter(key => key.startsWith(prefix)).length

      // normal speed
      this.anims.create({
        key: 'zombie-' + name + '-' + direction,
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFrames, prefix: prefix }),
        frameRate: numberOfFrames * 1.5,
        repeat: 0
      })
      // slowmo
      this.anims.create({
        key: 'zombie-' + name + '-' + direction + '-slowmo',
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFrames, prefix: prefix }),
        frameRate: numberOfFrames * 1.5 / 3,
        repeat: 0
      })
    })
  }

  createSpiderAnim(name, frameRate) {
    ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'].forEach(direction => {
      const prefix = 'enemies/spider/' + name + '/' + direction + '/'
      const allFrames = Object.keys(this.textures.list.sprites.frames)
      const numberOfFrames = allFrames.filter(key => key.startsWith(prefix)).length

      // normal speed
      this.anims.create({
        key: 'spider-' + name + '-' + direction,
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFrames, prefix: prefix }),
        frameRate: numberOfFrames * 1.5,
        repeat: 0
      })
      // slowmo
      this.anims.create({
        key: 'spider-' + name + '-' + direction + '-slowmo',
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFrames, prefix: prefix }),
        frameRate: numberOfFrames * 1.5 / 3,
        repeat: 0
      })
    })
  }
}
