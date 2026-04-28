import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import * as ButtonModule from '../Button/Button';
import buttonStyles from '../Button/styles.module.scss';
import { WindowDock, type WindowDockEntry } from './WindowDock';
import styles from './styles.module.scss';

describe('WindowDock', () => {
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
    vi.restoreAllMocks();
  });

  it('shows the focused entry tooltip on the shared button surface', async () => {
    const buttonRenderSpy = vi.spyOn(ButtonModule, 'Button');

    await act(async () => {
      root.render(<WindowDock entries={[createEntry()]} onToggle={vi.fn()} />);
    });

    const button = host.querySelector('button') as HTMLButtonElement | null;
    const [firstButtonProps] = buttonRenderSpy.mock.calls[0] ?? [];

    expect(buttonRenderSpy).toHaveBeenCalledTimes(1);
    expect(firstButtonProps?.unstyled).toBe(true);
    expect(firstButtonProps?.className).toBe(styles.dockButton);
    expect(button?.classList.contains(styles.dockButton)).toBe(true);
    expect(button?.classList.contains(buttonStyles.button)).toBe(false);
    expect(findTooltip()).toBeNull();

    await act(async () => {
      button?.focus();
    });

    expect(findTooltip()).not.toBeNull();
  });

  it('forwards toggles and clears the focused tooltip after click', async () => {
    const onToggle = vi.fn();
    const buttonRenderSpy = vi.spyOn(ButtonModule, 'Button');

    await act(async () => {
      root.render(<WindowDock entries={[createEntry()]} onToggle={onToggle} />);
    });

    const button = host.querySelector('button') as HTMLButtonElement | null;
    const [firstButtonProps] = buttonRenderSpy.mock.calls[0] ?? [];

    expect(buttonRenderSpy).toHaveBeenCalledTimes(1);
    expect(firstButtonProps?.unstyled).toBe(true);
    expect(firstButtonProps?.className).toBe(styles.dockButton);
    expect(button?.classList.contains(styles.dockButton)).toBe(true);
    expect(button?.classList.contains(buttonStyles.button)).toBe(false);

    await act(async () => {
      button?.focus();
    });

    expect(findTooltip()).not.toBeNull();

    await act(async () => {
      button?.click();
    });

    expect(onToggle).toHaveBeenCalledWith('inventory');
    expect(findTooltip()).toBeNull();
  });

  function findTooltip() {
    return host.querySelector(`.${styles.tooltip}`);
  }
});

function createEntry(): WindowDockEntry {
  return {
    key: 'inventory',
    label: 'Inventory',
    title: {
      plain: 'Inventory',
      prefix: '(',
      hotkey: 'I',
      suffix: ')nventory',
    },
    icon: 'inventory.svg',
    shown: false,
  };
}
