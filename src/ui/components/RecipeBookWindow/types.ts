import type { WindowPosition } from '../../../app/constants';
import type { RecipeDefinition } from '../../../game/state';
import type { TooltipLine } from '../../tooltips';

export interface RecipeBookWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  hasRecipeBook: boolean;
  currentStructure?: string;
  recipes: RecipeDefinition[];
  inventoryCounts: Record<string, number>;
  onCraft: (recipeId: string) => void;
  onHoverDetail?: (
    event: React.MouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
