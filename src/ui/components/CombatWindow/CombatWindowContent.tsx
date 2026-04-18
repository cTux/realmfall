import { getAbilityDefinition } from '../../../game/abilities';
import type { CombatActorState } from '../../../game/state';
import { getStatusEffectDefinition } from '../../../game/content/statusEffects';
import type { StatusEffectId } from '../../../game/types';
import { t } from '../../../i18n';
import {
  formatEnemyRarityLabel,
  formatStatusEffectLabel,
} from '../../../i18n/labels';
import { rarityColor } from '../../rarity';
import {
  iconMaskStyle,
  statusEffectIcon,
  statusEffectTint,
} from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
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
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  actor: CombatActorState;
  buffs: StatusEffectId[];
  debuffs: StatusEffectId[];
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
    const effectGroups = partitionStatusEffects(
      enemy.statusEffects?.map((effect) => effect.id) ?? [],
    );
    return {
      id: enemy.id,
      title: t('ui.combat.entityTitle', { name: enemy.name, level: enemy.tier }),
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      mana: 0,
      maxMana: 0,
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
          title={t('ui.combat.playerPartyTitle')}
          entities={alliedParty}
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
        <PartyColumn
          title={t('ui.combat.enemyPartyTitle')}
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
    actor: member.actor,
    buffs: member.buffs,
    debuffs: member.debuffs,
  };
}

function PartyColumn({
  title,
  entities,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  title: string;
  entities: CombatEntityView[];
  worldTimeMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  return (
    <section className={styles.partySection}>
      <div className={styles.partyTitle}>{title}</div>
      <div className={styles.partyList}>
        {entities.map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            worldTimeMs={worldTimeMs}
            onHoverDetail={onHoverDetail}
            onLeaveDetail={onLeaveDetail}
          />
        ))}
      </div>
    </section>
  );
}

function EntityCard({
  entity,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  entity: CombatEntityView;
  worldTimeMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  return (
    <article className={styles.entityCard}>
      <div className={styles.entityHeader}>
        <strong>{entity.title}</strong>
        {entity.rarity && entity.rarity !== 'common' ? (
          <span
            className={styles.elite}
            style={{ color: rarityColor(entity.rarity) }}
          >
            {formatEnemyRarityLabel(entity.rarity)}
          </span>
        ) : null}
      </div>
      <ResourceBar
        label={t('ui.hero.hp')}
        value={entity.hp}
        max={entity.maxHp}
        tone="hp"
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <ResourceBar
        label={t('ui.combat.mp')}
        value={entity.mana}
        max={entity.maxMana}
        tone="mp"
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      {entity.actor.casting ? (
        <CastBar
          actor={entity.actor}
          worldTimeMs={worldTimeMs}
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      ) : null}
      {entity.buffs.length > 0 ? (
        <EffectList
          items={entity.buffs}
          tone="buff"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      ) : null}
      {entity.debuffs.length > 0 ? (
        <EffectList
          items={entity.debuffs}
          tone="debuff"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
        />
      ) : null}
      <div className={styles.abilitiesGrid}>
        {entity.actor.abilityIds.map((abilityId) => {
          const ability = getAbilityDefinition(abilityId);
          const readyAt = Math.max(
            entity.actor.globalCooldownEndsAt,
            entity.actor.cooldownEndsAt[abilityId] ?? worldTimeMs,
          );
          const totalCooldownMs = Math.max(
            entity.actor.effectiveGlobalCooldownMs ??
              entity.actor.globalCooldownMs,
            entity.actor.effectiveCooldownMs?.[abilityId] ?? ability.cooldownMs,
            1,
          );
          const remainingMs = Math.max(0, readyAt - worldTimeMs);
          const cooldownRatio = Math.max(
            0,
            Math.min(1, remainingMs / totalCooldownMs),
          );

          return (
            <AbilitySquare
              key={ability.id}
              label={ability.name}
              icon={ability.icon}
              tooltipLines={abilityTooltipLines(ability, ability.target)}
              cooldownRatio={cooldownRatio}
              remainingMs={remainingMs}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            />
          );
        })}
      </div>
    </article>
  );
}

function ResourceBar({
  label,
  value,
  max,
  tone,
  onHoverDetail,
  onLeaveDetail,
}: {
  label: string;
  value: number;
  max: number;
  tone: 'hp' | 'mp';
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  const normalizedMax = Math.max(0, max);
  const width =
    normalizedMax > 0
      ? Math.max(0, Math.min(100, (value / normalizedMax) * 100))
      : 0;

  return (
    <div
      className={styles.barTrack}
      onMouseEnter={(event) =>
        onHoverDetail(
          event,
          label,
          [
            {
              kind: 'text',
              text:
                tone === 'hp'
                  ? t('ui.tooltip.bar.combatHp')
                  : t('ui.tooltip.bar.combatMp'),
            },
          ],
          'rgba(148, 163, 184, 0.9)',
        )
      }
      onMouseLeave={onLeaveDetail}
    >
      <div
        className={`${styles.barFill} ${tone === 'hp' ? styles.hpBar : styles.mpBar}`}
        style={{ width: `${width}%` }}
      />
      <div className={styles.barText}>
        <span>{label}</span>
        <strong>
          {value}/{normalizedMax}
        </strong>
      </div>
    </div>
  );
}

function EffectList({
  items,
  tone,
  onHoverDetail,
  onLeaveDetail,
}: {
  items: StatusEffectId[];
  tone: 'buff' | 'debuff';
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  return (
    <div className={styles.effectList}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`${styles.effectChip} ${tone === 'buff' ? styles.buffChip : styles.debuffChip}`}
          aria-label={formatStatusEffectLabel(item)}
          onMouseEnter={(event) =>
            onHoverDetail(
              event,
              formatStatusEffectLabel(item),
              statusEffectTooltipLines(item, tone),
              tone === 'buff'
                ? 'rgba(34, 197, 94, 0.9)'
                : 'rgba(239, 68, 68, 0.9)',
            )
          }
          onMouseLeave={onLeaveDetail}
        >
          <span
            aria-hidden="true"
            className={styles.effectIcon}
            style={iconMaskStyle(
              statusEffectIcon(item),
              statusEffectTint(item, tone),
            )}
          />
        </button>
      ))}
    </div>
  );
}

