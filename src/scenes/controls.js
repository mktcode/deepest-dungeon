import SubmenuScene from './submenu.js'

export default class ControlsScene extends SubmenuScene {
  constructor() {
    super("Controls", 300, 200, container => {
      // controls
      container.add(this.add.text(
        -90,
        -60,
        'Move:       WASD/Click' + "\n" +
        'Use:      E/Left Click' + "\n" +
        'Attack:    Space/Click' + "\n" +
        'Scout:               Q' + "\n" +
        'Shield:          Shift' + "\n" +
        'Fireball:  Right Click' + "\n" +
        'Pause:             ESC',
        { font: "13px monospace", fill: "#999999" }
      ))
    })
  }
}
