import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { storyPanelDecorator, noop } from '../storybook/storybookHelpers';
import { Tabs } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  decorators: [storyPanelDecorator('420px')],
  args: {
    activeTabId: 'graphics',
    tabs: [
      { id: 'graphics', label: 'Graphic settings' },
      { id: 'audio', label: 'Audio' },
      { id: 'controls', label: 'Controls' },
    ],
    onChange: noop,
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