function AbilitySquare({
  label,
  icon,
  tooltipLines,
  cooldownRatio,
  remainingMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  label: string;
  icon: string;
  tooltipLines: ReturnType<typeof abilityTooltipLines>;
  cooldownRatio: number;
  remainingMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  return (
    <div
      className={`${styles.abilitySquare} ${cooldownRatio > 0 ? styles.abilitySquareDisabled : ''}`}
      aria-label={label}
      onMouseEnter={(event) =>
        onHoverDetail(event, label, tooltipLines, 'rgba(148, 163, 184, 0.9)')
      }
      onMouseLeave={onLeaveDetail}
    >
      <span
        aria-hidden="true"
        className={styles.abilityIcon}
        style={iconMaskStyle(icon, '#f8fafc')}
      />
      {cooldownRatio > 0 ? (
        <div
          className={styles.cooldownOverlay}
          style={{
            ['--cooldown-scale' as string]: `${cooldownRatio}`,
            ['--cooldown-duration' as string]: `${Math.max(remainingMs, 1)}ms`,
          }}
        />
      ) : null}
    </div>
  );
}

function CastBar({
  actor,
  worldTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  actor: CombatActorState;
  worldTimeMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  if (!actor.casting) return null;

  const ability = getAbilityDefinition(actor.casting.abilityId);
  const castDurationMs = Math.max(ability.castTimeMs, 1);
  const castStartedAt = actor.casting.endsAt - castDurationMs;
  const elapsedMs = Math.max(0, worldTimeMs - castStartedAt);
  const width = Math.max(0, Math.min(100, (elapsedMs / castDurationMs) * 100));

  return (
    <div
      className={`${styles.barTrack} ${styles.castBarTrack}`}
      onMouseEnter={(event) =>
        onHoverDetail(
          event,
          ability.name,
          [
            {
              kind: 'text',
              text: t('ui.combat.castBar.tooltip'),
            },
            {
              kind: 'stat',
              label: t('ui.ability.castTime'),
              value: `${ability.castTimeMs / 1000}s`,
            },
          ],
          'rgba(250, 204, 21, 0.9)',
        )
      }
      onMouseLeave={onLeaveDetail}
    >
      <div
        className={`${styles.barFill} ${styles.castBarFill}`}
        style={{ width: `${width}%` }}
      />
      <div className={styles.barText}>
        <span>{t('ui.combat.casting')}</span>
        <strong>{ability.name}</strong>
      </div>
    </div>
  );
}

function partitionStatusEffects(items: StatusEffectId[]) {
  return items.reduce<{
    buffs: StatusEffectId[];
    debuffs: StatusEffectId[];
  }>(
    (groups, item) => {
      if (getStatusEffectDefinition(item)?.tone === 'buff') {
        groups.buffs.push(item);
      } else {
        groups.debuffs.push(item);
      }
      return groups;
    },
    { buffs: [], debuffs: [] },
  );
}
