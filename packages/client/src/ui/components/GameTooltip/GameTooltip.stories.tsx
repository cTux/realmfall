import type { Meta, StoryObj } from '@storybook/react-vite';
import { GameTooltip } from './GameTooltip';
import { storySurfaceDecorator } from '../storybook/storybookHelpers';

const meta = {
  title: 'Components/Game Tooltip',
  component: GameTooltip,
  decorators: [storySurfaceDecorator],
  args: {
    tooltip: {
      title: 'Trail Ration',
      x: 160,
      y: 120,
      borderColor: '#f59e0b',
      lines: [
        { text: 'TIER 1' },
        { kind: 'stat', label: 'Hunger', value: '15' },
        { kind: 'stat', label: 'Thirst', value: '2' },
        { text: 'A compact meal for a long march.' },
      ],
    },
  },
} satisfies Meta<typeof GameTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ItemTooltip: Story = {};

export const CombatTooltip: Story = {
  args: {
    tooltip: {
      title: 'Marauder Captain',
      x: 160,
      y: 120,
      borderColor: '#ef4444',
      lines: [
        { text: 'LEVEL 7' },
        { kind: 'bar', label: 'HP', current: 31, max: 40 },
        { kind: 'stat', label: 'Attack', value: '11' },
        { kind: 'stat', label: 'Defense', value: '6' },
        { text: 'Aggressive raider leader.', tone: 'negative' },
      ],
    },
  },
};
