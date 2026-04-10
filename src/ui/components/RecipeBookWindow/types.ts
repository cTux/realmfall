import type { WindowPosition } from '../../../app/constants';
import type { RecipeDefinition } from '../../../game/state';

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
}
