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

export async function renderMarkup(node: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(node);
  });

  await act(async () => {
    await vi.dynamicImportSettled();
    await Promise.resolve();
    await Promise.resolve();
  });

  const markup = host.innerHTML;

  await act(async () => {
    root.unmount();
  });
  host.remove();

  return markup;
}
