import type { EnemyTypeKey, ItemKey } from '@realmfall/core/game/content/ids';
import type { DebugEquipmentType } from '@realmfall/core/game/stateDebugWindow';
import type { ItemRarity } from '@realmfall/core/game/stateTypes';
import type { EnemyRarity } from '@realmfall/core/game/stateTypes';
import type { ManagedWindowShellProps } from '../managedWindowProps';

export interface DebugWindowProps extends ManagedWindowShellProps {
  onCreateEquipmentItem: (type: DebugEquipmentType, rarity: ItemRarity) => void;
  onCreateDropItem: (itemKey: ItemKey) => void;
  onSpawnEnemyNearby: (enemyTypeId: EnemyTypeKey, rarity: EnemyRarity) => void;
  onTriggerBloodMoon: () => void;
  onTriggerHarvestMoon: () => void;
  onTriggerEarthquake: () => void;
  onSetMorning: () => void;
  onSetNight: () => void;
}

export interface DebugWindowContentProps {
  onCreateEquipmentItem: (type: DebugEquipmentType, rarity: ItemRarity) => void;
  onCreateDropItem: (itemKey: ItemKey) => void;
  onSpawnEnemyNearby: (enemyTypeId: EnemyTypeKey, rarity: EnemyRarity) => void;
  onTriggerBloodMoon: () => void;
  onTriggerHarvestMoon: () => void;
  onTriggerEarthquake: () => void;
  onSetMorning: () => void;
  onSetNight: () => void;
}
