export default class Animations {
  static intro(anims) {
    anims.create({
      key: "intro-ground",
      frames: anims.generateFrameNumbers("intro-ground", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
  }

  static hero(anims) {
    [0, 1].forEach((slowmo) => {
      const moveFrameRate = slowmo ? 2 : 6
      const swordFrameRate = slowmo ? 4 : 12
      const slowmoString = slowmo ? '-slowmo' : ''
      anims.create({
        key: "walk-up" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 10, end: 13 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-up-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 5, end: 8 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-up-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 0, end: 3 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-down" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 35, end: 38 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-down-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 30, end: 33 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-down-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 25, end: 28 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 20, end: 23 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 15, end: 18 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "attack-up" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 40, end: 44 }),
        frameRate: moveFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-down" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 55, end: 59 }),
        frameRate: moveFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 45, end: 49 }),
        frameRate: moveFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 50, end: 54 }),
        frameRate: moveFrameRate,
        repeat: 0
      });
      anims.create({
        key: "sword-up" + slowmoString,
        frames: anims.generateFrameNumbers("sword", { start: 0, end: 4 }),
        frameRate: swordFrameRate,
        repeat: 0,
        hideOnComplete: true,
        showOnStart: true
      });
      anims.create({
        key: "sword-down" + slowmoString,
        frames: anims.generateFrameNumbers("sword", { start: 15, end: 19 }),
        frameRate: swordFrameRate,
        repeat: 0,
        hideOnComplete: true,
        showOnStart: true
      });
      anims.create({
        key: "sword-left" + slowmoString,
        frames: anims.generateFrameNumbers("sword", { start: 5, end: 9 }),
        frameRate: swordFrameRate,
        repeat: 0,
        hideOnComplete: true,
        showOnStart: true
      });
      anims.create({
        key: "sword-right" + slowmoString,
        frames: anims.generateFrameNumbers("sword", { start: 10, end: 14 }),
        frameRate: swordFrameRate,
        repeat: 0,
        hideOnComplete: true,
        showOnStart: true
      });
    })
  }

  static enemies(anims) {
    anims.create({
      key: "enemy-walk",
      frames: anims.generateFrameNumbers("enemies", { start: 69, end: 72 }),
      frameRate: 4,
      repeat: -1
    });
    anims.create({
      key: "deamon-idle",
      frames: anims.generateFrameNumbers("deamon", { start: 0, end: 5 }),
      frameRate: 4,
      repeat: -1
    });
  }

  static items(anims) {
    anims.create({
      key: "torch",
      frames: anims.generateFrameNumbers("torch", { start: 0, end: 6 }),
      frameRate: 8,
      repeat: -1
    });
  }
}
