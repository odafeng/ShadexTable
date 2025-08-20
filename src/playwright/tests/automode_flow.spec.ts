import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * This end‑to‑end test covers the full auto analysis flow for ShadexTable.
 *
 * Steps performed:
 *  1. Navigate to the sign‑in page and authenticate using credentials from
 *     environment variables `E2E_EMAIL` and `E2E_PASSWORD`.  If your dev
 *     environment already has an active session, this step will simply
 *     redirect you to step 1.
 *  2. Upload a small CSV file (provided in the fixtures folder) via the
 *     file input on the step 1 page.  The sample file contains a few
 *     columns and rows so the table analysis APIs have something to work
 *     with.
 *  3. Enable the AI auto mode by toggling the switch and (optionally)
 *     selecting the first available group variable.  Auto mode performs
 *     variable classification, missing value imputation and table analysis
 *     without further user input.
 *  4. Trigger the analysis by clicking the primary action button.  The
 *     application will navigate to `/step3` once the analysis pipeline
 *     completes.
 *  5. Verify that the result table is present on the step 3 page.
 *
 * To run this test locally you will need to install Playwright and its
 * browsers:
 *
 *   npm install --save-dev @playwright/test
 *   npx playwright install
 *
 * You can then execute the test with:
 *
 *   npx playwright test auto_analysis.spec.ts --project=chromium
 *
 * The base URL (`http://localhost:3000` in this example) can be adjusted
 * via the PLAYWRIGHT_BASE_URL environment variable if your dev server runs
 * on a different port.  Likewise, set E2E_EMAIL and E2E_PASSWORD for
 * authentication.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test('AI auto analysis from upload to summary table', async ({ page }) => {
  // Step 0: sign in if necessary.  Clerk will redirect unauthenticated
  // users to /sign-in.  When running locally with storageState or an
  // already authenticated browser context this block will simply
  // navigate to step 1 and bypass any input.
  await page.goto(`${BASE_URL}/sign-in`);

  // If an email/password are provided, perform sign in.  The Clerk
  // component renders inputs with accessible labels "Email address" and
  // "Password" when localised in English; for the zh‑TW localisation
  // Playwright falls back to the underlying input elements.
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (email && password) {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    // Fill out the credentials only if the inputs exist on the page.  If
    // storageState already contains a valid session, these locators will
    // not match anything and the fills will be skipped.
    if (await emailInput.count() > 0) {
      await emailInput.fill(email);
      await passwordInput.fill(password);
      // The sign in button should have role="button" and contain some
      // variant of the word "Sign in".  We match it using a case
      // insensitive regex so it works in both English and Chinese
      // localisations.
      await page.getByRole('button', { name: /sign in|登入/i }).click();
    }
  }

  // Wait for redirection to step 1.  Clerk will automatically redirect
  // after successful authentication.  If you are already signed in this
  // call resolves immediately.
  await page.waitForURL(/\/step1$/);

  // Step 1: upload the sample CSV.  Locate the file input; the upload
  // component uses an <input type="file"> internally.  The sample file
  // lives alongside this spec in the fixtures folder.
  const filePath = path.resolve(__dirname, 'sample.csv');
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toHaveCount(1);
  await fileInput.setInputFiles(filePath);

  // Wait for the preview or other UI changes that indicate parsing is
  // complete.  The app dispatches column analysis and privacy detection
  // automatically; waiting on a column name appearing in the DOM is a
  // reliable signal.  In our sample file the first column is "Group".
  await page.waitForSelector('text=Group');

  // Step 2: toggle AI auto mode.  The auto mode switch has role="switch"
  // and is the only switch in AnalysisControls, so grabbing the first
  // switch is safe.
  const autoModeSwitch = page.getByRole('switch').first();
  await autoModeSwitch.click();

  // Optionally choose a group variable when auto mode is enabled.  A
  // select element (combobox role) appears; select the first non‑empty
  // option.  If the combobox does not exist (auto mode does not require
  // grouping) this call will be skipped.
  const groupSelect = page.locator('select');
  if (await groupSelect.count() > 0) {
    const options = await groupSelect.locator('option').all();
    // Skip the empty/default option by selecting index 1 if it exists.
    if (options.length > 1) {
      await groupSelect.selectOption({ index: 1 });
    }
  }

  // Step 3: trigger the analysis by clicking the action button.  The
  // button text contains the word "分析" (analysis) or similar; we use a
  // regex to catch both English and Chinese variants.
  const analyzeButton = page.getByRole('button', { name: /分析|start|開始/i });
  await analyzeButton.click();

  // The analysis may take a while; wait for navigation to step 3.
  await page.waitForURL(/\/step3$/);

  // Finally, verify that the result table renders.  The table element
  // should have role="table" according to HTML semantics.
  const resultTable = page.getByRole('table');
  await expect(resultTable).toBeVisible();
});