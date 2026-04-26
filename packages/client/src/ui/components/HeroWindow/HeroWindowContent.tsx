import { getAbilityDefinition } from '../../../game/abilities';
import { useWorldClockTime } from '../../../app/App/worldClockStore';
import type { PlayerStatusEffect } from '../../../game/types';
import { t } from '../../../i18n';
import { formatStatusEffectLabel } from '../../../i18n/labels';
import { statusEffectIcon, statusEffectTint } from '../../statusEffects';
import { abilityTooltipLines, statusEffectTooltipLines } from '../../tooltips';
import {
  getPlayerThirstValue,
  PLAYER_SURVIVAL_MAX,
} from '../../../game/survival';
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
  'hero' | 'hunger' | 'thirst' | 'onHoverDetail' | 'onLeaveDetail'
>;

export function HeroWindowContent({
  hero,
  hunger,
  thirst,
  onHoverDetail,
  onLeaveDetail,
}: HeroWindowContentProps) {
  const worldTimeMs = useWorldClockTime();

  return (
    <div className={styles.stats}>
      <EntityStatusPanel
        className={styles.summary}
        title={t('ui.window.hero.plain')}
        showPrimaryTitle={false}
        bars={buildHeroBars(hero, hunger, thirst)}
        abilities={buildAbilityIcons(hero)}
        buffs={buildEffectIcons(hero, 'buff', worldTimeMs)}
        debuffs={buildEffectIcons(hero, 'debuff', worldTimeMs)}
        onHoverDetail={onHoverDetail}
        onLeaveDetail={onLeaveDetail}
      />
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t('ui.hero.statSheet.primary')}
        </h3>
        <div className={styles.statGrid}>
          {buildPrimaryStatRows(hero).map((row) => (
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
          {buildSecondaryStatRows(hero).map((row) => (
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
  hero: HeroWindowProps['hero'],
  hunger: number,
  thirst: number | undefined,
): [EntityStatusBar, ...EntityStatusBar[]] {
  return [
    {
      id: 'hp',
      label: t('ui.hero.hp'),
      value: hero.hp,
      max: hero.maxHp,
      tone: 'hp',
      description: t('ui.tooltip.bar.heroHp'),
    },
    {
      id: 'mana',
      label: t('ui.hero.mana'),
      value: hero.mana,
      max: hero.maxMana,
      tone: 'mana',
      description: t('ui.tooltip.bar.heroMana'),
    },
    {
      id: 'xp',
      label: t('ui.hero.xp'),
      value: hero.xp,
      max: hero.nextLevelXp,
      tone: 'xp',
      description: t('ui.tooltip.bar.heroXp'),
    },
    {
      id: 'hunger',
      label: t('ui.hero.hunger'),
      value: hunger,
      max: PLAYER_SURVIVAL_MAX,
      tone: 'hunger',
      description: t('ui.tooltip.bar.heroHunger'),
    },
    {
      id: 'thirst',
      label: t('ui.hero.thirst'),
      value: getPlayerThirstValue(thirst),
      max: PLAYER_SURVIVAL_MAX,
      tone: 'thirst',
      description: t('ui.tooltip.bar.heroThirst'),
    },
  ];
}

function buildEffectIcons(
  hero: HeroWindowProps['hero'],
  tone: 'buff' | 'debuff',
  worldTimeMs: number,
) {
  return buildHeroEffectItems(hero, tone).map<EntityStatusIcon>((item) => ({
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
      heroEffectExtraLines(item.id, hero),
      item,
      worldTimeMs,
    ),
    tooltipBorderColor:
      tone === 'buff' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
  }));
}

function buildAbilityIcons(hero: HeroWindowProps['hero']) {
  return hero.abilityIds.map<EntityStatusIcon>((abilityId) => {
    const ability = getAbilityDefinition(abilityId);
    return {
      id: ability.id,
      label: ability.name,
      icon: ability.icon,
      tint: '#f8fafc',
      borderColor: 'rgb(148 163 184 / 35%)',
      tooltipTitle: ability.name,
      tooltipLines: abilityTooltipLines(ability, ability.target, hero.attack),
      tooltipBorderColor: 'rgba(148, 163, 184, 0.9)',
    };
  });
}

function buildHeroEffectItems(
  hero: HeroWindowProps['hero'],
  tone: 'buff' | 'debuff',
) {
  const ids = tone === 'buff' ? hero.buffs : hero.debuffs;
  return ids.map(
    (id) =>
      hero.statusEffects.find((effect) => effect.id === id) ?? {
        id,
      },
  );
}

function heroEffectExtraLines(
  id: PlayerStatusEffect['id'],
  hero: HeroWindowProps['hero'],
) {
  switch (id) {
    case 'hunger':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.attack'),
          value: `-${hero.rawAttack - hero.attack}`,
          tone: 'negative' as const,
        },
        {
          kind: 'stat' as const,
          label: t('ui.hero.defense'),
          value: `-${hero.rawDefense - hero.defense}`,
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
