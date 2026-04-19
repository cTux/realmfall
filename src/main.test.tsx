import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let render: ReturnType<typeof vi.fn>;
let createRoot: ReturnType<typeof vi.fn>;
let loadI18n: ReturnType<typeof vi.fn>;
let appModuleImported: ReturnType<typeof vi.fn>;
const reportRootError = vi.fn();

type StrictModeElement = React.ReactElement<{
  children: React.ReactElement;
}>;
type BootstrapShellProps = {
  children: React.ReactNode;
  role: string;
};
type BootstrapShellElement = React.ReactElement<BootstrapShellProps>;

describe('main bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    render = vi.fn();
    createRoot = vi.fn(() => ({ render }));
    loadI18n = vi.fn(() => Promise.resolve({}));
    appModuleImported = vi.fn();
    reportRootError.mockReset();

    vi.doMock('react-dom/client', () => ({
      default: { createRoot },
    }));

    vi.doMock('./i18n', () => ({
      loadI18n,
    }));

    vi.doMock('./app/App', () => {
      (appModuleImported as () => void)();
      return {
        App: () => <div>Mock App</div>,
      };
    });

    document.body.innerHTML = '';
    (
      window as Window & { reportError?: (error: unknown) => void }
    ).reportError = reportRootError;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.doUnmock('react-dom/client');
    vi.doUnmock('./i18n');
    vi.doUnmock('./app/App');
  });

  it('mounts the app into the root element', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    expect(createRoot).toHaveBeenCalledWith(
      document.getElementById('root'),
      expect.objectContaining({
        onCaughtError: expect.any(Function),
        onUncaughtError: expect.any(Function),
      }),
    );
    expect(render).toHaveBeenCalledTimes(1);

    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect(render).toHaveBeenCalledTimes(2);
    expect(
      (globalThis as typeof globalThis & { version: string }).version,
    ).toBe(__APP_VERSION__);
  });

  it('waits for i18n to load before importing App', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    let resolveI18n!: () => void;
    loadI18n.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveI18n = () => resolve({});
        }),
    );

    await import('./main');
    await Promise.resolve();

    expect(loadI18n).toHaveBeenCalledTimes(1);
    expect(appModuleImported).not.toHaveBeenCalled();

    resolveI18n();
    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect(appModuleImported).toHaveBeenCalledTimes(1);
  });

  it('renders a spinner-only bootstrap shell before the app loads', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    const firstRender = render.mock.calls[0]?.[0] as StrictModeElement;
    const bootstrapShellElement = firstRender.props
      .children as BootstrapShellElement;
    const bootstrapShell = (
      bootstrapShellElement.type as (
        props: typeof bootstrapShellElement.props,
      ) => BootstrapShellElement
    )(bootstrapShellElement.props);
    const bootstrapChildren = React.Children.toArray(
      bootstrapShell.props.children,
    );

    expect(bootstrapShell.props.role).toBe('status');
    expect(bootstrapChildren).toHaveLength(1);
    expect(JSON.stringify(firstRender)).not.toContain('Loading Realmfall');
  });

  it('prevents the native browser context menu globally', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('reports root-level render errors through the configured handler', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('./main');

    const rootOptions = (createRoot.mock.calls as unknown[][])[0]?.[1] as {
      onCaughtError: (error: unknown) => void;
      onUncaughtError: (error: unknown) => void;
    };
    const error = new Error('root boom');

    rootOptions.onCaughtError(error);
    rootOptions.onUncaughtError(error);

    expect(reportRootError).toHaveBeenCalledTimes(2);
    expect(reportRootError).toHaveBeenNthCalledWith(1, error);
    expect(reportRootError).toHaveBeenNthCalledWith(2, error);
  });
});
