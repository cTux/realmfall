import { getAbilityDefinition } from '../../../game/abilities';
import type { PlayerStatusEffect } from '../../../game/types';
import { t } from '../../../i18n';
import { formatStatusEffectLabel } from '../../../i18n/labels';
import { statusEffectIcon, statusEffectTint } from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import {
  EntityStatusPanel,
  type EntityStatusBar,
  type EntityStatusIcon,
} from '../EntityStatusPanel/EntityStatusPanel';
import { buildPrimaryStatRows, buildSecondaryStatRows } from '../statSheet';
import type { HeroWindowProps } from './types';
import styles from './styles.module.scss';

type HeroWindowContentProps = Pick<
  HeroWindowProps,
  'stats' | 'hunger' | 'thirst' | 'onHoverDetail' | 'onLeaveDetail'
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
      <EntityStatusPanel
        className={styles.summary}
        title={t('ui.window.hero.plain')}
        showPrimaryTitle={false}
        bars={buildHeroBars(stats, hunger, thirst)}
        abilities={buildAbilityIcons(stats)}
        buffs={buildEffectIcons(stats, 'buff')}
        debuffs={buildEffectIcons(stats, 'debuff')}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t('ui.hero.statSheet.primary')}
        </h3>
        <div className={styles.statGrid}>
          {buildPrimaryStatRows(stats).map((row) => (
            <div key={row.label} className={styles.statRow}>
              <span className={styles.statLabel}>{row.label}</span>
              <span className={styles.statValue}>{row.value}</span>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t('ui.hero.statSheet.secondary')}
        </h3>
        <div className={styles.statGrid}>
          {buildSecondaryStatRows(stats).map((row) => (
            <div key={row.label} className={styles.statRow}>
              <span className={styles.statLabel}>{row.label}</span>
              <span className={styles.statValue}>{row.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildHeroBars(
  stats: HeroWindowProps['stats'],
  hunger: number,
  thirst: number | undefined,
): [EntityStatusBar, ...EntityStatusBar[]] {
  return [
    {
      id: 'hp',
      label: t('ui.hero.hp'),
      value: stats.hp,
      max: stats.maxHp,
      tone: 'hp',
      description: t('ui.tooltip.bar.heroHp'),
    },
    {
      id: 'mana',
      label: t('ui.hero.mana'),
      value: stats.mana,
      max: stats.maxMana,
      tone: 'mana',
      description: t('ui.tooltip.bar.heroMana'),
    },
    {
      id: 'xp',
      label: t('ui.hero.xp'),
      value: stats.xp,
      max: stats.nextLevelXp,
      tone: 'xp',
      description: t('ui.tooltip.bar.heroXp'),
    },
    {
      id: 'hunger',
      label: t('ui.hero.hunger'),
      value: hunger,
      max: 100,
      tone: 'hunger',
      description: t('ui.tooltip.bar.heroHunger'),
    },
    {
      id: 'thirst',
      label: t('ui.hero.thirst'),
      value: thirst ?? 100,
      max: 100,
      tone: 'thirst',
      description: t('ui.tooltip.bar.heroThirst'),
    },
  ];
}

function buildEffectIcons(
  stats: HeroWindowProps['stats'],
  tone: 'buff' | 'debuff',
) {
  return buildHeroEffectItems(stats, tone).map<EntityStatusIcon>((item) => ({
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
      heroEffectExtraLines(item.id, stats),
      item,
    ),
    tooltipBorderColor:
      tone === 'buff' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
  }));
}

function buildAbilityIcons(stats: HeroWindowProps['stats']) {
  return stats.abilityIds.map<EntityStatusIcon>((abilityId) => {
    const ability = getAbilityDefinition(abilityId);
    return {
      id: ability.id,
      label: ability.name,
      icon: ability.icon,
      tint: '#f8fafc',
      borderColor: 'rgb(148 163 184 / 35%)',
      tooltipTitle: ability.name,
      tooltipLines: abilityTooltipLines(ability, ability.target, stats.attack),
      tooltipBorderColor: 'rgba(148, 163, 184, 0.9)',
    };
  });
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

function heroEffectExtraLines(
  id: PlayerStatusEffect['id'],
  stats: HeroWindowProps['stats'],
) {
  switch (id) {
    case 'hunger':
      return [
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
      ];
    case 'thirst':
    case 'chilling':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.attackSpeed'),
          value: '-20%',
          tone: 'negative' as const,
        },
      ];
    case 'recentDeath':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.hp'),
          value: '-10%',
          tone: 'negative' as const,
        },
      ];
    case 'restoration':
      return [
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
      ];
    case 'guard':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.defense'),
          value: '+15%',
          tone: 'positive' as const,
        },
      ];
    case 'power':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.attack'),
          value: '+10%',
          tone: 'positive' as const,
        },
      ];
    case 'frenzy':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.attackSpeed'),
          value: '+20%',
          tone: 'positive' as const,
        },
      ];
    case 'weakened':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.attack'),
          value: '-15%',
          tone: 'negative' as const,
        },
      ];
    case 'shocked':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.defense'),
          value: '-15%',
          tone: 'negative' as const,
        },
      ];
    default:
      return [];
  }
}
