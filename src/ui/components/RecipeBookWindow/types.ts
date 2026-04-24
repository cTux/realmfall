import type { RecipeBookEntry, Skill, Tile } from '../../../game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface RecipeBookWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  currentStructure?: Tile['structure'];
  recipes: RecipeBookEntry[];
  recipeSkillLevels: Record<Skill, number>;
  inventoryCountsByItemKey: Record<string, number>;
  preferredSkill: Skill | null;
  materialFilterItemKey: string | null;
  onResetMaterialFilter: () => void;
  onCraft: (recipeId: string, count?: number | 'max') => void;
}
