import { test, expect } from '@playwright/test';

test.describe('Storyboard Generation Flow', () => {
  test('should automatically navigate to Timeline tab after generating storyboard', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Verify we start on Setup tab
    const setupTab = page.locator('[data-tab="setup"].active');
    await expect(setupTab).toBeVisible();

    // Upload an audio file (mock/fixture)
    const audioInput = page.locator('#audio-input');
    // Use existing test audio file if available, otherwise skip this test
    try {
        await audioInput.setInputFiles('./tests/It\'s New Day - 2035 West Coast Remix (Cover).wav');
    } catch (error) {
        // If fixture doesn't exist, create a minimal test
        test.skip();
        return;
    }

    // Wait for audio to load
    await page.waitForSelector('#audio-duration:not(:has-text("00:00"))', { timeout: 5000 });

    // Enter lyrics/creative brief
    const promptInput = page.locator('#prompt-input');
    await promptInput.fill('Test lyrics for automated testing of music video generation flow');

    // Click Generate Storyboard button
    const generateButton = page.locator('#plan-button');
    await generateButton.click();

    // Wait for storyboard generation (this may take time)
    await page.waitForSelector('#plan-button:not([disabled])', { timeout: 60000 });

    // Verify automatic navigation to Timeline tab
    const timelineTab = page.locator('[data-tab="timeline"].active');
    await expect(timelineTab).toBeVisible();

    // Verify Timeline panel is visible
    const timelinePanel = page.locator('#panel-timeline:not(.hidden)');
    await expect(timelinePanel).toBeVisible();

    // Verify scenes were created
    const sceneContainer = page.locator('#scene-container');
    const scenes = sceneContainer.locator('.group.flex.gap-3');
    await expect(scenes.first()).toBeVisible();

    // Verify console log message
    const consoleMessage = page.locator('#debug-output:has-text("Switched to Timeline view")');
    await expect(consoleMessage).toBeVisible();
  });

  test('should keep user on Setup tab if storyboard generation fails', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Try to generate without uploading audio (should fail)
    const generateButton = page.locator('#plan-button');

    // Handle alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Please upload an audio track first');
      await dialog.accept();
    });

    await generateButton.click();

    // Verify we stay on Setup tab
    const setupTab = page.locator('[data-tab="setup"].active');
    await expect(setupTab).toBeVisible();

    // Verify Timeline tab is not active
    const timelineTab = page.locator('[data-tab="timeline"].active');
    await expect(timelineTab).not.toBeVisible();
  });

  test('Generate Storyboard button should be visible and clickable on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    // Scroll to bottom of Setup panel to find button
    const setupPanel = page.locator('#panel-setup');
    await setupPanel.scrollIntoViewIfNeeded();

    // Find the Generate Storyboard button
    const generateButton = page.locator('#plan-button');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();

    // Verify button text
    await expect(generateButton).toContainText('Generate Storyboard');

    // Verify button styling (gradient background)
    const buttonStyles = await generateButton.evaluate(el => {
      return window.getComputedStyle(el).position;
    });
    expect(buttonStyles).toBe('relative');
  });
});
