import { access, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  GENERATED_SURFACE_TERRAIN_SOURCES,
  GENERATED_WORLD_TERRAIN_DIR,
  SURFACE_TERRAIN_SOURCE_DIR,
} from './world-terrain-family-recipes.mjs';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const terrainSourceDir = join(rootDir, SURFACE_TERRAIN_SOURCE_DIR);
const generatedTerrainDir = join(rootDir, GENERATED_WORLD_TERRAIN_DIR);
const TILE_SIZE = 200;

export async function generateSurfaceTerrainVariants() {
  await mkdir(generatedTerrainDir, { recursive: true });
  await removeStaleGeneratedFiles();

  for (const recipe of GENERATED_SURFACE_TERRAIN_SOURCES) {
    const sourcePath = join(terrainSourceDir, recipe.base);
    const outputPath = join(generatedTerrainDir, recipe.file);

    await ensureFileExists(
      sourcePath,
      `Surface terrain recipe source is missing: ${recipe.id} -> ${recipe.base}`,
    );

    const metadata = await sharp(sourcePath).metadata();

    if (metadata.width !== TILE_SIZE || metadata.height !== TILE_SIZE) {
      throw new Error(
        `Surface terrain recipe source dimensions differ for ${recipe.id}. Expected ${TILE_SIZE}x${TILE_SIZE}, received ${metadata.width ?? 'unknown'}x${metadata.height ?? 'unknown'}.`,
      );
    }

    let image = sharp(sourcePath).ensureAlpha();

    if (recipe.modulate) {
      image = image.modulate(recipe.modulate);
    }

    const overlays = buildRecipeOverlays(recipe.overlay);

    await image.composite(overlays).png().toFile(outputPath);
    console.log(`Wrote ${recipe.source}`);
  }
}

async function removeStaleGeneratedFiles() {
  const expectedFiles = new Set(
    GENERATED_SURFACE_TERRAIN_SOURCES.map(({ file }) => file),
  );
  const existingEntries = await readdir(generatedTerrainDir, {
    withFileTypes: true,
  });

  for (const entry of existingEntries) {
    if (
      entry.isFile() &&
      entry.name.endsWith('.png') &&
      !expectedFiles.has(entry.name)
    ) {
      await unlink(join(generatedTerrainDir, entry.name));
    }
  }
}

async function ensureFileExists(filePath, message) {
  try {
    await access(filePath);
  } catch {
    throw new Error(message);
  }
}

function buildRecipeOverlays(overlay) {
  switch (overlay.motif ?? overlay.terrain) {
    case 'petals':
      return buildPetalOverlays(overlay);
    case 'dry-grass':
      return buildDryGrassOverlays(overlay);
    case 'moss':
      return buildMossOverlays(overlay);
    case 'fern':
      return buildFernOverlays(overlay);
    case 'mountain':
      return buildMountainBlockerOverlays(overlay);
    case 'rift':
      return buildRiftBlockerOverlays(overlay);
    default:
      throw new Error(
        `Unknown terrain recipe overlay for ${JSON.stringify(overlay)}`,
      );
  }
}

function buildPetalOverlays({ accent, bloom, foliage, wash }) {
  const petals = [];
  const stems = [];

  for (let index = 0; index < 16; index += 1) {
    const x = 28 + ((index * 37) % 144);
    const y = 24 + ((index * 29) % 152);
    const rotation = (index * 19) % 360;

    petals.push(
      `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="${bloom}" opacity="0.34" transform="rotate(${rotation} ${x} ${y})" />`,
      `<ellipse cx="${x + 6}" cy="${y - 2}" rx="5" ry="3" fill="${accent}" opacity="0.28" transform="rotate(${rotation + 36} ${x + 6} ${y - 2})" />`,
    );
    stems.push(
      `<path d="M ${x - 6} ${y + 8} C ${x - 3} ${y + 1}, ${x + 2} ${y - 5}, ${x + 6} ${y - 2}" stroke="${foliage}" stroke-width="2.2" stroke-linecap="round" opacity="0.26" />`,
    );
  }

  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${TILE_SIZE - 16}" height="${
          TILE_SIZE - 16
        }" fill="${wash}" opacity="0.08" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(stems, 'soft-light'),
    createSvgOverlay(petals, 'screen'),
  ];
}

