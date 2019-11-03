// Our custom tile mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
export default {
  BLANK: 5,
  WALL: {
    TOP_LEFT: 0,
    TOP_RIGHT: 2,
    BOTTOM_RIGHT: 14,
    BOTTOM_LEFT: 12,
    TOP: 1,
    LEFT: 6,
    RIGHT: 8,
    BOTTOM: 13
  },
  FLOOR: 7,
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
  CHEST: 34,
  STAIRS: 53
}
