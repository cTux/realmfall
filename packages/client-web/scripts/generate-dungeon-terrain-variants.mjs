import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const terrainDir = join(
  rootDir,
  'packages/client-web/src/assets/images/terrain',
);
const dungeonTerrainDir = join(terrainDir, 'dungeons');
const tileSize = 200;
const insetHexPoints = '100,12 182,56 182,144 100,188 18,144 18,56';

const terrainDefinitions = [
  {
    file: 'dungeon-brick-floor.png',
    base: 'mountain-v2.png',
    modulate: { brightness: 0.93, saturation: 0.52 },
    overlays: buildBrickOverlays({
      accent: '#dbe4ee',
      base: '#64748b',
      mortar: '#334155',
      overlay: '#94a3b8',
    }),
  },
  {
    file: 'dungeon-brick-cracked.png',
    base: 'mountain-v2.png',
    modulate: { brightness: 0.88, saturation: 0.44 },
    overlays: buildBrickOverlays({
      accent: '#cbd5e1',
      base: '#586273',
      cracks: true,
      mortar: '#1e293b',
      overlay: '#e2e8f0',
    }),
  },
  {
    file: 'dungeon-brick-moss.png',
    base: 'highlands-v2.png',
    modulate: { brightness: 0.94, saturation: 0.7 },
    overlays: buildBrickOverlays({
      accent: '#dce7c2',
      base: '#5f6b59',
      mortar: '#334155',
      moss: true,
      overlay: '#84cc16',
    }),
  },
  {
    file: 'dungeon-brick-wall.png',
    base: 'mountain-v2.png',
    modulate: { brightness: 0.8, saturation: 0.36 },
    overlays: buildBrickOverlays({
      accent: '#cbd5e1',
      base: '#475569',
      mortar: '#0f172a',
      overlay: '#94a3b8',
      wall: true,
    }),
  },
  {
    file: 'dungeon-mud-floor.png',
    base: 'marsh-v2.png',
    modulate: { brightness: 0.9, saturation: 0.78 },
    overlays: buildMudOverlays({
      accent: '#9a6b45',
      base: '#6b4f3a',
      puddle: '#4b5563',
    }),
  },
  {
    file: 'dungeon-mud-rut.png',
    base: 'badlands-v2.png',
    modulate: { brightness: 0.84, saturation: 0.82 },
    overlays: buildMudOverlays({
      accent: '#533728',
      base: '#5f4330',
      puddle: '#42342a',
      ruts: true,
    }),
  },
  {
    file: 'dungeon-mud-puddle.png',
    base: 'swamp-v2.png',
    modulate: { brightness: 0.92, saturation: 0.84 },
    overlays: buildMudOverlays({
      accent: '#86634a',
      base: '#654938',
      puddle: '#4d6675',
      puddles: true,
    }),
  },
  {
    file: 'dungeon-mud-wall.png',
    base: 'badlands-v2.png',
    modulate: { brightness: 0.76, saturation: 0.58 },
    overlays: buildMudOverlays({
      accent: '#4d3425',
      base: '#4f3828',
      puddle: '#2d221c',
      wall: true,
    }),
  },
  {
    file: 'dungeon-obsidian-floor.png',
    base: 'blasted-v2.png',
    modulate: { brightness: 0.8, saturation: 0.55 },
    overlays: buildObsidianOverlays({
      base: '#16181f',
      glow: '#7c3aed',
      shard: '#475569',
    }),
  },
  {
    file: 'dungeon-obsidian-ash.png',
    base: 'blasted-v2.png',
    modulate: { brightness: 0.86, saturation: 0.5 },
    overlays: buildObsidianOverlays({
      ash: true,
      base: '#232a35',
      glow: '#e2e8f0',
      shard: '#94a3b8',
    }),
  },
  {
    file: 'dungeon-obsidian-ember.png',
    base: 'rift-v2.png',
    modulate: { brightness: 0.82, saturation: 0.7 },
    overlays: buildObsidianOverlays({
      base: '#1b1117',
      embers: true,
      glow: '#f97316',
      shard: '#4b1f2d',
    }),
  },
  {
    file: 'dungeon-obsidian-wall.png',
    base: 'rift-v2.png',
    modulate: { brightness: 0.72, saturation: 0.55 },
    overlays: buildObsidianOverlays({
      base: '#111827',
      glow: '#ef4444',
      shard: '#334155',
      wall: true,
    }),
  },
];

await mkdir(dungeonTerrainDir, { recursive: true });

for (const definition of terrainDefinitions) {
  const outputPath = join(dungeonTerrainDir, definition.file);
  let image = sharp(join(terrainDir, definition.base)).ensureAlpha();

  if (definition.modulate) {
    image = image.modulate(definition.modulate);
  }

  await image.composite(definition.overlays).png().toFile(outputPath);
  console.log(`Wrote ${outputPath}`);
}

