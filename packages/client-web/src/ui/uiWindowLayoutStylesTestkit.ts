import type { readFileSync as readFileSyncType } from 'node:fs';
import { resolve } from 'node:path';

export function readInventoryWindowStylesSource(
  readFileSync: typeof readFileSyncType,
) {
  return readFileSync(
    resolve(
      process.cwd(),
      'src/ui/components/InventoryWindow/styles.module.scss',
    ),
    'utf8',
  );
}

export function readRecipeBookWindowStylesSource(
  readFileSync: typeof readFileSyncType,
) {
  return readFileSync(
    resolve(
      process.cwd(),
      'src/ui/components/RecipeBookWindow/styles.module.scss',
    ),
    'utf8',
  );
}

export function readLogWindowStylesSource(
  readFileSync: typeof readFileSyncType,
) {
  return readFileSync(
    resolve(process.cwd(), 'src/ui/components/LogWindow/styles.module.scss'),
    'utf8',
  );
}

export function readUiStylesSource(readFileSync: typeof readFileSyncType) {
  return readFileSync(resolve(process.cwd(), 'src/styles/_ui.scss'), 'utf8');
}
