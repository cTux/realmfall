import { getPlayerOverview } from '../../game/progression';
import { getCurrentHexClaimStatus } from '../../game/stateClaims';
import { getRecipeBookEntries } from '../../game/stateCrafting';
import { getTownStock } from '../../game/stateInventoryActions';
import { getCurrentHexFactionNpcHealStatus } from '../../game/stateFactionNpc';
import { getEnemiesAt } from '../../game/stateWorldQueries';
import type { GameState, Item, LogKind, Skill, Tile } from '../../game/stateTypes';
import type { AudioSettings } from '../audioSettings';
import type { GraphicsSettings } from '../graphicsSettings';
import type { ActionBarSlots } from './actionBar';
import type { ItemContextMenuState } from './types';
import type { ItemModificationKind } from '../../game/itemModifications';

export interface HeroViewState {
  overview: ReturnType<typeof getPlayerOverview>;
  hunger: GameState['player']['hunger'];
  thirst: GameState['player']['thirst'];
}

export interface PlayerViewState {
  coord: GameState['player']['coord'];
  mana: GameState['player']['mana'];
}

export interface InventoryViewState {
  actionBarSlots: ActionBarSlots;
  equipment: GameState['player']['equipment'];
  inventory: GameState['player']['inventory'];
  learnedRecipeIds: GameState['player']['learnedRecipeIds'];
}

export interface HexItemModificationViewState {
  kind: ItemModificationKind;
  hint: string;
  pickerActive: boolean;
  selectedItem: Item | null;
  actionCost: number | null;
  canAfford: boolean;
  canApply: boolean;
  disabledReason: string | null;
  reforgeOptions: Array<{
    label: string;
    statIndex: number;
  }>;
  selectedReforgeStatIndex: number | null;
}

export interface HexViewState {
  homeHex: GameState['homeHex'];
  worldTimeMs: GameState['worldTimeMs'];
  currentTile: Tile;
  currentTileHostileEnemyCount: number;
  combat: GameState['combat'];
  interactLabel: string | null;
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  itemModification: HexItemModificationViewState | null;
  claimStatus: ReturnType<typeof getCurrentHexClaimStatus>;
  territoryNpcHealStatus: ReturnType<typeof getCurrentHexFactionNpcHealStatus>;
  bulkProspectEquipmentExplanation: string | null;
  bulkSellEquipmentExplanation: string | null;
  townStock: ReturnType<typeof getTownStock>;
  gold: number;
}

export interface RecipesViewState {
  entries: ReturnType<typeof getRecipeBookEntries>;
  skillLevels: Record<Skill, number>;
  inventoryCountsByItemKey: Record<string, number>;
  materialFilterItemKey: string | null;
}

export interface LootViewState {
  visible: boolean;
  snapshot: Item[];
}

export interface CombatViewState {
  visible: boolean;
  snapshot: {
    combat: NonNullable<GameState['combat']>;
    enemies: ReturnType<typeof getEnemiesAt>;
  } | null;
}

export interface LogsViewState {
  showFilterMenu: boolean;
  filters: Record<LogKind, boolean>;
  filtered: GameState['logs'];
}

export interface SettingsViewState {
  audio: AudioSettings;
  graphics: GraphicsSettings;
}

export interface AppWindowsViewState {
  hero: HeroViewState;
  player: PlayerViewState;
  inventory: InventoryViewState;
  hex: HexViewState;
  recipes: RecipesViewState;
  loot: LootViewState;
  combat: CombatViewState;
  logs: LogsViewState;
  settings: SettingsViewState;
  itemMenu: ItemContextMenuState | null;
}
