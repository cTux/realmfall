import type { readFileSync as readFileSyncType } from 'node:fs';
import { resolve } from 'node:path';

export function readUiStylesSource(readFileSync: typeof readFileSyncType) {
  return readFileSync(resolve(process.cwd(), 'src/styles/_ui.scss'), 'utf8');
}
