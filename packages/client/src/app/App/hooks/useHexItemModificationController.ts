import { useCallback, useEffect, useState } from 'react';
import { isEquippableItem } from '../../../game/inventory';
import {
  getItemModificationKindForStructure,
  getReforgeableItemSecondaryStats,
} from '../../../game/itemModifications';
import type { Equipment, Item, StructureType } from '../../../game/stateTypes';

interface UseHexItemModificationControllerOptions {
  currentStructure?: StructureType;
  equipment: Equipment;
  inventory: Item[];
  onCorruptItem: (itemId: string) => void;
  onEnchantItem: (itemId: string) => void;
  onReforgeItem: (itemId: string, statIndex: number) => void;
}

export function useHexItemModificationController({
  currentStructure,
  equipment,
  inventory,
  onCorruptItem,
  onEnchantItem,
  onReforgeItem,
}: UseHexItemModificationControllerOptions) {
  const [pickerActive, setPickerActive] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedReforgeStatIndex, setSelectedReforgeStatIndex] = useState<
    number | null
  >(null);

  const modificationKind =
    getItemModificationKindForStructure(currentStructure);
  const selectedItem = findSelectableItem(inventory, equipment, selectedItemId);
  const reforgeOptions =
    modificationKind === 'reforge' && selectedItem
      ? getReforgeableItemSecondaryStats(selectedItem)
      : [];
  const resolvedReforgeStatIndex =
    modificationKind !== 'reforge'
      ? null
      : reforgeOptions.some((entry) => entry.index === selectedReforgeStatIndex)
        ? selectedReforgeStatIndex
        : (reforgeOptions[0]?.index ?? null);

  useEffect(() => {
    if (!selectedItemId || selectedItem) {
      return;
    }

    setSelectedItemId(null);
    setSelectedReforgeStatIndex(null);
  }, [selectedItem, selectedItemId]);

  useEffect(() => {
    if (modificationKind) {
      return;
    }

    setPickerActive(false);
  }, [modificationKind]);

  useEffect(() => {
    if (modificationKind !== 'reforge') {
      setSelectedReforgeStatIndex(null);
      return;
    }

    if (resolvedReforgeStatIndex === selectedReforgeStatIndex) {
      return;
    }

    setSelectedReforgeStatIndex(resolvedReforgeStatIndex);
  }, [modificationKind, resolvedReforgeStatIndex, selectedReforgeStatIndex]);

  const clearSelectedItem = useCallback(() => {
    setPickerActive(false);
    setSelectedItemId(null);
    setSelectedReforgeStatIndex(null);
  }, []);

  const togglePicker = useCallback(() => {
    if (!modificationKind) {
      return;
    }

    setPickerActive((current) => !current);
  }, [modificationKind]);

  const selectItem = useCallback(
    (item: Item) => {
      if (!modificationKind || !isEquippableItem(item)) {
        return false;
      }

      setSelectedItemId(item.id);
      setPickerActive(false);
      setSelectedReforgeStatIndex(
        modificationKind === 'reforge'
          ? (getReforgeableItemSecondaryStats(item)[0]?.index ?? null)
          : null,
      );
      return true;
    },
    [modificationKind],
  );

  const selectInventoryItem = useCallback(
    (item: Item) => (pickerActive ? selectItem(item) : false),
    [pickerActive, selectItem],
  );

  const applySelectedItemModification = useCallback(() => {
    if (!selectedItemId || !modificationKind) {
      return;
    }

    switch (modificationKind) {
      case 'reforge':
        if (resolvedReforgeStatIndex == null) {
          return;
        }
        onReforgeItem(selectedItemId, resolvedReforgeStatIndex);
        return;
      case 'enchant':
        onEnchantItem(selectedItemId);
        return;
      case 'corrupt':
        onCorruptItem(selectedItemId);
        return;
    }
  }, [
    modificationKind,
    onCorruptItem,
    onEnchantItem,
    onReforgeItem,
    resolvedReforgeStatIndex,
    selectedItemId,
  ]);

  return {
    applySelectedItemModification,
    clearSelectedItem,
    modificationKind,
    pickerActive,
    resolvedReforgeStatIndex,
    selectInventoryItem,
    selectedItem,
    setSelectedReforgeStatIndex,
    togglePicker,
  };
}

function findSelectableItem(
  inventory: Item[],
  equipment: Equipment,
  itemId: string | null,
) {
  if (!itemId) {
    return null;
  }

  return (
    inventory.find((item) => item.id === itemId) ??
    Object.values(equipment).find((item) => item?.id === itemId) ??
    null
  );
}
