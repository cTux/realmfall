import type { ComponentType } from 'react';

export function loadNamedWindowModule<Props>(
  loadComponent: () => Promise<ComponentType<Props>>,
) {
  return () =>
    loadComponent().then((component) => ({
      default: component,
    }));
}
