import { createLazyWindowComponent } from '../../../../ui/components/lazyWindowComponent';
import { loadNamedWindowModule } from './lazyDeferredWindowModule';
import type { AppDeferredWindowDescriptor } from './types';

const RecipeBookWindow = createLazyWindowComponent<
  Parameters<
    (typeof import('../../../../ui/components/RecipeBookWindow'))['RecipeBookWindow']
  >[0]
>(
  loadNamedWindowModule(() =>
    import('../../../../ui/components/RecipeBookWindow').then(
      (module) => module.RecipeBookWindow,
    ),
  ),
);

export const recipesDeferredWindow: AppDeferredWindowDescriptor = {
  key: 'recipes',
  render: ({
    actions,
    detailTooltipHandlers,
    managedWindowProps,
    recipeWindowStructure,
    views,
  }) => (
    <RecipeBookWindow
      {...managedWindowProps.recipes}
      currentStructure={recipeWindowStructure}
      recipes={views.recipes.entries}
      recipeSkillLevels={views.recipes.skillLevels}
      inventoryCountsByItemKey={views.recipes.inventoryCountsByItemKey}
      materialFilterItemKey={views.recipes.materialFilterItemKey}
      onResetMaterialFilter={actions.recipes.onClearMaterialFilter}
      onCraft={actions.inventory.onCraftRecipe}
      {...detailTooltipHandlers}
    />
  ),
};
