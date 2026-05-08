import {
  createUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from '../../../ui/world/visibleWorldTiles';
import { reuseVisibleTilesIfUnchanged } from './reuseVisibleTilesIfUnchangedTestkit';

describe('reuseVisibleTilesIfUnchanged', () => {
  it('reuses the previous visibleTiles array when render keys are unchanged', () => {
    const previousVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
      createUnknownVisibleWorldTile({ q: 1, r: 0 }, 1_000),
    ];
    const nextVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      },
      createUnknownVisibleWorldTile({ q: 1, r: 0 }, 1_000),
    ];

    const reusedVisibleTiles = reuseVisibleTilesIfUnchanged(
      previousVisibleTiles,
      nextVisibleTiles,
    );

    expect(reusedVisibleTiles).toBe(previousVisibleTiles);
  });

  it('returns the next visibleTiles array when a pending tile resolves', () => {
    const pendingVisibleTiles: VisibleWorldTile[] = [
      createUnknownVisibleWorldTile({ q: 2, r: -1 }, 1_000),
    ];
    const resolvedVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 2, r: -1 },
        terrain: 'forest',
        items: [],
        enemyIds: [],
        requestedAt: 1_000,
        resolvedAt: 1_250,
      },
    ];

    const nextVisibleTiles = reuseVisibleTilesIfUnchanged(
      pendingVisibleTiles,
      resolvedVisibleTiles,
    );

    expect(nextVisibleTiles).toBe(resolvedVisibleTiles);
  });
});
