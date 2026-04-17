import type { WindowPosition } from '../../../app/constants';
import type { CombatActorState, CombatState, Enemy } from '../../../game/state';
import type { StatusEffectId } from '../../../game/types';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface CombatPartyMember {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  actor: CombatActorState;
  buffs: StatusEffectId[];
  debuffs: StatusEffectId[];
}

export interface CombatWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  combat: CombatState;
  playerParty: CombatPartyMember[];
  enemies: Enemy[];
  worldTimeMs?: number;
  onStart: () => void;
  onHoverDetail: NonNullable<WindowDetailTooltipHandlers['onHoverDetail']>;
  onLeaveDetail: NonNullable<WindowDetailTooltipHandlers['onLeaveDetail']>;
  onHoverHeaderAction?: WindowDetailTooltipHandlers['onHoverDetail'];
}
