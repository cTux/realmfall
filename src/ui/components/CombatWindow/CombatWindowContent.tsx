import { getAbilityDefinition } from '../../../game/combat';
import type { CombatActorState } from '../../../game/state';
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

const KICK_ICON_PATH =
  'M198.844 64.75c-.985 0-1.974.03-2.97.094-15.915 1.015-32.046 11.534-37.78 26.937-34.072 91.532-51.085 128.865-61.5 222.876 14.633 13.49 31.63 26.45 50.25 38.125l66.406-196.467 17.688 5.968L163.28 362.5c19.51 10.877 40.43 20.234 62 27.28l75.407-201.53 17.5 6.53-74.937 200.282c19.454 5.096 39.205 8.2 58.78 8.875L381.345 225.5l17.094 7.594-75.875 170.656c21.82-1.237 43.205-5.768 63.437-14.28 43.317-53.844 72.633-109.784 84.5-172.69 5.092-26.992-14.762-53.124-54.22-54.81l-6.155-.282-2.188-5.75c-8.45-22.388-19.75-30.093-31.5-32.47-11.75-2.376-25.267 1.535-35.468 7.376l-13.064 7.47-.906-15c-.99-16.396-10.343-29.597-24.313-35.626-13.97-6.03-33.064-5.232-54.812 9.906l-10.438 7.25-3.812-12.125c-6.517-20.766-20.007-27.985-34.78-27.97zM103.28 188.344C71.143 233.448 47.728 299.56 51.407 359.656c27.54 21.84 54.61 33.693 80.063 35.438 14.155.97 27.94-1.085 41.405-6.438-35.445-17.235-67.36-39.533-92.594-63.53l-3.343-3.157.5-4.595c5.794-54.638 13.946-91.5 25.844-129.03z';

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
              tooltipLines={abilityTooltipLines(ability)}
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
  tooltipLines,
  cooldownRatio,
  remainingMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  label: string;
  tooltipLines: ReturnType<typeof abilityTooltipLines>;
  cooldownRatio: number;
  remainingMs: number;
  onHoverDetail: CombatWindowProps['onHoverDetail'];
  onLeaveDetail: CombatWindowProps['onLeaveDetail'];
}) {
  return (
    <div
      className={styles.abilitySquare}
      aria-label={label}
      onMouseEnter={(event) =>
        onHoverDetail(event, label, tooltipLines, 'rgba(148, 163, 184, 0.9)')
      }
      onMouseLeave={onLeaveDetail}
    >
      <KickIcon />
      {cooldownRatio > 0 ? (
        <div
          className={styles.cooldownOverlay}
          style={{
            ['--cooldown-start' as string]: `${cooldownRatio * 360}deg`,
            ['--cooldown-duration' as string]: `${remainingMs}ms`,
          }}
        />
      ) : null}
    </div>
  );
}

function KickIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={styles.abilityIcon}
    >
      <path fill="currentColor" d={KICK_ICON_PATH} />
    </svg>
  );
}

function partitionStatusEffects(items: StatusEffectId[]) {
  return items.reduce<{
    buffs: StatusEffectId[];
    debuffs: StatusEffectId[];
  }>(
    (groups, item) => {
      if (item === 'power' || item === 'frenzy' || item === 'restoration') {
        groups.buffs.push(item);
      } else {
        groups.debuffs.push(item);
      }
      return groups;
    },
    { buffs: [], debuffs: [] },
  );
}
