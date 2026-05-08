import { GATHERING_BYPRODUCT_CHANCES } from '../../config';
import { getGatheringByproductKind } from '../../content/structures';
import { GAME_TAGS } from '../../content/tags';
import { structureDefinition } from '../../world';
import { createGame } from '../../state';
import { buildGatheringRewards, maybeGatherByproduct } from './gatheringTestkit';

const originalGatheringByproductChances = {
  ...GATHERING_BYPRODUCT_CHANCES,
};

describe('state reward gathering', () => {
  afterEach(() => {
    GATHERING_BYPRODUCT_CHANCES.tree = originalGatheringByproductChances.tree;
    GATHERING_BYPRODUCT_CHANCES.ore = originalGatheringByproductChances.ore;
  });

  it('returns one aggregated stack for fixed-output gathering nodes', () => {
    const game = createGame(3, 'fixed-gather-reward');
    const rewards = buildGatheringRewards(
      game,
      'tree',
      structureDefinition('tree'),
      3,
    );

    expect(rewards).toEqual([
      expect.objectContaining({
        itemKey: 'logs',
        name: 'Logs',
        quantity: 3,
        tier: 1,
      }),
    ]);
  });

  it('aggregates weighted gathering-table results by item key', () => {
    const game = createGame(3, 'weighted-gather-reward');
    const definition = structureDefinition('herbs');
    const expectedTiers = new Map<string, number>();

    for (const entry of definition.rewardTable ?? []) {
      expectedTiers.set(
        entry.itemKey,
        entry.rewardTier ?? definition.rewardTier,
      );
    }

    const rewards = buildGatheringRewards(game, 'herbs', definition, 25);

    expect(new Set(rewards.map((item) => item.itemKey)).size).toBe(
      rewards.length,
    );
    expect(rewards.reduce((sum, item) => sum + item.quantity, 0)).toBe(25);
    rewards.forEach((item) => {
      expect(expectedTiers.get(item.itemKey!)).toBe(item.tier);
    });
  });

  it('routes byproducts through tree, ore, and flax-specific outputs', () => {
    const treeGame = createGame(3, 'tree-gather-byproduct');
    const oreGame = createGame(3, 'ore-gather-byproduct');
    const flaxGame = createGame(3, 'flax-gather-byproduct');
    GATHERING_BYPRODUCT_CHANCES.tree = 1;
    GATHERING_BYPRODUCT_CHANCES.ore = 1;

    const treeByproduct = maybeGatherByproduct(
      treeGame,
      'tree',
      structureDefinition('tree'),
    );
    const oreByproduct = maybeGatherByproduct(
      oreGame,
      'copper-ore',
      structureDefinition('copper-ore'),
    );
    const flaxByproduct = maybeGatherByproduct(
      flaxGame,
      'flax',
      structureDefinition('flax'),
    );

    expect(treeByproduct?.item.itemKey).toBe('sticks');
    expect(oreByproduct?.item.itemKey).toBe('stone');
    expect(flaxByproduct?.item.itemKey).toBe('string');

    expect(getGatheringByproductKind(undefined)).toBeNull();
  });

  it('uses canonical byproduct tags for tree, ore, and flax', () => {
    expect(getGatheringByproductKind([GAME_TAGS.structure.tree])).toBe('tree');
    expect(getGatheringByproductKind([GAME_TAGS.structure.ore])).toBe('ore');
    expect(
      getGatheringByproductKind([GAME_TAGS.structure.byproductString]),
    ).toBe('string');
  });
});
