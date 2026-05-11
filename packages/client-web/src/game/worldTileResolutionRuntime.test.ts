import { describe, expect, it } from 'vitest';
import type { ResolvedWorldTilePayload } from '@realmfall/common';
import { hydrateResolvedWorldTilePayload } from './worldTileResolutionRuntimeTestkit';

function createPayload(
  enemy: ResolvedWorldTilePayload['enemies'][number],
  item?: ResolvedWorldTilePayload['tile']['items'][number],
): ResolvedWorldTilePayload {
  const items = item ? [item] : [];
  return {
    coord: { q: 2, r: -1 },
    tile: {
      coord: { q: 2, r: -1 },
      terrain: 'forest',
      items,
      enemyIds: [enemy.id],
    },
    enemies: [enemy],
  };
}

describe('hydrateResolvedWorldTilePayload', () => {
  it('refreshes configured enemy names when worker payloads contain i18n keys', () => {
    const hydrated = hydrateResolvedWorldTilePayload(
      createPayload({
        id: 'enemy-2,-1-0',
        enemyTypeId: 'wolf',
        name: 'game.enemy.wolf.name',
        coord: { q: 2, r: -1 },
        rarity: 'common',
        tier: 1,
        hp: 10,
        maxHp: 10,
        attack: 3,
        defense: 1,
        xp: 5,
        elite: false,
      }),
    );

    expect(hydrated.enemies[0]?.name).toBe('Wolf');
  });

  it('preserves explicit enemy names from payloads', () => {
    const hydrated = hydrateResolvedWorldTilePayload(
      createPayload({
        id: 'enemy-2,-1-1',
        enemyTypeId: 'wolf',
        name: 'Sera',
        coord: { q: 2, r: -1 },
        rarity: 'rare',
        tier: 3,
        hp: 24,
        maxHp: 24,
        attack: 7,
        defense: 4,
        xp: 15,
        elite: true,
      }),
    );

    expect(hydrated.enemies[0]?.name).toBe('Sera');
  });

  it('retains item tint metadata when present in payloads', () => {
    const hydrated = hydrateResolvedWorldTilePayload(
      createPayload(
        {
          id: 'enemy-2,-1-2',
          enemyTypeId: 'wolf',
          name: 'Sera',
          coord: { q: 2, r: -1 },
          rarity: 'common',
          tier: 1,
          hp: 10,
          maxHp: 10,
          attack: 3,
          defense: 1,
          xp: 5,
          elite: false,
        },
        {
          id: 'item-1',
          itemKey: 'pepper',
          name: 'Pepper',
          quantity: 1,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 1,
          thirst: 0,
          icon: '/assets/icons/pepper.svg',
          tint: '#00ff00',
        },
      ),
    );

    expect(hydrated.tile.items[0]?.tint).toBe('#00ff00');
  });
});
