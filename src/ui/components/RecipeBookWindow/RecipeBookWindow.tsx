import { WINDOW_LABELS } from '../../windowLabels';
import { createDeferredWindowComponent } from '../deferredWindowComponent';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.scss';

type RecipeBookWindowContentProps = Parameters<
  (typeof import('./RecipeBookWindowContent'))['RecipeBookWindowContent']
>[0];

export const RecipeBookWindow = createDeferredWindowComponent<
  RecipeBookWindowProps,
  RecipeBookWindowContentProps
>({
  displayName: 'RecipeBookWindow',
  loadContent: () =>
    import('./RecipeBookWindowContent').then((module) => ({
      default: module.RecipeBookWindowContent,
    })),
  mapWindowProps: ({
    position,
    onMove,
    visible,
    onClose,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    title: WINDOW_LABELS.recipes.plain,
    hotkeyLabel: WINDOW_LABELS.recipes,
    position,
    onMove,
    className: styles.window,
    visible,
    externalUnmount: true,
    onClose,
    resizeBounds: { minWidth: 360, minHeight: 260 },
    onHoverDetail,
    onLeaveDetail,
  }),
  mapContentProps: ({
    currentStructure,
    recipes,
    recipeSkillLevels,
    inventoryCountsByItemKey,
    preferredSkill,
    materialFilterItemKey,
    onResetMaterialFilter,
    onCraft,
    onHoverDetail,
    onLeaveDetail,
  }) => ({
    currentStructure,
    recipes,
    recipeSkillLevels,
    inventoryCountsByItemKey,
    preferredSkill,
    materialFilterItemKey,
    onResetMaterialFilter,
    onCraft,
    onHoverDetail,
    onLeaveDetail,
  }),
});
