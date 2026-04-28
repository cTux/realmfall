import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { Button } from './Button';

const meta = {
  title: 'UI Primitives/Button',
  component: Button,
  render: (args) => <ButtonStory {...args} />,
  args: {
    children: 'Action',
    onClick: () => undefined,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled action',
  },
};

export const Unstyled: Story = {
  args: {
    unstyled: true,
    children: 'Browser chrome',
  },
};

function ButtonStory(args: ComponentProps<typeof Button>) {
  const [pressed, setPressed] = useState(false);

  return (
    <Button {...args} onClick={() => setPressed((current) => !current)}>
      {pressed ? 'Pressed' : 'Not pressed'}
    </Button>
  );
}
