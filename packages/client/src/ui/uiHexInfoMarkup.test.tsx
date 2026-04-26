import React from 'react';
import { HexInfoWindow } from './components/HexInfoWindow';
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

    expect(markup).not.toContain('Nothing in your pack can be prospected.');
    expect(markup).not.toContain('No equippable items to sell.');
    expect(markup).not.toContain('Tak(e) all');
    expect(markup).not.toContain('Loot on the ground');
    expect(markup).not.toContain('S(e)ll all');
    expect(markup).not.toContain('>Prospect<');
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

    expect(markup).toContain('(Q) Gather');
    expect(markup).not.toContain('Nothing of note stirs here.');
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

    expect(markup).not.toContain('Cl(a)im');
    expect(markup).not.toContain('H(o)me');
  });
});
