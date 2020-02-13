import SubmenuScene from './submenu.js'
import GuiCheckbox from "../gui/checkbox.js"

export default class SettingsScene extends SubmenuScene {
  constructor() {
    super("Settings", 300, 150, container => {
      // narrator checkbox
      container.add(new GuiCheckbox(
        this,
        0,
        0,
        150,
        'Disable Narrator',
        () => {
          this.sound.play('clickMinor')
          if (this.registry.get("disableNarrator")) {
            this.registry.set("disableNarrator", false)
          } else {
            this.registry.set("disableNarrator", true)
          }
        },
        () => this.registry.get("disableNarrator")
      ).container)
    })
  }
}
