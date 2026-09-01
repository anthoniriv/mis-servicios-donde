import { expect, test } from './fixtures.js';

test('serves the static public foundation', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  await expect(response.text()).resolves.toContain('Información sobre cortes generada por la comunidad, no oficial.');
});

test('offers an unofficial filtered map and accessible report validation', async ({ page }) => {
  await page.route('**/v1/cells?service=water', (route) => route.fulfill({ json: [{ h3Cell: '8999999999fffff', service: 'water', provider: 'sedapal', confirmed: true, reports: 3 }] }));
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '¿Es solo tu casa?' })).toBeVisible();
  await expect(page.getByRole('note')).toContainText('No es un canal oficial de Sedapal, Luz del Sur ni de ningún proveedor.');
  await expect(page.getByLabel('Ver servicio')).toHaveValue('all');
  await expect(page.getByRole('status')).toContainText('No hay cortes reportados en este momento.');

  await page.getByLabel('Ver servicio').selectOption('water');
  await expect(page.getByRole('status')).toContainText('1 confirmado.');
  await expect(page.getByLabel('Cortes confirmados por zona')).toContainText('Corte de agua en una zona cercana');

  await page.getByRole('button', { name: 'Enviar reporte' }).click();
  await expect(page.getByRole('alert')).toContainText('Elige al menos un servicio afectado.');
});
