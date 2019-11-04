// Our custom tile mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
export default {
  BLANK: 5,
  WALL: {
    TOP_LEFT: [{index: 0, weight: 5}, {index: 51, weight: 1}],
    TOP_RIGHT: [{index: 2, weight: 5}, {index: 52, weight: 1}],
    BOTTOM_RIGHT: [{index: 14, weight: 5}, {index: 58, weight: 1}],
    BOTTOM_LEFT: [{index: 12, weight: 5}, {index: 57, weight: 1}],
    TOP: 1,
    LEFT: 6,
    RIGHT: 8,
    BOTTOM: 13
  },
  FLOOR: 7,
  FLOOR_LIGHT: 97,
  DOOR: {
    TOP: [3, 7, 4],
    LEFT: [
      [3],
      [7],
      [9]
    ],
    BOTTOM: [9, 7, 10],
    RIGHT: [
      [4],
      [7],
      [10]
    ]
  },
  LIGHT_ENTRANCE: {
    X: 90,
    Y: 91
  },
  CHEST: 34,
  STAIRS: 53
}
