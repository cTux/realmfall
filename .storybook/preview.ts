import type { Preview } from '@storybook/react-vite';
import { loadI18n } from '../src/i18n';
import '../src/styles/base.scss';
import './preview.scss';
import { storybookPreviewDecorator } from '../src/ui/components/storybook/storybookPreviewDecorator';

const preview: Preview = {
  decorators: [storybookPreviewDecorator],
  async beforeAll() {
    await loadI18n();
  },
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
  },
};

export default preview;
