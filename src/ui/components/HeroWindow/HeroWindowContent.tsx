import { getAbilityDefinition } from '../../../game/combat';
import { t } from '../../../i18n';
import { formatStatusEffectLabel } from '../../../i18n/labels';
import {
  iconMaskStyle,
  statusEffectIcon,
  statusEffectTint,
} from '../../statusEffects';
import { StatBar } from './components/StatBar';
import type { HeroWindowProps } from './types';
import styles from './styles.module.scss';

const KICK_ICON_PATH =
  'M198.844 64.75c-.985 0-1.974.03-2.97.094-15.915 1.015-32.046 11.534-37.78 26.937-34.072 91.532-51.085 128.865-61.5 222.876 14.633 13.49 31.63 26.45 50.25 38.125l66.406-196.467 17.688 5.968L163.28 362.5c19.51 10.877 40.43 20.234 62 27.28l75.407-201.53 17.5 6.53-74.937 200.282c19.454 5.096 39.205 8.2 58.78 8.875L381.345 225.5l17.094 7.594-75.875 170.656c21.82-1.237 43.205-5.768 63.437-14.28 43.317-53.844 72.633-109.784 84.5-172.69 5.092-26.992-14.762-53.124-54.22-54.81l-6.155-.282-2.188-5.75c-8.45-22.388-19.75-30.093-31.5-32.47-11.75-2.376-25.267 1.535-35.468 7.376l-13.064 7.47-.906-15c-.99-16.396-10.343-29.597-24.313-35.626-13.97-6.03-33.064-5.232-54.812 9.906l-10.438 7.25-3.812-12.125c-6.517-20.766-20.007-27.985-34.78-27.97zM103.28 188.344C71.143 233.448 47.728 299.56 51.407 359.656c27.54 21.84 54.61 33.693 80.063 35.438 14.155.97 27.94-1.085 41.405-6.438-35.445-17.235-67.36-39.533-92.594-63.53l-3.343-3.157.5-4.595c5.794-54.638 13.946-91.5 25.844-129.03z';

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
  worldTimeMs = 0,
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
          items={stats.buffs}
          tone="buff"
          onHoverDetail={onHoverDetail}
          onLeaveDetail={onLeaveDetail}
          stats={stats}
        />
      ) : null}
      {stats.debuffs.length > 0 ? (
        <EffectList
          items={stats.debuffs}
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
              manaCost={ability.manaCost}
              cooldownMs={ability.cooldownMs}
              castTimeMs={ability.castTimeMs}
              remainingMs={0}
              cooldownRatio={0}
              worldTimeMs={worldTimeMs}
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
  items: string[];
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
            onHoverDetail(
              event,
              formatStatusEffectLabel(item),
              item === 'hunger'
                ? [
                    {
                      kind: 'text',
                      text: t('ui.hero.effect.hunger.description'),
                    },
                    {
                      kind: 'stat',
                      label: t('ui.hero.attack'),
                      value: `-${stats.rawAttack - stats.attack}`,
                      tone: 'negative',
                    },
                    {
                      kind: 'stat',
                      label: t('ui.hero.defense'),
                      value: `-${stats.rawDefense - stats.defense}`,
                      tone: 'negative',
                    },
                  ]
                : item === 'thirst'
                  ? [
                      {
                        kind: 'text',
                        text: t('ui.hero.effect.thirst.description'),
                      },
                      {
                        kind: 'stat',
                        label: t('ui.hero.effect.attackSpeed'),
                        value: '-20%',
                        tone: 'negative',
                      },
                    ]
                  : item === 'recentDeath'
                    ? [
                        {
                          kind: 'text',
                          text: t('ui.hero.effect.recentDeath.description'),
                        },
                        {
                          kind: 'stat',
                          label: t('ui.hero.hp'),
                          value: '-10%',
                          tone: 'negative',
                        },
                      ]
                    : item === 'restoration'
                      ? [
                          {
                            kind: 'text',
                            text: t('ui.hero.effect.restoration.description'),
                          },
                          {
                            kind: 'stat',
                            label: t('ui.hero.hp'),
                            value: '+1% / s',
                            tone: 'positive',
                          },
                          {
                            kind: 'stat',
                            label: t('ui.combat.mp'),
                            value: '+1% / s',
                            tone: 'positive',
                          },
                        ]
                      : [
                          {
                            kind: 'text',
                            text:
                              tone === 'buff'
                                ? t('ui.hero.effect.buff')
                                : t('ui.hero.effect.debuff'),
                          },
                        ],
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
  cooldownRatio,
  remainingMs,
  manaCost,
  cooldownMs,
  castTimeMs,
  onHoverDetail,
  onLeaveDetail,
}: {
  label: string;
  cooldownRatio: number;
  remainingMs: number;
  manaCost: number;
  cooldownMs: number;
  castTimeMs: number;
  worldTimeMs: number;
  onHoverDetail?: HeroWindowProps['onHoverDetail'];
  onLeaveDetail?: HeroWindowProps['onLeaveDetail'];
}) {
  const tooltipLines = [
    {
      kind: 'stat' as const,
      label: t('ui.ability.aetherCost'),
      value: `${manaCost}`,
    },
    {
      kind: 'stat' as const,
      label: t('ui.ability.cooldown'),
      value: `${cooldownMs / 1000}s`,
    },
    {
      kind: 'stat' as const,
      label: t('ui.ability.castTime'),
      value:
        castTimeMs === 0 ? t('ui.ability.instant') : `${castTimeMs / 1000}s`,
    },
    {
      kind: 'text' as const,
      text: t('ui.ability.targeting'),
    },
  ];

  return (
    <div
      className={styles.abilitySquare}
      aria-label={label}
      onMouseEnter={(event) =>
        onHoverDetail?.(event, label, tooltipLines, 'rgba(148, 163, 184, 0.9)')
      }
      onMouseLeave={onLeaveDetail}
    >
      <svg
        viewBox="0 0 512 512"
        aria-hidden="true"
        className={styles.abilityIcon}
      >
        <path fill="currentColor" d={KICK_ICON_PATH} />
      </svg>
      {cooldownRatio > 0 ? (
        <div
          className={styles.cooldownOverlay}
          style={{
            ['--cooldown-duration' as string]: `${Math.max(remainingMs, 1)}ms`,
            ['--cooldown-start' as string]: `${cooldownRatio * 360}deg`,
          }}
        />
      ) : null}
    </div>
  );
}