function buildDryGrassOverlays({ accent, foliage, shadow, wash }) {
  const strokes = [];
  const seedheads = [];

  for (let index = 0; index < 18; index += 1) {
    const baseX = 20 + ((index * 23) % 160);
    const baseY = 170 - ((index * 17) % 84);
    const tipX = baseX + 8 - (index % 5) * 5;
    const tipY = baseY - 26 - (index % 3) * 6;

    strokes.push(
      `<path d="M ${baseX} ${baseY} C ${baseX + 2} ${baseY - 12}, ${tipX} ${
        tipY + 10
      }, ${tipX} ${tipY}" stroke="${index % 2 === 0 ? accent : shadow}" stroke-width="${
        2.2 + (index % 3) * 0.4
      }" stroke-linecap="round" opacity="0.32" />`,
    );
    seedheads.push(
      `<path d="M ${tipX - 3} ${tipY + 1} L ${tipX + 4} ${tipY - 5} L ${tipX + 8} ${
        tipY + 2
      }" stroke="${foliage}" stroke-width="1.6" stroke-linecap="round" opacity="0.24" />`,
    );
  }

  return [
    createSvgOverlay(
      [
        `<rect x="10" y="10" width="${TILE_SIZE - 20}" height="${
          TILE_SIZE - 20
        }" fill="${wash}" opacity="0.09" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(strokes, 'multiply'),
    createSvgOverlay(seedheads, 'soft-light'),
  ];
}

function buildMossOverlays({ accent, foliage, shadow, wash }) {
  const moss = [];
  const stones = [];

  for (let index = 0; index < 15; index += 1) {
    const x = 26 + ((index * 41) % 140);
    const y = 24 + ((index * 33) % 148);
    const width = 12 + (index % 4) * 6;
    const height = 8 + (index % 3) * 5;

    moss.push(
      `<ellipse cx="${x}" cy="${y}" rx="${width}" ry="${height}" fill="${
        index % 2 === 0 ? accent : foliage
      }" opacity="0.26" />`,
    );
    stones.push(
      `<ellipse cx="${x + 6}" cy="${y + 6}" rx="${6 + (index % 2) * 3}" ry="${
        4 + (index % 3)
      }" fill="${shadow}" opacity="0.14" />`,
    );
  }

  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${TILE_SIZE - 16}" height="${
          TILE_SIZE - 16
        }" fill="${wash}" opacity="0.1" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(stones, 'multiply'),
    createSvgOverlay(moss, 'soft-light'),
  ];
}

function buildFernOverlays({ accent, foliage, shadow, wash }) {
  const ferns = [];
  const highlights = [];

  for (let index = 0; index < 7; index += 1) {
    const x = 32 + index * 22;
    const y = 160 - (index % 3) * 18;
    const tipY = y - 52;

    ferns.push(
      `<path d="M ${x} ${y} C ${x + 1} ${y - 16}, ${x + 5} ${y - 34}, ${x + 6} ${tipY}" stroke="${shadow}" stroke-width="2.6" stroke-linecap="round" opacity="0.26" />`,
    );

    for (let frond = 0; frond < 5; frond += 1) {
      const branchY = y - 10 - frond * 9;
      const spread = 11 + frond * 2;
      highlights.push(
        `<path d="M ${x + 2} ${branchY} Q ${x - spread} ${branchY - 5}, ${
          x - spread - 4
        } ${branchY - 11}" stroke="${foliage}" stroke-width="2" stroke-linecap="round" opacity="0.3" />`,
        `<path d="M ${x + 2} ${branchY - 1} Q ${x + spread} ${branchY - 6}, ${
          x + spread + 4
        } ${branchY - 12}" stroke="${accent}" stroke-width="1.8" stroke-linecap="round" opacity="0.22" />`,
      );
    }
  }

  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${TILE_SIZE - 16}" height="${
          TILE_SIZE - 16
        }" fill="${wash}" opacity="0.08" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(ferns, 'multiply'),
    createSvgOverlay(highlights, 'screen'),
  ];
}

