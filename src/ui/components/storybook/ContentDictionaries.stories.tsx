import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';
import { ABILITIES } from '../../../game/abilities';
import { buildItemFromConfig } from '../../../game/content/items';
import { STATUS_EFFECT_DEFINITIONS } from '../../../game/content/statusEffects';
import { enemyIconFor, enemyTint, iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import { structureIconFor, structureTint } from '../../icons';
import { iconMaskStyle } from '../../statusEffects';
import {
  abilityTooltipLines,
  enemyTooltip,
  itemTooltipLines,
  statusEffectTooltipLines,
  structureTooltip,
  type TooltipLine,
} from '../../tooltips';
import { formatStatusEffectLabel } from '../../../i18n/labels';
import {
  createStorybookFixtures,
  storySurfaceDecorator,
} from './storybookHelpers';

const fixtures = createStorybookFixtures();

type HoverDetailHandler = (
  event: MouseEvent<HTMLElement>,
  title: string,
  lines: TooltipLine[],
  borderColor?: string,
) => void;

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

type Story = StoryObj<DictionaryStoryArgs>;

export const Items: Story = {
  args: {
    onHoverDetail: undefined,
    onLeaveDetail: undefined,
  },
  render: (args) => (
    <IconDictionaryGrid
      title={`Items (${fixtures.items.length})`}
      entries={fixtures.items.map((config) => ({
        id: config.key,
        label: config.name,
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
        borderColor: rarityColor(config.rarity),
        tooltipLines: itemTooltipLines(
          buildItemFromConfig(config.key, {
            id: config.key,
            quantity: 1,
          }),
        ),
      }))}
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
    />
  ),
};

export const Enemies: Story = {
  args: {
    onHoverDetail: undefined,
    onLeaveDetail: undefined,
  },
  render: (args) => (
    <IconDictionaryGrid
      title={`Enemies (${fixtures.enemies.length})`}
      entries={fixtures.enemies.map((config) => ({
        id: config.id,
        label: config.name,
        icon: enemyIconFor(config.id),
        tint: `#${enemyTint(config.id).toString(16).padStart(6, '0')}`,
        borderColor: 'rgba(148, 163, 184, 0.9)',
        tooltipLines:
          enemyTooltip([
            {
              id: config.id,
              enemyTypeId: config.id,
              name: config.name,
              coord: { q: 0, r: 0 },
              rarity: 'common',
              tier: 1,
              hp: 1,
              maxHp: 1,
              attack: 0,
              defense: 0,
              xp: 0,
              elite: false,
              tags: config.tags,
            },
          ])?.lines ?? [],
      }))}
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
    />
  ),
};

export const Structures: Story = {
  args: {
    onHoverDetail: undefined,
    onLeaveDetail: undefined,
  },
  render: (args) => (
    <IconDictionaryGrid
      title={`Structures (${fixtures.structures.length})`}
      entries={fixtures.structures.map((config) => ({
        id: config.type,
        label: config.title,
        icon: structureIconFor(config.type),
        tint: `#${structureTint(config.type).toString(16).padStart(6, '0')}`,
        borderColor: 'rgba(148, 163, 184, 0.9)',
        tooltipLines:
          structureTooltip({
            coord: { q: 0, r: 0 },
            terrain: 'plains',
            structure: config.type,
            items: [],
            enemyIds: [],
          })?.lines ?? [],
      }))}
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
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
        tooltipLines: abilityTooltipLines(ability, ability.target),
      }))}
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
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
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
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
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
    />
  ),
};

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
