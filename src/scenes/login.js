import axios from "axios"
import GuiContainer from "../gui/container.js";
import GuiButton from "../gui/button.js";
import GuiCheckbox from "../gui/checkbox.js";
import { API_URL, getLevelByXp } from "../helper.js"

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super("Login")
  }

  create() {
    this.cameras.main.fadeIn(250, 0, 0, 0)

    this.menuMusic = this.registry.get('menuMusic')
    this.menuMusic.play()

    this.centerX = this.game.scale.width / 2
    this.centerY = this.game.scale.height / 2

    this.addContainer()
  }

  addContainer() {
    this.container = new GuiContainer(this, this.game.scale.width / 2, this.game.scale.height / 2, 300, 300, container => {
      const title = this.add.text(-100, -100, 'Login. Account will be\ncreated if not exists.', {
        font: '14px monospace',
        fill: '#CCCCCC'
      }).setFixedSize(200, 40).setAlign('center')
      container.add(title)

      const errorMessage = this.add.text(-100, -55, 'User exists, password wrong.', {
        font: '12px monospace',
        fill: '#FF0000'
      }).setFixedSize(200, 20).setAlign('center').setAlpha(0)
      container.add(errorMessage)

      // login form
      const form = this.add.dom(0, 20).createFromCache('loginForm')
      container.add(form)

      // login button
      const loginButton = new GuiButton(this, 0, 100, 150, 'Login', () => {
        this.sound.play('clickMajor')
        const name = form.getChildByID('name').value
        const password = form.getChildByID('password').value
        if (name && password) {
          loginButton.text.setText('loading...')
          axios.post(API_URL + '/login', { name, password }).then(res => {
            errorMessage.setAlpha(0)
            this.registry.set('credentials', { name, password })
            this.registry.set('deepestDungeon', res.data.deepestDungeon || 1)
            this.registry.set('currentDungeon', res.data.currentDungeon || 1)
            this.registry.set('minDungeon', res.data.minDungeon || 1)
            this.registry.set('items', JSON.parse(res.data.items) || [])
            this.registry.set('maxHealth', res.data.maxHealth || 5)
            this.registry.set('health', this.registry.get('maxHealth'))
            this.registry.set('maxMana', res.data.maxMana || 5)
            this.registry.set('mana', this.registry.get('maxMana'))
            this.registry.set('damage', res.data.damage || 1)
            this.registry.set('xp', res.data.xp || 0)
            this.registry.set('level', getLevelByXp(this.registry.get('xp')))
            this.registry.set('enemiesKilled', res.data.enemiesKilled || 0)
            this.registry.set('narratorSaid', JSON.parse(res.data.narratorSaid) || [])
            this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
              form.setAlpha(1 - progress)
              if (progress === 1) {
                this.scene.sleep()
                this.scene.start('Menu')
              }
            })
          }).catch(e => {
            errorMessage.setAlpha(1)
          }).finally(() => loginButton.text.setText('Login'))
        }
      })
      container.add(loginButton.container)
    })
  }
}
