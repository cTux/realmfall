import { createCombatActorState } from '../../../../../game/combat';
import type { CombatState } from '../../../../../game/stateTypes';
import type { HexInfoWindowProps } from '../../types';

export function buildHexInfoWindowProps(
  overrides: Partial<HexInfoWindowProps> = {},
): HexInfoWindowProps {
  return {
    position: { x: 0, y: 0 },
    onMove: () => undefined,
    visible: true,
    onClose: () => undefined,
    isHome: false,
    onSetHome: () => undefined,
    terrain: 'Rift',
    structure: 'Dungeon',
    hexDescription:
      'A rift-torn ruin that marks the entrance to a dungeon below.',
    enemyCount: 1,
    interactLabel: null,
    canInteract: false,
    canBulkProspectEquipment: false,
    canBulkSellEquipment: false,
    canBuildOutpost: false,
    outpostBuildOptions: [],
    itemModification: null,
    canTerritoryAction: false,
    territoryActionLabel: 'Cl(a)im',
    canHealTerritoryNpc: false,
    onInteract: () => undefined,
    onProspect: () => undefined,
    onSellAll: () => undefined,
    onBuildOutpost: () => undefined,
    onTerritoryAction: () => undefined,
    onHealTerritoryNpc: () => undefined,
    territoryNpc: null,
    townStock: [],
    gold: 0,
    onBuyItem: () => undefined,
    onTakeAll: () => undefined,
    onTakeItem: () => undefined,
    onForfeitCombat: () => undefined,
    onHoverItem: () => undefined,
    onLeaveItem: () => undefined,
    ...overrides,
  };
}

export function buildCombatState({
  started = true,
  startedAtMs = 0,
}: {
  started?: boolean;
  startedAtMs?: number;
} = {}): CombatState {
  return {
    coord: { q: 1, r: 0 },
    enemyIds: ['enemy-1'],
    started,
    startedAtMs,
    player: createCombatActorState(0, ['kick']),
    enemies: {
      'enemy-1': createCombatActorState(0, ['kick']),
    },
    enemyStateById: {
      'enemy-1': {},
    },
  };
}
