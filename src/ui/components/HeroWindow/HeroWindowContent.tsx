import { getAbilityDefinition } from '../../../game/abilities';
import type { StatusEffectId } from '../../../game/types';
import { t } from '../../../i18n';
import { formatStatusEffectLabel } from '../../../i18n/labels';
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
        label={t('ui.hero.aether')}
        value={stats.mana}
        max={stats.maxMana}
        color="mana"
        description={t('ui.tooltip.bar.heroAether')}
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
        <div className={styles.statRow}>
          <span>{t('ui.hero.attack')}</span>
          <span>{stats.attack}</span>
        </div>
        <div className={styles.statRow}>
          <span>{t('ui.hero.defense')}</span>
          <span>{stats.defense}</span>
        </div>
      </div>
      {stats.buffs.length > 0 ? (
        <EffectList
          items={stats.buffs as StatusEffectId[]}
          tone="buff"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          stats={stats}
        />
      ) : null}
      {stats.debuffs.length > 0 ? (
        <EffectList
          items={stats.debuffs as StatusEffectId[]}
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
              tooltipLines={abilityTooltipLines(ability, ability.target)}
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
  items: StatusEffectId[];
  tone: 'buff' | 'debuff';
  onHoverDetail?: HeroWindowProps['onHoverDetail'];
  onLeaveDetail?: HeroWindowProps['onLeaveDetail'];
  stats: HeroWindowProps['stats'];
}) {
  return (
    <div className={styles.effectList}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`${styles.effectChip} ${tone === 'buff' ? styles.buffChip : styles.debuffChip}`}
          aria-label={formatStatusEffectLabel(item)}
          onMouseEnter={(event) => {
            if (!onHoverDetail) return;
            const extraLines =
              item === 'hunger'
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
                : item === 'thirst'
                  ? [
                      {
                        kind: 'stat' as const,
                        label: t('ui.hero.effect.attackSpeed'),
                        value: '-20%',
                        tone: 'negative' as const,
                      },
                    ]
                  : item === 'recentDeath'
                    ? [
                        {
                          kind: 'stat' as const,
                          label: t('ui.hero.hp'),
                          value: '-10%',
                          tone: 'negative' as const,
                        },
                      ]
                    : item === 'restoration'
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
                      : item === 'bleeding'
                        ? [
                            {
                              kind: 'stat' as const,
                            label: t('ui.hero.hp'),
                            value: t('ui.hero.effect.bleeding.value'),
                            tone: 'negative' as const,
                          },
                        ]
                      : item === 'poison'
                        ? [
                            {
                              kind: 'stat' as const,
                              label: t('ui.hero.hp'),
                              value: t('ui.hero.effect.poison.value'),
                              tone: 'negative' as const,
                            },
                          ]
                        : item === 'burning'
                          ? [
                              {
                                kind: 'stat' as const,
                                label: t('ui.hero.hp'),
                                value: t('ui.hero.effect.burning.value'),
                                tone: 'negative' as const,
                              },
                            ]
                          : item === 'chilling'
                            ? [
                                {
                                  kind: 'stat' as const,
                                  label: t('ui.hero.effect.attackSpeed'),
                                  value: '-20%',
                                  tone: 'negative' as const,
                                },
                              ]
                            : item === 'guard'
                              ? [
                                  {
                                    kind: 'stat' as const,
                                    label: t('ui.hero.defense'),
                                    value: '+15%',
                                    tone: 'positive' as const,
                                  },
                                ]
                            : item === 'power'
                              ? [
                                  {
                                    kind: 'stat' as const,
                                    label: t('ui.hero.attack'),
                                    value: '+10%',
                                    tone: 'positive' as const,
                                  },
                                ]
                              : item === 'frenzy'
                                ? [
                                    {
                                      kind: 'stat' as const,
                                      label: t('ui.hero.effect.attackSpeed'),
                                      value: '+20%',
                                      tone: 'positive' as const,
                                    },
                                  ]
                                : item === 'weakened'
                                  ? [
                                      {
                                        kind: 'stat' as const,
                                        label: t('ui.hero.attack'),
                                        value: '-15%',
                                        tone: 'negative' as const,
                                      },
                                    ]
                                  : item === 'shocked'
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
              formatStatusEffectLabel(item),
              statusEffectTooltipLines(item, tone, extraLines),
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
