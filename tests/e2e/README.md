E2E test scaffold (Playwright)
================================

This folder contains a minimal Playwright test scaffold to perform an end-to-end
check of the signup flow in a headless browser.

Notes:
- Playwright and browsers are not installed by default in this project. To run
  these tests you need Node.js and Playwright installed.

Quick start (on a machine with Node.js):

1. Install Playwright and test runner

   npm init -y
   npm i -D @playwright/test
   npx playwright install

2. Run the E2E test (from project root)

   npx playwright test tests/e2e --project=chromium

The test file `test_signup.spec.js` will open the static UI, fill the signup
form, submit and assert the new participant appears without a full page reload.

If you'd like, I can add a package.json with scripts and configure CI (GitHub
Actions) to run these tests headlessly.
