import type { CombatState, Enemy } from '../../../../../game/stateTypes';
import type { CombatPartyMember } from '../../types';

export type CombatWindowRenderOverrides = {
  combat?: CombatState;
  playerParty?: CombatPartyMember[];
  enemies?: Enemy[];
  worldTimeMs?: number;
};
