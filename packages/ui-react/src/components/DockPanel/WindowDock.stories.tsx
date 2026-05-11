import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { WindowDockEntry } from './WindowDock';
import {
  storySurfaceDecorator,
  createStorybookFixtures,
  noop,
} from '../storybook/storybookHelpers';
import { WindowDock } from './WindowDock';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/DockPanel',
  component: WindowDock,
  decorators: [storySurfaceDecorator],
  args: {
    entries: fixtures.dockEntries,
    onToggle: noop,
  },
  render: () => <WindowDockStory />,
} satisfies Meta<typeof WindowDock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ToggleableDock: Story = {};

export const WithOpenedEntries: Story = {
  render: () => (
    <WindowDock
      entries={fixtures.dockEntries.map(
        (entry: WindowDockEntry, index: number) => ({
          ...entry,
          shown: index < 3,
        }),
      )}
      onToggle={noop}
    />
  ),
};

export const WithAttentionBadge: Story = {
  render: () => (
    <WindowDock
      entries={fixtures.dockEntries.map((entry: WindowDockEntry) =>
        entry.key === 'hexInfo'
          ? { ...entry, shown: true, requiresAttention: true }
          : entry,
      )}
      onToggle={noop}
    />
  ),
};

function WindowDockStory() {
  const [entries, setEntries] = useState<WindowDockEntry[]>(
    fixtures.dockEntries,
  );

  return (
    <WindowDock
      entries={entries}
      onToggle={(key) =>
        setEntries((current: WindowDockEntry[]) =>
          current.map((entry: WindowDockEntry) =>
            entry.key === key ? { ...entry, shown: !entry.shown } : entry,
          ),
        )
      }
    />
  );
}