function buildBrickOverlays({
  base,
  mortar,
  accent,
  overlay,
  cracks = false,
  moss = false,
  wall = false,
}) {
  const brickWidth = wall ? 54 : 48;
  const brickHeight = wall ? 22 : 26;
  const mortarLines = [];
  const detailOverlays = [];

  for (let row = -1; row < 10; row += 1) {
    const y = 22 + row * brickHeight;
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;

    for (let column = -1; column < 6; column += 1) {
      const x = 12 + column * brickWidth + offset;
      mortarLines.push(
        `<rect x="${x}" y="${y}" width="${brickWidth - 4}" height="${brickHeight - 4}" rx="5" fill="none" stroke="${mortar}" stroke-width="2.8" opacity="${
          wall ? 0.4 : 0.28
        }" />`,
      );
      detailOverlays.push(
        `<rect x="${x + 5}" y="${y + 5}" width="${brickWidth - 16}" height="${
          brickHeight - 14
        }" rx="4" fill="${accent}" opacity="${wall ? 0.14 : 0.11}" />`,
      );

      if (moss && (row + column) % 3 === 0) {
        detailOverlays.push(
          `<ellipse cx="${x + brickWidth * 0.54}" cy="${y + brickHeight * 0.54}" rx="13" ry="8" fill="${overlay}" opacity="0.28" />`,
        );
      }

      if (cracks && (row + column) % 2 === 0) {
        detailOverlays.push(
          `<path d="M ${x + 10} ${y + 8} L ${x + 24} ${y + 13} L ${x + 15} ${
            y + 24
          } L ${x + 30} ${y + 31}" stroke="${overlay}" stroke-width="2.3" stroke-linecap="round" opacity="0.38" />`,
        );
      }
    }
  }

  if (wall) {
    for (let column = 24; column < tileSize; column += 40) {
      detailOverlays.push(
        `<rect x="${column}" y="16" width="7" height="${
          tileSize - 32
        }" fill="${overlay}" opacity="0.1" />`,
      );
    }
  }

  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${tileSize - 16}" height="${
          tileSize - 16
        }" fill="${base}" opacity="${wall ? 0.16 : 0.12}" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(mortarLines, 'multiply'),
    createSvgOverlay(detailOverlays),
  ];
}

function buildMudOverlays({
  base,
  accent,
  puddle,
  ruts = false,
  puddles = false,
  wall = false,
}) {
  const blobs = [];
  const ridges = [];

  for (let index = 0; index < 18; index += 1) {
    const x = 18 + ((index * 31) % 168);
    const y = 20 + ((index * 47) % 160);
    const width = 16 + (index % 4) * 7;
    const height = 10 + (index % 3) * 6;
    blobs.push(
      `<ellipse cx="${x}" cy="${y}" rx="${width}" ry="${height}" fill="${
        index % 2 === 0 ? accent : puddle
      }" opacity="${
        puddles && index % 3 === 0 ? 0.34 : wall ? 0.22 : 0.28
      }" />`,
    );
  }

  if (ruts) {
    for (let y = 32; y < tileSize; y += 34) {
      ridges.push(
        `<path d="M 18 ${y} C 58 ${y - 12}, 112 ${y + 14}, 182 ${y - 6}" stroke="${accent}" stroke-width="9" stroke-linecap="round" opacity="0.42" />`,
      );
    }
  }

  if (wall) {
    for (let x = 24; x < tileSize; x += 26) {
      ridges.push(
        `<path d="M ${x} 16 C ${x - 10} 64, ${x + 8} 132, ${x} 184" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity="0.36" />`,
      );
    }
  }

  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${tileSize - 16}" height="${
          tileSize - 16
        }" fill="${base}" opacity="${wall ? 0.24 : 0.18}" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(blobs, puddles ? 'soft-light' : 'over'),
    createSvgOverlay(ridges, 'multiply'),
  ];
}

function buildObsidianOverlays({
  base,
  shard,
  glow,
  ash = false,
  embers = false,
  wall = false,
}) {
  const shards = [];
  const glows = [];

  for (let index = 0; index < 14; index += 1) {
    const x = 16 + ((index * 29) % 170);
    const y = 18 + ((index * 41) % 166);
    const points = [
      `${x},${y}`,
      `${x + 16 + (index % 3) * 8},${y + 6}`,
      `${x + 10},${y + 22 + (index % 2) * 8}`,
      `${x - 8},${y + 18}`,
    ].join(' ');
    shards.push(
      `<polygon points="${points}" fill="${shard}" opacity="${wall ? 0.22 : 0.16}" />`,
    );
  }

  for (let y = 24; y < tileSize; y += wall ? 24 : 38) {
    glows.push(
      `<path d="M 14 ${y} C 54 ${y - 10}, 102 ${y + 12}, 186 ${y - 8}" stroke="${glow}" stroke-width="${
        wall ? 3.5 : 2.4
      }" stroke-linecap="round" opacity="${embers ? 0.4 : wall ? 0.24 : 0.18}" />`,
    );
  }

  if (ash) {
    for (let index = 0; index < 42; index += 1) {
      const x = 10 + ((index * 17) % 180);
      const y = 14 + ((index * 23) % 176);
      glows.push(
        `<circle cx="${x}" cy="${y}" r="${1 + (index % 3)}" fill="${glow}" opacity="0.14" />`,
      );
    }
  }

  if (embers) {
    for (let index = 0; index < 22; index += 1) {
      const x = 18 + ((index * 31) % 164);
      const y = 26 + ((index * 37) % 148);
      glows.push(
        `<circle cx="${x}" cy="${y}" r="${2 + (index % 2)}" fill="${glow}" opacity="0.3" />`,
      );
    }
  }

  return [
    createSvgOverlay(
      [
        `<rect x="8" y="8" width="${tileSize - 16}" height="${
          tileSize - 16
        }" fill="${base}" opacity="${wall ? 0.22 : 0.16}" />`,
      ],
      'soft-light',
    ),
    createSvgOverlay(shards),
    createSvgOverlay(glows, embers || ash ? 'screen' : 'over'),
  ];
}

function createSvgOverlay(contents, blend = 'over') {
  return {
    blend,
    input: Buffer.from(buildOverlayDocument(contents)),
  };
}

function buildOverlayDocument(contents) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}">`,
    '<defs>',
    '<clipPath id="hex-clip">',
    `<polygon points="${insetHexPoints}" />`,
    '</clipPath>',
    '</defs>',
    '<g clip-path="url(#hex-clip)">',
    ...contents,
    '</g>',
    '</svg>',
  ].join('');
}
