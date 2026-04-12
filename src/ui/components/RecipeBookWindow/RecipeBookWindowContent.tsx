import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.css';

type RecipeBookWindowContentProps = Pick<
  RecipeBookWindowProps,
  | 'hasRecipeBook'
  | 'currentStructure'
  | 'recipes'
  | 'inventoryCounts'
  | 'onCraft'
>;

export function RecipeBookWindowContent({
  hasRecipeBook,
  currentStructure,
  recipes,
  inventoryCounts,
  onCraft,
}: RecipeBookWindowContentProps) {
  return (
    <>
      <div className={styles.note}>
        Cooking consumes one fuel source automatically: coal, logs, then sticks.
      </div>
      {!hasRecipeBook ? (
        <div className={styles.empty}>
          Find a recipe book to use these notes.
        </div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>Defeat enemies to find new recipes.</div>
      ) : (
        <div className={styles.list}>
          {recipes.map((recipe) => {
            const missingIngredient = recipe.ingredients.some(
              (ingredient) =>
                (inventoryCounts[ingredient.name] ?? 0) < ingredient.quantity,
            );
            const hasFuel =
              !recipe.fuelOptions ||
              recipe.fuelOptions.some(
                (fuel) => (inventoryCounts[fuel.name] ?? 0) >= fuel.quantity,
              );
            const requiredStructure =
              recipe.skill === 'cooking' ? 'Campfire' : 'Workshop';
            const atRequiredStructure = currentStructure === requiredStructure;
            const canCraft =
              !missingIngredient && hasFuel && atRequiredStructure;

            return (
              <div key={recipe.id} className={styles.card}>
                <div className={styles.header}>
                  <span className={styles.title}>{recipe.name}</span>
                  <span className={styles.skill}>{recipe.skill}</span>
                </div>
                <div className={styles.description}>{recipe.description}</div>
                <div className={styles.requirements}>
                  {recipe.ingredients.map((ingredient) => {
                    const owned = inventoryCounts[ingredient.name] ?? 0;
                    const met = owned >= ingredient.quantity;
                    return (
                      <div
                        key={`${recipe.id}-${ingredient.name}`}
                        className={met ? styles.met : styles.missing}
                      >
                        {ingredient.name} x{ingredient.quantity} ({owned})
                      </div>
                    );
                  })}
                  {recipe.fuelOptions ? (
                    <div className={hasFuel ? styles.met : styles.missing}>
                      Fuel:{' '}
                      {recipe.fuelOptions
                        .map((fuel) => `${fuel.name} x${fuel.quantity}`)
                        .join(' or ')}
                    </div>
                  ) : null}
                  <div
                    className={
                      atRequiredStructure ? styles.met : styles.missing
                    }
                  >
                    Hex: {requiredStructure}
                  </div>
                </div>
                <div className={styles.actions}>
                  <span className={styles.output}>
                    Makes {recipe.output.name}
                  </span>
                  <button
                    onClick={() => onCraft(recipe.id)}
                    disabled={!canCraft}
                  >
                    {recipe.skill === 'cooking' ? 'Cook' : 'Craft'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
