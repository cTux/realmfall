import type { Meta, StoryObj } from '@storybook/react-vite';
import labelStyles from './windowLabels.module.scss';
import { storySurfaceDecorator } from './storybook/storybookHelpers';
import { BracketHotkeyLabel } from './BracketHotkeyLabel';

const meta = {
  title: 'Components/Bracket Hotkey Label',
  component: BracketHotkeyLabel,
  decorators: [storySurfaceDecorator],
  args: {
    label: 'Cl(a)im',
    hotkeyClassName: labelStyles.hotkey,
  },
} satisfies Meta<typeof BracketHotkeyLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HighlightedHotkey: Story = {};

export const PlainLabel: Story = {
  args: {
    label: 'Inventory',
  },
};
