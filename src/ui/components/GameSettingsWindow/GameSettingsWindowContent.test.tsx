import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
} from '../../../app/constants';
import { t } from '../../../i18n';
import { GameSettingsWindowContent } from './GameSettingsWindowContent';

describe('GameSettingsWindowContent', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
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

  it('holds reset save data for five seconds before firing', async () => {
    const onResetSaveData = vi.fn();

    await act(async () => {
      root.render(
        <GameSettingsWindowContent
          audioSettings={DEFAULT_AUDIO_SETTINGS}
          graphicsSettings={DEFAULT_GRAPHICS_SETTINGS}
          onResetSaveData={onResetSaveData}
          onSave={async () => undefined}
          onSaveAndReload={async () => undefined}
        />,
      );
    });

    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        const id = window.setTimeout(
          () => callback(performance.now() + 6000),
          0,
        );
        return id;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((handle: number) => window.clearTimeout(handle));
    const resetButton = Array.from(host.querySelectorAll('button')).find(
      (candidate) =>
        candidate.textContent?.includes(t('ui.settings.actions.resetSaveData')),
    );

    expect(resetButton).toBeDefined();

    await act(async () => {
      resetButton?.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(onResetSaveData).toHaveBeenCalledTimes(1);
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
