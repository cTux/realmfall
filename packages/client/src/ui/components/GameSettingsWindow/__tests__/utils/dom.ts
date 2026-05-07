export function requireElement<T extends Element>(
  element: T | null | undefined,
  message: string,
) {
  if (!element) {
    throw new Error(message);
  }

  return element;
}
