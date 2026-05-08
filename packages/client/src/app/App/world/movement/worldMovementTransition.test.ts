import type { VisibleWorldTile } from '../../../../ui/world/visibleWorldTiles';
import { createWorldMovementTransition } from './worldMovementTransitionTestkit';

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
      displayTiles: [
        { coord: { q: -2, r: 0 } },
        { coord: { q: 0, r: 0 } },
        { coord: { q: 3, r: 0 } },
      ],
      incomingTiles: [{ coord: { q: 3, r: 0 } }],
      outgoingTiles: [{ coord: { q: -2, r: 0 } }],
    });
  });

  it('preserves an initial player offset for post-combat visual continuation', () => {
    expect(
      createWorldMovementTransition({
        fromCoord: { q: 1, r: 0 },
        nextVisibleTiles: [],
        previousVisibleTiles: [],
        startedAtMs: 0,
        toCoord: { q: 2, r: 0 },
        playerOffsetAtStart: { x: 18, y: -4 },
      }),
    ).toMatchObject({
      fromCoord: { q: 1, r: 0 },
      toCoord: { q: 2, r: 0 },
      playerOffsetAtStart: { x: 18, y: -4 },
    });
  });
});
