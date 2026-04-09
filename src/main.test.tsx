import React from 'react';

const render = vi.fn();
const createRoot = vi.fn(() => ({ render }));

vi.mock('react-dom/client', () => ({
  default: { createRoot },
}));

vi.mock('./app/App', () => ({
  App: () => <div>Mock App</div>,
}));

describe('main bootstrap', () => {
  it('mounts the app into the root element', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(render).toHaveBeenCalledTimes(1);
  });
});
