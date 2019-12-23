// Our custom tile mapping with:
// - Single index for putTileAt
// - Array of weights for weightedRandomize
// - Array or 2D array for putTilesAt
export default {
  BLANK: 0,
  SHADOW: 44,
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
    TOP_ALT: [
      [{ index: 25, weight: 1 }],
      [{ index: 62, weight: 1 }, { index: 63, weight: 1 }, { index: 63, weight: 1 }],
      [{ index: 135, weight: 1 }, { index: 136, weight: 1 }],
      [{ index: 413, weight: 1 }, { index: 414, weight: 1 }, { index: 415, weight: 1 }]
    ],
    TOP_SAFEROOM_ACTIVATED: 31,
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
  PILLAR: {
    TOP: [
      [-1, 1025, -1],
      [-1, 1062, -1],
      [-1, 1136, -1],
      [1172, 1173, 1174]
    ],
    BOTTOM: [
      [1024],
      [1061]
    ],
    LEFT: [
      [1026, 1027],
      [1063, 1064],
      [1100, 1101],
      [1137, 1138],
    ],
    RIGHT: [
      [1030, 1031],
      [1067, 1068],
      [1104, 1105],
      [1141, 1142],
    ]
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
  FLOOR_ALT: [
    {index: 1480, weight: 5},
    {index: 1481, weight: 5},
    {index: 1482, weight: 5},
    {index: 1483, weight: 5},
    {index: 1517, weight: 5},
    {index: 1518, weight: 5},
    {index: 1519, weight: 1},
    {index: 1520, weight: 5}
  ],
  SHRINE: [
    [1398, 1400],
    [1435, 1437],
    [1546, 1548]
  ],
  SKILLBG: {
    CLOSED: [
      [68, 69],
      [105, 106]
    ],
    OPEN: [
      [70, 71],
      [107, 108]
    ]
  },
  DOOR: {
    TOP: [
      [274, 201, -1, 190, 265],
      [311, 238, -1, 264, 302],
      [348, 275, -1, 227, 339],
      [414, 423, -1, 412, 413]
    ],
    TOP_ALT: [
      [23, 201, -1, 190, 23],
      [60, 238, -1, 264, 60],
      [134, 275, -1, 227, 134],
      [414, 423, -1, 412, 413]
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
        [-1],
        [201]
      ]
    ],
    BOTTOM: [15, 814, -1, 816, 6],
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
        [-1],
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
    OPEN: [
      [840, 841, 842, 841, 843],
      [877, 774, 775, 776, 917],
      [914, 811, 812, 813, 954],
      [951, 848, 849, 850, 880],
      [988, 990, 989, 990, 991]
    ]
  }
}
