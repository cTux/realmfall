import { memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
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
    <WindowShell
      title={WINDOW_LABELS.recipes.plain}
      hotkeyLabel={WINDOW_LABELS.recipes}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
      resizeBounds={{ minWidth: 360, minHeight: 260 }}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <RecipeBookWindowContent
          currentStructure={currentStructure}
          recipes={recipes}
          recipeSkillLevels={recipeSkillLevels}
          inventoryCountsByItemKey={inventoryCountsByItemKey}
          materialFilterItemKey={materialFilterItemKey}
          onResetMaterialFilter={onResetMaterialFilter}
          onCraft={onCraft}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </Suspense>
    </WindowShell>
  );
});
