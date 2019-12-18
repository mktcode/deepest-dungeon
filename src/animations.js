export default class Animations {
  static create(anims) {
    anims.create({
      key: "intro-ground",
      frames: anims.generateFrameNumbers("intro-ground", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });

    [0, 1].forEach((slowmo) => {
      const moveFrameRate = slowmo ? 6 : 25
      const attackFrameRate = slowmo ? 6 : 25
      const slowmoString = slowmo ? '-slowmo' : ''
      anims.create({
        key: "idle-up" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 306, end: 319 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-up-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 289, end: 302 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-up-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 272, end: 285 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-down" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 391, end: 404 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-down-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 374, end: 387 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-down-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 357, end: 370 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 340, end: 353 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "idle-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 323, end: 336 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-up" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 34, end: 49 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-up-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 17, end: 32 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-up-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 0, end: 15 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-down" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 119, end: 134 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-down-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 102, end: 117 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-down-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 85, end: 100 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 68, end: 83 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "walk-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 51, end: 66 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-up" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 170, end: 180 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-up-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 153, end: 163 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-up-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 136, end: 146 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-down" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 255, end: 265 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-down-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 238, end: 248 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-down-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 221, end: 231 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 204, end: 214 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "run-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 187, end: 197 }),
        frameRate: moveFrameRate,
        repeat: -1
      });
      anims.create({
        key: "attack-up" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 442, end: 458 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-up-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 425, end: 441 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-up-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 408, end: 424 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-down" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 527, end: 543 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-down-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 493, end: 509 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-down-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 510, end: 526 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-left" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 476, end: 492 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "attack-right" + slowmoString,
        frames: anims.generateFrameNumbers("hero", { start: 459, end: 475 }),
        frameRate: attackFrameRate,
        repeat: 0
      });
      anims.create({
        key: "levelUp",
        frames: anims.generateFrameNumbers("levelUp", { start: 0, end: 8 }),
        frameRate: 24,
        repeat: 2,
        hideOnComplete: true,
        showOnStart: true
      });
    })

    anims.create({
      key: "snake-walk",
      frames: anims.generateFrameNumbers("snake", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });
    anims.create({
      key: "deamon-idle",
      frames: anims.generateFrameNumbers("deamon", { start: 0, end: 5 }),
      frameRate: 4,
      repeat: -1
    });

    anims.create({
      key: "torch",
      frames: anims.generateFrameNumbers("torch", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    anims.create({
      key: "pathfinder",
      frames: anims.generateFrameNumbers("pathfinder", { start: 0, end: 11 }),
      frameRate: 12,
      repeat: -1
    });

    anims.create({
      key: "xpDust",
      frames: anims.generateFrameNumbers("xpDust", { start: 0, end: 2 }),
      frameRate: 6,
      repeat: -1
    });
  }
}
