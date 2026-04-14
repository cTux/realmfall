import type { Meta, StoryObj } from '@storybook/react-vite';
import { getItemConfigCategory } from '../../../game/content/items';
import { enemyIconFor, enemyTint, iconForItem } from '../../icons';
import { rarityColor } from '../../rarity';
import { structureIconFor, structureTint } from '../../icons';
import {
  createStorybookFixtures,
  storySurfaceDecorator,
} from './storybookHelpers';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Catalogs/Dictionaries',
  decorators: [storySurfaceDecorator],
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

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
