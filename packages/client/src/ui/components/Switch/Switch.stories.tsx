import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { storyPanelDecorator } from '../storybook/storybookHelpers';
import { Switch } from './Switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  decorators: [storyPanelDecorator('460px')],
  args: {
    checked: true,
    label: 'Antialias',
    description: 'Smooth jagged edges during Pixi renderer initialization.',
    onChange: () => undefined,
  },
  render: (args) => <SwitchStory {...args} />,
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

function SwitchStory(args: ComponentProps<typeof Switch>) {
  const [checked, setChecked] = useState(args.checked);

  return <Switch {...args} checked={checked} onChange={setChecked} />;
}
