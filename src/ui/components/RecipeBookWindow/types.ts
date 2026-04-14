import type { WindowPosition } from '../../../app/constants';
import type { RecipeDefinition } from '../../../game/state';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface RecipeBookWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  hasRecipeBook: boolean;
  currentStructure?: string;
  recipes: RecipeDefinition[];
  inventoryCounts: Record<string, number>;
  onCraft: (recipeId: string) => void;
}
