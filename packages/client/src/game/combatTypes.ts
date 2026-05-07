import type { HexCoord } from './hex';
import type { AbilityId } from './abilityTypes';

export interface CombatCastState {
  abilityId: AbilityId;
  targetId: string;
  endsAt: number;
}

export interface CombatActorState {
  abilityIds: AbilityId[];
  globalCooldownMs: number;
  effectiveGlobalCooldownMs?: number;
  globalCooldownEndsAt: number;
  cooldownEndsAt: Partial<Record<AbilityId, number>>;
  effectiveCooldownMs?: Partial<Record<AbilityId, number>>;
  casting: CombatCastState | null;
}

export interface CombatTreasureGoblinEncounterState {
  damageHitsTaken: number;
  fleeHitsRequired: number;
}

export interface CombatEnemyEncounterState {
  treasureGoblin?: CombatTreasureGoblinEncounterState;
}

export interface CombatEngagementMetadata {
  engageMode: 'adjacent-click' | 'staged-click' | 'enemy-chase' | 'tile-step';
  originCoord: HexCoord;
  stagingCoord: HexCoord;
  targetCoord: HexCoord | null;
  autoStepOnVictory: boolean;
}

export interface CombatState {
  coord: HexCoord;
  enemyIds: string[];
  started: boolean;
  startedAtMs?: number;
  engagement?: CombatEngagementMetadata;
  player: CombatActorState;
  enemies: Record<string, CombatActorState>;
  enemyStateById: Record<string, CombatEnemyEncounterState>;
}
