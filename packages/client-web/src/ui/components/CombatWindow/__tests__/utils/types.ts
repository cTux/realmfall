import type { CombatState, Enemy } from '@realmfall/core/game/stateTypes';
import type { CombatPartyMember } from '../../types';

export type CombatWindowRenderOverrides = {
  combat?: CombatState;
  playerParty?: CombatPartyMember[];
  enemies?: Enemy[];
  worldTimeMs?: number;
};
