import type { DeepPartial } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeDeep<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) {
    return base;
  }

  const merged: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };

  for (const key of Object.keys(override) as Array<keyof T>) {
    const nextValue = override[key];
    const currentValue = merged[key as string];

    merged[key as string] =
      isPlainObject(currentValue) && isPlainObject(nextValue)
        ? mergeDeep(
            currentValue as Record<string, unknown>,
            nextValue as DeepPartial<Record<string, unknown>>,
          )
        : nextValue;
  }

  return merged as T;
}
