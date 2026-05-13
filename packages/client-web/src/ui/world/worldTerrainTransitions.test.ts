import { hexKey, type HexCoord } from '@realmfall/core/game/hex';
import type { Terrain } from '@realmfall/core/game/stateTypes';
import {
  getTerrainTransitionOverlays,
  getTerrainTransitionSignature,
} from './worldTerrainTransitions';
import type { VisibleWorldTile } from './visibleWorldTiles';

function createVisibleTile(
  coord: HexCoord,
  terrain: Terrain,
): VisibleWorldTile {
  return {
    coord,
    terrain,
    items: [],
    enemyIds: [],
  };
}

describe('worldTerrainTransitions', () => {
  it('emits edge overlays when neighboring biomes differ', () => {
    const center = createVisibleTile({ q: 0, r: 0 }, 'forest');
    const east = createVisibleTile({ q: 1, r: 0 }, 'desert');
    const southEast = createVisibleTile({ q: 0, r: 1 }, 'meadow');
    const visibleTileMap = new Map<string, VisibleWorldTile>([
      [hexKey(center.coord), center],
      [hexKey(east.coord), east],
      [hexKey(southEast.coord), southEast],
    ]);

    const overlays = getTerrainTransitionOverlays(center, visibleTileMap);

    expect(overlays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ edgeIndex: 0 }),
        expect.objectContaining({ edgeIndex: 5 }),
      ]),
    );
    expect(getTerrainTransitionSignature(center, visibleTileMap)).not.toBe('');
  });

  it('skips overlays when neighboring tiles share the same biome family', () => {
    const center = createVisibleTile({ q: 0, r: 0 }, 'forest');
    const neighbor = createVisibleTile({ q: 1, r: 0 }, 'grove');
    const visibleTileMap = new Map<string, VisibleWorldTile>([
      [hexKey(center.coord), center],
      [hexKey(neighbor.coord), neighbor],
    ]);

    expect(getTerrainTransitionOverlays(center, visibleTileMap)).toEqual([]);
  });
});
