import axios from 'axios'
import SubmenuScene from './submenu.js'
import { API_URL, getLevelByXp } from "../helper.js"

export default class LeaderboardScene extends SubmenuScene {
  constructor() {
    super("Leaderboard", 360, 300, container => {
      axios.get(API_URL + '/api/leaderboard').then(res => {
        let textLeft = '\nPlayer (lvl):\n\n'
        let textCenter = '\nDungeon:\n\n'
        let textRight = 'Enemies\nkilled:\n\n'
        res.data.forEach((player, i) => {
          if (i > 9) return
          let name = player.name
          if (name.length > 10) name = name.substr(0, 9) + '...'
          textLeft += (i + 1) + '. ' + name + ' (' + getLevelByXp(player.xp) + ') ' + '\n'
          textCenter += player.deepestDungeon + '\n'
          textRight += player.enemiesKilled + '\n'
        })
        container.add(this.add.text(-140, -100, textLeft, { font: "13px monospace", fill: "#999999" }))
        container.add(this.add.text(0, -100, textCenter, { font: "13px monospace", fill: "#999999", align: 'right' }))
        container.add(this.add.text(80, -100, textRight, { font: "13px monospace", fill: "#999999", align: 'right' }))
      })
    })
  }
}
