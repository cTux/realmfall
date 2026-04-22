import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_PATH);
const OUTPUT_DIR = join(SCRIPT_DIR, '../src/assets/images/terrain');

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 1760;
const HEX_TOP_OFFSET = 240;
const SIDE_DEPTH = 160;
const TERRAIN_VARIANT_KEYS = ['a', 'b', 'c', 'd'];
const HEX_SIDE = 640;
const HEX_HALF_WIDTH = (HEX_SIDE * Math.sqrt(3)) / 2;
const FRONT_FACE_TOP_Y = HEX_TOP_OFFSET + 1040;

const TOP_HEX_POINTS = [
  [CANVAS_WIDTH / 2, HEX_TOP_OFFSET],
  [CANVAS_WIDTH / 2 + HEX_HALF_WIDTH, HEX_TOP_OFFSET + 320],
  [CANVAS_WIDTH / 2 + HEX_HALF_WIDTH, HEX_TOP_OFFSET + 960],
  [CANVAS_WIDTH / 2, HEX_TOP_OFFSET + 1280],
  [CANVAS_WIDTH / 2 - HEX_HALF_WIDTH, HEX_TOP_OFFSET + 960],
  [CANVAS_WIDTH / 2 - HEX_HALF_WIDTH, HEX_TOP_OFFSET + 320],
];
const TOP_HEX_POINT_STRING = pointList(TOP_HEX_POINTS);
const LEFT_FACE_POINT_STRING = pointList([
  TOP_HEX_POINTS[4],
  TOP_HEX_POINTS[3],
  [CANVAS_WIDTH / 2, HEX_TOP_OFFSET + 1280 + SIDE_DEPTH],
  [0, HEX_TOP_OFFSET + 960 + SIDE_DEPTH],
]);
const RIGHT_FACE_POINT_STRING = pointList([
  TOP_HEX_POINTS[3],
  TOP_HEX_POINTS[2],
  [CANVAS_WIDTH, HEX_TOP_OFFSET + 960 + SIDE_DEPTH],
  [CANVAS_WIDTH / 2, HEX_TOP_OFFSET + 1280 + SIDE_DEPTH],
]);
const FRONT_FACE_LEFT_TOP = pointAtY(
  TOP_HEX_POINTS[4],
  TOP_HEX_POINTS[3],
  FRONT_FACE_TOP_Y,
);
const FRONT_FACE_RIGHT_TOP = pointAtY(
  TOP_HEX_POINTS[2],
  TOP_HEX_POINTS[3],
  FRONT_FACE_TOP_Y,
);
const FRONT_FACE_POINT_STRING = pointList([
  FRONT_FACE_LEFT_TOP,
  TOP_HEX_POINTS[3],
  FRONT_FACE_RIGHT_TOP,
  [FRONT_FACE_RIGHT_TOP[0], FRONT_FACE_RIGHT_TOP[1] + SIDE_DEPTH],
  [CANVAS_WIDTH / 2, HEX_TOP_OFFSET + 1280 + SIDE_DEPTH],
  [FRONT_FACE_LEFT_TOP[0], FRONT_FACE_LEFT_TOP[1] + SIDE_DEPTH],
]);

const TERRAIN_STYLES = {
  badlands: {
    accent: '#ffd9af',
    base: '#cb7334',
    dark: '#823414',
    detailDark: '#54200f',
    detailLight: '#ffe4be',
    glow: '#ffe8c9',
    light: '#eea360',
    shadow: '#2c1209',
    sideDark: '#5a2410',
    sideLight: '#9e4d23',
    water: '#f6d5b0',
  },
  desert: {
    accent: '#f59e0b',
    base: '#f6ba2a',
    dark: '#d88c10',
    detailDark: '#9f5e11',
    detailLight: '#ffe9a8',
    glow: '#fff0c7',
    light: '#ffd863',
    shadow: '#5f2f11',
    sideDark: '#8b4e1d',
    sideLight: '#d98b32',
    water: '#f9e5a7',
  },
  forest: {
    accent: '#bef264',
    base: '#73be45',
    dark: '#2b6e26',
    detailDark: '#19461c',
    detailLight: '#d9f5ac',
    glow: '#e9f9bf',
    light: '#9ae565',
    shadow: '#10230f',
    sideDark: '#603715',
    sideLight: '#99642e',
    water: '#97d8ff',
  },
  highlands: {
    accent: '#cfe294',
    base: '#90a56d',
    dark: '#5d7248',
    detailDark: '#3d4b31',
    detailLight: '#eef3cd',
    glow: '#f5f7dd',
    light: '#bdca8f',
    shadow: '#202518',
    sideDark: '#5a391d',
    sideLight: '#8f6537',
    water: '#c7def1',
  },
  mountain: {
    accent: '#ffffff',
    base: '#8ea2a8',
    dark: '#5d7078',
    detailDark: '#39464d',
    detailLight: '#ffffff',
    glow: '#f8fafc',
    light: '#e1ebf0',
    shadow: '#253037',
    sideDark: '#533114',
    sideLight: '#8a5a30',
    water: '#d9eefc',
  },
  plains: {
    accent: '#d9f99d',
    base: '#8dc853',
    dark: '#5f9638',
    detailDark: '#3c5f28',
    detailLight: '#effbc6',
    glow: '#f4fbcc',
    light: '#b9e47b',
    shadow: '#23361a',
    sideDark: '#603817',
    sideLight: '#9f6a34',
    water: '#bdeafe',
  },
  rift: {
    accent: '#fb923c',
    base: '#46525f',
    dark: '#222831',
    detailDark: '#0f1218',
    detailLight: '#ff9b5b',
    glow: '#f97316',
    light: '#7e8b98',
    shadow: '#08090c',
    sideDark: '#3b0f11',
    sideLight: '#7b3324',
    water: '#ffb26c',
  },
  swamp: {
    accent: '#a7f3d0',
    base: '#567b41',
    dark: '#2a4b2c',
    detailDark: '#18311d',
    detailLight: '#dff4ba',
    glow: '#c9ffd8',
    light: '#94b865',
    shadow: '#122117',
    sideDark: '#4b2d19',
    sideLight: '#7d5431',
    water: '#57a3ad',
  },
  tundra: {
    accent: '#f8fdff',
    base: '#95b6c8',
    dark: '#617e93',
    detailDark: '#365065',
    detailLight: '#ffffff',
    glow: '#eefaff',
    light: '#d8eef9',
    shadow: '#1b2834',
    sideDark: '#47586b',
    sideLight: '#7c94a6',
    water: '#89d5f4',
  },
};

