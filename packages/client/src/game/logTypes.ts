import type { EnemyRarity } from './itemTypes';
import type { AbilityId } from './abilityTypes';
import type { Enemy } from './enemyTypes';
import type { SecondaryStatKey } from './itemTypes';
import type { StatusEffectId } from './playerTypes';

export const LOG_KINDS = [
  'movement',
  'combat',
  'loot',
  'survival',
  'rumor',
  'motd',
  'system',
  'command',
] as const;

export type LogKind = (typeof LOG_KINDS)[number];

export interface LogEntry {
  id: string;
  kind: LogKind;
  text: string;
  turn: number;
  richText?: LogRichSegment[];
}

export type LogRichSegment =
  | { kind: 'text'; text: string }
  | { kind: 'entity'; text: string; rarity?: EnemyRarity; enemy?: Enemy }
  | { kind: 'damage'; text: string }
  | { kind: 'healing'; text: string }
  | {
      kind: 'source';
      text: string;
      source:
        | {
            kind: 'ability';
            abilityId: AbilityId;
            attack?: number;
          }
        | {
            kind: 'statusEffect';
            effectId: StatusEffectId;
            tone?: 'buff' | 'debuff';
            value?: number;
            tickIntervalMs?: number;
            stacks?: number;
          }
        | {
            kind: 'secondaryStat';
            stat: SecondaryStatKey;
          };
    };
