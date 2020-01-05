export default class Animations {
  constructor(scene) {
    this.anims = scene.anims
    this.textures = scene.textures

    this.createHeroAnim('idle', 12)
    this.createHeroAnim('walk', 25)
    this.createHeroAnim('run', 25)
    this.createHeroAnim('attack', 25)
    this.createHeroAnim('die', 25)

    this.createZombiAnim('walk', 25)
    this.createZombiAnim('die', 25)

    this.anims.create({
      key: "deamon-idle",
      frames: this.anims.generateFrameNumbers("deamon", { start: 0, end: 5 }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "torch",
      frames: this.anims.generateFrameNumbers("torch", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "pathfinder",
      frames: this.anims.generateFrameNumbers("pathfinder", { start: 0, end: 11 }),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: "xpDust",
      frames: this.anims.generateFrameNumbers("xpDust", { start: 0, end: 2 }),
      frameRate: 6,
      repeat: -1
    });
  }

  createHeroAnim(name, frameRate) {
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
        frameRate: numberOfFramesWithWeapon * 1.5,
        repeat: 0
      })
      this.anims.create({
        key: name + '-' + direction,
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithoutWeapon, prefix: withoutWeaponPrefix }),
        frameRate: numberOfFramesWithoutWeapon * 1.5,
        repeat: 0
      })
      // slowmo
      this.anims.create({
        key: name + '-with-sword' + direction + '-slowmo',
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithWeapon, prefix: withWeaponPrefix }),
        frameRate: numberOfFramesWithWeapon * 1.5 / 3,
        repeat: 0
      })
      this.anims.create({
        key: name + '-' + direction + '-slowmo',
        frames: this.anims.generateFrameNames('sprites', { start: 1, end: numberOfFramesWithoutWeapon, prefix: withoutWeaponPrefix }),
        frameRate: numberOfFramesWithoutWeapon * 1.5 / 3,
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
}
