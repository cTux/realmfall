import type {
  CombatActorState,
  CombatState,
  Enemy,
} from '../../../game/stateTypes';
import type { PlayerStatusEffect } from '../../../game/types';
import type { ManagedWindowShellProps } from '../managedWindowProps';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface CombatPartyMember {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  actor: CombatActorState;
  buffs: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
  >[];
  debuffs: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
  >[];
}

export interface CombatWindowProps
  extends ManagedWindowShellProps, WindowDetailTooltipHandlers {
  combat: CombatState;
  playerParty: CombatPartyMember[];
  enemies: Enemy[];
  worldTimeMs?: number;
  onStart: () => void;
  onHoverDetail: NonNullable<WindowDetailTooltipHandlers['onHoverDetail']>;
  onLeaveDetail: NonNullable<WindowDetailTooltipHandlers['onLeaveDetail']>;
  onHoverHeaderAction?: WindowDetailTooltipHandlers['onHoverDetail'];
}
