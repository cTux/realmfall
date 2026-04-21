import { memo } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DeferredWindowShell } from '../DeferredWindowShell';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.scss';

const RecipeBookWindowContent = createLazyWindowComponent<
  Parameters<
    (typeof import('./RecipeBookWindowContent'))['RecipeBookWindowContent']
  >[0]
>(() =>
  import('./RecipeBookWindowContent').then((module) => ({
    default: module.RecipeBookWindowContent,
  })),
);

export const RecipeBookWindow = memo(function RecipeBookWindow({
  position,
  onMove,
  visible,
  onClose,
  currentStructure,
  recipes,
  recipeSkillLevels,
  inventoryCountsByItemKey,
  materialFilterItemKey,
  onResetMaterialFilter,
  onCraft,
  onHoverDetail,
  onLeaveDetail,
}: RecipeBookWindowProps) {
  return (
    <DeferredWindowShell
      title={WINDOW_LABELS.recipes.plain}
      hotkeyLabel={WINDOW_LABELS.recipes}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      externalUnmount
      onClose={onClose}
      resizeBounds={{ minWidth: 360, minHeight: 260 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      content={RecipeBookWindowContent}
      contentProps={{
        currentStructure,
        recipes,
        recipeSkillLevels,
        inventoryCountsByItemKey,
        materialFilterItemKey,
        onResetMaterialFilter,
        onCraft,
        onHoverDetail,
        onLeaveDetail,
      }}
    />
  );
});
