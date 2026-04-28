import React from 'react';
import { HexInfoWindow } from './components/HexInfoWindow';
import { stripBracketHotkeyLabel } from './hotkeyLabels';
import { t } from '../i18n';
import { renderMarkup, setupUiTestEnvironment } from './uiTestHelpers';
import { buildBaseHexInfoProps } from './uiWindowMarkupTestHelpers';

setupUiTestEnvironment();

describe('ui hex info markup', () => {
  it('shows explanations instead of unavailable prospect and sell buttons', async () => {
    const markup = await renderMarkup(
      <>
        <HexInfoWindow
          {...buildBaseHexInfoProps()}
          structure="Forge"
          bulkProspectEquipmentExplanation="Nothing in your pack can be prospected."
        />
        <HexInfoWindow
          {...buildBaseHexInfoProps()}
          structure="Town"
          bulkSellEquipmentExplanation="No equippable items to sell."
        />
      </>,
    );

    const markupText = extractTextContent(markup);

    expect(markupText).not.toContain('Nothing in your pack can be prospected.');
    expect(markupText).not.toContain('No equippable items to sell.');
    expect(markupText).not.toContain(
      stripBracketHotkeyLabel(t('ui.loot.takeAllAction')),
    );
    expect(markupText).not.toContain('Loot on the ground');
    expect(markupText).not.toContain(
      stripBracketHotkeyLabel(t('ui.hexInfo.sellAllAction')),
    );
    expect(markupText).not.toContain(
      stripBracketHotkeyLabel(t('ui.hexInfo.prospectAction')),
    );
  });

  it('does not show empty-state text when a hex has an available interact action', async () => {
    const markup = await renderMarkup(
      <HexInfoWindow
        {...buildBaseHexInfoProps()}
        terrain="Forest"
        structure="Tree"
        interactLabel="Chop tree"
        canInteract
      />,
    );

    const markupText = extractTextContent(markup);

    expect(markupText).toContain(
      stripBracketHotkeyLabel(t('ui.hexInfo.interactAction')),
    );
    expect(markupText).not.toContain('Nothing of note stirs here.');
  });

  it('keeps claim requirement copy out of the hex window body', async () => {
    const markup = await renderMarkup(
      <HexInfoWindow
        {...buildBaseHexInfoProps()}
        territoryActionExplanation="Claiming needs 1 Cloth and 1 Sticks for a banner."
      />,
    );

    expect(markup).not.toContain(
      'Claiming needs 1 Cloth and 1 Sticks for a banner.',
    );
  });

  it('hides claim and home title actions when their requirements are not met', async () => {
    const markup = await renderMarkup(
      <HexInfoWindow
        {...buildBaseHexInfoProps()}
        isHome
        canSetHome={false}
        territoryActionExplanation="Claiming needs 1 Cloth and 1 Sticks for a banner."
      />,
    );

    const markupText = extractTextContent(markup);

    expect(markupText).not.toContain('Claim');
    expect(markupText).not.toContain(
      stripBracketHotkeyLabel(t('ui.hexInfo.setHomeAction')),
    );
  });
});

function extractTextContent(markup: string) {
  return markup.replace(/<[^>]+>/g, '');
}
