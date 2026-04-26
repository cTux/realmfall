import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  storySurfaceDecorator,
  createStorybookFixtures,
  noop,
} from '../storybook/storybookHelpers';
import { WindowDock } from './WindowDock';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Components/Window Dock',
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
      entries={fixtures.dockEntries.map((entry, index) => ({
        ...entry,
        shown: index < 3,
      }))}
      onToggle={noop}
    />
  ),
};

export const WithAttentionBadge: Story = {
  render: () => (
    <WindowDock
      entries={fixtures.dockEntries.map((entry) =>
        entry.key === 'hexInfo'
          ? { ...entry, shown: true, requiresAttention: true }
          : entry,
      )}
      onToggle={noop}
    />
  ),
};

function WindowDockStory() {
  const [entries, setEntries] = useState(fixtures.dockEntries);

  return (
    <WindowDock
      entries={entries}
      onToggle={(key) =>
        setEntries((current) =>
          current.map((entry) =>
            entry.key === key ? { ...entry, shown: !entry.shown } : entry,
          ),
        )
      }
    />
  );
}
