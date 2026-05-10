import type { HexCoord } from './hex';
import type { EnemyTypeKey } from './content/ids';
import type { GameTag } from './content/tags';
import type { AbilityId } from './abilityTypes';
import type { PlayerStatusEffect } from './playerTypes';
import type { EnemyRarity } from './itemTypes';

export interface Enemy {
  id: string;
  enemyTypeId?: EnemyTypeKey;
  tags?: GameTag[];
  name: string;
  coord: HexCoord;
  dungeonSpawnCoord?: HexCoord;
  dungeonMovementCooldownEndsAt?: number;
  dungeonMovementTargetCoord?: HexCoord;
  rarity?: EnemyRarity;
  tier: number;
  baseMaxHp?: number;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  baseAttack?: number;
  attack: number;
  baseDefense?: number;
  defense: number;
  xp: number;
  elite: boolean;
  worldBoss?: boolean;
  aggressive?: boolean;
  statusEffects?: PlayerStatusEffect[];
  abilityIds?: AbilityId[];
}
