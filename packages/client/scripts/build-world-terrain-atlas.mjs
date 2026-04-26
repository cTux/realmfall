import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  WORLD_TERRAIN_ATLAS_COLUMNS,
  WORLD_TERRAIN_ATLAS_OUTPUTS,
  WORLD_TERRAIN_ATLAS_SOURCES,
} from './world-terrain-atlas.config.mjs';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const imagePath = join(rootDir, WORLD_TERRAIN_ATLAS_OUTPUTS.image);
const manifestPath = join(rootDir, WORLD_TERRAIN_ATLAS_OUTPUTS.manifest);

const sourceMetadata = await Promise.all(
  WORLD_TERRAIN_ATLAS_SOURCES.map(async ({ id, source }) => {
    const sourcePath = join(rootDir, source);
    const metadata = await sharp(sourcePath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Terrain atlas source has no dimensions: ${source}`);
    }

    return {
      id,
      height: metadata.height,
      source,
      sourcePath,
      width: metadata.width,
    };
  }),
);

const [{ width: tileWidth, height: tileHeight }] = sourceMetadata;

for (const source of sourceMetadata) {
  if (source.width !== tileWidth || source.height !== tileHeight) {
    throw new Error(
      `Terrain atlas source dimensions differ for ${source.source}. Expected ${tileWidth}x${tileHeight}, received ${source.width}x${source.height}.`,
    );
  }
}

const rows = Math.ceil(sourceMetadata.length / WORLD_TERRAIN_ATLAS_COLUMNS);
const atlasWidth = tileWidth * WORLD_TERRAIN_ATLAS_COLUMNS;
const atlasHeight = tileHeight * rows;
const frames = {};

const composites = sourceMetadata.map((source, index) => {
  const x = (index % WORLD_TERRAIN_ATLAS_COLUMNS) * tileWidth;
  const y = Math.floor(index / WORLD_TERRAIN_ATLAS_COLUMNS) * tileHeight;

  frames[source.id] = {
    x,
    y,
    w: tileWidth,
    h: tileHeight,
    source: source.source,
  };

  return {
    input: source.sourcePath,
    left: x,
    top: y,
  };
});

await mkdir(dirname(imagePath), { recursive: true });
await sharp({
  create: {
    width: atlasWidth,
    height: atlasHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png()
  .toFile(imagePath);

await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      image: 'world-terrain-atlas.png',
      tileWidth,
      tileHeight,
      columns: WORLD_TERRAIN_ATLAS_COLUMNS,
      rows,
      frames,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${WORLD_TERRAIN_ATLAS_OUTPUTS.image}`);
console.log(`Wrote ${WORLD_TERRAIN_ATLAS_OUTPUTS.manifest}`);
