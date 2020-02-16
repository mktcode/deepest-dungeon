import axios from 'axios'
import SubmenuScene from './submenu.js'
import Hero from '../objects/hero.js'

require('dotenv').config()

export default class LeaderboardScene extends SubmenuScene {
  constructor() {
    super("Leaderboard", 300, 200, container => {
      axios.get(process.env.API_URL + '/api/leaderboard').then(res => {
        let textLeft = 'Player (lvl):\n'
        let textRight = 'Dungeon:\n'
        res.data.forEach((player, i) => {
          if (i > 9) return
          textLeft += (i + 1) + '. ' + player.name + ' (' + Hero.getLevelByXp(player.xp) + ') ' + '\n'
          textRight += player.deepestDungeon + '\n'
        })
        container.add(this.add.text(-100, -60, textLeft, { font: "13px monospace", fill: "#999999" }))
        container.add(this.add.text(40, -60, textRight, { font: "13px monospace", fill: "#999999", align: 'right' }))
      })
    })
  }
}
