import { setLocaleTranslations } from '../../../i18n';
import { setupUiTestEnvironment } from '../../../test/uiTestHelpers';
import { ActionBarTestkit } from './ActionBarTestkit';

setupUiTestEnvironment();

describe('ActionBar', () => {
  let testkit: ActionBarTestkit;
  const actionBarTranslations: Record<string, string> = {
    'ui.actionBar.picker.title': 'Select action bar item',
    'ui.actionBar.picker.optionLabel': 'Assign {item}',
    'ui.actionBar.picker.empty': 'No consumables available',
    'ui.actionBar.slot.emptyLabel': 'Action bar slot {hotkey}',
    'ui.actionBar.slot.filledLabel': 'Action bar slot {hotkey}: {item}',
    'ui.actionBar.ariaLabel': 'Action bar',
    'ui.common.empty': 'empty',
  };

  beforeAll(() => {
    setLocaleTranslations('en', actionBarTranslations);
  });

  beforeEach(() => {
    testkit = new ActionBarTestkit();
  });

  afterEach(async () => {
    await testkit.restore();
  });

  it('does not render cooldown overlays for populated slots', async () => {
    await testkit.actions.renderWithPopulatedFirstSlot();

    await testkit.expect.firstSlotHasNoCooldownOverlay();
  });
});
