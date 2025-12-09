# Testing Guide

## Overview

This project uses [Playwright](https://playwright.dev/) for end-to-end testing and includes unit test mocks for API interactions.

## Prerequisites

- Node.js 18+ with npm
- Google Gemini/Veo API key available to the test run (for full E2E tests)
- Dev server running at `http://localhost:3000` (`npm run dev` in a separate terminal)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Configure Test Environment

Create a `.env.local` file with your API key:

```env
GEMINI_API_KEY=your_test_api_key_here
```

**Note:** Tests will use mocks when possible to avoid API costs and rate limits.

### 4. Set Up Test Fixtures

Place a test audio file at `tests/fixtures/sample-audio.mp3`:

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force tests/fixtures
Copy-Item test.mp3 tests/fixtures/sample-audio.mp3
```

**Bash:**
```bash
mkdir -p tests/fixtures
cp test.mp3 tests/fixtures/sample-audio.mp3
```

Alternatively, tests will fall back to using existing audio files in the `tests/` directory.

## Running Tests

### E2E Tests

1. **Start the dev server** (keep it running):
   ```bash
   npm run dev
   ```

2. **In another terminal, run tests:**
   - **Headless (default):**
     ```bash
     npm test
     ```
   - **UI mode (interactive):**
     ```bash
     npm run test:ui
     ```
   - **Headed (watch browser):**
     ```bash
     npm run test:headed
     ```
   - **Specific test file:**
     ```bash
     npx playwright test tests/storyboard-generation.spec.ts
     ```

## Test Coverage

### E2E Test Coverage

1. **Storyboard Generation Flow**
   - Verifies automatic navigation to Timeline tab after successful generation
   - Validates that scenes are created and displayed correctly
   - Confirms console log messages appear
   - Tests the complete user flow from audio upload to storyboard generation

2. **Error Handling**
   - Ensures user stays on Setup tab if generation fails
   - Tests validation for missing audio files
   - Verifies error messages are displayed appropriately

3. **Mobile Responsiveness**
   - Verifies Generate Storyboard button is visible on mobile viewports
   - Tests button styling and clickability
   - Ensures tab navigation works on mobile devices

### Test Files

- `tests/storyboard-generation.spec.ts` - Main E2E test suite
- `tests/mocks/api-mock.ts` - API response mocks for testing
- `playwright.config.ts` - Playwright configuration

## API Mocking

The project includes API mocks in `tests/mocks/api-mock.ts` for testing without making actual API calls:

```typescript
import { mockStoryboardResponse, mockVideoOperation } from './tests/mocks/api-mock';
```

These can be used to:
- Test UI components without API dependencies
- Avoid API costs during development
- Test error handling scenarios

## Manual Testing

### Basic Flow Test

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

### Error Scenarios

1. **Missing Audio:**
   - Try to generate storyboard without uploading audio
   - Should show alert and stay on Setup tab

2. **Missing Prompt:**
   - Upload audio but leave prompt empty
   - Should show alert when trying to generate

3. **Invalid API Key:**
   - Use an invalid API key
   - Should show appropriate error message

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm test
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

## Debugging Tests

### View Test Traces

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Debug Specific Test

```bash
npx playwright test tests/storyboard-generation.spec.ts --debug
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome
```

## Known Limitations

1. **API Dependencies:**
   - Some tests require API keys for Google Gemini and Veo to fully test generation
   - Tests will skip or use mocks when API keys are unavailable
   - Tests call live Gemini/Veo endpoints; ensure your key has access and usage budget

2. **Browser Restrictions:**
   - Browser downloads may be restricted in sandboxed environments
   - Video download tests may fail in CI environments

3. **Rate Limiting:**
   - API rate limits may cause test failures
   - Use mocks for frequent test runs

4. **Test Data:**
   - Audio fixtures may not be available in all environments
   - Tests include fallback logic for missing fixtures

## Best Practices

1. **Isolation:** Each test should be independent and not rely on state from other tests
2. **Cleanup:** Tests should clean up after themselves (clear localStorage, reset state)
3. **Timeouts:** Use appropriate timeouts for async operations
4. **Assertions:** Use descriptive assertion messages
5. **Mocks:** Use mocks for external dependencies when possible

## Adding New Tests

1. Create test file in `tests/` directory
2. Follow existing test patterns
3. Use Playwright's best practices for selectors and waiting
4. Add appropriate timeouts for async operations
5. Update this documentation if adding new test categories
