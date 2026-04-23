import { EquipmentSlotId } from './content/ids';
import { buildItemFromConfig } from './content/items';
import { RECIPE_BOOK_RECIPES } from './crafting';
import { GENERATED_CRAFTING_RECIPES } from './generatedCraftingRecipes';
import { craftRecipe, createGame } from './state';

const REDISTRIBUTED_INGOT_KEYS = [
  'copper-ingot',
  'tin-ingot',
  'iron-ingot',
  'gold-ingot',
  'platinum-ingot',
] as const;

describe('generated crafting recipes', () => {
  it('splits redistributed metal gear recipes across all existing ingots', () => {
    const redistributedRecipes = GENERATED_CRAFTING_RECIPES.filter(
      ({ output }) =>
        !output.itemKey?.startsWith('icon-wand-') &&
        !output.itemKey?.startsWith('icon-magical-sphere-') &&
        !output.itemKey?.startsWith('icon-ring-') &&
        !output.itemKey?.startsWith('icon-necklace-'),
    );
    const counts = new Map<string, number>(
      REDISTRIBUTED_INGOT_KEYS.map((itemKey) => [itemKey, 0]),
    );

    redistributedRecipes.forEach((recipe) => {
      const ingot = recipe.ingredients.find((ingredient) =>
        REDISTRIBUTED_INGOT_KEYS.includes(
          ingredient.itemKey as (typeof REDISTRIBUTED_INGOT_KEYS)[number],
        ),
      );
      if (!ingot?.itemKey) {
        throw new Error(`Recipe ${recipe.id} is missing an ingot ingredient.`);
      }
      counts.set(ingot.itemKey, (counts.get(ingot.itemKey) ?? 0) + 1);
    });

    const quantities = [...counts.values()];

    expect([...counts.keys()]).toEqual([...REDISTRIBUTED_INGOT_KEYS]);
    expect(
      Math.max(...quantities) - Math.min(...quantities),
    ).toBeLessThanOrEqual(1);
  });

  it('keeps at least one weapon recipe craftable for every ingot', () => {
    const weaponRecipes = GENERATED_CRAFTING_RECIPES.filter(
      ({ output }) =>
        output.slot === EquipmentSlotId.Weapon ||
        output.slot === EquipmentSlotId.Offhand,
    );

    const coveredIngots = new Set(
      weaponRecipes.flatMap((recipe) =>
        recipe.ingredients.flatMap((ingredient) =>
          REDISTRIBUTED_INGOT_KEYS.includes(
            ingredient.itemKey as (typeof REDISTRIBUTED_INGOT_KEYS)[number],
          )
            ? [ingredient.itemKey]
            : [],
        ),
      ),
    );

    expect([...coveredIngots].sort()).toEqual(
      [...REDISTRIBUTED_INGOT_KEYS].sort(),
    );
  });

  it('crafts a generated weapon with only its assigned ingot path available', () => {
    const recipe = RECIPE_BOOK_RECIPES.find(
      ({ output }) =>
        output.slot === EquipmentSlotId.Weapon &&
        output.itemKey !== undefined &&
        !output.itemKey.startsWith('icon-wand-'),
    );
    if (!recipe?.output.itemKey) {
      throw new Error('Expected a generated weapon recipe.');
    }

    const game = createGame(3, 'generated-crafting-ingot-path');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
    game.player.learnedRecipeIds.push(recipe.id);
    game.player.inventory.push(
      ...recipe.ingredients.map((ingredient, index) =>
        buildItemFromConfig(ingredient.itemKey!, {
          id: `${ingredient.itemKey}-${index}`,
          quantity: ingredient.quantity,
        }),
      ),
    );

    const crafted = craftRecipe(game, recipe.id);

    expect(
      crafted.player.inventory.some(
        (item) => item.itemKey === recipe.output.itemKey,
      ),
    ).toBe(true);
  });
});
