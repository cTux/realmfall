import { buildItemFromConfig } from '../../../../game/content/items';
import { ItemId } from '../../../../game/content/ids';
import { mountUi, setupUiTestEnvironment } from '../../../uiTestHelpers';
import { HexInfoWindowContent } from '../HexInfoWindowContent';
import {
  HEX_INFO_COMPACT_CONTENT_SLOT_STYLE,
  HEX_INFO_CONTENT_SLOT_STYLE,
} from '../hexInfoSlotStyles';

setupUiTestEnvironment();

describe('HexInfoWindowContent', () => {
  it('shrinks content-window item slots to 0.8x of their shared sizes', async () => {
    const townItem = buildItemFromConfig(ItemId.TownKnife, {
      id: 'town-knife',
    });
    const lootItem = buildItemFromConfig(ItemId.Gold, {
      id: 'loot-gold',
      quantity: 3,
    });

    const ui = await mountUi(
      <HexInfoWindowContent
        terrain="Plains"
        structure="Town"
        enemyCount={0}
        interactLabel={null}
        canInteract={false}
        canBulkProspectEquipment={false}
        canBulkSellEquipment={false}
        itemModification={null}
        canTerritoryAction={false}
        territoryActionLabel="Cl(a)im"
        territoryActionKind="claim"
        canHealTerritoryNpc={false}
        territoryNpcHealExplanation={null}
        territoryActionExplanation={null}
        bulkProspectEquipmentExplanation={null}
        bulkSellEquipmentExplanation={null}
        onInteract={() => {}}
        onProspect={() => {}}
        onSellAll={() => {}}
        onTerritoryAction={() => {}}
        onHealTerritoryNpc={() => {}}
        territoryNpc={null}
        townStock={[{ item: townItem, price: 12 }]}
        gold={20}
        loot={[lootItem]}
        onBuyItem={() => {}}
        onTakeAll={() => {}}
        onTakeItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    const slotButtons = Array.from(
      ui.host.querySelectorAll<HTMLButtonElement>('button[data-size]'),
    );

    expect(slotButtons).toHaveLength(2);
    expect(slotButtons[0]?.getAttribute('style')).toContain(
      '--slot-size: 54.4px',
    );
    expect(slotButtons[0]?.getAttribute('style')).toContain(
      '--slot-icon-size: 1.76rem',
    );
    expect(slotButtons[1]?.getAttribute('style')).toContain(
      '--slot-size: 27.2px',
    );

    await ui.unmount();
  });

  it('shares stable content slot style objects across renders', () => {
    expect(HEX_INFO_CONTENT_SLOT_STYLE).toEqual({
      '--slot-size': '54.4px',
      '--slot-icon-size': '1.76rem',
    });
    expect(HEX_INFO_COMPACT_CONTENT_SLOT_STYLE).toEqual({
      '--slot-size': '27.2px',
      '--slot-icon-size': '24.48px',
    });
    expect(Object.isFrozen(HEX_INFO_CONTENT_SLOT_STYLE)).toBe(true);
    expect(Object.isFrozen(HEX_INFO_COMPACT_CONTENT_SLOT_STYLE)).toBe(true);
  });
});
