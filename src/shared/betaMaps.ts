// AUTO-GENERATED — terrain floors use public/maps/*.png; obstacles synced from art.
// Obstacle maps still seeded for turrets/grass/bombs via hazards.ts.
import type { ArenaMap, BetaMapId } from './types.ts';

export const BETA_MAPS: Record<BetaMapId, ArenaMap> = {
  dunes: {
    id: 'dunes',
    name: 'Dune Sea',
    subtitle: 'Collect 3 sand charges to slow the enemy team',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#d8b878',
      groundDetail: '#c9a560',
      groundAccent: '#e6c98f',
      gridLine: 'rgba(120, 80, 30, 0.10)',
      obstacleFill: '#9a6b3c',
      obstacleStroke: '#4a2e14',
      obstacleTop: '#b98a55',
      ambientEffect: 'dust'
    },
    obstacles: [
      {
        id: 'du1',
        x: 963,
        y: 185,
        w: 178,
        h: 97,
        kind: 'ruin'
      },
      {
        id: 'du2',
        x: 1352,
        y: 213,
        w: 184,
        h: 82,
        kind: 'ruin'
      },
      {
        id: 'du3',
        x: 1751,
        y: 185,
        w: 175,
        h: 97,
        kind: 'ruin'
      },
      {
        id: 'du4',
        x: 485,
        y: 325,
        w: 136,
        h: 121,
        kind: 'ruin'
      },
      {
        id: 'du5',
        x: 2266,
        y: 334,
        w: 136,
        h: 112,
        kind: 'ruin'
      },
      {
        id: 'du6',
        x: 778,
        y: 455,
        w: 58,
        h: 127,
        kind: 'ruin'
      },
      {
        id: 'du7',
        x: 1352,
        y: 476,
        w: 199,
        h: 124,
        kind: 'ruin'
      },
      {
        id: 'du8',
        x: 1519,
        y: 477,
        w: 76,
        h: 124,
        kind: 'ruin'
      },
      {
        id: 'du9',
        x: 1006,
        y: 559,
        w: 94,
        h: 178,
        kind: 'ruin'
      },
      {
        id: 'du10',
        x: 1790,
        y: 559,
        w: 91,
        h: 178,
        kind: 'ruin'
      },
      {
        id: 'du11',
        x: 1352,
        y: 828,
        w: 199,
        h: 118,
        kind: 'ruin'
      },
      {
        id: 'du12',
        x: 1519,
        y: 862,
        w: 79,
        h: 85,
        kind: 'ruin'
      },
      {
        id: 'du13',
        x: 424,
        y: 640,
        w: 79,
        h: 169,
        kind: 'ruin'
      },
      {
        id: 'du14',
        x: 2384,
        y: 640,
        w: 85,
        h: 169,
        kind: 'ruin'
      },
      {
        id: 'du15',
        x: 547,
        y: 1014,
        w: 154,
        h: 130,
        kind: 'ruin'
      },
      {
        id: 'du16',
        x: 2187,
        y: 1014,
        w: 157,
        h: 130,
        kind: 'ruin'
      },
      {
        id: 'du17',
        x: 1068,
        y: 1088,
        w: 121,
        h: 103,
        kind: 'ruin'
      },
      {
        id: 'du18',
        x: 1700,
        y: 1085,
        w: 124,
        h: 106,
        kind: 'ruin'
      },
      {
        id: 'du19',
        x: 1352,
        y: 1138,
        w: 184,
        h: 100,
        kind: 'ruin'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2640,
        y: 180
      },
      {
        x: 240,
        y: 1260
      },
      {
        x: 2640,
        y: 1260
      },
      {
        x: 1440,
        y: 150
      },
      {
        x: 1440,
        y: 1320
      },
      {
        x: 700,
        y: 700
      },
      {
        x: 2180,
        y: 700
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 192,
        y: 1008
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 400,
        y: 1180
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2512,
        y: 216
      },
      {
        x: 2480,
        y: 1180
      }
    ],
    redBase: {
      x: 224,
      y: 720,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 720,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 360
      },
      {
        x: 1440,
        y: 1080
      },
      {
        x: 900,
        y: 720
      },
      {
        x: 1980,
        y: 720
      },
      {
        x: 900,
        y: 240
      },
      {
        x: 1980,
        y: 1200
      },
      {
        x: 1980,
        y: 240
      },
      {
        x: 900,
        y: 1200
      }
    ],
    category: 'terrain',
    beta: true,
    bakedFloor: true,
    hazardSpec: {
      terrainUlt: 'slow'
    }
  },
  glacier: {
    id: 'glacier',
    name: 'Glacier Rift',
    subtitle: 'Collect 3 ice charges to freeze the enemy team',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#bfe3f2',
      groundDetail: '#a9d3e6',
      groundAccent: '#e4f6ff',
      gridLine: 'rgba(30, 90, 130, 0.12)',
      obstacleFill: '#6fa8c9',
      obstacleStroke: '#1f4a66',
      obstacleTop: '#a5d4ec',
      ambientEffect: 'snow'
    },
    obstacles: [
      {
        id: 'gl1',
        x: 818,
        y: 110,
        w: 151,
        h: 115,
        kind: 'ice_wall'
      },
      {
        id: 'gl2',
        x: 662,
        y: 419,
        w: 211,
        h: 127,
        kind: 'ice_wall'
      },
      {
        id: 'gl3',
        x: 498,
        y: 398,
        w: 106,
        h: 130,
        kind: 'ice_wall'
      },
      {
        id: 'gl4',
        x: 469,
        y: 500,
        w: 85,
        h: 67,
        kind: 'ice_wall'
      },
      {
        id: 'gl5',
        x: 578,
        y: 517,
        w: 70,
        h: 58,
        kind: 'ice_wall'
      },
      {
        id: 'gl6',
        x: 1081,
        y: 484,
        w: 334,
        h: 409,
        kind: 'ice_wall'
      },
      {
        id: 'gl7',
        x: 1456,
        y: 458,
        w: 304,
        h: 214,
        kind: 'ice_wall'
      },
      {
        id: 'gl8',
        x: 1526,
        y: 770,
        w: 175,
        h: 163,
        kind: 'ice_wall'
      },
      {
        id: 'gl9',
        x: 1695,
        y: 702,
        w: 91,
        h: 112,
        kind: 'ice_wall'
      },
      {
        id: 'gl10',
        x: 1391,
        y: 777,
        w: 103,
        h: 124,
        kind: 'ice_wall'
      },
      {
        id: 'gl11',
        x: 1619,
        y: 128,
        w: 118,
        h: 94,
        kind: 'ice_wall'
      },
      {
        id: 'gl12',
        x: 1747,
        y: 55,
        w: 880,
        h: 520,
        kind: 'ice_wall'
      },
      {
        id: 'gl13',
        x: 2321,
        y: 841,
        w: 94,
        h: 88,
        kind: 'ice_wall'
      },
      {
        id: 'gl14',
        x: 104,
        y: 934,
        w: 478,
        h: 433,
        kind: 'ice_wall'
      },
      {
        id: 'gl15',
        x: 815,
        y: 1001,
        w: 337,
        h: 319,
        kind: 'ice_wall'
      },
      {
        id: 'gl16',
        x: 1912,
        y: 1129,
        w: 178,
        h: 142,
        kind: 'ice_wall'
      },
      {
        id: 'gl17',
        x: 2593,
        y: 1188,
        w: 103,
        h: 73,
        kind: 'ice_wall'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2664,
        y: 180
      },
      {
        x: 72,
        y: 1260
      },
      {
        x: 2658,
        y: 1291
      },
      {
        x: 1440,
        y: 150
      },
      {
        x: 1440,
        y: 1320
      },
      {
        x: 700,
        y: 700
      },
      {
        x: 2180,
        y: 700
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 164,
        y: 904
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 616,
        y: 1180
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2668,
        y: 216
      },
      {
        x: 2480,
        y: 1180
      }
    ],
    redBase: {
      x: 224,
      y: 720,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 720,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 360
      },
      {
        x: 1440,
        y: 1080
      },
      {
        x: 900,
        y: 720
      },
      {
        x: 1980,
        y: 720
      },
      {
        x: 917,
        y: 257
      },
      {
        x: 2008,
        y: 1304
      },
      {
        x: 1713,
        y: 311
      },
      {
        x: 780,
        y: 1200
      }
    ],
    category: 'terrain',
    beta: true,
    bakedFloor: true,
    hazardSpec: {
      terrainUlt: 'freeze'
    }
  },
  magma: {
    id: 'magma',
    name: 'Magma Fields',
    subtitle: 'Collect 3 magma charges to burn the enemy team',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#2a1612',
      groundDetail: '#1f0f0c',
      groundAccent: '#3d1f17',
      gridLine: 'rgba(255, 120, 60, 0.07)',
      obstacleFill: '#4a2f2a',
      obstacleStroke: '#140807',
      obstacleTop: '#7a3d2c',
      ambientEffect: 'embers'
    },
    obstacles: [
      {
        id: 'ma1',
        x: 532,
        y: 59,
        w: 132,
        h: 98,
        kind: 'rock'
      },
      {
        id: 'ma2',
        x: 368,
        y: 110,
        w: 70,
        h: 51,
        kind: 'rock'
      },
      {
        id: 'ma3',
        x: 1114,
        y: 45,
        w: 84,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'ma4',
        x: 1370,
        y: 53,
        w: 152,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma5',
        x: 1634,
        y: 11,
        w: 141,
        h: 155,
        kind: 'rock'
      },
      {
        id: 'ma6',
        x: 1946,
        y: 48,
        w: 87,
        h: 68,
        kind: 'rock'
      },
      {
        id: 'ma7',
        x: 2199,
        y: 31,
        w: 146,
        h: 135,
        kind: 'rock'
      },
      {
        id: 'ma8',
        x: 2725,
        y: 115,
        w: 82,
        h: 70,
        kind: 'rock'
      },
      {
        id: 'ma9',
        x: 807,
        y: 236,
        w: 143,
        h: 110,
        kind: 'rock'
      },
      {
        id: 'ma10',
        x: 1257,
        y: 259,
        w: 104,
        h: 110,
        kind: 'rock'
      },
      {
        id: 'ma11',
        x: 1651,
        y: 262,
        w: 174,
        h: 104,
        kind: 'rock'
      },
      {
        id: 'ma12',
        x: 1949,
        y: 278,
        w: 82,
        h: 82,
        kind: 'rock'
      },
      {
        id: 'ma13',
        x: 2703,
        y: 250,
        w: 104,
        h: 98,
        kind: 'rock'
      },
      {
        id: 'ma14',
        x: 281,
        y: 340,
        w: 121,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma15',
        x: 532,
        y: 391,
        w: 101,
        h: 104,
        kind: 'rock'
      },
      {
        id: 'ma16',
        x: 1114,
        y: 470,
        w: 76,
        h: 87,
        kind: 'rock'
      },
      {
        id: 'ma17',
        x: 602,
        y: 596,
        w: 90,
        h: 101,
        kind: 'rock'
      },
      {
        id: 'ma18',
        x: 276,
        y: 608,
        w: 90,
        h: 73,
        kind: 'rock'
      },
      {
        id: 'ma19',
        x: 270,
        y: 706,
        w: 82,
        h: 93,
        kind: 'rock'
      },
      {
        id: 'ma20',
        x: 68,
        y: 728,
        w: 70,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'ma21',
        x: 1041,
        y: 613,
        w: 143,
        h: 188,
        kind: 'rock'
      },
      {
        id: 'ma22',
        x: 1263,
        y: 532,
        w: 385,
        h: 349,
        kind: 'rock'
      },
      {
        id: 'ma23',
        x: 1910,
        y: 610,
        w: 113,
        h: 101,
        kind: 'rock'
      },
      {
        id: 'ma24',
        x: 1901,
        y: 695,
        w: 115,
        h: 118,
        kind: 'rock'
      },
      {
        id: 'ma25',
        x: 2717,
        y: 678,
        w: 98,
        h: 98,
        kind: 'rock'
      },
      {
        id: 'ma26',
        x: 458,
        y: 914,
        w: 262,
        h: 321,
        kind: 'rock'
      },
      {
        id: 'ma27',
        x: 807,
        y: 1080,
        w: 138,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma28',
        x: 1308,
        y: 1066,
        w: 73,
        h: 84,
        kind: 'rock'
      },
      {
        id: 'ma29',
        x: 1634,
        y: 1066,
        w: 169,
        h: 107,
        kind: 'rock'
      },
      {
        id: 'ma30',
        x: 2121,
        y: 1080,
        w: 127,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma31',
        x: 1828,
        y: 1207,
        w: 76,
        h: 84,
        kind: 'rock'
      },
      {
        id: 'ma32',
        x: 2638,
        y: 1150,
        w: 138,
        h: 155,
        kind: 'rock'
      },
      {
        id: 'ma33',
        x: 2143,
        y: 239,
        w: 132,
        h: 107,
        kind: 'rock'
      },
      {
        id: 'ma34',
        x: 2433,
        y: 394,
        w: 98,
        h: 101,
        kind: 'rock'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2640,
        y: 180
      },
      {
        x: 240,
        y: 1260
      },
      {
        x: 2605,
        y: 1269
      },
      {
        x: 1440,
        y: 210
      },
      {
        x: 1440,
        y: 1320
      },
      {
        x: 724,
        y: 700
      },
      {
        x: 2180,
        y: 700
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 192,
        y: 1008
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 400,
        y: 1180
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2512,
        y: 216
      },
      {
        x: 2480,
        y: 1180
      }
    ],
    redBase: {
      x: 224,
      y: 900,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 900,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 360
      },
      {
        x: 1440,
        y: 1080
      },
      {
        x: 900,
        y: 720
      },
      {
        x: 2050,
        y: 739
      },
      {
        x: 900,
        y: 204
      },
      {
        x: 1980,
        y: 1200
      },
      {
        x: 1980,
        y: 240
      },
      {
        x: 924,
        y: 1242
      }
    ],
    category: 'terrain',
    beta: true,
    bakedFloor: true,
    hazardSpec: {
      terrainUlt: 'burn'
    }
  },
  storm: {
    id: 'storm',
    name: 'Storm Plateau',
    subtitle: 'Collect 3 storm charges to shield your team from shells',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#7d8a6a',
      groundDetail: '#6c7a5b',
      groundAccent: '#93a07e',
      gridLine: 'rgba(30, 40, 20, 0.12)',
      obstacleFill: '#5b6070',
      obstacleStroke: '#23262f',
      obstacleTop: '#7f8598',
      ambientEffect: 'dust'
    },
    obstacles: [
      {
        id: 'st1',
        x: 1117,
        y: 78,
        w: 245,
        h: 437,
        kind: 'rock'
      },
      {
        id: 'st2',
        x: 577,
        y: 287,
        w: 98,
        h: 74,
        kind: 'rock'
      },
      {
        id: 'st3',
        x: 788,
        y: 546,
        w: 77,
        h: 47,
        kind: 'rock'
      },
      {
        id: 'st4',
        x: 1522,
        y: 349,
        w: 59,
        h: 41,
        kind: 'rock'
      },
      {
        id: 'st5',
        x: 1586,
        y: 474,
        w: 98,
        h: 62,
        kind: 'rock'
      },
      {
        id: 'st6',
        x: 2554,
        y: 347,
        w: 62,
        h: 26,
        kind: 'rock'
      },
      {
        id: 'st7',
        x: 417,
        y: 699,
        w: 356,
        h: 299,
        kind: 'rock'
      },
      {
        id: 'st8',
        x: 1502,
        y: 817,
        w: 110,
        h: 74,
        kind: 'rock'
      },
      {
        id: 'st9',
        x: 1393,
        y: 1045,
        w: 431,
        h: 266,
        kind: 'rock'
      },
      {
        id: 'st10',
        x: 1980,
        y: 1106,
        w: 80,
        h: 50,
        kind: 'rock'
      },
      {
        id: 'st11',
        x: 2028,
        y: 615,
        w: 605,
        h: 221,
        kind: 'rock'
      },
      {
        id: 'st12',
        x: 2184,
        y: 769,
        w: 176,
        h: 188,
        kind: 'rock'
      },
      {
        id: 'st13',
        x: 1128,
        y: 586,
        w: 44,
        h: 23,
        kind: 'rock'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2640,
        y: 180
      },
      {
        x: 240,
        y: 1260
      },
      {
        x: 2640,
        y: 1260
      },
      {
        x: 1440,
        y: 150
      },
      {
        x: 1452,
        y: 1341
      },
      {
        x: 682,
        y: 669
      },
      {
        x: 2149,
        y: 584
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 192,
        y: 1008
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 400,
        y: 1180
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2512,
        y: 216
      },
      {
        x: 2480,
        y: 1180
      }
    ],
    redBase: {
      x: 224,
      y: 520,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 520,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 360
      },
      {
        x: 1421,
        y: 1010
      },
      {
        x: 900,
        y: 720
      },
      {
        x: 1980,
        y: 720
      },
      {
        x: 900,
        y: 240
      },
      {
        x: 1980,
        y: 1200
      },
      {
        x: 1980,
        y: 240
      },
      {
        x: 900,
        y: 1200
      }
    ],
    category: 'terrain',
    beta: true,
    bakedFloor: true,
    hazardSpec: {
      terrainUlt: 'gust_shield'
    }
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel Yard',
    subtitle: 'Fortified compound — wall-mounted turrets watch every lane',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#3a424d',
      groundDetail: '#2f363f',
      groundAccent: '#4c5663',
      gridLine: 'rgba(255, 255, 255, 0.06)',
      obstacleFill: '#59616e',
      obstacleStroke: '#171b21',
      obstacleTop: '#7a8494',
      ambientEffect: 'sparks'
    },
    obstacles: [
      {
        id: 'se1',
        x: 520,
        y: 240,
        w: 210,
        h: 110,
        kind: 'building'
      },
      {
        id: 'se2',
        x: 2150,
        y: 240,
        w: 210,
        h: 110,
        kind: 'building'
      },
      {
        id: 'se3',
        x: 520,
        y: 1090,
        w: 210,
        h: 110,
        kind: 'building'
      },
      {
        id: 'se4',
        x: 2150,
        y: 1090,
        w: 210,
        h: 110,
        kind: 'building'
      },
      {
        id: 'se5',
        x: 900,
        y: 420,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se6',
        x: 1840,
        y: 420,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se7',
        x: 900,
        y: 860,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se8',
        x: 1840,
        y: 860,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se9',
        x: 1100,
        y: 200,
        w: 50,
        h: 230,
        kind: 'barrier'
      },
      {
        id: 'se10',
        x: 1730,
        y: 200,
        w: 50,
        h: 230,
        kind: 'barrier'
      },
      {
        id: 'se11',
        x: 1100,
        y: 1010,
        w: 50,
        h: 230,
        kind: 'barrier'
      },
      {
        id: 'se12',
        x: 1730,
        y: 1010,
        w: 50,
        h: 230,
        kind: 'barrier'
      },
      {
        id: 'se13',
        x: 1180,
        y: 630,
        w: 150,
        h: 180,
        kind: 'bunker'
      },
      {
        id: 'se14',
        x: 1550,
        y: 630,
        w: 150,
        h: 180,
        kind: 'bunker'
      },
      {
        id: 'se15',
        x: 420,
        y: 620,
        w: 50,
        h: 200,
        kind: 'barrier'
      },
      {
        id: 'se16',
        x: 2410,
        y: 620,
        w: 50,
        h: 200,
        kind: 'barrier'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2640,
        y: 180
      },
      {
        x: 240,
        y: 1260
      },
      {
        x: 2640,
        y: 1260
      },
      {
        x: 1440,
        y: 168
      },
      {
        x: 1440,
        y: 1272
      },
      {
        x: 768,
        y: 720
      },
      {
        x: 2112,
        y: 720
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 192,
        y: 1008
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 368,
        y: 1224
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2512,
        y: 216
      },
      {
        x: 2512,
        y: 1224
      }
    ],
    redBase: {
      x: 224,
      y: 720,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 720,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 384
      },
      {
        x: 1440,
        y: 1056
      },
      {
        x: 832,
        y: 720
      },
      {
        x: 2048,
        y: 720
      },
      {
        x: 832,
        y: 216
      },
      {
        x: 2048,
        y: 1224
      },
      {
        x: 2048,
        y: 216
      },
      {
        x: 832,
        y: 1224
      }
    ],
    category: 'obstacle',
    beta: true,
    hazardSpec: {
      turrets: [
        4,
        5
      ]
    }
  },
  overgrowth: {
    id: 'overgrowth',
    name: 'Overgrowth',
    subtitle: 'Overgrown ruins — tall grass hides tanks that stay low',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#2f5a34',
      groundDetail: '#264c2b',
      groundAccent: '#3f7344',
      gridLine: 'rgba(0, 0, 0, 0.10)',
      obstacleFill: '#6b4a2b',
      obstacleStroke: '#2a1a0c',
      obstacleTop: '#8a6238',
      ambientEffect: 'leaves'
    },
    obstacles: [
      {
        id: 'ov1',
        x: 480,
        y: 300,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov2',
        x: 2300,
        y: 300,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov3',
        x: 600,
        y: 980,
        w: 110,
        h: 110,
        kind: 'tree'
      },
      {
        id: 'ov4',
        x: 2170,
        y: 980,
        w: 110,
        h: 110,
        kind: 'tree'
      },
      {
        id: 'ov5',
        x: 740,
        y: 440,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov6',
        x: 2040,
        y: 440,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov7',
        x: 960,
        y: 560,
        w: 150,
        h: 150,
        kind: 'ruin'
      },
      {
        id: 'ov8',
        x: 1770,
        y: 560,
        w: 150,
        h: 150,
        kind: 'ruin'
      },
      {
        id: 'ov9',
        x: 960,
        y: 220,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov10',
        x: 1820,
        y: 220,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov11',
        x: 1020,
        y: 1090,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov12',
        x: 1760,
        y: 1090,
        w: 100,
        h: 100,
        kind: 'tree'
      },
      {
        id: 'ov13',
        x: 440,
        y: 700,
        w: 80,
        h: 170,
        kind: 'ruin'
      },
      {
        id: 'ov14',
        x: 2360,
        y: 700,
        w: 80,
        h: 170,
        kind: 'ruin'
      },
      {
        id: 'ov15',
        x: 1200,
        y: 360,
        w: 90,
        h: 90,
        kind: 'tree'
      },
      {
        id: 'ov16',
        x: 1590,
        y: 360,
        w: 90,
        h: 90,
        kind: 'tree'
      },
      {
        id: 'ov17',
        x: 1200,
        y: 990,
        w: 90,
        h: 90,
        kind: 'tree'
      },
      {
        id: 'ov18',
        x: 1590,
        y: 990,
        w: 90,
        h: 90,
        kind: 'tree'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2640,
        y: 180
      },
      {
        x: 240,
        y: 1260
      },
      {
        x: 2640,
        y: 1260
      },
      {
        x: 1440,
        y: 168
      },
      {
        x: 1440,
        y: 1272
      },
      {
        x: 768,
        y: 720
      },
      {
        x: 2112,
        y: 720
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 192,
        y: 1008
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 368,
        y: 1224
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2512,
        y: 216
      },
      {
        x: 2512,
        y: 1224
      }
    ],
    redBase: {
      x: 224,
      y: 720,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 720,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 384
      },
      {
        x: 1440,
        y: 1056
      },
      {
        x: 832,
        y: 720
      },
      {
        x: 2048,
        y: 720
      },
      {
        x: 832,
        y: 216
      },
      {
        x: 2048,
        y: 1224
      },
      {
        x: 2048,
        y: 216
      },
      {
        x: 832,
        y: 1224
      }
    ],
    category: 'obstacle',
    beta: true,
    hazardSpec: {
      surfaces: [
        {
          kind: 'grass',
          count: [
            7,
            10
          ],
          rx: [
            110,
            220
          ],
          ry: [
            90,
            170
          ]
        }
      ]
    }
  },
  blastyard: {
    id: 'blastyard',
    name: 'Blast Yard',
    subtitle: 'Scrapyard rigged with demolition charges that go off at random',
    width: 2880,
    height: 1440,
    palette: {
      groundBase: '#4a4338',
      groundDetail: '#3e382f',
      groundAccent: '#5d5547',
      gridLine: 'rgba(255, 200, 120, 0.06)',
      obstacleFill: '#8a5a2b',
      obstacleStroke: '#241a0e',
      obstacleTop: '#b87a3a',
      ambientEffect: 'ash'
    },
    obstacles: [
      {
        id: 'bl1',
        x: 520,
        y: 260,
        w: 200,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl2',
        x: 2160,
        y: 260,
        w: 200,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl3',
        x: 520,
        y: 1100,
        w: 200,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl4',
        x: 2160,
        y: 1100,
        w: 200,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl5',
        x: 860,
        y: 430,
        w: 150,
        h: 100,
        kind: 'wreck'
      },
      {
        id: 'bl6',
        x: 1870,
        y: 430,
        w: 150,
        h: 100,
        kind: 'wreck'
      },
      {
        id: 'bl7',
        x: 860,
        y: 910,
        w: 150,
        h: 100,
        kind: 'wreck'
      },
      {
        id: 'bl8',
        x: 1870,
        y: 910,
        w: 150,
        h: 100,
        kind: 'wreck'
      },
      {
        id: 'bl9',
        x: 1080,
        y: 610,
        w: 90,
        h: 220,
        kind: 'machinery'
      },
      {
        id: 'bl10',
        x: 1710,
        y: 610,
        w: 90,
        h: 220,
        kind: 'machinery'
      },
      {
        id: 'bl11',
        x: 1180,
        y: 250,
        w: 170,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl12',
        x: 1530,
        y: 250,
        w: 170,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl13',
        x: 1180,
        y: 1110,
        w: 170,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl14',
        x: 1530,
        y: 1110,
        w: 170,
        h: 80,
        kind: 'container'
      },
      {
        id: 'bl15',
        x: 420,
        y: 620,
        w: 70,
        h: 200,
        kind: 'sandbag'
      },
      {
        id: 'bl16',
        x: 2390,
        y: 620,
        w: 70,
        h: 200,
        kind: 'sandbag'
      }
    ],
    ffaSpawns: [
      {
        x: 240,
        y: 180
      },
      {
        x: 2640,
        y: 180
      },
      {
        x: 240,
        y: 1260
      },
      {
        x: 2640,
        y: 1260
      },
      {
        x: 1440,
        y: 168
      },
      {
        x: 1440,
        y: 1272
      },
      {
        x: 768,
        y: 720
      },
      {
        x: 2112,
        y: 720
      }
    ],
    redSpawns: [
      {
        x: 192,
        y: 432
      },
      {
        x: 192,
        y: 1008
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 368,
        y: 1224
      }
    ],
    blueSpawns: [
      {
        x: 2688,
        y: 432
      },
      {
        x: 2688,
        y: 1008
      },
      {
        x: 2512,
        y: 216
      },
      {
        x: 2512,
        y: 1224
      }
    ],
    redBase: {
      x: 224,
      y: 720,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 720,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 384
      },
      {
        x: 1440,
        y: 1056
      },
      {
        x: 832,
        y: 720
      },
      {
        x: 2048,
        y: 720
      },
      {
        x: 832,
        y: 216
      },
      {
        x: 2048,
        y: 1224
      },
      {
        x: 2048,
        y: 216
      },
      {
        x: 832,
        y: 1224
      }
    ],
    category: 'obstacle',
    beta: true,
    hazardSpec: {
      bombs: true
    }
  }
};
