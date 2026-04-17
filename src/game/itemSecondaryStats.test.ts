import { describe, expect, it } from 'vitest';
import { buildGeneratedItemFromConfig } from './content/items';

describe('generated item secondary stats', () => {
  it('gives shields a default block chance secondary stat', () => {
    const shield = buildGeneratedItemFromConfig('generated-shield', {
      id: 'shield-secondary-test',
      tier: 4,
      rarity: 'common',
    });

    expect(shield.secondaryStatCapacity).toBe(1);
    expect(shield.secondaryStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'blockChance',
        }),
      ]),
    );
  });

  it('rolls two random main stats for accessories and cloaks', () => {
    const ring = buildGeneratedItemFromConfig('generated-ring-left', {
      id: 'ring-main-stat-test',
      tier: 6,
      rarity: 'legendary',
    });

    expect([ring.power > 0, ring.defense > 0, ring.maxHp > 0].filter(Boolean)).toHaveLength(2);
    expect(ring.secondaryStatCapacity).toBe(3);
    expect(new Set((ring.secondaryStats ?? []).map((stat) => stat.key)).size).toBe(
      ring.secondaryStats?.length ?? 0,
    );
  });
});
