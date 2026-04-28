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
import { Tabs } from './Tabs';
import styles from './styles.module.scss';

describe('Tabs', () => {
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

  it('marks the active tab on the shared button surface and forwards clicks', async () => {
    const onChange = vi.fn();
    const buttonRenderSpy = vi.spyOn(ButtonModule, 'Button');

    await act(async () => {
      root.render(
        <Tabs
          activeTabId="graphics"
          tabs={[
            { id: 'graphics', label: 'Graphics' },
            { id: 'audio', label: 'Audio' },
          ]}
          onChange={onChange}
        />,
      );
    });

    const activeTab = host.querySelector(
      'button[aria-selected="true"]',
    ) as HTMLButtonElement | null;
    const inactiveTab = host.querySelector(
      'button[aria-selected="false"]',
    ) as HTMLButtonElement | null;
    const [firstButtonProps] = buttonRenderSpy.mock.calls[0] ?? [];

    expect(buttonRenderSpy).toHaveBeenCalledTimes(2);
    expect(firstButtonProps?.unstyled).toBe(true);
    expect(firstButtonProps?.className).toBe(styles.tab);
    expect(activeTab?.id).toBe('graphics-tab');
    expect(activeTab?.tabIndex).toBe(0);
    expect(activeTab?.classList.contains(styles.tab)).toBe(true);
    expect(activeTab?.classList.contains(buttonStyles.button)).toBe(false);
    expect(inactiveTab?.id).toBe('audio-tab');
    expect(inactiveTab?.tabIndex).toBe(-1);
    expect(inactiveTab?.classList.contains(styles.tab)).toBe(true);
    expect(inactiveTab?.classList.contains(buttonStyles.button)).toBe(false);

    await act(async () => {
      inactiveTab?.click();
    });

    expect(onChange).toHaveBeenCalledWith('audio');
  });
});
