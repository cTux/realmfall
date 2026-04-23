import {
  createGame,
  getTileAt,
  moveToTile,
  startCombat,
  type GameState,
} from './state';
import { buildItemFromConfig } from './content/items';
import { GENERATED_CRAFTING_RECIPES } from './generatedCraftingRecipes';

export function buildRecipeInventory(recipeId: string, quantityMultiplier = 1) {
  const recipe = GENERATED_CRAFTING_RECIPES.find(
    (entry) => entry.id === recipeId,
  );
  if (!recipe) {
    throw new Error(`Expected recipe ${recipeId}.`);
  }

  return recipe.ingredients.map((ingredient, index) =>
    buildItemFromConfig(ingredient.itemKey!, {
      id: `${ingredient.itemKey}-${index}`,
      quantity: ingredient.quantity * quantityMultiplier,
    }),
  );
}

export function findResolvedEnemyRecipeDrop(
  seedPrefix: string,
  maxAttempts: number,
) {
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

export function seedRecipeDropEncounter(
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
