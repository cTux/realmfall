import { memo, useMemo } from 'react';
import { useWorldClockTime } from '../../../app/App/worldClockStore';
import { getAbilityDefinition } from '../../../game/abilities';
import { DEFAULT_ENEMY_MANA } from '../../../game/combat';
import { getStatusEffectDefinition } from '../../../game/content/statusEffects';
import { getEnemyCombatAttack } from '../../../game/stateCombat';
import type { CombatActorState } from '../../../game/stateTypes';
import type { PlayerStatusEffect } from '../../../game/types';
import { t } from '../../../i18n';
import {
  formatEnemyRarityLabel,
  formatStatusEffectLabel,
} from '../../../i18n/labels';
import { rarityColor } from '../../rarity';
import { statusEffectIcon, statusEffectTint } from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import {
  EntityStatusPanel,
  type EntityStatusBar,
  type EntityStatusIcon,
} from '../EntityStatusPanel/EntityStatusPanel';
import { buildEnemyStatSheetTooltipLines } from './combatEntityStats';
import type { CombatPartyMember, CombatWindowProps } from './types';
import styles from './styles.module.scss';

const COMBAT_VISUAL_STEP_MS = 100;

interface CombatWindowContentProps {
  combat: CombatWindowProps['combat'];
  playerParty: CombatWindowProps['playerParty'];
  enemies: CombatWindowProps['enemies'];
  worldTimeMs?: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}

interface CombatEntityView {
  id: string;
  title: string;
  titleAccent?: {
    label: string;
    color: string;
  };
  bars: [EntityStatusBar, ...EntityStatusBar[]];
  abilities: EntityStatusIcon[];
  buffs: EntityStatusIcon[];
  debuffs: EntityStatusIcon[];
}

export function CombatWindowContent({
  combat,
  playerParty,
  enemies,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: CombatWindowContentProps) {
  const liveWorldTimeMs = useWorldClockTime();
  const resolvedWorldTimeMs = liveWorldTimeMs || worldTimeMs || 0;
  const visualWorldTimeMs =
    Math.floor(resolvedWorldTimeMs / COMBAT_VISUAL_STEP_MS) *
    COMBAT_VISUAL_STEP_MS;
  const alliedParty = useMemo(
    () =>
      playerParty.map((member) => toPlayerEntity(member, visualWorldTimeMs)),
    [playerParty, visualWorldTimeMs],
  );
  const enemyParty = useMemo(
    () =>
      enemies.map((enemy) =>
        toEnemyEntity(
          enemy,
          combat.enemies[enemy.id] ?? combat.player,
          visualWorldTimeMs,
        ),
      ),
    [combat.enemies, combat.player, enemies, visualWorldTimeMs],
  );

  return (
    <div className={styles.layout}>
      <div className={styles.columns}>
        <PartyColumn
          entities={alliedParty}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
        <PartyColumn
          entities={enemyParty}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      </div>
    </div>
  );
}

function toPlayerEntity(
  member: CombatPartyMember,
  worldTimeMs: number,
): CombatEntityView {
  return {
    id: member.id,
    title: t('ui.combat.entityTitle', {
      name: member.name,
      level: member.level,
    }),
    bars: buildCombatBars({
      hp: member.hp,
      maxHp: member.maxHp,
      mana: member.mana,
      maxMana: member.maxMana,
    }),
    abilities: buildAbilityIcons(member.actor, member.attack, worldTimeMs),
    buffs: buildEffectIcons(member.buffs, 'buff', worldTimeMs),
    debuffs: buildEffectIcons(member.debuffs, 'debuff', worldTimeMs),
  };
}

function toEnemyEntity(
  enemy: CombatWindowProps['enemies'][number],
  actor: CombatActorState,
  worldTimeMs: number,
): CombatEntityView {
  const effectGroups = partitionStatusEffects(enemy.statusEffects ?? []);
  const rarity = enemy.rarity ?? 'common';

  return {
    id: enemy.id,
    title: t('ui.combat.entityTitle', { name: enemy.name, level: enemy.tier }),
    titleAccent:
      rarity !== 'common'
        ? {
            label: formatEnemyRarityLabel(rarity),
            color: rarityColor(rarity),
          }
        : undefined,
    bars: buildCombatBars(
      {
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        mana: enemy.mana ?? enemy.maxMana ?? DEFAULT_ENEMY_MANA,
        maxMana: enemy.maxMana ?? enemy.mana ?? DEFAULT_ENEMY_MANA,
      },
      {
        hpTooltipTitle: t('ui.combat.entityTitle', {
          name: enemy.name,
          level: enemy.tier,
        }),
        hpTooltipLines: buildEnemyStatSheetTooltipLines(enemy),
      },
    ),
    abilities: buildAbilityIcons(
      actor,
      getEnemyCombatAttack(enemy),
      worldTimeMs,
    ),
    buffs: buildEffectIcons(effectGroups.buffs, 'buff', worldTimeMs),
    debuffs: buildEffectIcons(effectGroups.debuffs, 'debuff', worldTimeMs),
  };
}

const PartyColumn = memo(function PartyColumn({
  entities,
  onHoverDetail,
  onLeaveDetail,
}: {
  entities: CombatEntityView[];
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
            titleAccent={entity.titleAccent}
            titleAccentPlacement="top"
            showPrimaryLabel={false}
            bars={entity.bars}
            abilities={entity.abilities}
            buffs={entity.buffs}
            debuffs={entity.debuffs}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />
        ))}
      </div>
    </section>
  );
});

