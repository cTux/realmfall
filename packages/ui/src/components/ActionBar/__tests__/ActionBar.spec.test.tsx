import { vi } from 'vitest';
import enTranslations from '../../../../../client/src/i18n/locales/en.json';
import { loadI18n } from '../../../i18n';
import { setupUiTestEnvironment } from '../../../test/uiTestHelpers';
import { ActionBarTestkit } from './ActionBarTestkit';

setupUiTestEnvironment();

describe('ActionBar', () => {
  let testkit: ActionBarTestkit;

  beforeAll(async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(enTranslations),
      }),
    );
    await loadI18n();
  });

  beforeEach(() => {
    testkit = new ActionBarTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('does not render cooldown overlays for populated slots', async () => {
    await testkit.actions.renderWithPopulatedFirstSlot();

    await testkit.expect.firstSlotHasNoCooldownOverlay();
  });
});
