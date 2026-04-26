import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const TERRAIN_ASSET_PATHS = [
  '../packages/client/src/assets/images/terrain/plains-v2.png',
  '../packages/client/src/assets/images/terrain/forest-v2.png',
  '../packages/client/src/assets/images/terrain/rift-v2.png',
  '../packages/client/src/assets/images/terrain/mountain-v2.png',
  '../packages/client/src/assets/images/terrain/desert-v2.png',
  '../packages/client/src/assets/images/terrain/swamp-v2.png',
].map((relativePath) => new URL(relativePath, import.meta.url));

describe('terrain hex assets', () => {
  it('keep square corners transparent while preserving opaque terrain art', async () => {
    for (const assetUrl of TERRAIN_ASSET_PATHS) {
      const { data, info } = await sharp(fileURLToPath(assetUrl))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const cornerAlphaIndexes = [
        3,
        (info.width - 1) * info.channels + 3,
        (info.height - 1) * info.width * info.channels + 3,
        (info.height * info.width - 1) * info.channels + 3,
      ];
      const centerAlphaIndex =
        (Math.floor(info.height / 2) * info.width +
          Math.floor(info.width / 2)) *
          info.channels +
        3;

      cornerAlphaIndexes.forEach((alphaIndex) => {
        expect(data[alphaIndex]).toBe(0);
      });
      expect(data[centerAlphaIndex]).toBeGreaterThan(0);
    }
  });
});
