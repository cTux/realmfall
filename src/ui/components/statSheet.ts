import type { SecondaryStatKey } from '../../game/types';
import { t } from '../../i18n';
import { formatSecondaryStatLabel } from '../../i18n/labels';
import type { TooltipLine } from '../tooltips';

export interface StatSheetValues {
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed?: number;
  bonusExperience?: number;
  criticalStrikeChance?: number;
  criticalStrikeDamage?: number;
  lifestealChance?: number;
  lifestealAmount?: number;
  dodgeChance?: number;
  blockChance?: number;
  suppressDamageChance?: number;
  suppressDamageReduction?: number;
  suppressDebuffChance?: number;
  bleedChance?: number;
  poisonChance?: number;
  burningChance?: number;
  chillingChance?: number;
  powerBuffChance?: number;
  frenzyBuffChance?: number;
  secondaryStatTotals?: Partial<
    Record<SecondaryStatKey, { effective: number; raw: number }>
  >;
}

export interface StatSheetRow {
  label: string;
  value: string;
}

interface SecondaryStatRowConfig {
  label: () => string;
  select: (stats: StatSheetValues) => number | undefined;
  format: (value: number) => string;
}

export const STAT_SHEET_SECONDARY_KEYS: SecondaryStatKey[] = [
  'attackSpeed',
  'bonusExperience',
  'criticalStrikeChance',
  'criticalStrikeDamage',
  'lifestealChance',
  'lifestealAmount',
  'dodgeChance',
  'blockChance',
  'suppressDamageChance',
  'suppressDamageReduction',
  'suppressDebuffChance',
  'bleedChance',
  'poisonChance',
  'burningChance',
  'chillingChance',
  'powerBuffChance',
  'frenzyBuffChance',
];

const SECONDARY_STAT_ROW_CONFIG = {
  attackSpeed: {
    label: () => t('ui.hero.effect.attackSpeed'),
    select: (stats) => stats.attackSpeed,
    format: formatAttackSpeedPercentFromMultiplier,
  },
  bonusExperience: {
    label: () => formatSecondaryStatLabel('bonusExperience'),
    select: (stats) => stats.bonusExperience,
    format: formatPercent,
  },
  criticalStrikeChance: {
    label: () => formatSecondaryStatLabel('criticalStrikeChance'),
    select: (stats) => stats.criticalStrikeChance,
    format: formatPercent,
  },
  criticalStrikeDamage: {
    label: () => formatSecondaryStatLabel('criticalStrikeDamage'),
    select: (stats) => stats.criticalStrikeDamage,
    format: formatPercent,
  },
  lifestealChance: {
    label: () => formatSecondaryStatLabel('lifestealChance'),
    select: (stats) => stats.lifestealChance,
    format: formatPercent,
  },
  lifestealAmount: {
    label: () => formatSecondaryStatLabel('lifestealAmount'),
    select: (stats) => stats.lifestealAmount,
    format: formatMaxHpPercent,
  },
  dodgeChance: {
    label: () => formatSecondaryStatLabel('dodgeChance'),
    select: (stats) => stats.dodgeChance,
    format: formatPercent,
  },
  blockChance: {
    label: () => formatSecondaryStatLabel('blockChance'),
    select: (stats) => stats.blockChance,
    format: formatPercent,
  },
  suppressDamageChance: {
    label: () => formatSecondaryStatLabel('suppressDamageChance'),
    select: (stats) => stats.suppressDamageChance,
    format: formatPercent,
  },
  suppressDamageReduction: {
    label: () => formatSecondaryStatLabel('suppressDamageReduction'),
    select: (stats) => stats.suppressDamageReduction,
    format: formatPercent,
  },
  suppressDebuffChance: {
    label: () => formatSecondaryStatLabel('suppressDebuffChance'),
    select: (stats) => stats.suppressDebuffChance,
    format: formatPercent,
  },
  bleedChance: {
    label: () => formatSecondaryStatLabel('bleedChance'),
    select: (stats) => stats.bleedChance,
    format: formatPercent,
  },
  poisonChance: {
    label: () => formatSecondaryStatLabel('poisonChance'),
    select: (stats) => stats.poisonChance,
    format: formatPercent,
  },
  burningChance: {
    label: () => formatSecondaryStatLabel('burningChance'),
    select: (stats) => stats.burningChance,
    format: formatPercent,
  },
  chillingChance: {
    label: () => formatSecondaryStatLabel('chillingChance'),
    select: (stats) => stats.chillingChance,
    format: formatPercent,
  },
  powerBuffChance: {
    label: () => formatSecondaryStatLabel('powerBuffChance'),
    select: (stats) => stats.powerBuffChance,
    format: formatPercent,
  },
  frenzyBuffChance: {
    label: () => formatSecondaryStatLabel('frenzyBuffChance'),
    select: (stats) => stats.frenzyBuffChance,
    format: formatPercent,
  },
} satisfies Record<SecondaryStatKey, SecondaryStatRowConfig>;

