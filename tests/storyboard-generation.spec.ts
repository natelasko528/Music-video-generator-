import { test, expect } from '@playwright/test';

test.describe('Storyboard Generation Flow', () => {
  // This test requires a valid GEMINI_API_KEY - skip in CI or when no key is set
  test.skip('should automatically navigate to Timeline tab after generating storyboard (requires API key)', async ({ page }) => {
    // Set mobile viewport since tab navigation is a mobile feature
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Verify we start on Setup tab (use header tabs for consistent selection)
    const setupTab = page.locator('header .tab-btn[data-tab="setup"].active');
    await expect(setupTab).toBeVisible();

    // Upload an audio file (mock/fixture)
    const audioInput = page.locator('#audio-input');
    await audioInput.setInputFiles('./tests/fixtures/sample-audio.wav');

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
    const timelineTab = page.locator('header .tab-btn[data-tab="timeline"].active');
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

  test('should navigate to Timeline tab when tab is clicked', async ({ page }) => {
    // Set mobile viewport since tab navigation is a mobile feature
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Verify we start on Setup tab
    const setupTab = page.locator('header .tab-btn[data-tab="setup"].active');
    await expect(setupTab).toBeVisible();
    
    // Verify Setup panel is visible
    const setupPanel = page.locator('#panel-setup:not(.hidden)');
    await expect(setupPanel).toBeVisible();

    // Click on Timeline tab
    const timelineTabButton = page.locator('header .tab-btn[data-tab="timeline"]');
    await timelineTabButton.click();

    // Verify Timeline tab is now active
    const timelineTab = page.locator('header .tab-btn[data-tab="timeline"].active');
    await expect(timelineTab).toBeVisible();

    // Verify Timeline panel is visible
    const timelinePanel = page.locator('#panel-timeline:not(.hidden)');
    await expect(timelinePanel).toBeVisible();

    // Verify Setup panel is hidden
    const setupPanelHidden = page.locator('#panel-setup');
    await expect(setupPanelHidden).toHaveClass(/hidden/);
  });

  test('should load audio file and display duration', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000');

    // Verify initial duration is 00:00
    const audioDuration = page.locator('#audio-duration');
    await expect(audioDuration).toHaveText('00:00');

    // Upload an audio file
    const audioInput = page.locator('#audio-input');
    await audioInput.setInputFiles('./tests/fixtures/sample-audio.wav');

    // Wait for audio to load and duration to update
    await page.waitForSelector('#audio-duration:not(:has-text("00:00"))', { timeout: 5000 });
    
    // Verify duration is no longer 00:00
    await expect(audioDuration).not.toHaveText('00:00');
    
    // Verify duration shows correct format (MM:SS) for 5-second audio
    await expect(audioDuration).toHaveText('00:05');
  });

  test('should keep user on Setup tab if storyboard generation fails', async ({ page }) => {
    // Set mobile viewport since tab navigation is a mobile feature
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000');

    // Try to generate without uploading audio (should fail)
    const generateButton = page.locator('#plan-button');

    // Handle alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Please upload an audio track first');
      await dialog.accept();
    });

    await generateButton.click();

    // Verify we stay on Setup tab (use header tabs for consistent selection)
    const setupTab = page.locator('header .tab-btn[data-tab="setup"].active');
    await expect(setupTab).toBeVisible();

    // Verify Timeline tab is not active
    const timelineTab = page.locator('header .tab-btn[data-tab="timeline"].active');
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
