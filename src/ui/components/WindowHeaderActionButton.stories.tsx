import type { Meta, StoryObj } from '@storybook/react-vite';
import { WindowHeaderActionButton } from './WindowHeaderActionButton';

const meta = {
  title: 'Shared/WindowHeaderActionButton',
  component: WindowHeaderActionButton,
  args: {
    children: 'Action',
    className: 'storybook-button',
    tooltipTitle: 'Action',
    tooltipLines: [{ kind: 'text', text: 'Shared header action tooltip.' }],
    onClick: () => {},
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '1rem',
          background: '#0f172a',
          display: 'inline-flex',
        }}
      >
        <style>{`.storybook-button{border:1px solid rgb(148 163 184 / 25%);background:#111827;color:#e2e8f0;padding:0.35rem 0.65rem;cursor:pointer;}`}</style>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WindowHeaderActionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
