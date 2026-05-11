import type { Meta, StoryObj } from '@storybook/react-vite';
import { storyPanelDecorator } from '../../../storybook/storybookHelpers';
import { StatBar } from './StatBar';

const meta = {
  title: 'Components/Stat Bar',
  component: StatBar,
  decorators: [storyPanelDecorator('360px')],
  args: {
    label: 'Health',
    value: 29,
    max: 34,
    color: 'hp',
  },
} satisfies Meta<typeof StatBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Health: Story = {};

export const Mana: Story = {
  args: {
    label: 'Mana',
    value: 10,
    max: 18,
    color: 'mana',
  },
};
