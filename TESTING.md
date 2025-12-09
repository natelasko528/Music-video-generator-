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

1. **Storyboard Generation Flow**
   - Verifies automatic navigation to Timeline tab after successful generation
   - Validates that scenes are created and displayed correctly
   - Confirms console log messages appear

2. **Error Handling**
   - Ensures user stays on Setup tab if generation fails
   - Tests validation for missing audio files

3. **Mobile Responsiveness**
   - Verifies Generate Storyboard button is visible on mobile viewports
   - Tests button styling and clickability

### Manual Testing

To manually test the new auto-navigation feature:

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

**Code changes:**
- `index.tsx:359-364` - Added automatic tab navigation logic
- `index.tsx:372-381` - Restored full button HTML with gradient styling

### Test Files

- `tests/storyboard-generation.spec.ts` - Main test suite
- `playwright.config.ts` - Playwright configuration

### Known Limitations

- Tests require API keys for Google Gemini and Veo to fully test generation
- Browser downloads may be restricted in sandboxed environments
- Mock fixtures would be needed for fully automated CI/CD testing
