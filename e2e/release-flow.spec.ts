import { expect, test, type Page } from '@playwright/test';

async function grantLocation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (success: (position: GeolocationPosition) => void) => success({ coords: { latitude: -12.0464, longitude: -77.0428 } } as GeolocationPosition) },
    });
  });
}

test('submits a report and renders only the public aggregate after confirmation', async ({ page }) => {
  let reported = false;
  await grantLocation(page);
  await page.route('**/v1/reports', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ services: ['water'], status: 'outage' });
    expect(route.request().postDataJSON()).not.toHaveProperty('name');
    reported = true;
    await route.fulfill({ status: 201, json: { submissionId: 'release-browser-submission', accepted: true } });
  });
  await page.route('**/v1/cells?service=water', async (route) => route.fulfill({
    json: reported ? [{ h3Cell: '8999999999fffff', service: 'water', deviceToken: 'never-public' }] : [],
  }));

  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Water' }).check();
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('alert')).toContainText('Report received.');

  await page.getByLabel('Show service').selectOption('water');
  await expect(page.getByRole('status')).toContainText('1 confirmed condition available.');
  await expect(page.getByLabel('Confirmed outage cells')).toContainText('water condition in a nearby area');
  await expect(page.locator('body')).not.toContainText('8999999999fffff');
  await expect(page.locator('body')).not.toContainText('never-public');
});

test('keeps the browser private and actionable when rollout APIs are disabled', async ({ page }) => {
  await grantLocation(page);
  await page.route('**/v1/cells', async (route) => route.fulfill({ json: [] }));
  await page.route('**/v1/reports', async (route) => route.fulfill({ status: 400, json: { code: 'report_unavailable' } }));

  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Water' }).check();
  await page.getByRole('button', { name: 'Send report' }).click();

  await expect(page.getByRole('alert')).toContainText('Unable to send your report right now.');
  await expect(page.getByRole('status')).toContainText('No confirmed outages are available right now.');
  await expect(page.getByLabel('Confirmed outage cells')).toBeEmpty();
});
