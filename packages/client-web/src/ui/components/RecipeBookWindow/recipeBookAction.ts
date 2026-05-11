import type { MouseEvent as ReactMouseEvent } from 'react';

export function getRecipeCraftCount(event: ReactMouseEvent<HTMLButtonElement>) {
  if (event.ctrlKey || event.metaKey) return 'max';
  if (event.shiftKey) return 5;
  return 1;
}
