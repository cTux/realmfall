import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingSpinner } from './LoadingSpinner';
import { storyPanelDecorator } from './storybook/storybookHelpers';

const meta = {
  title: 'Components/Loading Spinner',
  component: LoadingSpinner,
  decorators: [storyPanelDecorator('240px')],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
