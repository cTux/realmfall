export function findPrimaryBarByTitle(host: HTMLElement, title: string) {
  const entityCard = findEntityCardByTitle(host, title);

  return entityCard?.querySelector(
    'div[class*="primaryBar"]',
  ) as HTMLDivElement | null;
}

export function findEntityCardByTitle(host: HTMLElement, title: string) {
  const titleNode = Array.from(host.querySelectorAll('strong')).find(
    (node) => node.textContent === title,
  );

  return titleNode?.closest(
    'div[class*="entityCard"]',
  ) as HTMLDivElement | null;
}

export function findAbilityButtonByTitle(
  host: HTMLElement,
  entityTitle: string,
  abilityAriaLabel: string,
) {
  const entityCard = findEntityCardByTitle(host, entityTitle);
  const abilityButton = entityCard?.querySelector(
    `button[aria-label="${abilityAriaLabel}"]`,
  ) as HTMLButtonElement | null;

  return abilityButton;
}
