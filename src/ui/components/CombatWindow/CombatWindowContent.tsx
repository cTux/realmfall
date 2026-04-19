import { getAbilityDefinition } from '../../../game/abilities';
import { DEFAULT_ENEMY_MANA } from '../../../game/combat';
import { getStatusEffectDefinition } from '../../../game/content/statusEffects';
import { getEnemyCombatAttack, type CombatActorState } from '../../../game/state';
import type { PlayerStatusEffect } from '../../../game/types';
import { t } from '../../../i18n';
import {
  formatEnemyRarityLabel,
  formatStatusEffectLabel,
} from '../../../i18n/labels';
import { rarityColor } from '../../rarity';
import {
  statusEffectIcon,
  statusEffectTint,
} from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import {
  EntityStatusPanel,
  type EntityStatusBar,
  type EntityStatusIcon,
} from '../EntityStatusPanel/EntityStatusPanel';
import type { CombatPartyMember, CombatWindowProps } from './types';
import styles from './styles.module.scss';

interface CombatWindowContentProps {
  combat: CombatWindowProps['combat'];
  playerParty: CombatWindowProps['playerParty'];
  enemies: CombatWindowProps['enemies'];
  worldTimeMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}

interface CombatEntityView {
  id: string;
  title: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  actor: CombatActorState;
  buffs: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[];
  debuffs: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[];
}

