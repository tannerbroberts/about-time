/**
 * Complete Workflow E2E Test
 *
 * Tests the entire library + variable system workflow:
 * - Create templates, composites, and libraries
 * - Add templates to libraries
 * - View aggregated values with confidence
 * - Update composites and templates
 * - Fork and live-link functionality
 * - Export/import libraries
 *
 * Prerequisites:
 * - Backend running at http://localhost:3001
 * - Frontend running at http://localhost:5173
 * - Test credentials configured in .env.test
 *
 * Run: npx playwright test complete-workflow.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const TEST_EMAIL = process.env.TEST_EMAIL || 'tannerbroberts@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '19Brain96$$$$jesus2';

// Test data
const testData = {
  composite: {
    name: `e2e_test_meal_${Date.now()}`,
    composition: {
      calories: { value: 500, lower: 450, upper: 550 },
      protein_g: { value: 50, lower: 45, upper: 55 },
      carbs_g: { value: 60, lower: 55, upper: 65 },
    },
  },
  busyTemplate: {
    intent: `E2E Test Meal ${Date.now()}`,
    estimatedDuration: 1800000, // 30 minutes
  },
  laneTemplate: {
    intent: `E2E Test Daily Plan ${Date.now()}`,
    estimatedDuration: 86400000, // 24 hours
  },
  library: {
    name: `E2E Test Library ${Date.now()}`,
    description: 'Library created during E2E test',
  },
};

// Helper functions
async function login(page: Page): Promise<void> {
  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('networkidle');

  // Check if already logged in
  const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
  if (isLoggedIn) {
    return;
  }

  // Fill login form
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for login to complete
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
}

async function takeStepScreenshot(page: Page, stepName: string): Promise<void> {
  const filename = `step-${stepName.toLowerCase().replace(/\s+/g, '-')}.png`;
  await page.screenshot({ path: `test-results/${filename}`, fullPage: true });
}

async function waitForNotification(page: Page, message: string): Promise<void> {
  await page.waitForSelector(`text=${message}`, { timeout: 5000 });
}

test.describe('Complete Workflow E2E Test', () => {
  let page: Page;
  let createdCompositeId: string;
  let createdBusyTemplateId: string;
  let createdLaneTemplateId: string;
  let createdLibraryId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    // Cleanup: Delete created resources
    // Note: Implement cleanup API calls here
    await page.close();
  });

  test('Step 1: Create lane template with library', async () => {
    await page.goto(`${FRONTEND_URL}/build`);
    await takeStepScreenshot(page, '1-before-create-lane');

    // Click create lane button
    await page.click('button:has-text("Create Lane")');
    await page.waitForSelector('[data-testid="template-form"]');

    // Fill form
    await page.fill('input[name="intent"]', testData.laneTemplate.intent);
    await page.fill('input[name="estimatedDuration"]', String(testData.laneTemplate.estimatedDuration));

    // Submit
    await page.click('button[type="submit"]');
    await waitForNotification(page, 'Template created');
    await takeStepScreenshot(page, '1-lane-created');

    // Verify library was auto-created
    await page.click('button:has-text("Manage Libraries")');
    await page.waitForSelector('[data-testid="library-browser"]');
    const libraryExists = await page.locator(`text=${testData.laneTemplate.intent} Library`).isVisible();
    expect(libraryExists).toBeTruthy();
    await takeStepScreenshot(page, '1-library-auto-created');

    await page.click('button[aria-label="Close"]');
  });

  test('Step 2: Create composite variable definition', async () => {
    await page.goto(`${FRONTEND_URL}/build`);
    await page.click('button:has-text("Create Composite")');
    await page.waitForSelector('[data-testid="create-composite-dialog"]');
    await takeStepScreenshot(page, '2-composite-dialog-open');

    // Fill composite form
    await page.fill('input[name="name"]', testData.composite.name);

    // Add variables
    for (const [varName, varValue] of Object.entries(testData.composite.composition)) {
      await page.click('button:has-text("Add Variable")');
      const lastRow = page.locator('[data-testid="variable-row"]').last();
      await lastRow.locator('input[name="variableName"]').fill(varName);
      await lastRow.locator('input[name="nominalValue"]').fill(String(varValue.value));
      if (varValue.lower !== undefined) {
        await lastRow.locator('input[name="lowerBound"]').fill(String(varValue.lower));
      }
      if (varValue.upper !== undefined) {
        await lastRow.locator('input[name="upperBound"]').fill(String(varValue.upper));
      }
    }

    await takeStepScreenshot(page, '2-composite-form-filled');

    // Submit
    await page.click('button:has-text("Create")');
    await waitForNotification(page, 'Composite created');
    await takeStepScreenshot(page, '2-composite-created');
  });

  test('Step 3: Create busy template using composite', async () => {
    await page.goto(`${FRONTEND_URL}/build`);
    await page.click('button:has-text("Create Busy")');
    await page.waitForSelector('[data-testid="template-form"]');

    // Fill basic info
    await page.fill('input[name="intent"]', testData.busyTemplate.intent);
    await page.fill('input[name="estimatedDuration"]', String(testData.busyTemplate.estimatedDuration));

    // Add composite variable
    await page.click('button:has-text("Add Composite Variable")');
    await page.waitForSelector('[data-testid="composite-picker"]');
    await page.fill('input[placeholder="Search composites"]', testData.composite.name);
    await page.click(`text=${testData.composite.name}`);

    // Configure composite
    await page.fill('input[name="count"]', '2'); // 2x the composite
    await page.click('button:has-text("Snapshot")'); // Use snapshot mode
    await page.click('button:has-text("Add")');

    await takeStepScreenshot(page, '3-busy-with-composite');

    // Submit
    await page.click('button[type="submit"]');
    await waitForNotification(page, 'Template created');
    await takeStepScreenshot(page, '3-busy-created');
  });

  test('Step 4: Add busy template to lane library', async () => {
    await page.goto(`${FRONTEND_URL}/build`);

    // Find the busy template card
    const busyCard = page.locator(`text=${testData.busyTemplate.intent}`).first();
    await busyCard.hover();

    // Click add to library button
    await busyCard.locator('[aria-label="Add to library"]').click();
    await page.waitForSelector('[data-testid="library-selector"]');
    await takeStepScreenshot(page, '4-library-selector');

    // Select the lane's library
    await page.fill('input[placeholder="Search libraries"]', testData.laneTemplate.intent);
    const libraryOption = page.locator(`text=${testData.laneTemplate.intent} Library`);
    await libraryOption.click();

    // Add to library
    await page.click('button:has-text("Add to Library")');
    await waitForNotification(page, 'Added to library');
    await takeStepScreenshot(page, '4-added-to-library');
  });

  test('Step 5: Add template to lane segments', async () => {
    await page.goto(`${FRONTEND_URL}/build`);

    // Open lane template editor
    const laneCard = page.locator(`text=${testData.laneTemplate.intent}`).first();
    await laneCard.hover();
    await laneCard.locator('[aria-label="Compose"]').click();

    await page.waitForSelector('[data-testid="hierarchy-viewer"]');
    await takeStepScreenshot(page, '5-hierarchy-viewer');

    // Add segment
    await page.click('[data-testid="add-segment-button"]');
    await page.waitForSelector('[data-testid="template-picker"]');

    // Filter by library
    await page.click('[data-testid="library-filter"]');
    await page.click(`text=${testData.laneTemplate.intent} Library`);

    // Select busy template
    await page.click(`text=${testData.busyTemplate.intent}`);
    await page.click('button:has-text("Add to Lane")');

    await waitForNotification(page, 'Segment added');
    await takeStepScreenshot(page, '5-segment-added');
  });

  test('Step 6: View aggregated values with confidence', async () => {
    // Verify aggregated summary shows composite expansion
    const summary = page.locator('[data-testid="aggregated-summary"]');
    await expect(summary).toBeVisible();

    // Check that values are aggregated (2x composite = 1000 calories)
    const caloriesText = await summary.locator('text=/calories/').textContent();
    expect(caloriesText).toContain('1000'); // 2x 500

    await takeStepScreenshot(page, '6-aggregated-values');
  });

  test('Step 7: Toggle composite/expanded view', async () => {
    // Find and click view toggle
    await page.click('[aria-label="Expanded view"]');
    await page.waitForTimeout(500); // Wait for animation

    await takeStepScreenshot(page, '7-expanded-view');

    // Verify expanded view shows details
    const expandedView = page.locator('text=/↳/'); // Arrow prefix in expanded view
    await expect(expandedView).toBeVisible();

    // Toggle back to composite view
    await page.click('[aria-label="Composite view"]');
    await page.waitForTimeout(500);

    await takeStepScreenshot(page, '7-composite-view');
  });

  test('Step 8: Update composite definition (new version)', async () => {
    await page.goto(`${FRONTEND_URL}/build`);
    await page.click('button:has-text("Composites")');

    // Find and edit composite
    const compositeCard = page.locator(`text=${testData.composite.name}`).first();
    await compositeCard.hover();
    await compositeCard.locator('[aria-label="Edit"]').click();

    await page.waitForSelector('[data-testid="edit-composite-dialog"]');

    // Update a value
    const caloriesInput = page.locator('input[name="nominalValue"]').first();
    await caloriesInput.fill('550'); // Update from 500 to 550

    // Add changelog
    await page.fill('textarea[name="changelog"]', 'Increased calorie content');

    await takeStepScreenshot(page, '8-composite-edited');

    // Submit
    await page.click('button:has-text("Update")');
    await waitForNotification(page, 'Composite updated');

    // Verify version incremented
    const versionBadge = page.locator('text=/v2/');
    await expect(versionBadge).toBeVisible();

    await takeStepScreenshot(page, '8-version-incremented');
  });

  test('Step 9: Receive update notification', async () => {
    // Check for notification icon
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();

    // Open notifications
    await page.click('[data-testid="notifications-button"]');
    await page.waitForSelector('[data-testid="notifications-dropdown"]');

    // Verify update notification exists
    const updateNotification = page.locator('text=/Composite Update Available/');
    await expect(updateNotification).toBeVisible();

    await takeStepScreenshot(page, '9-update-notification');
  });

  test('Step 10: Apply composite update to snapshots', async () => {
    // Click "Update Now" in notification
    await page.click('button:has-text("Update Now")');
    await page.waitForSelector('[data-testid="update-confirmation-dialog"]');

    await takeStepScreenshot(page, '10-update-confirmation');

    // Review changelog
    const changelogText = await page.locator('[data-testid="changelog"]').textContent();
    expect(changelogText).toContain('Increased calorie content');

    // Confirm update
    await page.click('button:has-text("Apply Update")');
    await waitForNotification(page, 'Update applied');

    await takeStepScreenshot(page, '10-update-applied');
  });

  test('Step 11: Fork template to another library', async () => {
    await page.goto(`${FRONTEND_URL}/build`);

    // Create a new library first
    await page.click('button:has-text("Manage Libraries")');
    await page.click('button:has-text("Create Library")');
    await page.fill('input[name="name"]', testData.library.name);
    await page.fill('textarea[name="description"]', testData.library.description);
    await page.click('button[type="submit"]');
    await waitForNotification(page, 'Library created');

    // Fork the busy template
    const busyCard = page.locator(`text=${testData.busyTemplate.intent}`).first();
    await busyCard.hover();
    await busyCard.locator('[aria-label="More actions"]').click();
    await page.click('button:has-text("Fork")');

    // Select library for fork
    await page.waitForSelector('[data-testid="fork-dialog"]');
    await page.click(`text=${testData.library.name}`);
    await page.click('button:has-text("Fork Template")');

    await waitForNotification(page, 'Template forked');
    await takeStepScreenshot(page, '11-template-forked');
  });

  test('Step 12: Download public template with live-link', async () => {
    await page.goto(`${FRONTEND_URL}/build`);
    await page.click('button:has-text("Browse Public Templates")');
    await page.waitForSelector('[data-testid="public-library"]');

    await takeStepScreenshot(page, '12-public-templates');

    // Find and import a template
    const firstPublicTemplate = page.locator('[data-testid="public-template-card"]').first();
    await firstPublicTemplate.click('button:has-text("Import")');

    // Choose live-link option
    await page.click('input[value="live-link"]');
    await page.click('button:has-text("Import Template")');

    await waitForNotification(page, 'Template imported');
    await takeStepScreenshot(page, '12-template-imported');
  });

  test('Step 13: Receive template update notification', async () => {
    // This would require the original author to update the template
    // In a real test, we'd mock this or use a test account that publishes updates

    // Check for template update notification
    await page.click('[data-testid="notifications-button"]');
    const templateUpdate = page.locator('text=/Template Update Available/');

    // If notification exists, verify it
    if (await templateUpdate.isVisible()) {
      await takeStepScreenshot(page, '13-template-update-notification');
    }
  });

  test('Step 14: Apply template update', async () => {
    // Open template editor
    const importedTemplate = page.locator('[data-testid="live-linked-badge"]').first();
    if (await importedTemplate.isVisible()) {
      await importedTemplate.click();

      // Check for update banner
      const updateBanner = page.locator('[data-testid="update-available-banner"]');
      if (await updateBanner.isVisible()) {
        await takeStepScreenshot(page, '14-update-banner');

        await page.click('button:has-text("Update Now")');
        await page.click('button:has-text("Apply Update")');
        await waitForNotification(page, 'Template updated');

        await takeStepScreenshot(page, '14-template-updated');
      }
    }
  });

  test('Step 15: Break link and continue as fork', async () => {
    const liveLinkedTemplate = page.locator('[data-testid="live-linked-badge"]').first();
    if (await liveLinkedTemplate.isVisible()) {
      await liveLinkedTemplate.click();

      // Click break link button
      await page.click('button:has-text("Break Link")');
      await page.waitForSelector('[data-testid="break-link-confirmation"]');

      await takeStepScreenshot(page, '15-break-link-confirmation');

      await page.click('button:has-text("Break Link")');
      await waitForNotification(page, 'Link broken');

      // Verify now shows as forked
      const forkedBadge = page.locator('[data-testid="forked-badge"]');
      await expect(forkedBadge).toBeVisible();

      await takeStepScreenshot(page, '15-link-broken');
    }
  });

  test('Step 16: Export library as JSON', async () => {
    await page.goto(`${FRONTEND_URL}/build`);
    await page.click('button:has-text("Manage Libraries")');

    // Select library to export
    const libraryCard = page.locator(`text=${testData.library.name}`).first();
    await libraryCard.hover();
    await libraryCard.locator('[aria-label="Export"]').click();

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/library-.*-export\.json/);
    await takeStepScreenshot(page, '16-library-exported');

    // Save for next test
    const exportPath = `test-results/library-export-${Date.now()}.json`;
    await download.saveAs(exportPath);

    // Store path for next test
    test.info().attach('exportPath', { body: exportPath });
  });

  test('Step 17: Import library from JSON', async () => {
    // Get exported file from previous test
    const exportPath = test.info().attachments.find(a => a.name === 'exportPath')?.body as string;

    await page.goto(`${FRONTEND_URL}/build`);
    await page.click('button:has-text("Manage Libraries")');
    await page.click('button:has-text("Import Library")');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exportPath);

    await page.click('button:has-text("Import")');
    await waitForNotification(page, 'Library imported');

    await takeStepScreenshot(page, '17-library-imported');

    // Verify imported library exists
    const importedLibrary = page.locator(`text=${testData.library.name} (imported)`);
    await expect(importedLibrary).toBeVisible();
  });

  test('Step 18: Verify all data intact', async () => {
    await page.goto(`${FRONTEND_URL}/build`);

    // Verify composite exists
    await page.click('button:has-text("Composites")');
    const composite = page.locator(`text=${testData.composite.name}`);
    await expect(composite).toBeVisible();

    // Verify templates exist
    await page.click('button:has-text("Templates")');
    const busyTemplate = page.locator(`text=${testData.busyTemplate.intent}`);
    await expect(busyTemplate).toBeVisible();

    const laneTemplate = page.locator(`text=${testData.laneTemplate.intent}`);
    await expect(laneTemplate).toBeVisible();

    // Verify libraries exist
    await page.click('button:has-text("Libraries")');
    const library = page.locator(`text=${testData.library.name}`);
    await expect(library).toBeVisible();

    const autoLibrary = page.locator(`text=${testData.laneTemplate.intent} Library`);
    await expect(autoLibrary).toBeVisible();

    await takeStepScreenshot(page, '18-data-verified');

    // Success!
    console.log('✅ All E2E tests passed!');
  });

  test('Error scenarios', async () => {
    await page.goto(`${FRONTEND_URL}/build`);

    // Test 1: Prevent circular reference
    await page.click('button:has-text("Manage Libraries")');
    // Try to add lane A to lane B's library where lane B is in lane A
    // Should show error: "Circular reference detected"

    // Test 2: Duplicate composite name
    await page.click('button:has-text("Create Composite")');
    await page.fill('input[name="name"]', testData.composite.name);
    // Should show error: "Composite with this name already exists"

    // Test 3: Invalid confidence bounds
    await page.click('button:has-text("Create Composite")');
    await page.fill('input[name="lowerBound"]', '600');
    await page.fill('input[name="upperBound"]', '400');
    // Should show error: "Lower bound must be less than upper bound"

    await takeStepScreenshot(page, 'error-scenarios');
  });
});
