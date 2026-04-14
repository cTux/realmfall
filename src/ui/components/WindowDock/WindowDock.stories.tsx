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