export function CombatWindowContent({
  combat,
  playerParty,
  enemies,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: CombatWindowContentProps) {
  const alliedParty: CombatEntityView[] = playerParty.map((member) =>
    toPlayerEntity(member),
  );
  const enemyParty: CombatEntityView[] = enemies.map((enemy) => {
    const effectGroups = partitionStatusEffects(enemy.statusEffects ?? []);
    return {
      id: enemy.id,
      title: t('ui.combat.entityTitle', { name: enemy.name, level: enemy.tier }),
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      mana: enemy.mana ?? enemy.maxMana ?? DEFAULT_ENEMY_MANA,
      maxMana: enemy.maxMana ?? enemy.mana ?? DEFAULT_ENEMY_MANA,
      attack: getEnemyCombatAttack(enemy),
      rarity: enemy.rarity ?? 'common',
      actor: combat.enemies[enemy.id] ?? combat.player,
      buffs: effectGroups.buffs,
      debuffs: effectGroups.debuffs,
    };
  });

  return (
    <div className={styles.layout}>
      <div className={styles.columns}>
        <PartyColumn
          entities={alliedParty}
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
        <PartyColumn
          entities={enemyParty}
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </div>
    </div>
  );
}

function toPlayerEntity(member: CombatPartyMember): CombatEntityView {
  return {
    id: member.id,
    title: t('ui.combat.entityTitle', {
      name: member.name,
      level: member.level,
    }),
    hp: member.hp,
    maxHp: member.maxHp,
    mana: member.mana,
    maxMana: member.maxMana,
    attack: member.attack,
    actor: member.actor,
    buffs: member.buffs,
    debuffs: member.debuffs,
  };
}

function PartyColumn({
  entities,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  entities: CombatEntityView[];
  worldTimeMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  return (
    <section className={styles.partySection}>
      <div className={styles.partyList}>
        {entities.map((entity) => (
          <EntityStatusPanel
            key={entity.id}
            className={styles.entityCard}
            title={entity.title}
            titleAccent={
              entity.rarity && entity.rarity !== 'common'
                ? {
                    label: formatEnemyRarityLabel(entity.rarity),
                    color: rarityColor(entity.rarity),
                  }
                : undefined
            }
            titleAccentPlacement="top"
            bars={buildCombatBars(entity, worldTimeMs)}
            abilities={buildAbilityIcons(
              entity.actor,
              entity.attack,
              worldTimeMs,
            )}
            buffs={buildEffectIcons(entity.buffs, 'buff')}
            debuffs={buildEffectIcons(entity.debuffs, 'debuff')}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />
        ))}
      </div>
    </section>
  );
}

function buildCombatBars(
  entity: CombatEntityView,
  worldTimeMs: number,
): [EntityStatusBar, ...EntityStatusBar[]] {
  const bars: [EntityStatusBar, ...EntityStatusBar[]] = [
    {
      id: 'hp',
      label: t('ui.hero.hp'),
      value: entity.hp,
      max: entity.maxHp,
      tone: 'hp',
      description: t('ui.tooltip.bar.combatHp'),
    },
    {
      id: 'mana',
      label: t('ui.combat.mp'),
      value: entity.mana,
      max: entity.maxMana,
      tone: 'mana',
      description: t('ui.tooltip.bar.combatMp'),
    },
  ];

  if (entity.actor.casting) {
    const ability = getAbilityDefinition(entity.actor.casting.abilityId);
    const castDurationMs = Math.max(ability.castTimeMs, 1);
    const castStartedAt = entity.actor.casting.endsAt - castDurationMs;
    const elapsedMs = Math.max(0, worldTimeMs - castStartedAt);

    bars.push({
      id: 'cast',
      label: t('ui.combat.casting'),
      value: elapsedMs,
      max: castDurationMs,
      tone: 'cast',
      description: t('ui.combat.castBar.tooltip'),
      text: ability.name,
    });
  }

  return bars;
}

function buildAbilityIcons(
  actor: CombatActorState,
  attack: number,
  worldTimeMs: number,
) {
  return actor.abilityIds.map<EntityStatusIcon>((abilityId) => {
    const ability = getAbilityDefinition(abilityId);
    const readyAt = Math.max(
      actor.globalCooldownEndsAt,
      actor.cooldownEndsAt[abilityId] ?? worldTimeMs,
    );
    const totalCooldownMs = Math.max(
      actor.effectiveGlobalCooldownMs ?? actor.globalCooldownMs,
      actor.effectiveCooldownMs?.[abilityId] ?? ability.cooldownMs,
      1,
    );
    const remainingMs = Math.max(0, readyAt - worldTimeMs);
    const cooldownRatio = Math.max(0, Math.min(1, remainingMs / totalCooldownMs));

    return {
      id: ability.id,
      label: ability.name,
      icon: ability.icon,
      tint: '#f8fafc',
      borderColor: 'rgb(148 163 184 / 35%)',
      tooltipTitle: ability.name,
      tooltipLines: abilityTooltipLines(ability, ability.target, attack),
      tooltipBorderColor: 'rgba(148, 163, 184, 0.9)',
      cooldownRatio,
      remainingMs,
    };
  });
}

function buildEffectIcons(
  items: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[],
  tone: 'buff' | 'debuff',
) {
  return items.map<EntityStatusIcon>((item) => ({
    id: item.id,
    label: formatStatusEffectLabel(item.id),
    icon: statusEffectIcon(item.id),
    tint: statusEffectTint(item.id, tone),
    borderColor:
      tone === 'buff'
        ? 'rgb(34 197 94 / 70%)'
        : 'rgb(239 68 68 / 70%)',
    tooltipTitle: formatStatusEffectLabel(item.id),
    tooltipLines: statusEffectTooltipLines(item.id, tone, [], item),
    tooltipBorderColor:
      tone === 'buff'
        ? 'rgba(34, 197, 94, 0.9)'
        : 'rgba(239, 68, 68, 0.9)',
  }));
}

function partitionStatusEffects(
  items: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[],
) {
  return items.reduce<{
    buffs: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[];
    debuffs: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[];
  }>(
    (groups, item) => {
      if (getStatusEffectDefinition(item.id)?.tone === 'buff') {
        groups.buffs.push(item);
      } else {
        groups.debuffs.push(item);
      }
      return groups;
    },
    { buffs: [], debuffs: [] },
  );
}
