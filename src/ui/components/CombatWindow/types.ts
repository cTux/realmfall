import type { MouseEvent as ReactMouseEvent } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { CombatActorState, CombatState, Enemy } from '../../../game/state';
import type { TooltipLine } from '../../tooltips';

export interface CombatPartyMember {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  actor: CombatActorState;
}

export interface CombatWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  combat: CombatState;
  playerParty: CombatPartyMember[];
  enemies: Enemy[];
  worldTimeMs: number;
  onStart: () => void;
  onHoverDetail: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail: () => void;
  onHoverHeaderAction?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
}
