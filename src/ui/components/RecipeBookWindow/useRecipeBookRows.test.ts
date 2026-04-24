import { Skill } from '../../../game/types';
import {
  DEFAULT_RECIPE_SKILL_LEVELS,
  createRecipe,
} from '../../uiRecipeBookTestHelpers';
import { buildRecipeBookRows } from './useRecipeBookRows';

describe('buildRecipeBookRows', () => {
  it('derives bounded recipe row view models before render', () => {
    const craftableRecipe = createRecipe({
      id: 'craft-town-knife',
      name: 'Town Knife',
      ingredients: [{ itemKey: 'wood', name: 'Wood', quantity: 2 }],
    });
    const hiddenRecipe = createRecipe({
      id: 'craft-hidden-knife',
      name: 'Hidden Knife',
    });

    const rows = buildRecipeBookRows({
      currentStructure: 'workshop',
      inventoryCountsByItemKey: { wood: 2 },
      recipeSkillLevels: DEFAULT_RECIPE_SKILL_LEVELS,
      recipes: [craftableRecipe, hiddenRecipe],
      visibleRecipeCount: 1,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actionLabel: 'Craft',
      canCraft: true,
      recipe: craftableRecipe,
      requiredStructureLabel: 'Workshop',
      tintOverride: '#f8fafc',
    });
    expect(rows[0]?.recipeOutput).toMatchObject({
      id: 'crafted-town-knife',
      power: 2,
    });
    expect(rows[0]?.tooltipLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'stat',
          label: 'Wood',
          value: '2/2',
          tone: 'item',
        }),
      ]),
    );
  });

  it('derives cooking action labels from recipe skill', () => {
    const rows = buildRecipeBookRows({
      currentStructure: 'camp',
      inventoryCountsByItemKey: {},
      recipeSkillLevels: DEFAULT_RECIPE_SKILL_LEVELS,
      recipes: [
        createRecipe({
          id: 'cook-fish',
          name: 'Cooked Fish',
          skill: Skill.Cooking,
          output: {
            id: 'cooked-fish',
            itemKey: 'cooked-fish',
            name: 'Cooked Fish',
            power: 0,
            hunger: 8,
          },
        }),
      ],
      visibleRecipeCount: 40,
    });

    expect(rows[0]?.actionLabel).toBe('Cook');
  });
});