export const TERRAIN_ART_ASSET_DEFINITIONS = Object.freeze(
  Object.entries(TERRAIN_STYLES).flatMap(([terrain]) =>
    TERRAIN_VARIANT_KEYS.map((variantKey) => ({
      fileName: `${terrain}-v3-${variantKey}.svg`,
      terrain,
      variantKey,
    })),
  ),
);

export function buildTerrainArtSvg(terrain, variantKey) {
  const style = TERRAIN_STYLES[terrain];
  if (!style) {
    throw new Error(`Unsupported terrain art terrain: ${terrain}`);
  }

  const seed = `${terrain}:${variantKey}:terrain-art`;
  const rng = createRng(seed);
  const prefix = `${terrain}-${variantKey}`.replace(/[^a-z0-9-]/gi, '-');
  const props = buildTerrainProps(terrain, style, rng);
  const texture = buildGroundTexture(style, rng);
  const contours = buildContourBands(style, rng);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}">`,
    '<defs>',
    `  <clipPath id="${prefix}-clip-top">`,
    `    <polygon points="${TOP_HEX_POINT_STRING}" />`,
    '  </clipPath>',
    `  <linearGradient id="${prefix}-top-gradient" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `    <stop offset="0%" stop-color="${style.light}" />`,
    `    <stop offset="58%" stop-color="${style.base}" />`,
    `    <stop offset="100%" stop-color="${style.dark}" />`,
    '  </linearGradient>',
    `  <linearGradient id="${prefix}-left-face" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `    <stop offset="0%" stop-color="${style.sideLight}" />`,
    `    <stop offset="100%" stop-color="${style.sideDark}" />`,
    '  </linearGradient>',
    `  <linearGradient id="${prefix}-right-face" x1="100%" y1="0%" x2="0%" y2="100%">`,
    `    <stop offset="0%" stop-color="${style.sideLight}" />`,
    `    <stop offset="100%" stop-color="${style.sideDark}" />`,
    '  </linearGradient>',
    `  <linearGradient id="${prefix}-front-face" x1="50%" y1="0%" x2="50%" y2="100%">`,
    `    <stop offset="0%" stop-color="${style.sideLight}" />`,
    `    <stop offset="100%" stop-color="${style.sideDark}" />`,
    '  </linearGradient>',
    `  <filter id="${prefix}-platform-shadow" x="-20%" y="-20%" width="140%" height="190%">`,
    `    <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="${style.shadow}" flood-opacity="0.42" />`,
    '  </filter>',
    `  <filter id="${prefix}-overhang-shadow" x="-30%" y="-30%" width="160%" height="220%">`,
    `    <feDropShadow dx="0" dy="30" stdDeviation="24" flood-color="${style.shadow}" flood-opacity="0.5" />`,
    '  </filter>',
    props.defs,
    '</defs>',
    `  <ellipse cx="640" cy="1676" rx="396" ry="70" fill="${style.shadow}" opacity="0.18" />`,
    `  <g filter="url(#${prefix}-platform-shadow)">`,
    `    <polygon points="${LEFT_FACE_POINT_STRING}" fill="url(#${prefix}-left-face)" opacity="0.98" />`,
    `    <polygon points="${RIGHT_FACE_POINT_STRING}" fill="url(#${prefix}-right-face)" opacity="0.98" />`,
    `    <polygon points="${FRONT_FACE_POINT_STRING}" fill="url(#${prefix}-front-face)" opacity="0.94" />`,
    '  </g>',
    `  <g clip-path="url(#${prefix}-clip-top)">`,
    `    <polygon points="${TOP_HEX_POINT_STRING}" fill="url(#${prefix}-top-gradient)" />`,
    texture,
    props.surface,
    contours,
    '  </g>',
    `  <g filter="url(#${prefix}-overhang-shadow)">`,
    props.overlap,
    '  </g>',
    `  <polygon points="${TOP_HEX_POINT_STRING}" fill="none" stroke="${style.detailDark}" stroke-opacity="0.16" stroke-width="10" />`,
    `  <path d="M96 1236 Q640 1560 1184 1236" fill="none" stroke="${style.glow}" stroke-opacity="0.16" stroke-width="18" />`,
    `  <path d="M160 1216 Q640 1468 1120 1216" fill="none" stroke="${style.shadow}" stroke-opacity="0.14" stroke-width="10" />`,
    '</svg>',
  ].join('\n');
}

