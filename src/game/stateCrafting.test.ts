import {
  activateInventoryItem,
  craftRecipe,
  createGame,
  getGoldAmount,
  getRecipeBookEntries,
  getTileAt,
  moveToTile,
  sellInventoryItem,
  startCombat,
  takeTileItem,
  useItem,
  type GameState,
} from './state';
import { GameTag } from './content/tags';
import { buildItemFromConfig } from './content/items';
import { Skill } from './types';

describe('game state crafting', () => {
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
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
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
          buildItemFromConfig('iron-ingot', { id: 'ingot-1', quantity: 20 }),
          buildItemFromConfig('sticks', { id: 'sticks-1', quantity: 20 }),
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

  it('learns a dropped recipe page when used', () => {
    const game = createGame(3, 'recipe-use-seed');
    const originalLearnedRecipeIds = game.player.learnedRecipeIds;
    game.player.inventory.push({
      id: 'recipe-craft-weapon',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const learned = useItem(game, 'recipe-craft-weapon');

    expect(learned.player.learnedRecipeIds).toContain('craft-icon-axe-01');
    expect(learned.player.learnedRecipeIds).not.toBe(originalLearnedRecipeIds);
    expect(
      learned.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon',
      ),
    ).toBe(false);
  });

  it('does not consume an already learned recipe page when used', () => {
    const game = createGame(3, 'recipe-known-seed');
    game.player.learnedRecipeIds = ['craft-icon-axe-01'];
    game.player.inventory.push({
      id: 'recipe-craft-weapon-known',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const unchanged = useItem(game, 'recipe-craft-weapon-known');

    expect(unchanged.player.learnedRecipeIds).toEqual(['craft-icon-axe-01']);
    expect(
      unchanged.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-known',
      ),
    ).toBe(true);
    expect(unchanged.logs[0]?.text).toContain('already know');
  });

  it('routes inventory activation for learned recipe pages through the use path', () => {
    const game = createGame(3, 'recipe-activation-seed');
    game.player.learnedRecipeIds = ['craft-icon-axe-01'];
    game.player.inventory.push({
      id: 'recipe-craft-weapon-activate',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const unchanged = activateInventoryItem(
      game,
      'recipe-craft-weapon-activate',
    );

    expect(unchanged.player.learnedRecipeIds).toEqual(['craft-icon-axe-01']);
    expect(
      unchanged.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-activate',
      ),
    ).toBe(true);
    expect(unchanged.logs[0]?.text).toContain('already know');
  });

  it('sells recipe pages in town for elevated value', () => {
    const game = createGame(3, 'sell-recipe-page-seed');
    game.tiles['0,0'] = {
      ...getTileAt(game, { q: 0, r: 0 }),
      structure: 'town',
    };
    game.player.inventory.push({
      id: 'recipe-craft-weapon-sell',
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
      quantity: 1,
      tier: 2,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    });

    const sold = sellInventoryItem(game, 'recipe-craft-weapon-sell');

    expect(
      sold.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-sell',
      ),
    ).toBe(false);
    expect(getGoldAmount(sold.player.inventory)).toBe(40);
    expect(sold.logs[0]?.text).toContain('Recipe: Axe 01');
    expect(sold.logs[0]?.text).toContain('40 gold');
  });

  it('can drop an unlearned recipe from enemies', () => {
    const dropped = findResolvedEnemyRecipeDrop('recipe-drop-seed', 200);

    expect(dropped).not.toBeNull();
  });

  it('unlocks the matching recipe book entry after looting and using an enemy recipe page', () => {
    const dropped = findResolvedEnemyRecipeDrop('recipe-loot-use-seed', 400);

    expect(dropped).not.toBeNull();

    const recipePage = getTileAt(dropped!.resolved, {
      q: 2,
      r: 0,
    }).items.find((item) => item.recipeId === dropped!.recipeId);
    expect(recipePage).toBeDefined();
    expect(recipePage?.itemKey).toBe('recipe-book');
    expect(recipePage?.icon).toBeTruthy();

    const looted = takeTileItem(dropped!.resolved, recipePage!.id);
    const learned = useItem(looted, recipePage!.id);

    expect(learned.player.learnedRecipeIds).toContain(dropped!.recipeId);
    expect(
      getRecipeBookEntries(learned.player.learnedRecipeIds).some(
        (entry) => entry.id === dropped!.recipeId && entry.learned,
      ),
    ).toBe(true);
  });

  it('exposes learned and unlearned recipe entries for the recipe book', () => {
    const entries = getRecipeBookEntries(['cook-cooked-fish']);

    expect(
      entries.some((entry) => entry.id === 'cook-cooked-fish' && entry.learned),
    ).toBe(true);
    expect(
      entries.some(
        (entry) => entry.id === 'craft-icon-helmet-01' && !entry.learned,
      ),
    ).toBe(true);
    expect(entries.some((entry) => entry.id === 'craft-weapon')).toBe(false);
    expect(entries.some((entry) => entry.id === 'craft-ashen-blade')).toBe(
      false,
    );
  });
});

function findResolvedEnemyRecipeDrop(seedPrefix: string, maxAttempts: number) {
  for (let index = 0; index < maxAttempts; index += 1) {
    const game = createGame(3, `${seedPrefix}-${index}`);
    const target = { q: 2, r: 0 };
    game.player.learnedRecipeIds = ['cook-cooked-fish'];
    seedRecipeDropEncounter(game, target);

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);
    const recipePage = getTileAt(resolved, target).items.find((item) =>
      Boolean(item.recipeId),
    );
    if (!recipePage?.recipeId) continue;

    return { resolved, recipeId: recipePage.recipeId };
  }

  return null;
}

function seedRecipeDropEncounter(
  game: GameState,
  target: { q: number; r: number },
) {
  game.tiles['2,0'] = {
    coord: target,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: ['enemy-2,0-0'],
  };
  game.enemies['enemy-2,0-0'] = {
    id: 'enemy-2,0-0',
    name: 'Bandit',
    coord: target,
    tier: 4,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 5,
    elite: true,
  };
  game.player.coord = { q: 1, r: 0 };
}
