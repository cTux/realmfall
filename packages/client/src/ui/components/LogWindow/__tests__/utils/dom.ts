export function findLogList(host: HTMLElement) {
  return host.querySelector('[data-virtualized-list="log-window"]');
}

export function findSegmentByText(
  host: HTMLElement,
  text: string,
): HTMLSpanElement | undefined {
  return Array.from(host.querySelectorAll('span[class]')).find(
    (node) => node.textContent === text,
  ) as HTMLSpanElement | undefined;
}
