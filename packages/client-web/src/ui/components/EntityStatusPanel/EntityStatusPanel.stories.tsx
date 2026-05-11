import type { Meta, StoryObj } from '@storybook/react-vite';
import { EntityStatusPanel } from './EntityStatusPanel';
import { Icons } from '../../icons';
import { storySurfaceDecorator } from '../storybook/storybookHelpers';

const meta = {
  title: 'Components/EntityStatusPanel',
  component: EntityStatusPanel,
  decorators: [storySurfaceDecorator],
  args: {
    title: 'Vanguard',
    bars: [
      {
        id: 'hp',
        label: 'HP',
        value: 42,
        max: 60,
        tone: 'hp',
        description: 'Current health.',
      },
      {
        id: 'mana',
        label: 'Mana',
        value: 16,
        max: 30,
        tone: 'mana',
        description: 'Current mana.',
      },
    ],
    abilities: [
      {
        id: 'a1',
        label: 'Slash',
        icon: Icons.ArrowDunk,
        tint: '#f8fafc',
        borderColor: 'rgb(148 163 184 / 35%)',
        tooltipTitle: 'Slash',
        tooltipLines: [{ kind: 'text', text: 'Deals damage.' }],
        tooltipBorderColor: 'rgba(148, 163, 184, 0.9)',
      },
    ],
    buffs: [
      {
        id: 'b1',
        label: 'Power',
        icon: Icons.Totem,
        tint: '#4ade80',
        borderColor: 'rgb(34 197 94 / 70%)',
        tooltipTitle: 'Power',
        tooltipLines: [{ kind: 'text', text: 'Increases attack.' }],
        tooltipBorderColor: 'rgba(34, 197, 94, 0.9)',
      },
    ],
    debuffs: [
      {
        id: 'd1',
        label: 'Burning',
        icon: Icons.Spill,
        tint: '#f87171',
        borderColor: 'rgb(239 68 68 / 70%)',
        tooltipTitle: 'Burning',
        tooltipLines: [{ kind: 'text', text: 'Deals damage over time.' }],
        tooltipBorderColor: 'rgba(239, 68, 68, 0.9)',
      },
    ],
    onHoverDetail: () => undefined,
    onLeaveDetail: () => undefined,
  },
} satisfies Meta<typeof EntityStatusPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
