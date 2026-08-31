import { expect, test } from '@playwright/test';

test('serves the static public foundation', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  await expect(response.text()).resolves.toContain('Community-generated, unofficial outage information.');
});

test('offers an unofficial filtered map and accessible report validation', async ({ page }) => {
  await page.route('**/v1/cells?service=water', (route) => route.fulfill({ json: [{ h3Cell: '8999999999fffff', service: 'water' }] }));
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Community outage map' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('Community-generated information is unofficial and not provider-confirmed.');
  await expect(page.getByLabel('Show service')).toHaveValue('all');
  await expect(page.getByRole('status')).toContainText('No confirmed outages are available right now.');

  await page.getByLabel('Show service').selectOption('water');
  await expect(page.getByRole('status')).toContainText('1 confirmed condition available.');
  await expect(page.getByLabel('Confirmed outage cells')).toContainText('water condition in a nearby area');

  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('alert')).toContainText('Choose at least one affected service.');
});
