// Our custom tile mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
export default {
  BLANK: 44,
  WALL: {
    TOP_LEFT: 52,
    TOP_RIGHT: 43,
    BOTTOM_RIGHT: 9,
    BOTTOM_LEFT: 12,
    TOP: [
      [{ index: 266, weight: 4 }, { index: 267, weight: 1 }, { index: 272, weight: 4 }],
      [{ index: 90, weight: 1 }, { index: 93, weight: 1 }],
      [{ index: 127, weight: 1 }, { index: 130, weight: 1 }],
      [{ index: 413, weight: 1 }, { index: 414, weight: 1 }, { index: 415, weight: 1 }]
    ],
    LEFT: [
      [{ index: 126, weight: 1 }, { index: 237, weight: 5 }],
      [312, [{ index: 238, weight: 1 }, { index: 275, weight: 1 }]]
    ],
    RIGHT: [
      [{ index: 117, weight: 1 }, { index: 228, weight: 5 }],
      [301, [{ index: 227, weight: 1 }, { index: 264, weight: 1 }]]
    ],
    BOTTOM: [{ index: 7, weight: 1 }, { index: 8, weight: 5 }, { index: 13, weight: 1 }, { index: 14, weight: 5 }]
  },
  FLOOR: [
    {index: 814, weight: 5},
    {index: 815, weight: 1},
    {index: 816, weight: 1},
    {index: 817, weight: 1},
    {index: 851, weight: 5},
    {index: 852, weight: 1},
    {index: 853, weight: 1},
    {index: 854, weight: 1}
  ],
  FLOOR_LIGHT: 97,
  SHRINE: {
    TOP: [11, 17],
    BOTTOM: [29, 23],
    LEFT: [30, 31],
    RIGHT: [37, 36]
  },
  DOOR: {
    TOP: [
      [274, 201, 814, 190, 265],
      [311, 238, 815, 264, 302],
      [348, 275, 816, 227, 339],
      [414, 423, 817, 412, 413]
    ],
    LEFT: [
      [
        [274],
        [311],
        [348],
        [414],
        [15],
        [237],
      ],
      [
        [423],
        [854],
        [201]
      ]
    ],
    BOTTOM: [15, 814, 815, 816, 6],
    RIGHT: [
      [
        [265],
        [302],
        [339],
        [414],
        [6],
        [228]
      ],
      [
        [412],
        [854],
        [190]
      ]
    ]
  },
  LIGHT_ENTRANCE: {
    X: 90,
    Y: 91
  },
  CHEST: 34,
  STAIRS: {
    OPEN: 53,
    CLOSED: 59
  }
}
