const API_URL = 'https://edbad.uber.space'

const getLevelByXp = (xp) => {
  // required xp for level up: current level * 50
  // https://gamedev.stackexchange.com/questions/110431/how-can-i-calculate-current-level-from-total-xp-when-each-level-requires-propor
  return Math.floor((1 + Math.sqrt(1 + 8 * xp / 50)) / 2)
}

const getXpForLevelUp = (level) => {
  return ((Math.pow(level, 2) - level) * 50) / 2
}

export { API_URL, getLevelByXp, getXpForLevelUp }
