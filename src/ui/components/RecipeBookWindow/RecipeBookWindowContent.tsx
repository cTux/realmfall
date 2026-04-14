import { t } from '../../../i18n';
import { formatSkillLabel } from '../../../i18n/labels';
import { Skill } from '../../../game/types';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.scss';

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
      <div className={styles.note}>{t('ui.recipeBook.note')}</div>
      {!hasRecipeBook ? (
        <div className={styles.empty}>{t('ui.recipeBook.missingBook')}</div>
      ) : recipes.length === 0 ? (
        <div className={styles.empty}>{t('ui.recipeBook.empty')}</div>
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
              recipe.skill === Skill.Cooking
                ? t('game.structure.camp.title')
                : t('game.structure.workshop.title');
            const atRequiredStructure = currentStructure === requiredStructure;
            const canCraft =
              !missingIngredient && hasFuel && atRequiredStructure;

            return (
              <div key={recipe.id} className={styles.card}>
                <div className={styles.header}>
                  <span className={styles.title}>{recipe.name}</span>
                  <span className={styles.skill}>
                    {formatSkillLabel(recipe.skill)}
                  </span>
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
                      {t('ui.recipeBook.fuelLabel')}{' '}
                      {recipe.fuelOptions
                        .map((fuel) => `${fuel.name} x${fuel.quantity}`)
                        .join(t('ui.common.or'))}
                    </div>
                  ) : null}
                  <div
                    className={
                      atRequiredStructure ? styles.met : styles.missing
                    }
                  >
                    {t('ui.recipeBook.siteLabel', { site: requiredStructure })}
                  </div>
                </div>
                <div className={styles.actions}>
                  <span className={styles.output}>
                    {t('ui.recipeBook.makesLabel', {
                      item: recipe.output.name,
                    })}
                  </span>
                  <button
                    onClick={() => onCraft(recipe.id)}
                    disabled={!canCraft}
                  >
                    {recipe.skill === Skill.Cooking
                      ? t('ui.recipeBook.cookAction')
                      : t('ui.recipeBook.craftAction')}
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
