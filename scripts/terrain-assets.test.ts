import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTerrainArtSvg,
  TERRAIN_ART_ASSET_DEFINITIONS,
} from './generate-terrain-art.mjs';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));

describe('terrain hex assets', () => {
  it('match the checked-in generated pseudo-3d terrain art', () => {
    for (const definition of TERRAIN_ART_ASSET_DEFINITIONS) {
      const assetPath = join(
        SCRIPT_DIR,
        '../src/assets/images/terrain',
        definition.fileName,
      );
      const assetContents = readFileSync(assetPath, 'utf8').trim();
      const generatedContents = buildTerrainArtSvg(
        definition.terrain,
        definition.variantKey,
      ).trim();

      expect(assetContents).toBe(generatedContents);
      expect(assetContents).toContain('viewBox="0 0 1280 1760"');
      expect(assetContents).toContain('clipPath');
      expect(assetContents).toContain('feDropShadow');
      const topHexBounds = getTopHexBounds(assetContents);
      expect(topHexBounds.minX).toBeGreaterThan(0);
      expect(topHexBounds.maxX).toBeLessThan(1280);
      expect(topHexBounds.width / topHexBounds.height).toBeCloseTo(
        Math.sqrt(3) / 2,
        3,
      );
    }
  });
});

function getTopHexBounds(svg: string) {
  const pointsMatch = svg.match(
    /<clipPath id="[^"]+-clip-top">\s*<polygon points="([^"]+)"/,
  );
  if (!pointsMatch) {
    throw new Error('Missing top hex polygon points');
  }

  const points = pointsMatch[1]
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter((pair) => pair.length === 2);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return {
    height: Math.max(...ys) - Math.min(...ys),
    maxX: Math.max(...xs),
    minX: Math.min(...xs),
    width: Math.max(...xs) - Math.min(...xs),
  };
}