export function buildPrimaryStatRows(stats: StatSheetValues): StatSheetRow[] {
  return [
    {
      label: t('ui.tooltip.maxHealth'),
      value: formatNumber(stats.maxHp),
    },
    {
      label: t('ui.hero.attack'),
      value: formatNumber(stats.attack),
    },
    {
      label: t('ui.hero.defense'),
      value: formatNumber(stats.defense),
    },
  ];
}

export function buildSecondaryStatRows(
  stats: StatSheetValues,
  keys: SecondaryStatKey[] = STAT_SHEET_SECONDARY_KEYS,
): StatSheetRow[] {
  return keys.flatMap((key) => {
    const config = SECONDARY_STAT_ROW_CONFIG[key];
    const value = formatSecondaryValue(
      stats.secondaryStatTotals?.[key],
      config.select(stats),
      config.format,
    );

    return value
      ? [
          {
            label: config.label(),
            value,
          },
        ]
      : [];
  });
}

export function buildStatSheetTooltipLines(
  stats: StatSheetValues,
  {
    secondaryKeys = STAT_SHEET_SECONDARY_KEYS,
  }: {
    secondaryKeys?: SecondaryStatKey[];
  } = {},
): TooltipLine[] {
  const primaryRows = buildPrimaryStatRows(stats);
  const secondaryRows = buildSecondaryStatRows(stats, secondaryKeys);

  return [
    {
      kind: 'text',
      text: t('ui.hero.statSheet.primary'),
      tone: 'section',
    },
    ...primaryRows.map(
      (row) =>
        ({
          kind: 'stat',
          label: row.label,
          value: row.value,
        }) satisfies TooltipLine,
    ),
    ...(secondaryRows.length > 0
      ? [
          {
            kind: 'text' as const,
            text: t('ui.hero.statSheet.secondary'),
            tone: 'section' as const,
          },
          ...secondaryRows.map(
            (row) =>
              ({
                kind: 'stat',
                label: row.label,
                value: row.value,
              }) satisfies TooltipLine,
          ),
        ]
      : []),
  ];
}

function formatSecondaryValue(
  total: { effective: number; raw: number } | undefined,
  fallback: number | undefined,
  formatter: (value: number) => string,
) {
  const effective = total?.effective ?? fallback;
  if (effective === undefined) {
    return null;
  }

  const raw = total?.raw ?? effective;
  const effectiveValue = formatter(effective);

  if (raw <= effective + 0.0001) {
    return effectiveValue;
  }

  return t('ui.hero.statSheet.overcap', {
    effective: effectiveValue,
    raw: t('ui.hero.statSheet.raw', { value: formatter(raw) }),
  });
}

function formatNumber(value: number) {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 0.0001 ? `${rounded}` : value.toFixed(1);
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function formatAttackSpeedPercentFromMultiplier(value: number) {
  return formatPercent((value - 1) * 100);
}

function formatMaxHpPercent(value: number) {
  return `${formatNumber(value)}% ${t('ui.tooltip.maxHealth').toLowerCase()}`;
}
