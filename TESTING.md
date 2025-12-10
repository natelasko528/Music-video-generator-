# Testing Guide

## Playwright E2E Tests

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

### Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

### Running Tests

- **Run all tests (headless):**
  ```bash
  npm test
  ```

- **Run tests with UI mode (interactive):**
  ```bash
  npm run test:ui
  ```

- **Run tests in headed mode (watch browser):**
  ```bash
  npm run test:headed
  ```

### Test Coverage

The test suite covers:

1. **Tab Navigation**
   - Verifies starting on Setup tab
   - Tests manual tab switching between Setup, Timeline, and Preview
   - Validates panel visibility changes with tab state

2. **Audio Upload**
   - Tests audio file upload functionality
   - Verifies duration display updates correctly

3. **Error Handling**
   - Ensures user stays on Setup tab if generation fails (no audio uploaded)
   - Tests validation alerts for missing requirements

4. **Mobile Responsiveness**
   - All tests use mobile viewport (375x667)
   - Verifies Generate Storyboard button is visible on mobile viewports
   - Tests button styling and clickability

5. **Storyboard Generation (Requires API Key)**
   - Verifies automatic navigation to Timeline tab after successful generation
   - Validates that scenes are created and displayed correctly
   - Confirms console log messages appear
   - **Note:** This test is skipped by default as it requires a valid GEMINI_API_KEY

### Test Fixtures

Test fixtures are located in `tests/fixtures/`:

- `sample-audio.wav` - A 5-second generated WAV file for audio upload testing
- `create-test-audio.cjs` - Script to regenerate the test audio file if needed

### Manual Testing

To manually test the full storyboard generation feature:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Follow these steps:
   - Upload an audio file (MP3, WAV, or M4A)
   - Enter lyrics or a creative description
   - Click "Generate Storyboard" button
   - **Expected Result:** App automatically switches to Timeline tab and displays generated scenes

### Feature: Auto-Navigation After Storyboard Generation

**What was added:**
- After successful storyboard generation, the app now automatically navigates from the Setup tab to the Timeline tab
- A system log message "Switched to Timeline view" appears in the console
- The button's gradient styling is preserved after generation completes

**Why this matters:**
- On mobile devices, users previously had to manually click the Timeline tab to see their generated scenes
- This creates a smoother, more intuitive user experience
- Users immediately see the results of their storyboard generation

### Test Files

- `tests/storyboard-generation.spec.ts` - Main test suite
- `tests/fixtures/sample-audio.wav` - Test audio fixture
- `playwright.config.ts` - Playwright configuration

### Known Limitations

- Full storyboard generation test requires API keys for Google Gemini (skipped by default)
- Tab navigation tests use mobile viewport since header tabs are hidden on desktop (lg:hidden)
- Browser downloads may be restricted in sandboxed environments
