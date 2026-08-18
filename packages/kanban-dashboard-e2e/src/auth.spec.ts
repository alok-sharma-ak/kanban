import { expect, test } from '@playwright/test';

const password = 'Industry12345';

test('protects private routes and reports invalid credentials', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Email address').fill(`missing-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('The email or password is incorrect.')).toBeVisible();
});

test('rejects an invalid refresh session', async ({ page, context }) => {
  await context.addCookies([
    { name: 'kanban_access_token', value: 'expired', url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
    { name: 'kanban_refresh_token', value: 'invalid.refresh', url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
  ]);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?reason=session-expired/);
  expect((await context.cookies()).filter(({ name }) => name.startsWith('kanban_'))).toHaveLength(0);
});

test('registers, restores, refreshes, and logs out a server-only session', async ({ page, context }) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('localhost:3001')) apiRequests.push(request.url()); });
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Dashboard E2E');
  await page.getByLabel('Email address').fill(`dashboard-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Your boards' })).toBeVisible();
  expect(apiRequests).toEqual([]);

  let cookies = await context.cookies();
  expect(cookies.find(({ name }) => name === 'kanban_access_token')?.httpOnly).toBe(true);
  expect(cookies.find(({ name }) => name === 'kanban_refresh_token')?.httpOnly).toBe(true);

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);

  const access = cookies.find(({ name }) => name === 'kanban_access_token');
  if (!access) throw new Error('Access cookie missing');
  const expiredPayload = Buffer.from(JSON.stringify({ exp: 1 })).toString('base64url');
  await context.addCookies([{ ...access, value: `header.${expiredPayload}.signature`, expires: Math.floor(Date.now() / 1000) + 60 }]);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  cookies = await context.cookies();
  expect(cookies.find(({ name }) => name === 'kanban_access_token')?.value).not.toContain(expiredPayload);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
  expect((await context.cookies()).filter(({ name }) => name.startsWith('kanban_'))).toHaveLength(0);
});
