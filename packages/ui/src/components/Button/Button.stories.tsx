import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'UI Primitives/Button',
  component: Button,
  args: {
    children: 'Action',
    onClick: () => undefined,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = {
  args: {
    tone: 'danger',
    children: 'Delete save',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled action',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    children: 'Compact action',
  },
};

export const IconOnlySmall: Story = {
  args: {
    size: 'small',
    'aria-label': 'Close',
    children: (
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M2 2l8 8M10 2 2 10" />
      </svg>
    ),
  },
};

export const Unstyled: Story = {
  args: {
    unstyled: true,
    children: 'Browser chrome',
  },
};
