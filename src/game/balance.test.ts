import { describe, expect, it } from 'vitest';
import {
  clampItemLevel,
  getEnemyBaseStatsForLevel,
  getPlayerBaseStatsForLevel,
  scaleMainItemStatForLevel,
  scaleSecondaryItemStatForLevel,
} from './balance';
import { buildItemFromConfig } from './content/items';
import { NON_CHANCE_BASED_SECONDARY_STAT_KEYS } from './itemSecondaryStats';
import { getPlayerOverview } from './progression';
import { createGame } from './state';

describe('balance anchors', () => {
  it('matches the player base stat targets at level 1 and 100', () => {
    expect(getPlayerBaseStatsForLevel(1)).toEqual({
      maxHp: 150,
      attack: 50,
      defense: 35,
    });
    expect(getPlayerBaseStatsForLevel(100)).toEqual({
      maxHp: 4000,
      attack: 800,
      defense: 200,
    });
  });

  it('matches the enemy base stat targets at level 1, 100, and above 100', () => {
    expect(getEnemyBaseStatsForLevel(1)).toEqual({
      maxHp: 150,
      attack: 50,
      defense: 35,
    });
    expect(getEnemyBaseStatsForLevel(100)).toEqual({
      maxHp: 5000,
      attack: 1600,
      defense: 1100,
    });
    expect(getEnemyBaseStatsForLevel(101)).toEqual({
      maxHp: 5500,
      attack: 1760,
      defense: 1210,
    });
  });

  it('matches the item stat anchors at level 1 and 100 and clamps item levels', () => {
    expect(scaleMainItemStatForLevel(1)).toBe(1);
    expect(scaleMainItemStatForLevel(100)).toBe(1000);
    expect(scaleSecondaryItemStatForLevel(1)).toBe(1);
    expect(scaleSecondaryItemStatForLevel(100)).toBe(10);
    expect(clampItemLevel(140)).toBe(100);

    const levelOneKnife = buildItemFromConfig('town-knife', {
      id: 'knife-1',
      tier: 1,
    });
    const levelHundredKnife = buildItemFromConfig('town-knife', {
      id: 'knife-100',
      tier: 100,
    });

    expect(levelOneKnife.power).toBe(1);
    expect(levelHundredKnife.power).toBe(1000);
  });

  it('keeps non-chance secondary stat rolls on the same 1-to-10 item-level anchors', () => {
    expect(NON_CHANCE_BASED_SECONDARY_STAT_KEYS).toEqual([
      'attackSpeed',
      'criticalStrikeDamage',
      'lifestealAmount',
      'suppressDamageReduction',
    ]);
    expect(scaleSecondaryItemStatForLevel(1)).toBe(1);
    expect(scaleSecondaryItemStatForLevel(100)).toBe(10);
  });

  it('caps shared gear-derived secondary stats at 75 while leaving bonus experience uncapped', () => {
    const game = createGame(3, 'secondary-cap-seed');
    game.player.equipment.offhand = {
      id: 'cap-test-offhand',
      name: 'Cap Test Offhand',
      slot: 'offhand',
      quantity: 1,
      tier: 100,
      rarity: 'legendary',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
      secondaryStats: [
        { key: 'bonusExperience', value: 143 },
        { key: 'criticalStrikeChance', value: 143 },
        { key: 'poisonChance', value: 143 },
        { key: 'attackSpeed', value: 143 },
      ],
    };

    const heroOverview = getPlayerOverview(game.player);

    expect(heroOverview.bonusExperience).toBe(143);
    expect(heroOverview.criticalStrikeChance).toBe(80);
    expect(heroOverview.poisonChance).toBe(75);
    expect(heroOverview.secondaryStatTotals?.bonusExperience).toEqual({
      effective: 143,
      raw: 143,
    });
    expect(heroOverview.secondaryStatTotals?.criticalStrikeChance).toEqual({
      effective: 80,
      raw: 148,
    });
    expect(heroOverview.secondaryStatTotals?.poisonChance).toEqual({
      effective: 75,
      raw: 143,
    });
    expect(
      heroOverview.secondaryStatTotals?.attackSpeed?.effective,
    ).toBeCloseTo(1.75);
    expect(heroOverview.secondaryStatTotals?.attackSpeed?.raw).toBeCloseTo(
      2.43,
    );
  });
});
