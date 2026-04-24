import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { TERRAINS } from '../../src/game/types';
import {
  WORLD_TERRAIN_ATLAS_COLUMNS,
  WORLD_TERRAIN_ATLAS_OUTPUTS,
  WORLD_TERRAIN_ATLAS_SOURCES,
} from '../world-terrain-atlas.config.mjs';

interface WorldTerrainAtlasManifest {
  columns: number;
  frames: Record<
    string,
    {
      h: number;
      source: string;
      w: number;
      x: number;
      y: number;
    }
  >;
  image: string;
  rows: number;
  tileHeight: number;
  tileWidth: number;
}

describe('world terrain atlas pipeline', () => {
  it('keeps the atlas build command wired to package scripts', () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts['assets:world-atlas']).toBe(
      'node scripts/build-world-terrain-atlas.mjs',
    );
    expect(
      existsSync(join(process.cwd(), 'scripts/build-world-terrain-atlas.mjs')),
    ).toBe(true);
  });

  it('tracks every runtime terrain in the atlas source list', () => {
    expect(WORLD_TERRAIN_ATLAS_SOURCES.map((source) => source.id)).toEqual([
      ...TERRAINS,
    ]);
  });

  it('emits a generated atlas image and frame manifest', async () => {
    const imagePath = join(process.cwd(), WORLD_TERRAIN_ATLAS_OUTPUTS.image);
    const manifestPath = join(
      process.cwd(),
      WORLD_TERRAIN_ATLAS_OUTPUTS.manifest,
    );

    expect(existsSync(imagePath)).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8'),
    ) as WorldTerrainAtlasManifest;
    const metadata = await sharp(imagePath).metadata();
    const expectedRows = Math.ceil(
      WORLD_TERRAIN_ATLAS_SOURCES.length / WORLD_TERRAIN_ATLAS_COLUMNS,
    );

    expect(manifest.image).toBe('world-terrain-atlas.png');
    expect(manifest.columns).toBe(WORLD_TERRAIN_ATLAS_COLUMNS);
    expect(manifest.rows).toBe(expectedRows);
    expect(Object.keys(manifest.frames)).toEqual([...TERRAINS]);
    expect(metadata.width).toBe(
      manifest.tileWidth * WORLD_TERRAIN_ATLAS_COLUMNS,
    );
    expect(metadata.height).toBe(manifest.tileHeight * expectedRows);

    for (const [terrainIndex, terrain] of TERRAINS.entries()) {
      const frame = manifest.frames[terrain];
      const source = WORLD_TERRAIN_ATLAS_SOURCES[terrainIndex];

      expect(frame).toEqual({
        h: manifest.tileHeight,
        source: source?.source,
        w: manifest.tileWidth,
        x: (terrainIndex % WORLD_TERRAIN_ATLAS_COLUMNS) * manifest.tileWidth,
        y:
          Math.floor(terrainIndex / WORLD_TERRAIN_ATLAS_COLUMNS) *
          manifest.tileHeight,
      });
    }
  });
});
