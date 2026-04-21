import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState, type MouseEvent } from 'react';
import { loadI18n } from '../../../i18n';
import type { TooltipLine } from '../../tooltips';

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

interface IconDictionaryEntry {
  id: string;
  label: string;
  icon: string;
  tint: string;
  borderColor: string;
  tooltipLines: TooltipLine[];
}

interface DictionaryCatalogs {
  items: IconDictionaryEntry[];
  enemies: IconDictionaryEntry[];
  structures: IconDictionaryEntry[];
  abilities: IconDictionaryEntry[];
  buffs: IconDictionaryEntry[];
  debuffs: IconDictionaryEntry[];
}

const meta: Meta<DictionaryStoryArgs> = {
  title: 'Catalogs/Dictionaries',
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
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
    <DictionaryCatalogStory
      catalogKey="items"
      title="Items"
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
    <DictionaryCatalogStory
      catalogKey="enemies"
      title="Enemies"
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
    <DictionaryCatalogStory
      catalogKey="structures"
      title="Structures"
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
    <DictionaryCatalogStory
      catalogKey="abilities"
      title="Abilities"
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
    <DictionaryCatalogStory
      catalogKey="buffs"
      title="Buffs"
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
    <DictionaryCatalogStory
      catalogKey="debuffs"
      title="Debuffs"
      onHoverDetail={args.onHoverDetail}
      onLeaveDetail={args.onLeaveDetail}
    />
  ),
};

function DictionaryCatalogStory({
  catalogKey,
  title,
  onHoverDetail,
  onLeaveDetail,
}: {
  catalogKey: keyof DictionaryCatalogs;
  title: string;
  onHoverDetail?: HoverDetailHandler;
  onLeaveDetail?: () => void;
}) {
  const [catalogs, setCatalogs] = useState<DictionaryCatalogs | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadI18n();
      const { loadDictionaryCatalogs } = await import('./dictionaryStoryData');
      if (!cancelled) {
        setCatalogs(loadDictionaryCatalogs());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!catalogs) {
    return <LoadingState />;
  }

  const entries = catalogs[catalogKey];

  return (
    <IconDictionaryGrid
      title={`${title} (${entries.length})`}
      entries={entries}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
    />
  );
}

function LoadingState() {
  return (
    <div
      style={{
        minHeight: '240px',
        display: 'grid',
        placeItems: 'center',
        color: '#cbd5e1',
      }}
    >
      Loading dictionaries...
    </div>
  );
}

function IconDictionaryGrid({
  title,
  entries,
  onHoverDetail,
  onLeaveDetail,
}: {
  title: string;
  entries: IconDictionaryEntry[];
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
            <MaskedIcon icon={entry.icon} tint={entry.tint} />
          </button>
        ))}
      </div>
    </section>
  );
}

function MaskedIcon({ icon, tint }: { icon: string; tint: string }) {
  const mask = `url("${icon}") center / contain no-repeat`;

  return (
    <span
      aria-hidden="true"
      style={{
        width: '52px',
        height: '52px',
        display: 'inline-block',
        backgroundColor: tint,
        WebkitMask: mask,
        mask,
      }}
    />
  );
}
