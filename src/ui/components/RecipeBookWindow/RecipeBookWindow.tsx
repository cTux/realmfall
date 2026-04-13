import { lazy, memo, Suspense } from 'react';
import { WINDOW_LABELS } from '../../windowLabels';
import { DraggableWindow } from '../DraggableWindow';
import { WindowLabel } from '../WindowLabel/WindowLabel';
import { WindowLoadingState } from '../WindowLoadingState';
import labelStyles from '../windowLabels.module.scss';
import type { RecipeBookWindowProps } from './types';
import styles from './styles.module.scss';

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
      title={
        <WindowLabel
          label={WINDOW_LABELS.recipes}
          hotkeyClassName={labelStyles.hotkey}
        />
      }
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
