import { createCombatActorState } from '../../../../game/combat';
import type { CombatState } from '../../../../game/types';
import { setWorldClockTime } from '../../../../app/App/worldClockStore';
import { t } from '../../../../i18n';
import { mountUi, setupUiTestEnvironment } from '../../../uiTestHelpers';
import { HexInfoWindow } from '../HexInfoWindow';

const COMBAT_TIME_MS = 61_000;

setupUiTestEnvironment();

describe('HexInfoWindow', () => {
  afterEach(() => {
    setWorldClockTime(0);
  });

  it('keeps the close button on the same compact header-action sizing contract as the home action', async () => {
    const ui = await mountUi(
      <HexInfoWindow
        position={{ x: 0, y: 0 }}
        onMove={() => {}}
        visible
        onClose={() => {}}
        isHome={false}
        onSetHome={() => {}}
        terrain="Rift"
        structure="Dungeon"
        hexDescription="A broken ruin where stronger foes and old spoils gather beneath the fracture."
        enemyCount={1}
        interactLabel={null}
        canInteract={false}
        canBulkProspectEquipment={false}
        canBulkSellEquipment={false}
        itemModification={null}
        canTerritoryAction={false}
        territoryActionLabel="Claim"
        canHealTerritoryNpc={false}
        onInteract={() => {}}
        onProspect={() => {}}
        onSellAll={() => {}}
        onTerritoryAction={() => {}}
        onHealTerritoryNpc={() => {}}
        territoryNpc={null}
        townStock={[]}
        gold={0}
        onBuyItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    const closeButton = ui.host.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;
    const homeButton = Array.from(
      ui.host.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent === t('ui.hexInfo.setHomeAction'));

    expect(closeButton).not.toBeNull();
    expect(homeButton).toBeDefined();

    const closeButtonStyle = closeButton ? getComputedStyle(closeButton) : null;
    const homeButtonStyle = homeButton ? getComputedStyle(homeButton) : null;

    expect(closeButtonStyle?.height).toBe(homeButtonStyle?.height);
    expect(closeButtonStyle?.paddingTop).toBe(homeButtonStyle?.paddingTop);
    expect(closeButtonStyle?.paddingBottom).toBe(
      homeButtonStyle?.paddingBottom,
    );
    expect(closeButtonStyle?.minHeight).toBe(homeButtonStyle?.minHeight);

    await ui.unmount();
  });

  it('uses the leaf world clock subscription for the combat forfeit timer', async () => {
    setWorldClockTime(COMBAT_TIME_MS);

    const ui = await mountUi(
      <HexInfoWindow
        position={{ x: 0, y: 0 }}
        onMove={() => {}}
        visible
        onClose={() => {}}
        isHome={false}
        onSetHome={() => {}}
        terrain="Rift"
        structure="Dungeon"
        hexDescription="A broken ruin where stronger foes and old spoils gather beneath the fracture."
        enemyCount={1}
        interactLabel={null}
        canInteract={false}
        canBulkProspectEquipment={false}
        canBulkSellEquipment={false}
        itemModification={null}
        canTerritoryAction={false}
        territoryActionLabel="Claim"
        canHealTerritoryNpc={false}
        onInteract={() => {}}
        onProspect={() => {}}
        onSellAll={() => {}}
        onTerritoryAction={() => {}}
        onHealTerritoryNpc={() => {}}
        territoryNpc={null}
        townStock={[]}
        gold={0}
        combat={buildCombatState()}
        onBuyItem={() => {}}
        onHoverItem={() => {}}
        onLeaveItem={() => {}}
      />,
    );

    const forfeitButton = Array.from(
      ui.host.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent === t('ui.combat.forfeitAction'));

    expect(forfeitButton).toBeDefined();

    await ui.unmount();
  });
});

function buildCombatState(): CombatState {
  return {
    coord: { q: 1, r: 0 },
    enemyIds: ['enemy-1'],
    started: true,
    startedAtMs: 0,
    player: createCombatActorState(0, ['kick']),
    enemies: {
      'enemy-1': createCombatActorState(0, ['kick']),
    },
  };
}
