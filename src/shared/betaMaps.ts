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
        x: 559,
        y: 1031,
        w: 138,
        h: 108,
        kind: 'ruin'
      },
      {
        id: 'du2',
        x: 2201,
        y: 1036,
        w: 137,
        h: 102,
        kind: 'ruin'
      },
      {
        id: 'du3',
        x: 1364,
        y: 1154,
        w: 164,
        h: 78,
        kind: 'ruin'
      },
      {
        id: 'du4',
        x: 976,
        y: 201,
        w: 158,
        h: 77,
        kind: 'ruin'
      },
      {
        id: 'du5',
        x: 1764,
        y: 201,
        w: 156,
        h: 77,
        kind: 'ruin'
      },
      {
        id: 'du6',
        x: 1020,
        y: 577,
        w: 74,
        h: 155,
        kind: 'ruin'
      },
      {
        id: 'du7',
        x: 1804,
        y: 578,
        w: 73,
        h: 154,
        kind: 'ruin'
      },
      {
        id: 'du8',
        x: 499,
        y: 344,
        w: 117,
        h: 95,
        kind: 'ruin'
      },
      {
        id: 'du9',
        x: 2280,
        y: 345,
        w: 117,
        h: 94,
        kind: 'ruin'
      },
      {
        id: 'du10',
        x: 427,
        y: 660,
        w: 72,
        h: 143,
        kind: 'ruin'
      },
      {
        id: 'du11',
        x: 2389,
        y: 662,
        w: 73,
        h: 141,
        kind: 'ruin'
      },
      {
        id: 'du12',
        x: 1363,
        y: 236,
        w: 167,
        h: 55,
        kind: 'ruin'
      },
      {
        id: 'du13',
        x: 1081,
        y: 1104,
        w: 102,
        h: 83,
        kind: 'ruin'
      },
      {
        id: 'du14',
        x: 1714,
        y: 1109,
        w: 103,
        h: 78,
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
        id: 'glB',
        x: 2100,
        y: 140,
        w: 300,
        h: 200,
        kind: 'ice_wall'
      },
      {
        id: 'gl1',
        x: 2347,
        y: 400,
        w: 269,
        h: 156,
        kind: 'ice_wall'
      },
      {
        id: 'gl3',
        x: 1137,
        y: 635,
        w: 192,
        h: 145,
        kind: 'ice_wall'
      },
      {
        id: 'gl4',
        x: 1185,
        y: 541,
        w: 218,
        h: 107,
        kind: 'ice_wall'
      },
      {
        id: 'gl5',
        x: 1528,
        y: 509,
        w: 151,
        h: 129,
        kind: 'ice_wall'
      },
      {
        id: 'gl6',
        x: 1532,
        y: 791,
        w: 157,
        h: 121,
        kind: 'ice_wall'
      },
      {
        id: 'gl7',
        x: 986,
        y: 1169,
        w: 117,
        h: 127,
        kind: 'ice_wall'
      },
      {
        id: 'gl8',
        x: 2219,
        y: 416,
        w: 116,
        h: 114,
        kind: 'ice_wall'
      },
      {
        id: 'gl9',
        x: 169,
        y: 1310,
        w: 246,
        h: 51,
        kind: 'ice_wall'
      },
      {
        id: 'gl10',
        x: 364,
        y: 947,
        w: 121,
        h: 95,
        kind: 'ice_wall'
      },
      {
        id: 'gl11',
        x: 574,
        y: 1069,
        w: 104,
        h: 99,
        kind: 'ice_wall'
      },
      {
        id: 'gl12',
        x: 718,
        y: 450,
        w: 145,
        h: 71,
        kind: 'ice_wall'
      },
      {
        id: 'gl13',
        x: 1279,
        y: 772,
        w: 100,
        h: 96,
        kind: 'ice_wall'
      },
      {
        id: 'gl14',
        x: 819,
        y: 1062,
        w: 84,
        h: 100,
        kind: 'ice_wall'
      },
      {
        id: 'gl15',
        x: 489,
        y: 1258,
        w: 84,
        h: 84,
        kind: 'ice_wall'
      },
      {
        id: 'gl16',
        x: 1626,
        y: 145,
        w: 94,
        h: 65,
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
        w: 258,
        h: 232,
        kind: 'rock'
      },
      {
        id: 'ma2',
        x: 496,
        y: 923,
        w: 167,
        h: 205,
        kind: 'rock'
      },
      {
        id: 'ma6',
        x: 461,
        y: 371,
        w: 62,
        h: 77,
        kind: 'rock'
      },
      {
        id: 'maB',
        x: 1980,
        y: 980,
        w: 120,
        h: 70,
        kind: 'rock'
      },
      {
        id: 'maC',
        x: 1100,
        y: 980,
        w: 100,
        h: 90,
        kind: 'rock'
      },
      {
        id: 'maD',
        x: 1680,
        y: 420,
        w: 100,
        h: 90,
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
        id: 'stB',
        x: 1120,
        y: 120,
        w: 200,
        h: 280,
        kind: 'rock'
      },
      {
        id: 'stC',
        x: 430,
        y: 740,
        w: 260,
        h: 220,
        kind: 'rock'
      },
      {
        id: 'st3',
        x: 1499,
        y: 794,
        w: 114,
        h: 95,
        kind: 'rock'
      },
      {
        id: 'st4',
        x: 576,
        y: 285,
        w: 97,
        h: 77,
        kind: 'rock'
      },
      {
        id: 'st5',
        x: 1585,
        y: 459,
        w: 94,
        h: 71,
        kind: 'rock'
      },
      {
        id: 'st6',
        x: 780,
        y: 538,
        w: 78,
        h: 53,
        kind: 'rock'
      },
      {
        id: 'st7',
        x: 1981,
        y: 1101,
        w: 77,
        h: 49,
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
