function getToggleButtons(page) {
  return page.$$eval('button[aria-label^="Toggle "]', (buttons) =>
    buttons
      .map((button) => ({
        ariaLabel: button.getAttribute('aria-label') ?? '',
      }))
      .filter(({ ariaLabel }) => ariaLabel.length > 0),
  );
}

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

export async function setup(page) {
  await page.waitForSelector('button[aria-label^="Toggle "]');
}

export async function createTests(page) {
  const buttons = await getToggleButtons(page);

  return buttons.map(({ ariaLabel }) => ({
    description: ariaLabel,
    data: { ariaLabel },
  }));
}

export async function iteration(page, { ariaLabel }) {
  const selector = `button[aria-label="${ariaLabel}"]`;

  await page.click(selector);
  await page.waitForFunction(
    ({ expectedButtonCount }) =>
      globalThis.document.querySelectorAll('button[aria-label^="Toggle "]')
        .length >= expectedButtonCount,
    {},
    { expectedButtonCount: 1 },
  );
  await delay(250);
  await page.click(selector);
  await delay(250);
}

export async function waitForIdle(_page) {
  void _page;
  await delay(500);
}
