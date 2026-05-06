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

function getRecipe(outputItemKey: string) {
  const recipe = GENERATED_CRAFTING_RECIPES.find(
    ({ output }) => output.itemKey === outputItemKey,
  );
  if (!recipe) {
    throw new Error(`Expected recipe for ${outputItemKey}.`);
  }
  return recipe;
}

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

  it('assigns generated ring recipes with the preserved left-first mirrored split', () => {
    const ringRecipes = GENERATED_CRAFTING_RECIPES.filter(
      ({ output }) => output.itemKey?.startsWith('icon-ring-') ?? false,
    );
    const expectedLeft = Math.ceil(ringRecipes.length / 2);
    const expectedRight = Math.floor(ringRecipes.length / 2);
    const outputSlots = ringRecipes.map(({ output }) => output.slot);
    const left = ringRecipes.filter(
      ({ output }) => output.slot === EquipmentSlotId.RingLeft,
    ).length;
    const right = ringRecipes.filter(
      ({ output }) => output.slot === EquipmentSlotId.RingRight,
    ).length;

    expect(left).toBe(expectedLeft);
    expect(right).toBe(expectedRight);
    expect(outputSlots).toEqual([
      ...Array.from({ length: expectedLeft }, () => EquipmentSlotId.RingLeft),
      ...Array.from({ length: expectedRight }, () => EquipmentSlotId.RingRight),
    ]);
  });

  it('preserves generated recipe ids and output item keys', () => {
    GENERATED_CRAFTING_RECIPES.forEach((recipe) => {
      expect(recipe.output.itemKey).toBeTruthy();
      expect(recipe.id).toBe(`craft-${recipe.output.itemKey}`);
      expect(recipe.output.id).toBe(`crafted-${recipe.output.itemKey}`);
    });
  });

  it('preserves ingredient profiles for each generated crafting family', () => {
    expect(getRecipe('icon-wand-01').ingredients).toEqual([
      { itemKey: 'tin-ingot', name: 'Tin Ingot', quantity: 2 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ]);
    expect(getRecipe('icon-magical-sphere-01').ingredients).toEqual([
      { itemKey: 'gold-ingot', name: 'Gold Ingot', quantity: 2 },
      { itemKey: 'platinum-ingot', name: 'Platinum Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 3 },
    ]);
    expect(getRecipe('icon-shield-01').ingredients).toEqual([
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 2 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
      {
        itemKey: 'leather-scraps',
        name: 'Leather Scraps',
        quantity: 2,
      },
    ]);
    expect(getRecipe('icon-ring-01').ingredients).toEqual([
      { itemKey: 'gold-ingot', name: 'Gold Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
    ]);
    expect(getRecipe('icon-necklace-01').ingredients).toEqual([
      { itemKey: 'gold-ingot', name: 'Gold Ingot', quantity: 1 },
      { itemKey: 'platinum-ingot', name: 'Platinum Ingot', quantity: 1 },
      { itemKey: 'arcane-dust', name: 'Mana Dust', quantity: 2 },
    ]);
    expect(getRecipe('icon-two-handed-sword-01').ingredients).toEqual([
      { itemKey: 'iron-ingot', name: 'Iron Ingot', quantity: 4 },
      { itemKey: 'logs', name: 'Logs', quantity: 1 },
    ]);
    expect(getRecipe('icon-sword-01').ingredients).toEqual([
      { itemKey: 'tin-ingot', name: 'Tin Ingot', quantity: 2 },
      { itemKey: 'sticks', name: 'Sticks', quantity: 1 },
    ]);
    expect(getRecipe('icon-chest-01').ingredients).toEqual([
      { itemKey: 'cloth', name: 'Cloth', quantity: 4 },
      {
        itemKey: 'leather-scraps',
        name: 'Leather Scraps',
        quantity: 4,
      },
      { itemKey: 'copper-ingot', name: 'Copper Ingot', quantity: 2 },
    ]);
    expect(getRecipe('icon-helmet-01').ingredients).toEqual([
      { itemKey: 'cloth', name: 'Cloth', quantity: 2 },
      {
        itemKey: 'leather-scraps',
        name: 'Leather Scraps',
        quantity: 2,
      },
      { itemKey: 'copper-ingot', name: 'Copper Ingot', quantity: 1 },
    ]);
    expect(getRecipe('icon-bracers-01').ingredients).toEqual([
      {
        itemKey: 'leather-scraps',
        name: 'Leather Scraps',
        quantity: 2,
      },
      { itemKey: 'cloth', name: 'Cloth', quantity: 1 },
      { itemKey: 'platinum-ingot', name: 'Platinum Ingot', quantity: 1 },
    ]);
  });
});
