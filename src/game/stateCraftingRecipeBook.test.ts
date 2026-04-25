import { createGame, getRecipeBookEntries, toggleFavoriteRecipe } from './state';
import { findResolvedEnemyRecipeDrop } from './stateCraftingTestHelpers';

describe('game state crafting recipe book', () => {
  it('can drop an unlearned recipe from enemies', () => {
    const dropped = findResolvedEnemyRecipeDrop('recipe-drop-seed', 200);

    expect(dropped).not.toBeNull();
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

  it('can drop the hand cloth recipe from enemies', () => {
    const dropped = findResolvedEnemyRecipeDrop(
      'hand-recipe-drop-seed',
      500,
      'hand-cloth',
    );

    expect(dropped).not.toBeNull();
    expect(dropped?.recipeId).toBe('hand-cloth');
  });

  it('marks favorite recipes in the recipe book entry list', () => {
    const entries = getRecipeBookEntries(
      ['cook-cooked-fish'],
      ['cook-cooked-fish'],
    );

    expect(
      entries.find((entry) => entry.id === 'cook-cooked-fish'),
    ).toMatchObject({ favorite: true });
  });

  it('can toggle favorite recipes on learned-only entries', () => {
    const state = createGame();
    const action = toggleFavoriteRecipe(state, 'cook-cooked-fish');

    expect(action.player.favoriteRecipeIds).toEqual(['cook-cooked-fish']);

    const toggledAgain = toggleFavoriteRecipe(action, 'cook-cooked-fish');
    expect(toggledAgain.player.favoriteRecipeIds).toEqual([]);
  });

  it('cannot favorite unlearned recipes', () => {
    const state = createGame();
    const next = toggleFavoriteRecipe(state, 'craft-icon-helmet-01');

    expect(next.player.favoriteRecipeIds).toEqual([]);
  });
});
