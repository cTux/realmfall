import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = fileURLToPath(new URL('../../../', import.meta.url));
const terrainDir = join(
  rootDir,
  'packages/client/src/assets/images/terrain/dungeons',
);
const tileSize = 200;

const terrainDefinitions = [
  {
    file: 'dungeon-brick-floor.png',
    svg: buildBrickSvg({
      base: '#4b5563',
      mortar: '#374151',
      accent: '#6b7280',
      overlay: '#9ca3af',
    }),
  },
  {
    file: 'dungeon-brick-cracked.png',
    svg: buildBrickSvg({
      base: '#52525b',
      mortar: '#3f3f46',
      accent: '#71717a',
      overlay: '#a1a1aa',
      cracks: true,
    }),
  },
  {
    file: 'dungeon-brick-moss.png',
    svg: buildBrickSvg({
      base: '#4b5563',
      mortar: '#334155',
      accent: '#6b7280',
      overlay: '#65a30d',
      moss: true,
    }),
  },
  {
    file: 'dungeon-brick-wall.png',
    svg: buildBrickSvg({
      base: '#374151',
      mortar: '#1f2937',
      accent: '#4b5563',
      overlay: '#94a3b8',
      wall: true,
    }),
  },
  {
    file: 'dungeon-mud-floor.png',
    svg: buildMudSvg({
      base: '#6b4f3a',
      accent: '#7c5a42',
      puddle: '#8b6b4f',
    }),
  },
  {
    file: 'dungeon-mud-rut.png',
    svg: buildMudSvg({
      base: '#5b4331',
      accent: '#7a5a43',
      puddle: '#6b4f3a',
      ruts: true,
    }),
  },
  {
    file: 'dungeon-mud-puddle.png',
    svg: buildMudSvg({
      base: '#5c4636',
      accent: '#86634a',
      puddle: '#4c6475',
      puddles: true,
    }),
  },
  {
    file: 'dungeon-mud-wall.png',
    svg: buildMudSvg({
      base: '#4a3729',
      accent: '#6d4f39',
      puddle: '#8b6b4f',
      wall: true,
    }),
  },
  {
    file: 'dungeon-obsidian-floor.png',
    svg: buildObsidianSvg({
      base: '#16181f',
      shard: '#2d3748',
      glow: '#7c3aed',
    }),
  },
  {
    file: 'dungeon-obsidian-ash.png',
    svg: buildObsidianSvg({
      base: '#1f2933',
      shard: '#4b5563',
      glow: '#94a3b8',
      ash: true,
    }),
  },
  {
    file: 'dungeon-obsidian-ember.png',
    svg: buildObsidianSvg({
      base: '#170f14',
      shard: '#3b1f2b',
      glow: '#f97316',
      embers: true,
    }),
  },
  {
    file: 'dungeon-obsidian-wall.png',
    svg: buildObsidianSvg({
      base: '#111827',
      shard: '#374151',
      glow: '#ef4444',
      wall: true,
    }),
  },
];

await mkdir(terrainDir, { recursive: true });

for (const definition of terrainDefinitions) {
  const outputPath = join(terrainDir, definition.file);
  await sharp(Buffer.from(definition.svg)).png().toFile(outputPath);
  console.log(`Wrote ${outputPath}`);
}

