import type { WindowPosition } from '../../../app/constants';
import type { RecipeBookEntry, Tile } from '../../../game/state';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface RecipeBookWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  currentStructure?: Tile['structure'];
  recipes: RecipeBookEntry[];
  inventoryCountsByItemKey: Record<string, number>;
  materialFilterItemKey: string | null;
  onResetMaterialFilter: () => void;
  onCraft: (recipeId: string) => void;
}
