import { describe, expect, it } from 'vitest';
import type { ResolveWorldTilesRequest } from '@realmfall/common';
import { resolveWorldTiles } from './worldTileResolutionPayloads';

describe('resolveWorldTiles', () => {
  it('builds deterministic payloads with enemy references resolved', () => {
    const request: ResolveWorldTilesRequest = {
      requestId: 'req-1',
      seed: 'worker-payload-seed',
      bloodMoonActive: false,
      coords: [
        { q: 2, r: 0 },
        { q: 2, r: -1 },
      ],
    };

    const first = resolveWorldTiles(request);
    const second = resolveWorldTiles(request);

    expect(second).toEqual(first);
    expect(first.requestId).toBe('req-1');
    expect(first.tiles.map((entry) => entry.coord)).toEqual(request.coords);

    first.tiles.forEach((entry) => {
      entry.tile.enemyIds.forEach((enemyId) => {
        expect(entry.enemies.some((enemy) => enemy.id === enemyId)).toBe(true);
      });
    });
  });
});
