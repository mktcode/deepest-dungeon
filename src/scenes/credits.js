import SubmenuScene from './submenu.js'

export default class CreditsScene extends SubmenuScene {
  constructor() {
    super("Credits", 450, 200, container => {
      const credits = this.add.text(
        -170,
        -60,
        'Development: mktcode.itch.io\n' +
        'Music: kai-engel.com\n' +
        'Dungeon Tileset: szadiart.itch.io\n' +
        'Main Character Design: robertramsay.co.uk\n' +
        'Spider: opengameart.org/users/johndh\n' +
        'Zombie: opengameart.org/users/clint-bellanger\n' +
        'User Interface: opengameart.org/users/wyrmheart',
        { font: "13px monospace", fill: "#999999" }
      )
      container.add(credits)
    })
  }
}
