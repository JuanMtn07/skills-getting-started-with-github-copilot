const { test, expect } = require('@playwright/test');

test('signup flow updates participants without full reload', async ({ page }) => {
  // Serve the app before running this test (e.g. with `uvicorn src.app:app --reload --port 8000`)
  await page.goto('http://127.0.0.1:8000');

  // Wait for activities to load
  await page.waitForSelector('.activity-card');

  // Choose the first activity from the select
  const select = await page.$('#activity');
  const value = await select.evaluate((s) => s.options[1]?.value);
  if (!value) throw new Error('No activity option found to test');

  // Fill the form
  await page.fill('#email', 'e2e.user@mergington.edu');
  await page.selectOption('#activity', value);

  // Submit the form
  await page.click('button[type=submit]');

  // Wait for success message
  await page.waitForSelector('#message.success');

  // Verify the participant badge or name was inserted into the activity card
  // Find the activity card with the selected name
  const card = await page.locator('.activity-card').filter({ has: page.locator('h4', { hasText: value }) });
  await expect(card.locator('.participant-name')).toContainText('e2e.user@mergington.edu');
});
