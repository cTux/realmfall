import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';
import { ABILITIES } from '../../../game/abilities';
import { getItemConfigCategory } from '../../../game/content/items';
import { STATUS_EFFECT_DEFINITIONS } from '../../../game/content/statusEffects';
import { enemyIconFor, enemyTint, iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import { structureIconFor, structureTint } from '../../icons';
import { iconMaskStyle } from '../../statusEffects';
import {
  abilityTooltipLines,
  statusEffectTooltipLines,
  type TooltipLine,
} from '../../tooltips';
import { formatStatusEffectLabel } from '../../../i18n/labels';
import {
  createStorybookFixtures,
  storySurfaceDecorator,
} from './storybookHelpers';

const fixtures = createStorybookFixtures();
interface DictionaryStoryArgs {
  onHoverDetail?: HoverDetailHandler;
  onLeaveDetail?: () => void;
}

const meta: Meta<DictionaryStoryArgs> = {
  title: 'Catalogs/Dictionaries',
  decorators: [storySurfaceDecorator],
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
};

export default meta;

type HoverDetailHandler = (
  event: MouseEvent<HTMLElement>,
  title: string,
  lines: TooltipLine[],
  borderColor?: string,
) => void;
type Story = StoryObj<DictionaryStoryArgs>;

export const Items: Story = {
  render: () => (
    <CatalogGrid
      title={`Items (${fixtures.items.length})`}
      entries={fixtures.items.map((config) => ({
        id: config.key,
        title: config.name,
        subtitle: `${getItemConfigCategory(config)} · tier ${config.tier} · ${config.rarity}`,
        details: [
          `Power ${config.power}`,
          `Defense ${config.defense}`,
          `Max HP ${config.maxHp}`,
          `Tags ${config.tags?.join(', ') ?? 'none'}`,
        ],
        icon: iconForItem({
          id: config.key,
          itemKey: config.key,
          slot: config.slot,
          name: config.name,
          quantity: 1,
          tier: config.tier,
          rarity: config.rarity,
          power: config.power,
          defense: config.defense,
          maxHp: config.maxHp,
          healing: config.healing,
          hunger: config.hunger,
          thirst: config.thirst,
          tags: config.tags,
        }),
        tint: config.tint ?? rarityColor(config.rarity),
      }))}
    />
  ),
};

export const Enemies: Story = {
  render: () => (
    <CatalogGrid
      title={`Enemies (${fixtures.enemies.length})`}
      entries={fixtures.enemies.map((config) => ({
        id: config.id,
        title: config.name,
        subtitle: config.id,
        details: [
          `Elite chance ${Math.round((config.eliteAppearanceChance ?? 0) * 100)}%`,
          `Terrains ${Object.keys(config.appearanceChanceByTerrain).join(', ') || 'none'}`,
          `Tags ${config.tags?.join(', ') ?? 'none'}`,
        ],
        icon: enemyIconFor(config.id),
        tint: `#${enemyTint(config.id).toString(16).padStart(6, '0')}`,
      }))}
    />
  ),
};

export const Structures: Story = {
  render: () => (
    <CatalogGrid
      title={`Structures (${fixtures.structures.length})`}
      entries={fixtures.structures.map((config) => ({
        id: config.type,
        title: config.title,
        subtitle: config.type,
        details: [
          config.description,
          config.gathering
            ? `${config.gathering.verb} ${config.gathering.reward}`
            : config.functionsProvided.join(', '),
        ],
        icon: structureIconFor(config.type),
        tint: `#${structureTint(config.type).toString(16).padStart(6, '0')}`,
      }))}
    />
  ),
};

export const Abilities: Story = {
  args: {
    onHoverDetail: undefined,
    onLeaveDetail: undefined,
  },
  render: (args) => (
    <IconDictionaryGrid
      title={`Abilities (${Object.values(ABILITIES).length})`}
      entries={Object.values(ABILITIES).map((ability) => ({
        id: ability.id,
        label: ability.name,
        icon: ability.icon,
        tint: '#f8fafc',
        borderColor: 'rgba(148, 163, 184, 0.9)',
        tooltipLines: abilityTooltipLines(ability),
      }))}
      onHoverDetail={args.onHoverDetail as HoverDetailHandler | undefined}
      onLeaveDetail={args.onLeaveDetail as (() => void) | undefined}
    />
  ),
};

export const Buffs: Story = {
  args: {
    onHoverDetail: undefined,
    onLeaveDetail: undefined,
  },
  render: (args) => (
    <IconDictionaryGrid
      title={`Buffs (${
        Object.values(STATUS_EFFECT_DEFINITIONS).filter(
          (definition) => definition.tone === 'buff',
        ).length
      })`}
      entries={Object.values(STATUS_EFFECT_DEFINITIONS)
        .filter((definition) => definition.tone === 'buff')
        .map((definition) => ({
          id: definition.id,
          label: formatStatusEffectLabel(definition.id),
          icon: definition.icon,
          tint: definition.tint,
          borderColor: 'rgba(34, 197, 94, 0.9)',
          tooltipLines: statusEffectTooltipLines(definition.id, 'buff'),
        }))}
      onHoverDetail={args.onHoverDetail as HoverDetailHandler | undefined}
      onLeaveDetail={args.onLeaveDetail as (() => void) | undefined}
    />
  ),
};

export const Debuffs: Story = {
  args: {
    onHoverDetail: undefined,
    onLeaveDetail: undefined,
  },
  render: (args) => (
    <IconDictionaryGrid
      title={`Debuffs (${
        Object.values(STATUS_EFFECT_DEFINITIONS).filter(
          (definition) => definition.tone === 'debuff',
        ).length
      })`}
      entries={Object.values(STATUS_EFFECT_DEFINITIONS)
        .filter((definition) => definition.tone === 'debuff')
        .map((definition) => ({
          id: definition.id,
          label: formatStatusEffectLabel(definition.id),
          icon: definition.icon,
          tint: definition.tint,
          borderColor: 'rgba(239, 68, 68, 0.9)',
          tooltipLines: statusEffectTooltipLines(definition.id, 'debuff'),
        }))}
      onHoverDetail={args.onHoverDetail as HoverDetailHandler | undefined}
      onLeaveDetail={args.onLeaveDetail as (() => void) | undefined}
    />
  ),
};

function CatalogGrid({
  title,
  entries,
}: {
  title: string;
  entries: Array<{
    id: string;
    title: string;
    subtitle: string;
    details: string[];
    icon: string;
    tint: string;
  }>;
}) {
  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <header>
        <h1 style={{ margin: 0, fontSize: '28px' }}>{title}</h1>
      </header>
      <div
        style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
      >
        {entries.map((entry) => (
          <article
            key={entry.id}
            style={{
              display: 'grid',
              gap: '10px',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              background:
                'linear-gradient(160deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.86))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                aria-hidden="true"
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'inline-block',
                  backgroundColor: entry.tint,
                  WebkitMask: `url("${entry.icon}") center / contain no-repeat`,
                  mask: `url("${entry.icon}") center / contain no-repeat`,
                }}
              />
              <div>
                <strong style={{ display: 'block' }}>{entry.title}</strong>
                <span
                  style={{
                    color: 'rgba(226, 232, 240, 0.72)',
                    fontSize: '13px',
                  }}
                >
                  {entry.subtitle}
                </span>
              </div>
            </div>
            {entry.details.map((detail) => (
              <span key={detail} style={{ fontSize: '13px', color: '#cbd5e1' }}>
                {detail}
              </span>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function IconDictionaryGrid({
  title,
  entries,
  onHoverDetail,
  onLeaveDetail,
}: {
  title: string;
  entries: Array<{
    id: string;
    label: string;
    icon: string;
    tint: string;
    borderColor: string;
    tooltipLines: TooltipLine[];
  }>;
  onHoverDetail?: HoverDetailHandler;
  onLeaveDetail?: () => void;
}) {
  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <header>
        <h1 style={{ margin: 0, fontSize: '28px' }}>{title}</h1>
      </header>
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        }}
      >
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-label={entry.label}
            onMouseEnter={(event) =>
              onHoverDetail?.(
                event,
                entry.label,
                entry.tooltipLines,
                entry.borderColor,
              )
            }
            onMouseLeave={onLeaveDetail}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '88px',
              height: '88px',
              padding: '18px',
              borderRadius: '20px',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              background:
                'linear-gradient(160deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.86))',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.24)',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '52px',
                height: '52px',
                display: 'inline-block',
                ...iconMaskStyle(entry.icon, entry.tint),
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
