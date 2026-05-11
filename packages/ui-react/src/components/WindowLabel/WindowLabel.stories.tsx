import type { Meta, StoryObj } from '@storybook/react-vite';
import labelStyles from '../windowLabels.module.scss';
import { storySurfaceDecorator } from '../storybook/storybookHelpers';
import { WindowLabel } from './WindowLabel';

const SAMPLE_LABELS = [
  { prefix: '(', hotkey: 'H', suffix: ')ero info' },
  { prefix: '(', hotkey: 'I', suffix: ')nventory' },
  { prefix: '', hotkey: '', suffix: 'Loot' },
] as const;

const meta = {
  title: 'Components/Window Label',
  component: WindowLabel,
  decorators: [storySurfaceDecorator],
  args: {
    label: SAMPLE_LABELS[0],
    hotkeyClassName: labelStyles.hotkey,
  },
} satisfies Meta<typeof WindowLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CharacterInfo: Story = {};

export const AllLabels: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '12px' }}>
      {SAMPLE_LABELS.map((label) => (
        <div
          key={`${label.prefix}-${label.hotkey}-${label.suffix}`}
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
