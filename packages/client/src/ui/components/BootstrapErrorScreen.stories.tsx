import type { Meta, StoryObj } from '@storybook/react-vite';
import { BootstrapErrorScreen } from './BootstrapErrorScreen';
import { noop, storySurfaceDecorator } from './storybook/storybookHelpers';

const meta = {
  title: 'Components/Bootstrap Error Screen',
  component: BootstrapErrorScreen,
  decorators: [storySurfaceDecorator],
  args: {
    reloadPage: noop,
  },
} satisfies Meta<typeof BootstrapErrorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LoadingFailure: Story = {};
