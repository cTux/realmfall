import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('marks small buttons with the shared size attribute', async () => {
    await act(async () => {
      root.render(<Button size="small">Compact action</Button>);
    });

    const button = host.querySelector('button');
    expect(button?.getAttribute('data-size')).toBe('small');
  });

  it('marks destructive buttons with the shared tone attribute', async () => {
    await act(async () => {
      root.render(<Button tone="danger">Delete save</Button>);
    });

    const button = host.querySelector('button');
    expect(button?.getAttribute('data-tone')).toBe('danger');
  });
});
