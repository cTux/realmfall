import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { loadRetryingWindowModule } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.scss';

const RecipeBookWindowContent = lazy(() =>
  loadRetryingWindowModule(() =>
    import('./RecipeBookWindowContent').then((module) => ({
      default: module.RecipeBookWindowContent,
    })),
  ),
);

export const RecipeBookWindow = memo(function RecipeBookWindow({
  position,
  onMove,
  visible,
  onClose,
  hasRecipeBook,
  currentStructure,
  recipes,
  inventoryCounts,
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
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <RecipeBookWindowContent
          hasRecipeBook={hasRecipeBook}
          currentStructure={currentStructure}
          recipes={recipes}
          inventoryCounts={inventoryCounts}
          onCraft={onCraft}
        />
      </Suspense>
    </WindowShell>
  );
});
