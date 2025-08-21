    // tests/auth.global.setup.ts
import { chromium } from '@playwright/test';

export default async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 走公開路由登入（你的 middleware 對 /sign-in 放行）
  await page.goto(`${process.env.BASE_URL ?? 'http://localhost:3000'}/sign-in`);

  // 這裡的選取器請依你的 Clerk 登入表單實際文字調整
  // 建議先跑 `npx playwright codegen http://localhost:3000/sign-in` 探索正確的 selector
  await page.getByLabel(/email|電子郵件/i).fill(process.env.E2E_EMAIL!);
  await page.getByLabel(/password|密碼/i).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: /sign in|登入/i }).click();

  // 成功登入後導回首頁或 Step1，都可以
  await page.waitForURL('**/step1', { timeout: 30_000 }).catch(async () => {
    // 若你的登入後是回首頁，也接受
    await page.waitForURL('**/', { timeout: 10_000 });
  });

  // 存下登入狀態
  await context.storageState({ path: 'storageState.json' });
  await browser.close();
};
