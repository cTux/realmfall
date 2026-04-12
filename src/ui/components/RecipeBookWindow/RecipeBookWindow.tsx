import { lazy, memo, Suspense } from 'react';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLoadingState } from '../WindowLoadingState';
import { WINDOW_LABELS, renderWindowLabel } from '../windowLabels';
import labelStyles from '../windowLabels.module.css';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.css';

const RecipeBookWindowContent = lazy(() =>
  import('./RecipeBookWindowContent').then((module) => ({
    default: module.RecipeBookWindowContent,
  })),
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
}: RecipeBookWindowProps) {
  return (
    <DraggableWindow
      title={renderWindowLabel(WINDOW_LABELS.recipes, labelStyles.hotkey)}
      position={position}
      onMove={onMove}
      className={styles.window}
      visible={visible}
      onClose={onClose}
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
    </DraggableWindow>
  );
});
