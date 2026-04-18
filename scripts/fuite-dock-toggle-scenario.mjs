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

async function toggleWindow(page, ariaLabel) {
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
  await page.evaluate(() => {
    const activeElement = globalThis.document.activeElement;

    if (
      activeElement &&
      'blur' in activeElement &&
      typeof activeElement.blur === 'function'
    ) {
      activeElement.blur();
    }
  });
  await delay(250);
}

export async function setup(page) {
  await page.waitForSelector('button[aria-label^="Toggle "]');
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

export async function createTests(page) {
  const buttons = await getToggleButtons(page);

  // Warm lazy window modules once before fuite starts measuring, so
  // first-load code compilation and one-time caches do not appear as leaks.
  for (const { ariaLabel } of buttons) {
    await toggleWindow(page, ariaLabel);
  }

  return buttons.map(({ ariaLabel }) => ({
    description: ariaLabel,
    data: { ariaLabel },
  }));
}

export async function iteration(page, { ariaLabel }) {
  await toggleWindow(page, ariaLabel);
}

export async function waitForIdle(page) {
  await page.evaluate(() => {
    globalThis.performance.clearMarks();
    globalThis.performance.clearMeasures();
    globalThis.performance.clearResourceTimings();
  });
  await delay(500);
}
