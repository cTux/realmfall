import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useAppBootstrapState } from './useAppBootstrapState';

const createGameMock = vi.hoisted(() => vi.fn());
const loadAudioSettingsMock = vi.hoisted(() => vi.fn());
const loadGraphicsSettingsMock = vi.hoisted(() => vi.fn());

vi.mock('../../../game/stateFactory', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../game/stateFactory')>();

  return {
    ...actual,
    createGame: createGameMock.mockImplementation(actual.createGame),
  };
});

vi.mock('../../audioSettings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../audioSettings')>();

  return {
    ...actual,
    loadAudioSettings: loadAudioSettingsMock.mockImplementation(
      actual.loadAudioSettings,
    ),
  };
});

vi.mock('../../graphicsSettings', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../graphicsSettings')>();

  return {
    ...actual,
    loadGraphicsSettings: loadGraphicsSettingsMock.mockImplementation(
      actual.loadGraphicsSettings,
    ),
  };
});

function BootstrapHarness() {
  const bootstrap = useAppBootstrapState();

  return (
    <button
      type="button"
      onClick={() => bootstrap.setPaused((value) => !value)}
    >
      {bootstrap.paused ? 'paused' : 'running'}
    </button>
  );
}

describe('useAppBootstrapState', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('creates startup state only once across rerenders', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<BootstrapHarness />);
    });

    const button = host.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createGameMock).toHaveBeenCalledTimes(1);
    expect(loadAudioSettingsMock).toHaveBeenCalledTimes(1);
    expect(loadGraphicsSettingsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});
