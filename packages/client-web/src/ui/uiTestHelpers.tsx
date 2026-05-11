import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, vi } from 'vitest';

export function setupUiTestEnvironment() {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}

export async function settleUi() {
  await act(async () => {
    await vi.dynamicImportSettled();
    await Promise.resolve();
    await Promise.resolve();
  });
}

export async function mountUi(node: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  const render = async (nextNode: React.ReactNode) => {
    await act(async () => {
      root.render(nextNode);
    });
    await settleUi();
  };

  const unmount = async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  };

  await render(node);

  return { host, render, unmount };
}

export async function renderMarkup(node: React.ReactNode) {
  const ui = await mountUi(node);
  const markup = ui.host.innerHTML;
  await ui.unmount();
  return markup;
}
