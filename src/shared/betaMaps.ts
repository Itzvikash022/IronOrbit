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
        x: 974,
        y: 203,
        w: 145,
        h: 66,
        kind: 'ruin'
      },
      {
        id: 'du2',
        x: 1362,
        y: 895,
        w: 156,
        h: 39,
        kind: 'ruin'
      },
      {
        id: 'du3',
        x: 2196,
        y: 1083,
        w: 130,
        h: 49,
        kind: 'ruin'
      },
      {
        id: 'du4',
        x: 1012,
        y: 641,
        w: 73,
        h: 81,
        kind: 'ruin'
      },
      {
        id: 'du5',
        x: 1364,
        y: 548,
        w: 154,
        h: 40,
        kind: 'ruin'
      },
      {
        id: 'du6',
        x: 554,
        y: 1082,
        w: 131,
        h: 49,
        kind: 'ruin'
      },
      {
        id: 'du7',
        x: 1760,
        y: 237,
        w: 144,
        h: 34,
        kind: 'ruin'
      },
      {
        id: 'du8',
        x: 493,
        y: 386,
        w: 112,
        h: 46,
        kind: 'ruin'
      },
      {
        id: 'du9',
        x: 1795,
        y: 680,
        w: 73,
        h: 45,
        kind: 'ruin'
      },
      {
        id: 'du10',
        x: 1074,
        y: 1138,
        w: 99,
        h: 43,
        kind: 'ruin'
      },
      {
        id: 'du11',
        x: 1363,
        y: 234,
        w: 154,
        h: 49,
        kind: 'ruin'
      },
      {
        id: 'du12',
        x: 1708,
        y: 1162,
        w: 99,
        h: 32,
        kind: 'ruin'
      },
      {
        id: 'du13',
        x: 1795,
        y: 638,
        w: 73,
        h: 35,
        kind: 'ruin'
      },
      {
        id: 'du14',
        x: 2274,
        y: 383,
        w: 112,
        h: 32,
        kind: 'ruin'
      },
      {
        id: 'du15',
        x: 2274,
        y: 411,
        w: 112,
        h: 32,
        kind: 'ruin'
      },
      {
        id: 'du16',
        x: 437,
        y: 655,
        w: 54,
        h: 102,
        kind: 'ruin'
      },
      {
        id: 'du17',
        x: 2389,
        y: 644,
        w: 55,
        h: 63,
        kind: 'ruin'
      },
      {
        id: 'du18',
        x: 1369,
        y: 1155,
        w: 156,
        h: 79,
        kind: 'ruin'
      },
      {
        id: 'du19',
        x: 2399,
        y: 692,
        w: 46,
        h: 67,
        kind: 'ruin'
      },
      {
        id: 'du20',
        x: 1370,
        y: 596,
        w: 162,
        h: 32,
        kind: 'ruin'
      },
      {
        id: 'du21',
        x: 427,
        y: 779,
        w: 65,
        h: 32,
        kind: 'ruin'
      },
      {
        id: 'du22',
        x: 1748,
        y: 1136,
        w: 62,
        h: 32,
        kind: 'ruin'
      },
      {
        id: 'duC1',
        x: 1320,
        y: 620,
        w: 240,
        h: 70,
        kind: 'ruin'
      },
      {
        id: 'duC2',
        x: 1280,
        y: 690,
        w: 70,
        h: 90,
        kind: 'ruin'
      },
      {
        id: 'duC3',
        x: 1320,
        y: 820,
        w: 240,
        h: 70,
        kind: 'ruin'
      },
      {
        id: 'duC4',
        x: 1530,
        y: 760,
        w: 70,
        h: 90,
        kind: 'ruin'
      },
      {
        id: 'duP1',
        x: 1180,
        y: 700,
        w: 40,
        h: 70,
        kind: 'ruin'
      },
      {
        id: 'duP2',
        x: 1660,
        y: 700,
        w: 40,
        h: 70,
        kind: 'ruin'
      },
      {
        id: 'duTL',
        x: 520,
        y: 280,
        w: 130,
        h: 110,
        kind: 'ruin'
      },
      {
        id: 'duTR',
        x: 2230,
        y: 280,
        w: 130,
        h: 110,
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
        x: 1101,
        y: 509,
        w: 295,
        h: 260,
        kind: 'ice_wall'
      },
      {
        id: 'gl2',
        x: 1468,
        y: 489,
        w: 251,
        h: 156,
        kind: 'ice_wall'
      },
      {
        id: 'gl3',
        x: 1182,
        y: 772,
        w: 195,
        h: 113,
        kind: 'ice_wall'
      },
      {
        id: 'gl4',
        x: 1532,
        y: 785,
        w: 156,
        h: 139,
        kind: 'ice_wall'
      },
      {
        id: 'gl5',
        x: 672,
        y: 430,
        w: 185,
        h: 105,
        kind: 'ice_wall'
      },
      {
        id: 'gl6',
        x: 571,
        y: 1066,
        w: 111,
        h: 105,
        kind: 'ice_wall'
      },
      {
        id: 'gl7',
        x: 1394,
        y: 795,
        w: 94,
        h: 100,
        kind: 'ice_wall'
      },
      {
        id: 'gl8',
        x: 1694,
        y: 712,
        w: 85,
        h: 97,
        kind: 'ice_wall'
      },
      {
        id: 'gl9',
        x: 1623,
        y: 132,
        w: 107,
        h: 83,
        kind: 'ice_wall'
      },
      {
        id: 'gl10',
        x: 2324,
        y: 853,
        w: 86,
        h: 74,
        kind: 'ice_wall'
      },
      {
        id: 'gl11',
        x: 1011,
        y: 1058,
        w: 81,
        h: 68,
        kind: 'ice_wall'
      },
      {
        id: 'gl12',
        x: 473,
        y: 503,
        w: 77,
        h: 62,
        kind: 'ice_wall'
      },
      {
        id: 'gl13',
        x: 2119,
        y: 1242,
        w: 75,
        h: 65,
        kind: 'ice_wall'
      },
      {
        id: 'gl14',
        x: 523,
        y: 414,
        w: 75,
        h: 88,
        kind: 'ice_wall'
      },
      {
        id: 'gl15',
        x: 1039,
        y: 269,
        w: 70,
        h: 63,
        kind: 'ice_wall'
      },
      {
        id: 'gl16',
        x: 2202,
        y: 831,
        w: 61,
        h: 60,
        kind: 'ice_wall'
      },
      {
        id: 'gl17',
        x: 2125,
        y: 867,
        w: 61,
        h: 55,
        kind: 'ice_wall'
      },
      {
        id: 'gl18',
        x: 580,
        y: 525,
        w: 62,
        h: 46,
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
        x: 1292,
        y: 541,
        w: 240,
        h: 210,
        kind: 'rock'
      },
      {
        id: 'ma2',
        x: 496,
        y: 923,
        w: 160,
        h: 190,
        kind: 'rock'
      },
      {
        id: 'ma4',
        x: 1980,
        y: 980,
        w: 120,
        h: 70,
        kind: 'rock'
      },
      {
        id: 'ma5',
        x: 1100,
        y: 980,
        w: 100,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'ma6',
        x: 1680,
        y: 420,
        w: 100,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'ma7',
        x: 461,
        y: 371,
        w: 70,
        h: 80,
        kind: 'rock'
      },
      {
        id: 'ma8',
        x: 2360,
        y: 380,
        w: 140,
        h: 110,
        kind: 'rock'
      },
      {
        id: 'ma11',
        x: 1500,
        y: 200,
        w: 140,
        h: 70,
        kind: 'rock'
      },
      {
        id: 'ma12',
        x: 1900,
        y: 520,
        w: 100,
        h: 80,
        kind: 'rock'
      },
      {
        id: 'ma14',
        x: 2150,
        y: 250,
        w: 100,
        h: 70,
        kind: 'rock'
      },
      {
        id: 'maE',
        x: 2360,
        y: 380,
        w: 140,
        h: 110,
        kind: 'rock'
      },
      {
        id: 'maH',
        x: 1500,
        y: 200,
        w: 150,
        h: 80,
        kind: 'rock'
      },
      {
        id: 'maJ',
        x: 1900,
        y: 500,
        w: 100,
        h: 80,
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
        id: 'st2',
        x: 1120,
        y: 120,
        w: 200,
        h: 260,
        kind: 'rock'
      },
      {
        id: 'st3',
        x: 450,
        y: 760,
        w: 240,
        h: 200,
        kind: 'rock'
      },
      {
        id: 'st4',
        x: 1480,
        y: 1000,
        w: 260,
        h: 160,
        kind: 'rock'
      },
      {
        id: 'st5',
        x: 1501,
        y: 793,
        w: 119,
        h: 100,
        kind: 'rock'
      },
      {
        id: 'st6',
        x: 577,
        y: 284,
        w: 100,
        h: 84,
        kind: 'rock'
      },
      {
        id: 'st7',
        x: 1591,
        y: 458,
        w: 120,
        h: 80,
        kind: 'rock'
      },
      {
        id: 'st8',
        x: 780,
        y: 535,
        w: 89,
        h: 64,
        kind: 'rock'
      },
      {
        id: 'st9',
        x: 1978,
        y: 1098,
        w: 88,
        h: 61,
        kind: 'rock'
      },
      {
        id: 'st10',
        x: 2548,
        y: 337,
        w: 68,
        h: 59,
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
