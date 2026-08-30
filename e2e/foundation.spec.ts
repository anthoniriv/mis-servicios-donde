import { expect, test } from '@playwright/test';

test('serves the static public foundation', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  await expect(response.text()).resolves.toContain('Community-generated, unofficial outage information.');
});
