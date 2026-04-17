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

    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect(render).toHaveBeenCalledTimes(2);
    expect(
      (globalThis as typeof globalThis & { version: string }).version,
    ).toBe(__APP_VERSION__);
  });

  it('renders a spinner-only bootstrap shell before the app loads', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    const firstRender = render.mock.calls[0]?.[0] as React.ReactElement;
    const bootstrapShellElement = firstRender.props.children as React.ReactElement;
    const bootstrapShell = (
      bootstrapShellElement.type as (
        props: typeof bootstrapShellElement.props,
      ) => React.ReactElement
    )(bootstrapShellElement.props);
    const bootstrapChildren = React.Children.toArray(
      bootstrapShell.props.children,
    );

    expect(bootstrapShell.props.role).toBe('status');
    expect(bootstrapChildren).toHaveLength(2);
    expect(JSON.stringify(firstRender)).not.toContain('Loading Realmfall');
  });
});
