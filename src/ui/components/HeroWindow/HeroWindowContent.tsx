import { getAbilityDefinition } from '../../../game/abilities';
import type { PlayerStatusEffect } from '../../../game/types';
import { t } from '../../../i18n';
import {
  formatSecondaryStatLabel,
  formatStatusEffectLabel,
} from '../../../i18n/labels';
import {
  iconMaskStyle,
  statusEffectIcon,
  statusEffectTint,
} from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import { StatBar } from './components/StatBar';
import type { HeroWindowProps } from './types';
import styles from './styles.module.scss';

type HeroWindowContentProps = Pick<
  HeroWindowProps,
  | 'stats'
  | 'hunger'
  | 'thirst'
  | 'worldTimeMs'
  | 'onHoverDetail'
  | 'onLeaveDetail'
>;

export function HeroWindowContent({
  stats,
  hunger,
  thirst,
  onHoverDetail,
  onLeaveDetail,
}: HeroWindowContentProps) {
  return (
    <div className={styles.stats}>
      <StatBar
        label={t('ui.hero.hp')}
        value={stats.hp}
        max={stats.maxHp}
        color="hp"
        description={t('ui.tooltip.bar.heroHp')}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <StatBar
        label={t('ui.hero.mana')}
        value={stats.mana}
        max={stats.maxMana}
        color="mana"
        description={t('ui.tooltip.bar.heroMana')}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <StatBar
        label={t('ui.hero.xp')}
        value={stats.xp}
        max={stats.nextLevelXp}
        color="xp"
        description={t('ui.tooltip.bar.heroXp')}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <StatBar
        label={t('ui.hero.hunger')}
        value={hunger}
        max={100}
        color="hunger"
        description={t('ui.tooltip.bar.heroHunger')}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <StatBar
        label={t('ui.hero.thirst')}
        value={thirst ?? 100}
        max={100}
        color="thirst"
        description={t('ui.tooltip.bar.heroThirst')}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <div className={styles.statList}>
        {buildStatRows(stats).map((row) => (
          <div key={row.label} className={styles.statRow}>
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
      {stats.buffs.length > 0 ? (
        <EffectList
          items={buildHeroEffectItems(stats, 'buff')}
          tone="buff"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          stats={stats}
        />
      ) : null}
      {stats.debuffs.length > 0 ? (
        <EffectList
          items={buildHeroEffectItems(stats, 'debuff')}
          tone="debuff"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          stats={stats}
        />
      ) : null}
      <div className={styles.abilitiesGrid}>
        {stats.abilityIds.map((abilityId) => {
          const ability = getAbilityDefinition(abilityId);
          return (
            <AbilitySquare
              key={ability.id}
              label={ability.name}
              icon={ability.icon}
              tooltipLines={abilityTooltipLines(
                ability,
                ability.target,
                stats.attack,
              )}
              remainingMs={0}
              cooldownRatio={0}
              onHoverDetail={onHoverDetail}
              onLeaveDetail={onLeaveDetail}
            />
          );
        })}
      </div>
    </div>
  );
}

function EffectList({
  items,
  tone,
  onHoverDetail,
  onLeaveDetail,
  stats,
}: {
  items: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>[];
  tone: 'buff' | 'debuff';
  onHoverDetail?: HeroWindowProps['onHoverDetail'];
  onLeaveDetail?: HeroWindowProps['onLeaveDetail'];
  stats: HeroWindowProps['stats'];
}) {
  return (
    <div className={styles.effectList}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.effectChip} ${tone === 'buff' ? styles.buffChip : styles.debuffChip}`}
          aria-label={formatStatusEffectLabel(item.id)}
          onMouseEnter={(event) => {
            if (!onHoverDetail) return;
            const extraLines =
              item.id === 'hunger'
                ? [
                    {
                      kind: 'stat' as const,
                      label: t('ui.hero.attack'),
                      value: `-${stats.rawAttack - stats.attack}`,
                      tone: 'negative' as const,
                    },
                    {
                      kind: 'stat' as const,
                      label: t('ui.hero.defense'),
                      value: `-${stats.rawDefense - stats.defense}`,
                      tone: 'negative' as const,
                    },
                  ]
                : item.id === 'thirst'
                  ? [
                      {
                        kind: 'stat' as const,
                        label: t('ui.hero.effect.attackSpeed'),
                        value: '-20%',
                        tone: 'negative' as const,
                      },
                    ]
                  : item.id === 'recentDeath'
                    ? [
                        {
                          kind: 'stat' as const,
                          label: t('ui.hero.hp'),
                          value: '-10%',
                          tone: 'negative' as const,
                        },
                      ]
                    : item.id === 'restoration'
                      ? [
                          {
                            kind: 'stat' as const,
                            label: t('ui.hero.hp'),
                            value: '+1% / s',
                            tone: 'positive' as const,
                          },
                          {
                            kind: 'stat' as const,
                            label: t('ui.combat.mp'),
                            value: '+1% / s',
                            tone: 'positive' as const,
                          },
                        ]
                      : item.id === 'chilling'
                            ? [
                                {
                                  kind: 'stat' as const,
                                  label: t('ui.hero.effect.attackSpeed'),
                                  value: '-20%',
                                  tone: 'negative' as const,
                                },
                              ]
                            : item.id === 'guard'
                              ? [
                                  {
                                    kind: 'stat' as const,
                                    label: t('ui.hero.defense'),
                                    value: '+15%',
                                    tone: 'positive' as const,
                                  },
                                ]
                              : item.id === 'power'
                              ? [
                                  {
                                    kind: 'stat' as const,
                                    label: t('ui.hero.attack'),
                                    value: '+10%',
                                    tone: 'positive' as const,
                                  },
                                ]
                                : item.id === 'frenzy'
                                ? [
                                    {
                                      kind: 'stat' as const,
                                      label: t('ui.hero.effect.attackSpeed'),
                                      value: '+20%',
                                      tone: 'positive' as const,
                                    },
                                  ]
                                  : item.id === 'weakened'
                                  ? [
                                      {
                                        kind: 'stat' as const,
                                        label: t('ui.hero.attack'),
                                        value: '-15%',
                                        tone: 'negative' as const,
                                      },
                                    ]
                                    : item.id === 'shocked'
                                    ? [
                                        {
                                          kind: 'stat' as const,
                                          label: t('ui.hero.defense'),
                                          value: '-15%',
                                          tone: 'negative' as const,
                                        },
                                      ]
                                    : [];
            onHoverDetail(
              event,
              formatStatusEffectLabel(item.id),
              statusEffectTooltipLines(item.id, tone, extraLines, item),
              tone === 'buff'
                ? 'rgba(34, 197, 94, 0.9)'
                : 'rgba(239, 68, 68, 0.9)',
            );
          }}
          onMouseLeave={onLeaveDetail}
        >
          <span
            aria-hidden="true"
            className={styles.effectIcon}
            style={iconMaskStyle(
              statusEffectIcon(item.id),
              statusEffectTint(item.id, tone),
            )}
          />
        </button>
      ))}
    </div>
  );
}

function buildStatRows(stats: HeroWindowProps['stats']) {
  return [
    { label: t('ui.hero.attack'), value: `${stats.attack}` },
    { label: t('ui.hero.defense'), value: `${stats.defense}` },
    formatDerivedStatRow('attackSpeed', stats.attackSpeed, true),
    formatDerivedStatRow(
      'criticalStrikeChance',
      stats.criticalStrikeChance,
    ),
    formatDerivedStatRow(
      'criticalStrikeDamage',
      stats.criticalStrikeDamage,
      false,
      'percent',
    ),
    formatDerivedStatRow('lifestealChance', stats.lifestealChance),
    formatDerivedStatRow(
      'lifestealAmount',
      stats.lifestealAmount,
      false,
      'percentMaxHp',
    ),
    formatDerivedStatRow('dodgeChance', stats.dodgeChance),
    formatDerivedStatRow('blockChance', stats.blockChance),
    formatDerivedStatRow(
      'suppressDamageChance',
      stats.suppressDamageChance,
    ),
    formatDerivedStatRow(
      'suppressDamageReduction',
      stats.suppressDamageReduction,
      false,
      'percent',
    ),
    formatDerivedStatRow(
      'suppressDebuffChance',
      stats.suppressDebuffChance,
    ),
    formatDerivedStatRow('bleedChance', stats.bleedChance),
    formatDerivedStatRow('poisonChance', stats.poisonChance),
    formatDerivedStatRow('burningChance', stats.burningChance),
    formatDerivedStatRow('chillingChance', stats.chillingChance),
    formatDerivedStatRow('powerBuffChance', stats.powerBuffChance),
    formatDerivedStatRow('frenzyBuffChance', stats.frenzyBuffChance),
  ].filter(
    (row): row is { label: string; value: string } => row !== null,
  );
}

function formatDerivedStatRow(
  key: Parameters<typeof formatSecondaryStatLabel>[0],
  value: number | undefined,
  multiplierAsPercent = false,
  format: 'percent' | 'percentMaxHp' = 'percent',
) {
  if (value == null || value === 0) return null;

  const formattedValue =
    key === 'attackSpeed' && multiplierAsPercent
      ? `${Math.round(value * 100)}%`
      : format === 'percentMaxHp'
        ? `${value}% max HP`
        : `${value}%`;

  return {
    label: formatSecondaryStatLabel(key),
    value: formattedValue,
  };
}

function buildHeroEffectItems(
  stats: HeroWindowProps['stats'],
  tone: 'buff' | 'debuff',
) {
  const ids = tone === 'buff' ? stats.buffs : stats.debuffs;
  return ids.map(
    (id) =>
      stats.statusEffects.find((effect) => effect.id === id) ?? {
        id,
      },
  );
}

function AbilitySquare({
  label,
  icon,
  cooldownRatio,
  remainingMs,
  tooltipLines,
  onHoverDetail,
  onLeaveDetail,
}: {
  label: string;
  icon: string;
  cooldownRatio: number;
  remainingMs: number;
  tooltipLines: ReturnType<typeof abilityTooltipLines>;
  onHoverDetail?: HeroWindowProps['onHoverDetail'];
  onLeaveDetail?: HeroWindowProps['onLeaveDetail'];
}) {
  return (
    <div
      className={`${styles.abilitySquare} ${cooldownRatio > 0 ? styles.abilitySquareDisabled : ''}`}
      aria-label={label}
      onMouseEnter={(event) =>
        onHoverDetail?.(event, label, tooltipLines, 'rgba(148, 163, 184, 0.9)')
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
            ['--cooldown-duration' as string]: `${Math.max(remainingMs, 1)}ms`,
            ['--cooldown-scale' as string]: `${cooldownRatio}`,
          }}
        />
      ) : null}
    </div>
  );
}