function buildCombatBars(
  entity: Pick<CombatPartyMember, 'hp' | 'maxHp' | 'mana' | 'maxMana'>,
  tooltipOptions?: {
    hpTooltipTitle?: string;
    hpTooltipLines?: EntityStatusBar['tooltipLines'];
  },
): [EntityStatusBar, ...EntityStatusBar[]] {
  const bars: [EntityStatusBar, ...EntityStatusBar[]] = [
    {
      id: 'hp',
      label: t('ui.hero.hp'),
      value: entity.hp,
      max: entity.maxHp,
      tone: 'hp',
      description: t('ui.tooltip.bar.combatHp'),
      tooltipTitle: tooltipOptions?.hpTooltipTitle,
      tooltipLines: tooltipOptions?.hpTooltipLines,
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
    const remainingMs = Math.max(0, readyAt - worldTimeMs);

    return {
      id: ability.id,
      label: ability.name,
      icon: ability.icon,
      tint: '#f8fafc',
      borderColor: 'rgb(148 163 184 / 35%)',
      tooltipTitle: ability.name,
      tooltipLines: abilityTooltipLines(ability, ability.target, attack),
      tooltipBorderColor: 'rgba(148, 163, 184, 0.9)',
      disabled: remainingMs > 0,
    };
  });
}

function buildEffectIcons(
  items: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
  >[],
  tone: 'buff' | 'debuff',
  worldTimeMs: number,
) {
  return items.map<EntityStatusIcon>((item) => ({
    id: item.id,
    label: formatStatusEffectLabel(item.id),
    icon: statusEffectIcon(item.id),
    tint: statusEffectTint(item.id, tone),
    borderColor:
      tone === 'buff' ? 'rgb(34 197 94 / 70%)' : 'rgb(239 68 68 / 70%)',
    tooltipTitle: formatStatusEffectLabel(item.id),
    tooltipLines: statusEffectTooltipLines(
      item.id,
      tone,
      [],
      item,
      worldTimeMs,
    ),
    tooltipBorderColor:
      tone === 'buff' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
  }));
}

function partitionStatusEffects(
  items: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
  >[],
) {
  return items.reduce<{
    buffs: Pick<
      PlayerStatusEffect,
      'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
    >[];
    debuffs: Pick<
      PlayerStatusEffect,
      'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
    >[];
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
