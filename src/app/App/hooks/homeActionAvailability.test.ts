import { describe, expect, it } from 'vitest';

import { canSetHomeAction } from './homeActionAvailability';

const factionClaim = {
  borderColor: '#fff',
  ownerId: 'faction-1',
  ownerName: 'The Wardens',
  ownerType: 'faction',
} as const;

const playerClaim = {
  borderColor: '#fff',
  ownerId: 'player',
  ownerName: 'Player',
  ownerType: 'player',
} as const;

describe('canSetHomeAction', () => {
  it('allows setting home on an unclaimed tile away from the current home', () => {
    expect(
      canSetHomeAction({
        currentTileClaim: null,
        homeHex: { q: 0, r: 0 },
        playerCoord: { q: 1, r: 0 },
      }),
    ).toBe(true);
  });

  it('blocks the action on non-player claims and on the current home tile', () => {
    expect(
      canSetHomeAction({
        currentTileClaim: factionClaim,
        homeHex: { q: 0, r: 0 },
        playerCoord: { q: 1, r: 0 },
      }),
    ).toBe(false);
    expect(
      canSetHomeAction({
        currentTileClaim: playerClaim,
        homeHex: { q: 0, r: 0 },
        playerCoord: { q: 0, r: 0 },
      }),
    ).toBe(false);
  });
});
