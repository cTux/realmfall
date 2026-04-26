import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { Tabs } from './Tabs';

const meta = {
  title: 'UI Primitives/Tabs',
  component: Tabs,
  args: {
    activeTabId: 'graphics',
    tabs: [
      { id: 'graphics', label: 'Graphic settings' },
      { id: 'audio', label: 'Audio' },
      { id: 'controls', label: 'Controls' },
    ],
    onChange: () => undefined,
  },
  render: (args) => <TabsStory {...args} />,
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function TabsStory(args: ComponentProps<typeof Tabs>) {
  const [activeTabId, setActiveTabId] = useState(args.activeTabId);

  return <Tabs {...args} activeTabId={activeTabId} onChange={setActiveTabId} />;
}
