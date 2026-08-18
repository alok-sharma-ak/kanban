import { expect, test } from '@playwright/test';

test('creates and manages a board through server actions only', async ({ page }) => {
  const stamp=`${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const backendRequests:string[]=[];
  page.on('request',request=>{if(request.url().startsWith('http://localhost:3001'))backendRequests.push(request.url())});
  await page.goto('/register');
  await page.getByLabel('Name').fill('Workspace User');
  await page.getByLabel('Email').fill(`workspace-${stamp}@example.com`);
  await page.getByLabel('Password').fill('Industry12345');
  await page.getByRole('button',{name:'Create account'}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByLabel('Board name').fill(`Project ${stamp}`);
  await page.getByRole('button',{name:'Create board'}).click();
  await expect(page).toHaveURL(/\/boards\/[0-9a-f-]+$/);
  await expect(page.getByText(`Project ${stamp}`)).toBeVisible();
  await page.getByText('Board and column settings').click();
  await page.getByPlaceholder('Column name').fill('Review');
  await page.getByRole('button',{name:'Add column'}).click();
  await expect(page.getByRole('heading', { name: /^Review/ })).toBeVisible();
  await page.getByRole('link',{name:'Profile'}).click();
  await expect(page.getByRole('heading',{name:'Profile'})).toBeVisible();
  await page.getByRole('link',{name:'Health'}).click();
  await expect(page.getByRole('heading',{name:'System health'})).toBeVisible();
  expect(backendRequests).toEqual([]);
});
