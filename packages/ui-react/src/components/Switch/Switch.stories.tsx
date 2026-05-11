import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { Switch } from './Switch';

const meta = {
  title: 'UI Primitives/Switch',
  component: Switch,
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

export const Default: Story = {};

function SwitchStory(args: ComponentProps<typeof Switch>) {
  const [checked, setChecked] = useState(args.checked);

  return <Switch {...args} checked={checked} onChange={setChecked} />;
}
