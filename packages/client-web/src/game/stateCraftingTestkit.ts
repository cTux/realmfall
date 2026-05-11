import {
  buildRecipeInventory,
  findResolvedEnemyRecipeDrop,
  seedRecipeDropEncounter,
} from './stateCraftingTestHelpers';

export class StateCraftingTestkit {
  readonly actions = {
    buildRecipeInventory: (...args: Parameters<typeof buildRecipeInventory>) =>
      buildRecipeInventory(...args),
    findResolvedEnemyRecipeDrop: (
      ...args: Parameters<typeof findResolvedEnemyRecipeDrop>
    ) => findResolvedEnemyRecipeDrop(...args),
    seedRecipeDropEncounter: (
      ...args: Parameters<typeof seedRecipeDropEncounter>
    ) => seedRecipeDropEncounter(...args),
  };
}

export * from './stateCraftingTestHelpers';
