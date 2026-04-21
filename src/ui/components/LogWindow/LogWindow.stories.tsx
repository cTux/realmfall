import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  createLogFilters,
  createStorybookFixtures,
  noop,
  STORYBOOK_WINDOW_POSITION,
  storySurfaceDecorator,
} from '../storybook/storybookHelpers';
import { LogWindow } from './LogWindow';

const fixtures = createStorybookFixtures();

const meta = {
  title: 'Windows/Log',
  component: LogWindow,
  decorators: [storySurfaceDecorator],
  args: {
    position: STORYBOOK_WINDOW_POSITION,
    onMove: noop,
    visible: true,
    onClose: noop,
    filters: fixtures.defaultFilters,
    defaultFilters: fixtures.defaultFilters,
    showFilterMenu: true,
    onToggleMenu: noop,
    onToggleFilter: noop,
    logs: fixtures.logs,
  },
  render: () => <LogWindowStory />,
} satisfies Meta<typeof LogWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ExpeditionLog: Story = {};

export const RecentEntry: Story = {
  render: () => (
    <LogWindow
      position={STORYBOOK_WINDOW_POSITION}
      onMove={noop}
      visible
      onClose={noop}
      filters={fixtures.defaultFilters}
      defaultFilters={fixtures.defaultFilters}
      showFilterMenu={false}
      onToggleMenu={noop}
      onToggleFilter={noop}
      logs={[
        {
          id: 'log-recent-entry',
          kind: 'system',
          text: '[Year 1, Day 4, 22:14] A warded sigil flickers and then steadies.',
          turn: 12,
        },
      ]}
    />
  ),
};

function LogWindowStory() {
  const [filters, setFilters] = useState(createLogFilters({ rumor: false }));
  const [showFilterMenu, setShowFilterMenu] = useState(true);

  return (
    <LogWindow
      position={STORYBOOK_WINDOW_POSITION}
      onMove={noop}
      visible
      onClose={noop}
      filters={filters}
      defaultFilters={fixtures.defaultFilters}
      showFilterMenu={showFilterMenu}
      onToggleMenu={() => setShowFilterMenu((current) => !current)}
      onToggleFilter={(kind) =>
        setFilters((current) => ({
          ...current,
          [kind]: !current[kind],
        }))
      }
      logs={fixtures.logs.filter((entry) => filters[entry.kind])}
    />
  );
}
