import type { Meta, StoryObj } from '@storybook/react-vite';
import { WINDOW_LABELS } from '../../windowLabels';
import labelStyles from '../windowLabels.module.scss';
import { storySurfaceDecorator } from '../storybook/storybookHelpers';
import { WindowLabel } from './WindowLabel';

const meta = {
  title: 'Components/Window Label',
  component: WindowLabel,
  decorators: [storySurfaceDecorator],
  args: {
    label: WINDOW_LABELS.hero,
    hotkeyClassName: labelStyles.hotkey,
  },
} satisfies Meta<typeof WindowLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CharacterInfo: Story = {};

export const AllLabels: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      {Object.entries(WINDOW_LABELS).map(([key, label]) => (
        <div
          key={key}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.82)',
            border: '1px solid rgba(148, 163, 184, 0.28)',
          }}
        >
          <WindowLabel label={label} hotkeyClassName={labelStyles.hotkey} />
        </div>
      ))}
    </div>
  ),
};
