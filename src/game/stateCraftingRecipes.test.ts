import { craftRecipe, createGame, getRecipeBookEntries } from './state';
import { buildItemFromConfig } from './content/items';
import { Skill } from './types';
import { buildRecipeInventory } from './stateCraftingTestHelpers';

describe('game state crafting recipes', () => {
  it('cooks raw fish with available burnable fuel and levels cooking', () => {
    const game = createGame(3, 'cooking-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'camp' };
    game.player.inventory.push(
      {
        id: 'raw-fish-1',
        name: 'Raw Fish',
        itemKey: 'raw-fish',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'coal-1',
        name: 'Coal',
        itemKey: 'coal',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const cooked = craftRecipe(game, 'cook-cooked-fish');

    expect(
      cooked.player.inventory.some((item) => item.name === 'Cooked Fish'),
    ).toBe(true);
    expect(
      cooked.player.inventory.find((item) => item.itemKey === 'raw-fish')
        ?.quantity,
    ).toBe(9);
    expect(
      cooked.player.inventory.find((item) => item.itemKey === 'coal')?.quantity,
    ).toBe(9);
    expect(cooked.player.skills[Skill.Cooking].xp).toBeGreaterThan(0);
  });

  it('crafts slot gear from recipe requirements and levels crafting', () => {
    const game = createGame(3, 'crafting-seed');
    game.player.level = 12;
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
    game.player.learnedRecipeIds.push('craft-icon-axe-01');
    game.player.inventory.push(
      ...buildRecipeInventory('craft-icon-axe-01', 20),
    );

    const crafted = craftRecipe(game, 'craft-icon-axe-01');
    const craftedWeapon = crafted.player.inventory.find(
      (item) => item.itemKey === 'icon-axe-01',
    );

    expect(craftedWeapon).toBeDefined();
    expect(craftedWeapon?.tier).toBe(game.player.level);
    expect(craftedWeapon?.power).toBeGreaterThan(
      buildItemFromConfig('icon-axe-01').power,
    );
    expect(crafted.player.skills[Skill.Crafting].xp).toBeGreaterThan(0);
  });

  it('rolls crafted gear through the shared rarity cascade', () => {
    const upgradedCraft = Array.from({ length: 64 }, (_, index) => index)
      .map((index) => {
        const game = createGame(3, `crafted-rarity-${index}`);
        game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
        game.player.learnedRecipeIds.push('craft-icon-axe-01');
        game.player.inventory.push(
          ...buildRecipeInventory('craft-icon-axe-01', 20),
        );

        return craftRecipe(game, 'craft-icon-axe-01').player.inventory.find(
          (item) => item.itemKey === 'icon-axe-01' && item.rarity !== 'common',
        );
      })
      .find(Boolean);

    expect(upgradedCraft).toBeDefined();
  });

  it('smelts ore into ingots at a furnace and levels smelting', () => {
    const game = createGame(3, 'smelting-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'furnace' };
    game.player.learnedRecipeIds.push('smelt-copper-ingot');
    game.player.inventory.push(
      {
        id: 'ore-1',
        name: 'Copper Ore',
        itemKey: 'copper-ore',
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'coal-1',
        name: 'Coal',
        itemKey: 'coal',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const smelted = craftRecipe(game, 'smelt-copper-ingot');

    expect(
      smelted.player.inventory.some((item) => item.itemKey === 'copper-ingot'),
    ).toBe(true);
    expect(
      smelted.player.inventory.find((item) => item.itemKey === 'copper-ore')
        ?.quantity,
    ).toBe(19);
    expect(
      smelted.player.inventory.find((item) => item.itemKey === 'coal')
        ?.quantity,
    ).toBe(9);
    expect(smelted.player.skills[Skill.Smelting].xp).toBeGreaterThan(0);
  });

  it('increases cooking and smelting recipe output from profession levels', () => {
    const cookingGame = createGame(3, 'cooking-output-seed');
    cookingGame.tiles['0,0'] = {
      ...cookingGame.tiles['0,0'],
      structure: 'camp',
    };
    cookingGame.player.learnedRecipeIds.push('cook-cooked-fish');
    cookingGame.player.skills[Skill.Cooking].level = 6;
    cookingGame.player.inventory.push(
      buildItemFromConfig('raw-fish', { id: 'raw-fish-1', quantity: 1 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 1 }),
    );

    const cooked = craftRecipe(cookingGame, 'cook-cooked-fish');

    expect(
      cooked.player.inventory.find((item) => item.itemKey === 'cooked-fish')
        ?.quantity,
    ).toBe(2);

    const smeltingGame = createGame(3, 'smelting-output-seed');
    smeltingGame.tiles['0,0'] = {
      ...smeltingGame.tiles['0,0'],
      structure: 'furnace',
    };
    smeltingGame.player.learnedRecipeIds.push('smelt-copper-ingot');
    smeltingGame.player.skills[Skill.Smelting].level = 6;
    smeltingGame.player.inventory.push(
      buildItemFromConfig('copper-ore', { id: 'ore-1', quantity: 1 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 1 }),
    );

    const smelted = craftRecipe(smeltingGame, 'smelt-copper-ingot');

    expect(
      smelted.player.inventory.find((item) => item.itemKey === 'copper-ingot')
        ?.quantity,
    ).toBe(2);
  });

  it('can craft up to a fixed batch size when requested', () => {
    const game = createGame(3, 'craft-batch-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'camp' };
    game.player.learnedRecipeIds.push('cook-cooked-fish');
    game.player.inventory.push(
      buildItemFromConfig('raw-fish', { id: 'raw-fish-1', quantity: 5 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 5 }),
    );

    const crafted = craftRecipe(game, 'cook-cooked-fish', 5);

    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'cooked-fish')
        ?.quantity,
    ).toBe(5);
    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'raw-fish'),
    ).toBeUndefined();
  });

  it('can craft the maximum possible amount when requested', () => {
    const game = createGame(3, 'craft-max-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'camp' };
    game.player.learnedRecipeIds.push('cook-cooked-fish');
    game.player.inventory.push(
      buildItemFromConfig('raw-fish', { id: 'raw-fish-1', quantity: 7 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 3 }),
    );

    const crafted = craftRecipe(game, 'cook-cooked-fish', 'max');

    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'cooked-fish')
        ?.quantity,
    ).toBe(3);
    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'coal'),
    ).toBeUndefined();
    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'raw-fish')
        ?.quantity,
    ).toBe(4);
  });

  it('smelts the expanded ore set into ingots with one iron recipe', () => {
    const game = createGame(3, 'expanded-smelting-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'furnace' };
    game.player.learnedRecipeIds.push(
      'smelt-tin-ingot',
      'smelt-iron-ingot',
      'smelt-gold-ingot',
      'smelt-platinum-ingot',
    );
    game.player.inventory.push(
      buildItemFromConfig('tin-ore', { id: 'tin-ore-1', quantity: 20 }),
      buildItemFromConfig('iron-ore', { id: 'iron-ore-1', quantity: 20 }),
      buildItemFromConfig('gold-ore', { id: 'gold-ore-1', quantity: 30 }),
      buildItemFromConfig('platinum-ore', {
        id: 'platinum-ore-1',
        quantity: 40,
      }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 40 }),
    );

    const smeltedTin = craftRecipe(game, 'smelt-tin-ingot');
    const smeltedIron = craftRecipe(smeltedTin, 'smelt-iron-ingot');
    const smeltedGold = craftRecipe(smeltedIron, 'smelt-gold-ingot');
    const smeltedPlatinum = craftRecipe(smeltedGold, 'smelt-platinum-ingot');

    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'tin-ingot',
      ),
    ).toBe(true);
    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'iron-ingot',
      ),
    ).toBe(true);
    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'gold-ingot',
      ),
    ).toBe(true);
    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'platinum-ingot',
      ),
    ).toBe(true);
    expect(
      getRecipeBookEntries(smeltedPlatinum.player.learnedRecipeIds).filter(
        (entry) => entry.id.startsWith('smelt-iron-ingot'),
      ),
    ).toHaveLength(1);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'tin-ore',
      )?.quantity,
    ).toBe(19);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'iron-ore',
      )?.quantity,
    ).toBe(19);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'gold-ore',
      )?.quantity,
    ).toBe(29);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'platinum-ore',
      )?.quantity,
    ).toBe(39);
    expect(
      smeltedPlatinum.player.inventory.find((item) => item.itemKey === 'coal')
        ?.quantity,
    ).toBe(36);
  });

  it('requires the matching hex type for cooking and crafting recipes', () => {
    const game = createGame(3, 'recipe-station-seed');
    game.player.inventory.push(
      {
        id: 'raw-fish-1',
        name: 'Raw Fish',
        itemKey: 'raw-fish',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'coal-1',
        name: 'Coal',
        itemKey: 'coal',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const denied = craftRecipe(game, 'cook-cooked-fish');

    expect(denied.logs[0]?.text).toMatch(/stand at a campfire/i);
  });

  it('requires learning a recipe before crafting it', () => {
    const game = createGame(3, 'recipe-learning-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
    game.player.inventory.push(
      {
        id: 'ingot-1',
        name: 'Iron Ingot',
        itemKey: 'iron-ingot',
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'sticks-1',
        name: 'Sticks',
        itemKey: 'sticks',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const denied = craftRecipe(game, 'craft-icon-axe-01');

    expect(denied.logs[0]?.text).toMatch(/have not learned/i);
  });
});