function buildBrickSvg({
  base,
  mortar,
  accent,
  overlay,
  cracks = false,
  moss = false,
  wall = false,
}) {
  const brickWidth = wall ? 60 : 52;
  const brickHeight = wall ? 24 : 28;
  const bricks = [];
  const extras = [];

  for (let row = -1; row < 10; row += 1) {
    const y = row * brickHeight;
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;

    for (let column = -1; column < 6; column += 1) {
      const x = column * brickWidth + offset;
      bricks.push(
        `<rect x="${x}" y="${y}" width="${brickWidth - 4}" height="${brickHeight - 4}" rx="6" fill="${accent}" opacity="0.62" />`,
      );

      if (moss && (row + column) % 3 === 0) {
        extras.push(
          `<ellipse cx="${x + brickWidth * 0.5}" cy="${y + brickHeight * 0.55}" rx="12" ry="7" fill="${overlay}" opacity="0.42" />`,
        );
      }

      if (cracks && (row + column) % 2 === 0) {
        extras.push(
          `<path d="M ${x + 10} ${y + 8} L ${x + 22} ${y + 14} L ${x + 16} ${y + 24} L ${x + 30} ${y + 30}" stroke="${overlay}" stroke-width="2.2" stroke-linecap="round" opacity="0.45" />`,
        );
      }
    }
  }

  if (wall) {
    for (let column = 18; column < tileSize; column += 40) {
      extras.push(
        `<rect x="${column}" y="0" width="6" height="${tileSize}" fill="${overlay}" opacity="0.12" />`,
      );
    }
  }

  return buildSvgDocument([
    `<rect width="${tileSize}" height="${tileSize}" rx="26" fill="${base}" />`,
    `<rect x="8" y="8" width="${tileSize - 16}" height="${
      tileSize - 16
    }" rx="22" fill="none" stroke="${mortar}" stroke-width="8" opacity="0.72" />`,
    ...bricks,
    ...extras,
  ]);
}

function buildMudSvg({
  base,
  accent,
  puddle,
  ruts = false,
  puddles = false,
  wall = false,
}) {
  const ridges = [];
  const blobs = [];

  for (let index = 0; index < 18; index += 1) {
    const x = 18 + ((index * 31) % 168);
    const y = 20 + ((index * 47) % 160);
    const width = 16 + (index % 4) * 7;
    const height = 10 + (index % 3) * 6;
    blobs.push(
      `<ellipse cx="${x}" cy="${y}" rx="${width}" ry="${height}" fill="${
        index % 2 === 0 ? accent : puddle
      }" opacity="${puddles && index % 3 === 0 ? 0.42 : 0.22}" />`,
    );
  }

  if (ruts) {
    for (let y = 30; y < tileSize; y += 34) {
      ridges.push(
        `<path d="M 18 ${y} C 58 ${y - 12}, 112 ${y + 14}, 182 ${y - 6}" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity="0.32" />`,
      );
    }
  }

  if (wall) {
    for (let x = 18; x < tileSize; x += 26) {
      ridges.push(
        `<path d="M ${x} 8 C ${x - 8} 64, ${x + 8} 132, ${x} 192" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity="0.24" />`,
      );
    }
  }

  return buildSvgDocument([
    `<rect width="${tileSize}" height="${tileSize}" rx="26" fill="${base}" />`,
    `<rect x="10" y="10" width="${tileSize - 20}" height="${
      tileSize - 20
    }" rx="22" fill="none" stroke="${accent}" stroke-width="6" opacity="0.18" />`,
    ...blobs,
    ...ridges,
  ]);
}

function buildObsidianSvg({
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
      `<polygon points="${points}" fill="${shard}" opacity="${wall ? 0.74 : 0.54}" />`,
    );
  }

  for (let y = 24; y < tileSize; y += wall ? 24 : 38) {
    glows.push(
      `<path d="M 14 ${y} C 54 ${y - 10}, 102 ${y + 12}, 186 ${y - 8}" stroke="${glow}" stroke-width="${
        wall ? 3.5 : 2.4
      }" stroke-linecap="round" opacity="${embers ? 0.45 : 0.28}" />`,
    );
  }

  if (ash) {
    for (let index = 0; index < 42; index += 1) {
      const x = 10 + ((index * 17) % 180);
      const y = 14 + ((index * 23) % 176);
      glows.push(
        `<circle cx="${x}" cy="${y}" r="${1 + (index % 3)}" fill="${glow}" opacity="0.18" />`,
      );
    }
  }

  if (embers) {
    for (let index = 0; index < 22; index += 1) {
      const x = 18 + ((index * 31) % 164);
      const y = 26 + ((index * 37) % 148);
      glows.push(
        `<circle cx="${x}" cy="${y}" r="${2 + (index % 2)}" fill="${glow}" opacity="0.36" />`,
      );
    }
  }

  return buildSvgDocument([
    `<rect width="${tileSize}" height="${tileSize}" rx="26" fill="${base}" />`,
    ...shards,
    ...glows,
  ]);
}

function buildSvgDocument(contents) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}">`,
    ...contents,
    '</svg>',
  ].join('');
}
