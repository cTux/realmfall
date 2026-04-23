import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { ItemModificationKind } from '../../../game/itemModifications';
import type {
  CombatState,
  Enemy,
  Equipment,
  Item,
  TerritoryNpc,
  TownStockEntry,
} from '../../../game/stateTypes';
import type { CombatPartyMember } from '../CombatWindow/types';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface HexInfoWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  isHome: boolean;
  onSetHome: () => void;
  canSetHome?: boolean;
  terrain: string;
  structure?: string | null;
  enemyCount: number;
  interactLabel?: string | null;
  canInteract: boolean;
  canBulkProspectEquipment: boolean;
  canBulkSellEquipment: boolean;
  itemModification?: {
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
  } | null;
  canTerritoryAction: boolean;
  territoryActionKind?: 'claim' | 'unclaim';
  territoryActionLabel: string;
  territoryActionExplanation?: string | null;
  bulkProspectEquipmentExplanation?: string | null;
  bulkSellEquipmentExplanation?: string | null;
  onInteract: () => void;
  onProspect: () => void;
  onSellAll: () => void;
  onApplyItemModification?: () => void;
  onClearItemModificationSelection?: () => void;
  onSelectItemModificationReforgeStat?: (statIndex: number) => void;
  onToggleItemModificationPicker?: () => void;
  onTerritoryAction: () => void;
  canHealTerritoryNpc: boolean;
  territoryNpcHealExplanation?: string | null;
  onHealTerritoryNpc: () => void;
  structureHp?: number;
  structureMaxHp?: number;
  territoryName?: string | null;
  territoryOwnerType?: 'player' | 'faction' | null;
  territoryNpc: TerritoryNpc | null;
  townStock: TownStockEntry[];
  gold: number;
  equipment?: Equipment;
  loot?: Item[];
  combat?: CombatState | null;
  combatPlayerParty?: CombatPartyMember[];
  combatEnemies?: Enemy[];
  combatWorldTimeMs?: number;
  onBuyItem: (itemId: string) => void;
  onTakeAll?: () => void;
  onTakeItem?: (itemId: string) => void;
  onStartCombat?: () => void;
  onForfeitCombat?: () => void;
  onHoverItem: (
    event: ReactMouseEvent<HTMLElement>,
    item: Item,
    equipped?: Item,
  ) => void;
  onLeaveItem: () => void;
}
