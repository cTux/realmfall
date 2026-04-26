import type { Preview } from '@storybook/react-vite';
import { loadI18n } from '../src/i18n';
import '../src/styles/base.scss';
import './preview.scss';

await loadI18n();
const { storybookPreviewDecorator } =
  await import('../src/ui/components/storybook/storybookPreviewDecorator');

const preview: Preview = {
  decorators: [storybookPreviewDecorator],
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
  },
};

export default preview;
