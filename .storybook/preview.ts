import type { Preview } from '@storybook/react-vite';
import '../src/styles/base.scss';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
  },
};

export default preview;
