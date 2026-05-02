import type { VisibleWorldTile } from '../../../../ui/world/visibleWorldTiles';
import { createWorldMovementTransition } from './worldMovementTransition';

describe('worldMovementTransition', () => {
  it('tracks incoming and outgoing edge tiles for a one-hex move', () => {
    const previousVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: -2, r: 0 },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      },
      {
        coord: { q: 0, r: 0 },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      },
    ];
    const nextVisibleTiles: VisibleWorldTile[] = [
      {
        coord: { q: 0, r: 0 },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      },
      {
        coord: { q: 3, r: 0 },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      },
    ];

    expect(
      createWorldMovementTransition({
        fromCoord: { q: 0, r: 0 },
        nextVisibleTiles,
        previousVisibleTiles,
        startedAtMs: 0,
        toCoord: { q: 1, r: 0 },
      }),
    ).toMatchObject({
      incomingTiles: [{ coord: { q: 3, r: 0 } }],
      outgoingTiles: [{ coord: { q: -2, r: 0 } }],
    });
  });
});
