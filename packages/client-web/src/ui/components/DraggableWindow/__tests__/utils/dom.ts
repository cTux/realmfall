export function findFloatingWindows(host: HTMLElement) {
  return Array.from(
    host.querySelectorAll('section[class*="floatingWindow"]'),
  ) as HTMLElement[];
}

export function findWindowByContentText(host: HTMLElement, text: string) {
  return findFloatingWindows(host).find((windowElement) =>
    windowElement.textContent?.includes(text),
  );
}

export function findWindowCloseButton(windowElement: HTMLElement | undefined) {
  return windowElement?.querySelector(
    'button[aria-label="Close"]',
  ) as HTMLButtonElement | null;
}

export function findWindowHeader(windowElement: HTMLElement | undefined) {
  return windowElement?.querySelector(
    'div[class*="windowHeader"]',
  ) as HTMLDivElement | null;
}

export function findWindowResizeHandle(windowElement: HTMLElement | undefined) {
  return windowElement?.querySelector(
    'div[class*="resizeHandle"]',
  ) as HTMLDivElement | null;
}