function buildMountainBlockerOverlays({ accent, fill, shape, shadow }) {
  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${TILE_SIZE - 16}" height="${
          TILE_SIZE - 16
        }" fill="${fill}" opacity="0.16" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(buildMountainBodies(shape, fill), 'multiply'),
    createSvgOverlay(buildMountainHighlights(shape, accent, shadow), 'screen'),
  ];
}

function buildRiftBlockerOverlays({ accent, fill, shape, shadow }) {
  return [
    createSvgOverlay(
      [
        `<rect x="10" y="10" width="${TILE_SIZE - 20}" height="${
          TILE_SIZE - 20
        }" fill="${fill}" opacity="0.12" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(buildRiftFissures(shape, fill, shadow), 'multiply'),
    createSvgOverlay(buildRiftGlow(shape, accent), 'screen'),
  ];
}

function buildMountainBodies(shape, fill) {
  const ridgeStroke = `<path d="${shapePath(shape)}" stroke="${fill}" stroke-width="${
    shape === 'massif' ? 34 : shape === 'isolated' ? 28 : 24
  }" stroke-linecap="round" stroke-linejoin="round" opacity="${
    shape === 'massif' ? 0.46 : 0.36
  }" />`;

  const spurs = mountainSpurs(shape).map(
    ({ points, opacity }) =>
      `<path d="${points}" stroke="${fill}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />`,
  );

  return [ridgeStroke, ...spurs];
}

function buildMountainHighlights(shape, accent, shadow) {
  const crest = `<path d="${shapePath(shape)}" stroke="${accent}" stroke-width="${
    shape === 'massif' ? 10 : 8
  }" stroke-linecap="round" stroke-linejoin="round" opacity="0.32" />`;
  const shade = `<g transform="translate(9 10)"><path d="${shapePath(shape)}" stroke="${shadow}" stroke-width="${
    shape === 'massif' ? 14 : 10
  }" stroke-linecap="round" stroke-linejoin="round" opacity="0.22" /></g>`;

  return [shade, crest];
}

function buildRiftFissures(shape, fill, shadow) {
  const fissure = `<path d="${shapePath(shape)}" stroke="${shadow}" stroke-width="${
    shape === 'massif' ? 28 : shape === 'isolated' ? 24 : 20
  }" stroke-linecap="round" stroke-linejoin="round" opacity="0.54" />`;
  const inner = `<path d="${shapePath(shape)}" stroke="${fill}" stroke-width="${
    shape === 'massif' ? 16 : shape === 'isolated' ? 13 : 11
  }" stroke-linecap="round" stroke-linejoin="round" opacity="0.36" />`;

  return [
    fissure,
    inner,
    ...mountainSpurs(shape).map(
      ({ points, opacity }) =>
        `<path d="${points}" stroke="${shadow}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="${
          opacity + 0.08
        }" />`,
    ),
  ];
}

function buildRiftGlow(shape, accent) {
  const glow = `<path d="${shapePath(shape)}" stroke="${accent}" stroke-width="${
    shape === 'massif' ? 6 : 5
  }" stroke-linecap="round" stroke-linejoin="round" opacity="0.42" />`;
  const sparks = riftSparkCoordinates(shape).map(
    ({ x, y, radius }) =>
      `<circle cx="${x}" cy="${y}" r="${radius}" fill="${accent}" opacity="0.32" />`,
  );

  return [glow, ...sparks];
}

function mountainSpurs(shape) {
  switch (shape) {
    case 'bend':
      return [
        { opacity: 0.24, points: 'M 98 96 Q 124 84, 146 58' },
        { opacity: 0.2, points: 'M 92 122 Q 78 144, 66 164' },
      ];
    case 'fork':
      return [
        { opacity: 0.26, points: 'M 100 102 Q 74 80, 56 56' },
        { opacity: 0.24, points: 'M 104 98 Q 132 80, 150 56' },
      ];
    case 'end':
      return [{ opacity: 0.24, points: 'M 100 116 Q 126 136, 144 156' }];
    case 'isolated':
      return [
        { opacity: 0.2, points: 'M 92 104 Q 68 94, 54 112' },
        { opacity: 0.2, points: 'M 108 100 Q 132 90, 146 108' },
      ];
    case 'massif':
      return [
        { opacity: 0.3, points: 'M 100 106 Q 66 82, 48 58' },
        { opacity: 0.28, points: 'M 98 108 Q 80 144, 58 166' },
        { opacity: 0.3, points: 'M 104 102 Q 138 82, 156 58' },
      ];
    default:
      return [];
  }
}

function riftSparkCoordinates(shape) {
  switch (shape) {
    case 'bend':
      return [
        { radius: 4, x: 96, y: 74 },
        { radius: 3, x: 126, y: 88 },
        { radius: 4, x: 72, y: 144 },
      ];
    case 'fork':
      return [
        { radius: 4, x: 66, y: 66 },
        { radius: 3, x: 98, y: 102 },
        { radius: 4, x: 138, y: 64 },
      ];
    case 'end':
      return [
        { radius: 4, x: 98, y: 80 },
        { radius: 3, x: 112, y: 132 },
      ];
    case 'isolated':
      return [
        { radius: 4, x: 88, y: 92 },
        { radius: 3, x: 112, y: 110 },
        { radius: 3, x: 84, y: 124 },
      ];
    case 'massif':
      return [
        { radius: 5, x: 70, y: 66 },
        { radius: 4, x: 104, y: 102 },
        { radius: 5, x: 140, y: 66 },
        { radius: 4, x: 74, y: 148 },
      ];
    default:
      return [
        { radius: 4, x: 78, y: 88 },
        { radius: 3, x: 112, y: 102 },
        { radius: 4, x: 124, y: 122 },
      ];
  }
}

function shapePath(shape) {
  switch (shape) {
    case 'straight':
      return 'M 42 98 C 66 82, 134 120, 158 102';
    case 'bend':
      return 'M 62 148 C 78 120, 86 92, 108 84 C 126 80, 140 62, 150 46';
    case 'fork':
      return 'M 52 54 C 74 72, 88 88, 100 106 C 112 88, 126 72, 148 54';
    case 'end':
      return 'M 96 54 C 100 78, 100 110, 118 144';
    case 'isolated':
      return 'M 72 118 C 82 88, 118 76, 132 110 C 124 132, 96 146, 72 118';
    case 'massif':
      return 'M 52 56 C 78 76, 90 94, 100 108 C 110 92, 126 78, 150 58';
    default:
      throw new Error(`Unknown blocker shape: ${shape}`);
  }
}

function createSvgOverlay(contents, blend = 'over') {
  return {
    blend,
    input: Buffer.from(buildOverlayDocument(contents)),
  };
}

function buildOverlayDocument(contents) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_SIZE}" height="${TILE_SIZE}" viewBox="0 0 ${TILE_SIZE} ${TILE_SIZE}">`,
    '<defs>',
    '<clipPath id="hex-clip">',
    `<polygon points="${buildInsetHexPoints()}" />`,
    '</clipPath>',
    '</defs>',
    '<g clip-path="url(#hex-clip)">',
    ...contents,
    '</g>',
    '</svg>',
  ].join('');
}

function buildInsetHexPoints() {
  const points = [
    [0.5, 0.06],
    [0.91, 0.28],
    [0.91, 0.72],
    [0.5, 0.94],
    [0.09, 0.72],
    [0.09, 0.28],
  ];

  return points
    .map(
      ([x, y]) => `${Math.round(TILE_SIZE * x)},${Math.round(TILE_SIZE * y)}`,
    )
    .join(' ');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await generateSurfaceTerrainVariants();
}
