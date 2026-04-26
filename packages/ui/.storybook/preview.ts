import type { Preview } from '@storybook/react-vite';
import '../src/styles/storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
    },
  },
};

export default preview;