export function writeTerrainArtFiles(outputDir = OUTPUT_DIR) {
  mkdirSync(outputDir, { recursive: true });

  for (const definition of TERRAIN_ART_ASSET_DEFINITIONS) {
    const svg = buildTerrainArtSvg(definition.terrain, definition.variantKey);
    writeFileSync(join(outputDir, definition.fileName), `${svg}\n`);
  }
}

function buildGroundTexture(style, rng) {
  const shapes = [];

  for (let index = 0; index < 12; index += 1) {
    const x = round(randomBetween(rng, 96, 1184), 1);
    const y = round(randomBetween(rng, 430, 1390), 1);
    const radiusX = round(randomBetween(rng, 54, 150), 1);
    const radiusY = round(randomBetween(rng, 16, 44), 1);
    const rotation = round(randomBetween(rng, -34, 34), 1);
    const fill = rng() > 0.58 ? style.detailDark : style.detailLight;
    const opacity = round(randomBetween(rng, 0.04, 0.12), 3);
    shapes.push(
      `    <ellipse cx="${x}" cy="${y}" rx="${radiusX}" ry="${radiusY}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotation} ${x} ${y})" />`,
    );
  }

  for (let index = 0; index < 16; index += 1) {
    const x = round(randomBetween(rng, 92, 1188), 1);
    const y = round(randomBetween(rng, 420, 1410), 1);
    const radius = round(randomBetween(rng, 6, 16), 1);
    const fill = rng() > 0.55 ? style.detailLight : style.detailDark;
    const opacity = round(randomBetween(rng, 0.08, 0.18), 3);
    shapes.push(
      `    <circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" opacity="${opacity}" />`,
    );
  }

  return shapes.join('\n');
}

function buildContourBands(style, rng) {
  const bands = [];

  for (let index = 0; index < 4; index += 1) {
    const left = round(randomBetween(rng, 60, 220), 1);
    const right = round(randomBetween(rng, 1040, 1220), 1);
    const y = round(randomBetween(rng, 500, 1180), 1);
    const controlY = round(y - randomBetween(rng, 32, 84), 1);
    const opacity = round(randomBetween(rng, 0.05, 0.1), 3);
    bands.push(
      `    <path d="M ${left} ${y} Q 640 ${controlY} ${right} ${y}" fill="none" stroke="${style.glow}" stroke-opacity="${opacity}" stroke-width="22" stroke-linecap="round" />`,
    );
  }

  return bands.join('\n');
}

function buildTerrainProps(terrain, style, rng) {
  switch (terrain) {
    case 'badlands':
      return buildBadlandsProps(style, rng);
    case 'desert':
      return buildDesertProps(style, rng);
    case 'forest':
      return buildForestProps(style, rng);
    case 'highlands':
      return buildHighlandsProps(style, rng);
    case 'mountain':
      return buildMountainProps(style, rng);
    case 'plains':
      return buildPlainsProps(style, rng);
    case 'rift':
      return buildRiftProps(style, rng);
    case 'swamp':
      return buildSwampProps(style, rng);
    case 'tundra':
      return buildTundraProps(style, rng);
    default:
      return { defs: '', overlap: '', surface: '' };
  }
}

function buildPlainsProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 4; index += 1) {
    const x = round(randomBetween(rng, 180, 1100), 1);
    const y = round(randomBetween(rng, 720, 1220), 1);
    surface.push(
      `    <ellipse cx="${x}" cy="${y}" rx="${round(randomBetween(rng, 160, 250), 1)}" ry="${round(randomBetween(rng, 58, 100), 1)}" fill="${style.dark}" opacity="0.16" />`,
    );
  }

  for (let index = 0; index < 18; index += 1) {
    surface.push(
      ...buildGrassTuft(style, {
        baseY: round(randomBetween(rng, 540, 1320), 1),
        height: round(randomBetween(rng, 30, 66), 1),
        x: round(randomBetween(rng, 80, 1200), 1),
      }),
    );
  }

  for (let index = 0; index < 3; index += 1) {
    const clusterX = round(260 + index * 280 + randomBetween(rng, -40, 40), 1);
    const clusterBaseY = round(randomBetween(rng, 520, 760), 1);
    overlap.push(
      ...buildRoundTree(style, {
        baseY: clusterBaseY,
        canopyRadius: round(randomBetween(rng, 52, 74), 1),
        trunkHeight: round(randomBetween(rng, 170, 220), 1),
        x: clusterX,
      }),
      ...buildRoundTree(style, {
        baseY: clusterBaseY + randomBetween(rng, 32, 70),
        canopyRadius: round(randomBetween(rng, 40, 58), 1),
        trunkHeight: round(randomBetween(rng, 130, 180), 1),
        x: round(clusterX + randomBetween(rng, 56, 96), 1),
      }),
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildForestProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 8; index += 1) {
    surface.push(
      `    <ellipse cx="${round(randomBetween(rng, 120, 1160), 1)}" cy="${round(randomBetween(rng, 740, 1260), 1)}" rx="${round(randomBetween(rng, 44, 90), 1)}" ry="${round(randomBetween(rng, 16, 34), 1)}" fill="${style.detailDark}" opacity="0.2" />`,
    );
  }

  for (let index = 0; index < 3; index += 1) {
    const clusterBaseX = round(
      240 + index * 320 + randomBetween(rng, -44, 44),
      1,
    );
    const clusterBaseY = round(randomBetween(rng, 560, 820), 1);
    for (let treeIndex = 0; treeIndex < 3; treeIndex += 1) {
      overlap.push(
        ...buildPineTree(style, {
          baseY: clusterBaseY + treeIndex * 34 + randomBetween(rng, -18, 18),
          height: round(randomBetween(rng, 220, 340), 1),
          width: round(randomBetween(rng, 110, 170), 1),
          x: round(
            clusterBaseX + treeIndex * 52 + randomBetween(rng, -22, 22),
            1,
          ),
        }),
      );
    }
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildTundraProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 5; index += 1) {
    surface.push(
      ...buildSnowDrift(style, {
        rx: round(randomBetween(rng, 90, 180), 1),
        ry: round(randomBetween(rng, 26, 58), 1),
        x: round(randomBetween(rng, 150, 1130), 1),
        y: round(randomBetween(rng, 700, 1260), 1),
      }),
    );
  }

  for (let index = 0; index < 2; index += 1) {
    surface.push(
      ...buildWaterPool(style, {
        rx: round(randomBetween(rng, 82, 118), 1),
        ry: round(randomBetween(rng, 30, 46), 1),
        x: round(randomBetween(rng, 260, 1020), 1),
        y: round(randomBetween(rng, 860, 1180), 1),
      }),
    );
  }

  for (let index = 0; index < 3; index += 1) {
    const x = round(280 + index * 260 + randomBetween(rng, -40, 40), 1);
    const baseY = round(randomBetween(rng, 560, 820), 1);
    overlap.push(
      ...buildPineTree(style, {
        baseY,
        height: round(randomBetween(rng, 220, 310), 1),
        snowCapOpacity: 0.9,
        width: round(randomBetween(rng, 100, 150), 1),
        x,
      }),
      ...buildIceShard(style, {
        baseY: baseY + randomBetween(rng, 18, 64),
        height: round(randomBetween(rng, 160, 220), 1),
        width: round(randomBetween(rng, 42, 64), 1),
        x: round(x + randomBetween(rng, 58, 94), 1),
      }),
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildHighlandsProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 4; index += 1) {
    const startX = round(randomBetween(rng, 100, 1040), 1);
    const width = round(randomBetween(rng, 180, 280), 1);
    const startY = round(randomBetween(rng, 700, 1220), 1);
    surface.push(
      `    <path d="M ${startX} ${startY} Q ${round(startX + width * 0.5, 1)} ${round(startY - randomBetween(rng, 40, 80), 1)} ${round(startX + width, 1)} ${startY}" fill="none" stroke="${style.detailDark}" stroke-opacity="0.24" stroke-width="28" stroke-linecap="round" />`,
    );
  }

  for (let index = 0; index < 3; index += 1) {
    const x = round(280 + index * 300 + randomBetween(rng, -56, 56), 1);
    const baseY = round(randomBetween(rng, 620, 860), 1);
    overlap.push(
      ...buildMesa(style, {
        baseY,
        height: round(randomBetween(rng, 170, 260), 1),
        width: round(randomBetween(rng, 180, 260), 1),
        x,
      }),
      ...buildPineTree(style, {
        baseY: round(baseY + randomBetween(rng, 24, 72), 1),
        height: round(randomBetween(rng, 170, 250), 1),
        width: round(randomBetween(rng, 84, 124), 1),
        x: round(x + randomBetween(rng, -54, 54), 1),
      }),
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildBadlandsProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 5; index += 1) {
    const startX = round(randomBetween(rng, 120, 1060), 1);
    const width = round(randomBetween(rng, 140, 260), 1);
    const startY = round(randomBetween(rng, 720, 1260), 1);
    surface.push(
      `    <path d="M ${startX} ${startY} Q ${round(startX + width * 0.45, 1)} ${round(startY - randomBetween(rng, 28, 64), 1)} ${round(startX + width, 1)} ${startY}" fill="none" stroke="${style.detailLight}" stroke-opacity="0.22" stroke-width="22" stroke-linecap="round" />`,
    );
  }

  for (let index = 0; index < 4; index += 1) {
    overlap.push(
      ...buildRockSpire(style, {
        baseY: round(randomBetween(rng, 600, 860), 1),
        height: round(randomBetween(rng, 220, 340), 1),
        width: round(randomBetween(rng, 90, 146), 1),
        x: round(200 + index * 220 + randomBetween(rng, -46, 46), 1),
      }),
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildMountainProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 8; index += 1) {
    const x = round(randomBetween(rng, 120, 1160), 1);
    const y = round(randomBetween(rng, 820, 1290), 1);
    const radius = round(randomBetween(rng, 20, 44), 1);
    surface.push(
      `    <circle cx="${x}" cy="${y}" r="${radius}" fill="${style.detailDark}" opacity="0.24" />`,
      `    <circle cx="${round(x - radius * 0.24, 1)}" cy="${round(y - radius * 0.28, 1)}" r="${round(radius * 0.48, 1)}" fill="${style.detailLight}" opacity="0.2" />`,
    );
  }

  for (let index = 0; index < 3; index += 1) {
    overlap.push(
      ...buildMountainPeak(style, {
        baseY: round(randomBetween(rng, 760, 980), 1),
        height: round(randomBetween(rng, 380, 600), 1),
        width: round(randomBetween(rng, 260, 360), 1),
        x: round(300 + index * 320 + randomBetween(rng, -44, 44), 1),
      }),
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildDesertProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 7; index += 1) {
    const startX = round(randomBetween(rng, 90, 980), 1);
    const width = round(randomBetween(rng, 140, 280), 1);
    const startY = round(randomBetween(rng, 620, 1260), 1);
    surface.push(
      `    <path d="M ${startX} ${startY} Q ${round(startX + width * 0.5, 1)} ${round(startY - randomBetween(rng, 40, 86), 1)} ${round(startX + width, 1)} ${startY}" fill="none" stroke="${style.detailLight}" stroke-opacity="0.32" stroke-width="28" stroke-linecap="round" />`,
    );
  }

  for (let index = 0; index < 2; index += 1) {
    const x = round(360 + index * 340 + randomBetween(rng, -40, 40), 1);
    const baseY = round(randomBetween(rng, 640, 860), 1);
    overlap.push(
      ...buildMesa(style, {
        baseY,
        height: round(randomBetween(rng, 180, 260), 1),
        width: round(randomBetween(rng, 200, 280), 1),
        x,
      }),
      ...buildCactus(style, {
        baseY: round(baseY + randomBetween(rng, 50, 110), 1),
        height: round(randomBetween(rng, 110, 160), 1),
        x: round(x + randomBetween(rng, -74, 74), 1),
      }),
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildSwampProps(style, rng) {
  const surface = [];
  const overlap = [];

  for (let index = 0; index < 3; index += 1) {
    surface.push(
      ...buildWaterPool(style, {
        rx: round(randomBetween(rng, 90, 150), 1),
        ry: round(randomBetween(rng, 34, 56), 1),
        x: round(randomBetween(rng, 220, 1060), 1),
        y: round(randomBetween(rng, 860, 1180), 1),
      }),
    );
  }

  for (let index = 0; index < 16; index += 1) {
    surface.push(
      ...buildReedCluster(style, {
        baseY: round(randomBetween(rng, 640, 1320), 1),
        count: 3,
        height: round(randomBetween(rng, 28, 62), 1),
        x: round(randomBetween(rng, 80, 1200), 1),
      }),
    );
  }

  for (let index = 0; index < 3; index += 1) {
    const x = round(260 + index * 290 + randomBetween(rng, -42, 42), 1);
    const baseY = round(randomBetween(rng, 600, 860), 1);
    overlap.push(
      ...buildSwampTree(style, {
        baseY,
        crownRadius: round(randomBetween(rng, 48, 76), 1),
        trunkHeight: round(randomBetween(rng, 190, 260), 1),
        x,
      }),
    );
  }

  overlap.push(
    ...buildFogBank(style, {
      opacity: 0.12,
      rx: 220,
      ry: 48,
      x: 440,
      y: 560,
    }),
    ...buildFogBank(style, {
      opacity: 0.1,
      rx: 260,
      ry: 56,
      x: 820,
      y: 620,
    }),
  );

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildRiftProps(style, rng) {
  const surface = [];
  const overlap = [];

  surface.push(
    `    <path d="M 140 920 Q 320 760 468 806 T 786 730 T 1140 884" fill="none" stroke="${style.glow}" stroke-opacity="0.54" stroke-width="58" stroke-linecap="round" />`,
    `    <path d="M 140 920 Q 320 760 468 806 T 786 730 T 1140 884" fill="none" stroke="${style.detailDark}" stroke-width="28" stroke-linecap="round" />`,
  );

  for (let index = 0; index < 5; index += 1) {
    overlap.push(
      ...buildCrystalSpire(style, {
        baseY: round(randomBetween(rng, 520, 860), 1),
        height: round(randomBetween(rng, 240, 400), 1),
        width: round(randomBetween(rng, 64, 110), 1),
        x: round(180 + index * 200 + randomBetween(rng, -38, 38), 1),
      }),
    );
  }

  for (let index = 0; index < 7; index += 1) {
    const x = round(randomBetween(rng, 140, 1140), 1);
    const y = round(randomBetween(rng, 620, 1260), 1);
    surface.push(
      `    <circle cx="${x}" cy="${y}" r="${round(randomBetween(rng, 16, 40), 1)}" fill="${style.glow}" opacity="${round(randomBetween(rng, 0.08, 0.18), 3)}" />`,
    );
  }

  return { defs: '', overlap: overlap.join('\n'), surface: surface.join('\n') };
}

function buildRoundTree(style, options) {
  const { baseY, canopyRadius, trunkHeight, x } = options;
  const canopyY = round(baseY - trunkHeight, 1);
  return [
    `    <path d="M ${x} ${baseY} C ${round(x - 10, 1)} ${round(baseY - trunkHeight * 0.36, 1)} ${round(x + 10, 1)} ${round(baseY - trunkHeight * 0.76, 1)} ${x} ${canopyY}" fill="none" stroke="${style.detailDark}" stroke-width="16" stroke-linecap="round" opacity="0.72" />`,
    `    <circle cx="${x}" cy="${canopyY}" r="${canopyRadius}" fill="${style.dark}" />`,
    `    <circle cx="${round(x - canopyRadius * 0.54, 1)}" cy="${round(canopyY + canopyRadius * 0.18, 1)}" r="${round(canopyRadius * 0.68, 1)}" fill="${style.base}" />`,
    `    <circle cx="${round(x + canopyRadius * 0.52, 1)}" cy="${round(canopyY + canopyRadius * 0.22, 1)}" r="${round(canopyRadius * 0.58, 1)}" fill="${style.detailLight}" opacity="0.9" />`,
  ];
}

function buildPineTree(style, options) {
  const { baseY, height, snowCapOpacity = 0, width, x } = options;
  const topY = round(baseY - height, 1);
  const upperMidY = round(baseY - height * 0.68, 1);
  const lowerMidY = round(baseY - height * 0.42, 1);
  return [
    `    <path d="M ${x} ${baseY} L ${round(x, 1)} ${round(baseY - height * 0.22, 1)}" fill="none" stroke="${style.detailDark}" stroke-width="18" stroke-linecap="round" opacity="0.74" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.22, 1), lowerMidY],
      [x, topY],
      [round(x + width * 0.22, 1), lowerMidY],
    ])}" fill="${style.dark}" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.34, 1), round(baseY - height * 0.24, 1)],
      [x, upperMidY],
      [round(x + width * 0.34, 1), round(baseY - height * 0.24, 1)],
    ])}" fill="${style.base}" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.46, 1), baseY],
      [x, lowerMidY],
      [round(x + width * 0.46, 1), baseY],
    ])}" fill="${style.light}" opacity="0.92" />`,
    snowCapOpacity > 0
      ? `    <polygon points="${pointList([
          [round(x - width * 0.1, 1), round(topY + height * 0.14, 1)],
          [x, topY],
          [round(x + width * 0.11, 1), round(topY + height * 0.15, 1)],
        ])}" fill="${style.detailLight}" opacity="${snowCapOpacity}" />`
      : '',
  ].filter(Boolean);
}

function buildSnowDrift(style, options) {
  const { rx, ry, x, y } = options;
  return [
    `    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${style.detailLight}" opacity="0.88" />`,
    `    <ellipse cx="${round(x - rx * 0.18, 1)}" cy="${round(y - ry * 0.1, 1)}" rx="${round(rx * 0.46, 1)}" ry="${round(ry * 0.34, 1)}" fill="${style.glow}" opacity="0.34" />`,
  ];
}

function buildWaterPool(style, options) {
  const { rx, ry, x, y } = options;
  return [
    `    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${style.water}" opacity="0.86" />`,
    `    <ellipse cx="${round(x - rx * 0.16, 1)}" cy="${round(y - ry * 0.12, 1)}" rx="${round(rx * 0.46, 1)}" ry="${round(ry * 0.34, 1)}" fill="${style.detailLight}" opacity="0.24" />`,
  ];
}

function buildMesa(style, options) {
  const { baseY, height, width, x } = options;
  const leftX = round(x - width / 2, 1);
  const rightX = round(x + width / 2, 1);
  const topY = round(baseY - height, 1);
  return [
    `    <polygon points="${pointList([
      [leftX, baseY],
      [round(x - width * 0.2, 1), topY],
      [round(x + width * 0.26, 1), round(topY + height * 0.08, 1)],
      [rightX, baseY],
    ])}" fill="${style.dark}" />`,
    `    <polygon points="${pointList([
      [leftX, baseY],
      [round(x - width * 0.18, 1), topY],
      [x, round(baseY - height * 0.18, 1)],
    ])}" fill="${style.base}" opacity="0.84" />`,
    `    <path d="M ${round(x - width * 0.28, 1)} ${round(topY + height * 0.1, 1)} L ${round(x + width * 0.2, 1)} ${round(topY + height * 0.1, 1)}" fill="none" stroke="${style.detailLight}" stroke-opacity="0.4" stroke-width="12" stroke-linecap="round" />`,
  ];
}

function buildRockSpire(style, options) {
  const { baseY, height, width, x } = options;
  return [
    `    <polygon points="${pointList([
      [round(x - width * 0.44, 1), baseY],
      [round(x - width * 0.18, 1), round(baseY - height * 0.72, 1)],
      [round(x, 1), round(baseY - height, 1)],
      [round(x + width * 0.18, 1), round(baseY - height * 0.56, 1)],
      [round(x + width * 0.4, 1), baseY],
    ])}" fill="${style.dark}" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.18, 1), round(baseY - height * 0.72, 1)],
      [round(x, 1), round(baseY - height, 1)],
      [round(x + width * 0.08, 1), round(baseY - height * 0.46, 1)],
    ])}" fill="${style.detailLight}" opacity="0.78" />`,
  ];
}

function buildMountainPeak(style, options) {
  const { baseY, height, width, x } = options;
  const leftX = round(x - width / 2, 1);
  const rightX = round(x + width / 2, 1);
  const peakY = round(baseY - height, 1);
  return [
    `    <polygon points="${pointList([
      [leftX, baseY],
      [x, peakY],
      [rightX, baseY],
    ])}" fill="${style.dark}" />`,
    `    <polygon points="${pointList([
      [leftX, baseY],
      [x, peakY],
      [x, baseY],
    ])}" fill="${style.base}" opacity="0.92" />`,
    `    <polygon points="${pointList([
      [x, peakY],
      [rightX, baseY],
      [round(x + width * 0.06, 1), round(baseY - height * 0.2, 1)],
    ])}" fill="${style.light}" opacity="0.9" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.1, 1), round(peakY + height * 0.16, 1)],
      [x, peakY],
      [round(x + width * 0.12, 1), round(peakY + height * 0.18, 1)],
    ])}" fill="${style.detailLight}" opacity="0.96" />`,
  ];
}

function buildCactus(style, options) {
  const { baseY, height, x } = options;
  const armHeight = round(height * 0.44, 1);
  return [
    `    <path d="M ${x} ${baseY} L ${x} ${round(baseY - height, 1)}" fill="none" stroke="${style.detailDark}" stroke-width="18" stroke-linecap="round" />`,
    `    <path d="M ${x} ${round(baseY - height * 0.56, 1)} L ${round(x - 38, 1)} ${round(baseY - height * 0.76, 1)}" fill="none" stroke="${style.detailDark}" stroke-width="14" stroke-linecap="round" />`,
    `    <path d="M ${x} ${round(baseY - height * 0.42, 1)} L ${round(x + 34, 1)} ${round(baseY - height * 0.6, 1)}" fill="none" stroke="${style.detailDark}" stroke-width="14" stroke-linecap="round" />`,
    `    <path d="M ${x} ${baseY} L ${x} ${round(baseY - height, 1)}" fill="none" stroke="${style.base}" stroke-width="12" stroke-linecap="round" opacity="0.94" />`,
    `    <path d="M ${x} ${round(baseY - height * 0.56, 1)} L ${round(x - 38, 1)} ${round(baseY - height * 0.76, 1)}" fill="none" stroke="${style.base}" stroke-width="9" stroke-linecap="round" opacity="0.92" />`,
    `    <path d="M ${x} ${round(baseY - height * 0.42, 1)} L ${round(x + 34, 1)} ${round(baseY - height * 0.6, 1)}" fill="none" stroke="${style.base}" stroke-width="9" stroke-linecap="round" opacity="0.92" />`,
    `    <circle cx="${x}" cy="${round(baseY - height, 1)}" r="${round(Math.max(8, armHeight * 0.12), 1)}" fill="${style.detailLight}" opacity="0.7" />`,
  ];
}

function buildGrassTuft(style, options) {
  const { baseY, height, x } = options;
  return [
    `    <path d="M ${x} ${baseY} L ${round(x - 8, 1)} ${round(baseY - height, 1)}" fill="none" stroke="${style.detailDark}" stroke-opacity="0.34" stroke-width="6" stroke-linecap="round" />`,
    `    <path d="M ${x} ${baseY} L ${x} ${round(baseY - height * 0.86, 1)}" fill="none" stroke="${style.base}" stroke-opacity="0.56" stroke-width="6" stroke-linecap="round" />`,
    `    <path d="M ${x} ${baseY} L ${round(x + 8, 1)} ${round(baseY - height * 0.92, 1)}" fill="none" stroke="${style.detailLight}" stroke-opacity="0.38" stroke-width="5" stroke-linecap="round" />`,
  ];
}

function buildReedCluster(style, options) {
  const { baseY, count, height, x } = options;
  const reeds = [];
  for (let index = 0; index < count; index += 1) {
    const offsetX = round((index - (count - 1) / 2) * 8, 1);
    reeds.push(
      `    <path d="M ${round(x + offsetX, 1)} ${baseY} L ${round(x + offsetX - 4, 1)} ${round(baseY - height, 1)}" fill="none" stroke="${style.detailLight}" stroke-opacity="0.48" stroke-width="6" stroke-linecap="round" />`,
    );
  }
  return reeds;
}

function buildSwampTree(style, options) {
  const { baseY, crownRadius, trunkHeight, x } = options;
  const crownY = round(baseY - trunkHeight, 1);
  return [
    `    <path d="M ${x} ${baseY} C ${round(x - 22, 1)} ${round(baseY - trunkHeight * 0.34, 1)} ${round(x + 16, 1)} ${round(baseY - trunkHeight * 0.7, 1)} ${round(x - 6, 1)} ${crownY}" fill="none" stroke="${style.detailDark}" stroke-width="18" stroke-linecap="round" opacity="0.8" />`,
    `    <circle cx="${round(x - 18, 1)}" cy="${crownY}" r="${crownRadius}" fill="${style.dark}" />`,
    `    <circle cx="${round(x + 18, 1)}" cy="${round(crownY + 10, 1)}" r="${round(crownRadius * 0.78, 1)}" fill="${style.base}" opacity="0.96" />`,
    `    <circle cx="${round(x + 44, 1)}" cy="${round(crownY + 8, 1)}" r="${round(crownRadius * 0.52, 1)}" fill="${style.detailLight}" opacity="0.22" />`,
  ];
}

function buildFogBank(style, options) {
  const { opacity, rx, ry, x, y } = options;
  return [
    `    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${style.glow}" opacity="${opacity}" />`,
    `    <ellipse cx="${round(x - rx * 0.26, 1)}" cy="${round(y + 10, 1)}" rx="${round(rx * 0.48, 1)}" ry="${round(ry * 0.82, 1)}" fill="${style.detailLight}" opacity="${round(opacity * 0.7, 3)}" />`,
    `    <ellipse cx="${round(x + rx * 0.28, 1)}" cy="${round(y - 8, 1)}" rx="${round(rx * 0.42, 1)}" ry="${round(ry * 0.78, 1)}" fill="${style.glow}" opacity="${round(opacity * 0.8, 3)}" />`,
  ];
}

function buildIceShard(style, options) {
  const { baseY, height, width, x } = options;
  return [
    `    <polygon points="${pointList([
      [round(x - width * 0.46, 1), baseY],
      [round(x - width * 0.08, 1), round(baseY - height, 1)],
      [round(x + width * 0.32, 1), round(baseY - height * 0.24, 1)],
      [round(x + width * 0.18, 1), baseY],
    ])}" fill="${style.base}" opacity="0.96" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.08, 1), round(baseY - height, 1)],
      [round(x + width * 0.18, 1), round(baseY - height * 0.38, 1)],
      [round(x - width * 0.02, 1), round(baseY - height * 0.16, 1)],
    ])}" fill="${style.detailLight}" opacity="0.84" />`,
  ];
}

function buildCrystalSpire(style, options) {
  const { baseY, height, width, x } = options;
  return [
    `    <polygon points="${pointList([
      [round(x - width, 1), baseY],
      [x, round(baseY - height, 1)],
      [round(x + width, 1), baseY],
      [round(x + width * 0.24, 1), round(baseY - height * 0.3, 1)],
      [round(x - width * 0.3, 1), round(baseY - height * 0.18, 1)],
    ])}" fill="${style.dark}" />`,
    `    <polygon points="${pointList([
      [x, round(baseY - height, 1)],
      [round(x + width * 0.22, 1), round(baseY - height * 0.26, 1)],
      [round(x - width * 0.2, 1), round(baseY - height * 0.16, 1)],
    ])}" fill="${style.detailLight}" opacity="0.92" />`,
    `    <polygon points="${pointList([
      [round(x - width * 0.1, 1), round(baseY - height * 0.68, 1)],
      [round(x + width * 0.34, 1), round(baseY - height * 0.18, 1)],
      [round(x - width * 0.02, 1), round(baseY - height * 0.06, 1)],
    ])}" fill="${style.glow}" opacity="0.64" />`,
  ];
}

function createRng(seed) {
  let state = hashSeed(seed);

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pointList(points) {
  return points.map(([x, y]) => `${round(x, 1)},${round(y, 1)}`).join(' ');
}

function pointAtY(start, end, targetY) {
  const [startX, startY] = start;
  const [endX, endY] = end;
  if (endY === startY) {
    return [startX, targetY];
  }

  const progress = (targetY - startY) / (endY - startY);
  return [lerp(startX, endX, progress), targetY];
}

function randomBetween(rng, min, max) {
  return min + (max - min) * rng();
}

function round(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

if (resolve(process.argv[1] ?? '') === SCRIPT_PATH) {
  writeTerrainArtFiles();
}
