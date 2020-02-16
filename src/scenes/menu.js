import DungeonScene from "../scenes/dungeon.js"
import GuiScene from "../scenes/gui.js"
import PauseScene from "../scenes/pause.js"
import Hero from "../objects/hero.js"
import GuiContainer from "../gui/container.js";
import GuiButton from "../gui/button.js";
import GuiCheckbox from "../gui/checkbox.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu")
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0)
    this.menuMusic = this.registry.get('menuMusic')
    this.menuMusic.play()

    this.centerX = this.game.scale.width / 2
    this.centerY = this.game.scale.height / 2

    this.addContainer()

    this.events.on('wake', () => {
      this.cameras.main.fadeIn(250, 0, 0, 0);
    })
  }

  addContainer() {
    this.container = new GuiContainer(this, this.game.scale.width / 2, this.game.scale.height / 2, 265, 280, container => {
      // new game button
      container.add(new GuiButton(this, 0, -80, 150, 'New Game', () => {
        this.sound.play('clickMajor')
        this.cameras.main.fadeOut(1500, 0, 0, 0, (camera, progress) => {
          this.menuMusic.setVolume(1 - progress)
          if (progress === 1) {
            this.menuMusic.stop()
            this.scene.sleep()
            this.scene.add('Dungeon1', new DungeonScene(1), true)
            this.scene.add('Gui', new GuiScene(), true)
            this.scene.add('Pause', new PauseScene())
          }
        })
      }).container)

      // continue button
      const currentDungeon = this.registry.get('currentDungeon')
      if (currentDungeon > 1) {
        container.add(new GuiButton(this, 0, -50, 150, 'Continue', () => {
          this.sound.play('clickMajor')
          this.cameras.main.fadeOut(1500, 0, 0, 0, (camera, progress) => {
            this.menuMusic.setVolume(1 - progress)
            if (progress === 1) {
              this.menuMusic.stop()
              this.scene.sleep()
              this.scene.add('Dungeon' + currentDungeon, new DungeonScene(currentDungeon), true)
              this.scene.add('Gui', new GuiScene(), true)
              this.scene.add('Pause', new PauseScene())
            }
          })
        }).container)
      }

      // leaderboard button
      container.add(new GuiButton(this, 0, -20, 150, 'Leaderboard', () => {
        this.sound.play('clickMajor')
        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
          if (progress === 1) {
            this.scene.sleep()
            this.scene.run('Leaderboard')
          }
        })
      }).container)

      // controls button
      container.add(new GuiButton(this, 0, 20, 150, 'Controls', () => {
        this.sound.play('clickMinor')
        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
          if (progress === 1) {
            this.scene.sleep()
            this.scene.run('Controls')
          }
        })
      }).container)

      // settings button
      container.add(new GuiButton(this, 0, 50, 150, 'Settings', () => {
        this.sound.play('clickMinor')
        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
          if (progress === 1) {
            this.scene.sleep()
            this.scene.run('Settings')
          }
        })
      }).container)

      // credits button
      container.add(new GuiButton(this, 0, 80, 150, 'Credits', () => {
        this.sound.play('clickMinor')
        this.cameras.main.fadeOut(250, 0, 0, 0, (camera, progress) => {
          if (progress === 1) {
            this.scene.sleep()
            this.scene.run('Credits')
          }
        })
      }).container)
    })
  }
}
