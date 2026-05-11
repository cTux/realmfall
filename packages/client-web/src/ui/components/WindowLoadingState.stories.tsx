import type { Meta, StoryObj } from '@storybook/react-vite';
import { WindowLoadingState } from './WindowLoadingState';
import { storyPanelDecorator } from './storybook/storybookHelpers';

const meta = {
  title: 'Components/Window Loading State',
  component: WindowLoadingState,
  decorators: [storyPanelDecorator('360px')],
} satisfies Meta<typeof WindowLoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
