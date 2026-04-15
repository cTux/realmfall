import type { Decorator } from '@storybook/react-vite';
import { StorybookPreviewRuntime } from './storybookPreview';

type StoryArgs = Record<string, unknown>;

export const storybookPreviewDecorator: Decorator = (Story, context) => (
  <StorybookPreviewRuntime Story={Story} args={context.args as StoryArgs} />
);
