export type ItemTooltipModule = typeof import('../../ui/tooltips/itemTooltips');

export function loadItemTooltipModule(): Promise<ItemTooltipModule> {
  return import('../../ui/tooltips/itemTooltips');
}
