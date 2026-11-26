// AUTO-GENERATED — terrain floors use custom terrain artwork (src/assets/images/terrain_*.jpg); obstacles synced to art.
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
        x: 960,
        y: 175,
        w: 178,
        h: 105,
        kind: 'ruin'
      },
      {
        id: 'du2',
        x: 1350,
        y: 205,
        w: 185,
        h: 87,
        kind: 'ruin'
      },
      {
        id: 'du3',
        x: 1750,
        y: 175,
        w: 175,
        h: 105,
        kind: 'ruin'
      },
      {
        id: 'du4',
        x: 485,
        y: 320,
        w: 135,
        h: 120,
        kind: 'ruin'
      },
      {
        id: 'du5',
        x: 2265,
        y: 320,
        w: 135,
        h: 120,
        kind: 'ruin'
      },
      {
        id: 'du6',
        x: 775,
        y: 445,
        w: 60,
        h: 130,
        kind: 'ruin'
      },
      {
        id: 'du7',
        x: 1350,
        y: 480,
        w: 170,
        h: 112,
        kind: 'ruin'
      },
      {
        id: 'du8',
        x: 1520,
        y: 452,
        w: 74,
        h: 140,
        kind: 'ruin'
      },
      {
        id: 'du9',
        x: 1005,
        y: 552,
        w: 93,
        h: 180,
        kind: 'ruin'
      },
      {
        id: 'du10',
        x: 1790,
        y: 552,
        w: 92,
        h: 180,
        kind: 'ruin'
      },
      {
        id: 'du11',
        x: 1350,
        y: 838,
        w: 188,
        h: 104,
        kind: 'ruin'
      },
      {
        id: 'du12',
        x: 1538,
        y: 816,
        w: 57,
        h: 126,
        kind: 'ruin'
      },
      {
        id: 'du13',
        x: 424,
        y: 636,
        w: 78,
        h: 168,
        kind: 'ruin'
      },
      {
        id: 'du14',
        x: 2386,
        y: 636,
        w: 78,
        h: 168,
        kind: 'ruin'
      },
      {
        id: 'du15',
        x: 545,
        y: 1012,
        w: 153,
        h: 130,
        kind: 'ruin'
      },
      {
        id: 'du16',
        x: 2188,
        y: 1012,
        w: 154,
        h: 130,
        kind: 'ruin'
      },
      {
        id: 'du17',
        x: 1065,
        y: 1080,
        w: 123,
        h: 112,
        kind: 'ruin'
      },
      {
        id: 'du18',
        x: 1700,
        y: 1080,
        w: 124,
        h: 112,
        kind: 'ruin'
      },
      {
        id: 'du19',
        x: 1350,
        y: 1132,
        w: 185,
        h: 102,
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
        x: 814,
        y: 98,
        w: 146,
        h: 112,
        kind: 'ice_wall'
      },
      {
        id: 'gl2',
        x: 658,
        y: 394,
        w: 212,
        h: 138,
        kind: 'ice_wall'
      },
      {
        id: 'gl3',
        x: 510,
        y: 386,
        w: 98,
        h: 120,
        kind: 'ice_wall'
      },
      {
        id: 'gl4',
        x: 464,
        y: 472,
        w: 88,
        h: 80,
        kind: 'ice_wall'
      },
      {
        id: 'gl5',
        x: 574,
        y: 492,
        w: 72,
        h: 78,
        kind: 'ice_wall'
      },
      {
        id: 'gl6',
        x: 1172,
        y: 464,
        w: 234,
        h: 184,
        kind: 'ice_wall'
      },
      {
        id: 'gl7',
        x: 1078,
        y: 586,
        w: 266,
        h: 196,
        kind: 'ice_wall'
      },
      {
        id: 'gl8',
        x: 1170,
        y: 760,
        w: 214,
        h: 138,
        kind: 'ice_wall'
      },
      {
        id: 'gl9',
        x: 1454,
        y: 456,
        w: 286,
        h: 210,
        kind: 'ice_wall'
      },
      {
        id: 'gl10',
        x: 1518,
        y: 752,
        w: 178,
        h: 182,
        kind: 'ice_wall'
      },
      {
        id: 'gl11',
        x: 1682,
        y: 696,
        w: 100,
        h: 128,
        kind: 'ice_wall'
      },
      {
        id: 'gl12',
        x: 1384,
        y: 742,
        w: 104,
        h: 162,
        kind: 'ice_wall'
      },
      {
        id: 'gl13',
        x: 1612,
        y: 92,
        w: 120,
        h: 124,
        kind: 'ice_wall'
      },
      {
        id: 'gl14',
        x: 1744,
        y: 72,
        w: 228,
        h: 258,
        kind: 'ice_wall'
      },
      {
        id: 'gl15',
        x: 1940,
        y: 60,
        w: 154,
        h: 344,
        kind: 'ice_wall'
      },
      {
        id: 'gl16',
        x: 2060,
        y: 50,
        w: 346,
        h: 338,
        kind: 'ice_wall'
      },
      {
        id: 'gl17',
        x: 2380,
        y: 92,
        w: 212,
        h: 208,
        kind: 'ice_wall'
      },
      {
        id: 'gl18',
        x: 2200,
        y: 386,
        w: 138,
        h: 144,
        kind: 'ice_wall'
      },
      {
        id: 'gl19',
        x: 2334,
        y: 282,
        w: 290,
        h: 282,
        kind: 'ice_wall'
      },
      {
        id: 'gl20',
        x: 2314,
        y: 822,
        w: 98,
        h: 124,
        kind: 'ice_wall'
      },
      {
        id: 'gl21',
        x: 2118,
        y: 808,
        w: 186,
        h: 150,
        kind: 'ice_wall'
      },
      {
        id: 'gl22',
        x: 204,
        y: 916,
        w: 292,
        h: 136,
        kind: 'ice_wall'
      },
      {
        id: 'gl23',
        x: 112,
        y: 1046,
        w: 460,
        h: 310,
        kind: 'ice_wall'
      },
      {
        id: 'gl24',
        x: 568,
        y: 1028,
        w: 120,
        h: 160,
        kind: 'ice_wall'
      },
      {
        id: 'gl25',
        x: 810,
        y: 1006,
        w: 336,
        h: 312,
        kind: 'ice_wall'
      },
      {
        id: 'gl26',
        x: 1906,
        y: 1152,
        w: 186,
        h: 140,
        kind: 'ice_wall'
      },
      {
        id: 'gl27',
        x: 2098,
        y: 1188,
        w: 104,
        h: 126,
        kind: 'ice_wall'
      },
      {
        id: 'gl28',
        x: 2588,
        y: 1152,
        w: 114,
        h: 116,
        kind: 'ice_wall'
      },
      {
        id: 'gl29',
        x: 982,
        y: 268,
        w: 140,
        h: 110,
        kind: 'ice_wall'
      },
      {
        id: 'gl30',
        x: 886,
        y: 236,
        w: 48,
        h: 50,
        kind: 'ice_wall'
      },
      {
        id: 'gl31',
        x: 1024,
        y: 196,
        w: 48,
        h: 52,
        kind: 'ice_wall'
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
        x: 78,
        y: 1303
      },
      {
        x: 2664,
        y: 1302
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
        x: 169,
        y: 1014
      },
      {
        x: 368,
        y: 216
      },
      {
        x: 609,
        y: 1236
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
        x: 2632,
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
        x: 854,
        y: 252
      },
      {
        x: 1958,
        y: 1119
      },
      {
        x: 1908,
        y: 365
      },
      {
        x: 772,
        y: 1234
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
        x: 528,
        y: 59,
        w: 133,
        h: 98,
        kind: 'rock'
      },
      {
        id: 'ma2',
        x: 363,
        y: 110,
        w: 70,
        h: 51,
        kind: 'rock'
      },
      {
        id: 'ma3',
        x: 1112,
        y: 45,
        w: 84,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'ma4',
        x: 1370,
        y: 53,
        w: 153,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma5',
        x: 1635,
        y: 16,
        w: 142,
        h: 150,
        kind: 'rock'
      },
      {
        id: 'ma6',
        x: 1948,
        y: 48,
        w: 87,
        h: 68,
        kind: 'rock'
      },
      {
        id: 'ma7',
        x: 2203,
        y: 31,
        w: 147,
        h: 135,
        kind: 'rock'
      },
      {
        id: 'ma8',
        x: 2731,
        y: 115,
        w: 82,
        h: 70,
        kind: 'rock'
      },
      {
        id: 'ma9',
        x: 804,
        y: 236,
        w: 144,
        h: 110,
        kind: 'rock'
      },
      {
        id: 'ma10',
        x: 1256,
        y: 259,
        w: 105,
        h: 110,
        kind: 'rock'
      },
      {
        id: 'ma11',
        x: 1652,
        y: 262,
        w: 175,
        h: 104,
        kind: 'rock'
      },
      {
        id: 'ma12',
        x: 1951,
        y: 278,
        w: 82,
        h: 82,
        kind: 'rock'
      },
      {
        id: 'ma13',
        x: 2709,
        y: 250,
        w: 105,
        h: 98,
        kind: 'rock'
      },
      {
        id: 'ma14',
        x: 275,
        y: 340,
        w: 122,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma15',
        x: 528,
        y: 391,
        w: 101,
        h: 104,
        kind: 'rock'
      },
      {
        id: 'ma16',
        x: 1112,
        y: 470,
        w: 76,
        h: 87,
        kind: 'rock'
      },
      {
        id: 'ma17',
        x: 598,
        y: 596,
        w: 90,
        h: 101,
        kind: 'rock'
      },
      {
        id: 'ma18',
        x: 270,
        y: 608,
        w: 90,
        h: 73,
        kind: 'rock'
      },
      {
        id: 'ma19',
        x: 264,
        y: 706,
        w: 82,
        h: 93,
        kind: 'rock'
      },
      {
        id: 'ma20',
        x: 58,
        y: 728,
        w: 70,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'ma21',
        x: 1039,
        y: 613,
        w: 144,
        h: 188,
        kind: 'rock'
      },
      {
        id: 'ma22',
        x: 1344,
        y: 556,
        w: 236,
        h: 314,
        kind: 'rock'
      },
      {
        id: 'ma23',
        x: 1272,
        y: 626,
        w: 374,
        h: 192,
        kind: 'rock'
      },
      {
        id: 'ma24',
        x: 1912,
        y: 610,
        w: 114,
        h: 101,
        kind: 'rock'
      },
      {
        id: 'ma25',
        x: 1903,
        y: 695,
        w: 116,
        h: 118,
        kind: 'rock'
      },
      {
        id: 'ma26',
        x: 2723,
        y: 678,
        w: 98,
        h: 98,
        kind: 'rock'
      },
      {
        id: 'ma27',
        x: 462,
        y: 932,
        w: 244,
        h: 294,
        kind: 'rock'
      },
      {
        id: 'ma28',
        x: 804,
        y: 1080,
        w: 139,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma29',
        x: 1307,
        y: 1066,
        w: 73,
        h: 84,
        kind: 'rock'
      },
      {
        id: 'ma30',
        x: 1635,
        y: 1066,
        w: 170,
        h: 107,
        kind: 'rock'
      },
      {
        id: 'ma31',
        x: 2124,
        y: 1080,
        w: 128,
        h: 127,
        kind: 'rock'
      },
      {
        id: 'ma32',
        x: 1830,
        y: 1207,
        w: 76,
        h: 84,
        kind: 'rock'
      },
      {
        id: 'ma33',
        x: 2644,
        y: 1150,
        w: 139,
        h: 155,
        kind: 'rock'
      },
      {
        id: 'ma34',
        x: 2146,
        y: 239,
        w: 133,
        h: 107,
        kind: 'rock'
      },
      {
        id: 'ma35',
        x: 2438,
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
        x: 2609,
        y: 1278
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
        x: 2064,
        y: 720
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
        x: 1114,
        y: 44,
        w: 232,
        h: 452,
        kind: 'rock'
      },
      {
        id: 'st2',
        x: 568,
        y: 274,
        w: 104,
        h: 92,
        kind: 'rock'
      },
      {
        id: 'st3',
        x: 778,
        y: 526,
        w: 84,
        h: 66,
        kind: 'rock'
      },
      {
        id: 'st4',
        x: 1510,
        y: 336,
        w: 72,
        h: 64,
        kind: 'rock'
      },
      {
        id: 'st5',
        x: 1574,
        y: 442,
        w: 112,
        h: 92,
        kind: 'rock'
      },
      {
        id: 'st6',
        x: 2540,
        y: 326,
        w: 78,
        h: 60,
        kind: 'rock'
      },
      {
        id: 'st7a',
        x: 456,
        y: 686,
        w: 234,
        h: 106,
        kind: 'rock'
      },
      {
        id: 'st7b',
        x: 414,
        y: 782,
        w: 324,
        h: 198,
        kind: 'rock'
      },
      {
        id: 'st8',
        x: 1492,
        y: 788,
        w: 120,
        h: 96,
        kind: 'rock'
      },
      {
        id: 'st9',
        x: 1440,
        y: 1022,
        w: 300,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'st10',
        x: 1384,
        y: 1090,
        w: 420,
        h: 200,
        kind: 'rock'
      },
      {
        id: 'st11',
        x: 1966,
        y: 1084,
        w: 96,
        h: 84,
        kind: 'rock'
      },
      {
        id: 'st12',
        x: 2100,
        y: 544,
        w: 460,
        h: 100,
        kind: 'rock'
      },
      {
        id: 'st13',
        x: 2030,
        y: 612,
        w: 584,
        h: 182,
        kind: 'rock'
      },
      {
        id: 'st14',
        x: 2206,
        y: 784,
        w: 136,
        h: 178,
        kind: 'rock'
      },
      {
        id: 'st15',
        x: 1122,
        y: 562,
        w: 52,
        h: 52,
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
        x: 1440,
        y: 1320
      },
      {
        x: 724,
        y: 700
      },
      {
        x: 2146,
        y: 828
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
      y: 880,
      radius: 68
    },
    blueBase: {
      x: 2656,
      y: 880,
      radius: 68
    },
    crateZones: [
      {
        x: 1440,
        y: 360
      },
      {
        x: 1398,
        y: 1056
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
        x: 890,
        y: 420,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se6',
        x: 1850,
        y: 420,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se7',
        x: 890,
        y: 860,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se8',
        x: 1850,
        y: 860,
        w: 140,
        h: 160,
        kind: 'bunker'
      },
      {
        id: 'se9',
        x: 1120,
        y: 180,
        w: 50,
        h: 210,
        kind: 'barrier'
      },
      {
        id: 'se10',
        x: 1710,
        y: 180,
        w: 50,
        h: 210,
        kind: 'barrier'
      },
      {
        id: 'se11',
        x: 1120,
        y: 1050,
        w: 50,
        h: 210,
        kind: 'barrier'
      },
      {
        id: 'se12',
        x: 1710,
        y: 1050,
        w: 50,
        h: 210,
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
        y: 635,
        w: 80,
        h: 170,
        kind: 'ruin'
      },
      {
        id: 'ov14',
        x: 2360,
        y: 635,
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
