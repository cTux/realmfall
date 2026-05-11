import { createUnknownVisibleWorldTile } from './worldIconsUnknownHexTestkit';

const COLD_IMPORT_TIMEOUT_MS = 10_000;

describe('worldIcons unknown hex assets', () => {
  it(
    'preloads the unknown icon without preloading placeholder terrain art',
    async () => {
      const { WorldIcons, getVisibleWorldIconAssetIds } =
        await import('./worldIcons');
      const { terrainArtFor } = await import('./worldTerrainArt');

      const unknownTile = createUnknownVisibleWorldTile({ q: 1, r: 0 }, 250);
      const icons = getVisibleWorldIconAssetIds({}, [unknownTile]);

      expect(icons).toContain(WorldIcons.UnknownHex);
      expect(icons).not.toContain(terrainArtFor(unknownTile.terrain));
    },
    COLD_IMPORT_TIMEOUT_MS,
  );
});
