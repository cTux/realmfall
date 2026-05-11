import {
  createUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from '../../../ui/world/visibleWorldTiles';
import type { Item } from '@realmfall/core/game/itemTypes';
import { reuseVisibleTilesIfUnchanged } from './reuseVisibleTilesIfUnchangedTestkit';

function createItem(id: string, quantity: number): Item {
  return {
    id,
    name: 'Test Item',
    quantity,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

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

  it('returns the next visibleTiles array when a tile item id changes', () => {
    const previousVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [createItem('iron-ore', 1)],
        enemyIds: [],
      },
    ];
    const nextVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [createItem('copper-ore', 1)],
        enemyIds: [],
      },
    ];

    const reusedVisibleTiles = reuseVisibleTilesIfUnchanged(
      previousVisibleTiles,
      nextVisibleTiles,
    );

    expect(reusedVisibleTiles).toBe(nextVisibleTiles);
  });

  it('returns the next visibleTiles array when a tile item quantity changes', () => {
    const previousVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [createItem('iron-ore', 1)],
        enemyIds: [],
      },
    ];
    const nextVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        terrain: 'plains',
        items: [createItem('iron-ore', 2)],
        enemyIds: [],
      },
    ];

    const reusedVisibleTiles = reuseVisibleTilesIfUnchanged(
      previousVisibleTiles,
      nextVisibleTiles,
    );

    expect(reusedVisibleTiles).toBe(nextVisibleTiles);
  });
});
