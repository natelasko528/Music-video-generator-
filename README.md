<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Director's Cut - AI Music Video Generator

An AI-powered music video generation suite using Google's Gemini 3.0 for storyboard planning and Veo 3.1 for video generation. Create professional music videos from audio tracks and creative briefs.

View your app in AI Studio: https://ai.studio/apps/drive/1dpY7hsyKLkAA_G25N1b_N4ZnhMoHPCwr

## Features

- **AI Storyboard Generation**: Automatically create scene-by-scene storyboards from lyrics or creative briefs
- **Video Generation**: Generate high-quality video clips using Veo 3.1
- **Safety Filtering**: Intelligent prompt sanitization to avoid content policy violations
- **Dual-Layer Playback**: Smooth scene transitions with multiple transition effects
- **Local State Persistence**: Projects are automatically saved to browser storage
- **Mobile-First Design**: Responsive UI optimized for mobile and desktop

## Prerequisites

- **Node.js** 18+ and npm
- **Google Gemini API Key** with access to:
  - Gemini 3.0 Pro (for storyboard generation)
  - Veo 3.1 (for video generation)
  - Imagen 3.0 (for reference image generation)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

**Important Security Notes:**
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- For production deployments, use environment variables in your hosting platform
- Consider using the API proxy (`api/proxy.ts`) to keep keys server-side
- When running inside AI Studio, you can also pick a key via the built-in key selector

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run Playwright E2E tests
- `npm run test:ui` - Run tests with UI mode
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Auto-fix linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
├── src/
│   ├── api/          # API client and Gemini/Veo integration
│   ├── logging/      # Logging system
│   ├── playback/     # Dual-layer video playback engine
│   ├── planner/      # Storyboard planning logic
│   ├── state/        # State management
│   ├── types.ts      # TypeScript type definitions
│   ├── ui/           # UI components and handlers
│   ├── utils/        # Utility functions
│   └── video/        # Video rendering with safety recovery
├── api/              # Serverless API proxy (for production)
├── tests/            # Playwright E2E tests
└── index.html        # Main HTML entry point
```

## Usage

1. **Upload Audio**: Select an audio file (MP3, WAV, M4A)
2. **Configure Settings**: 
   - Choose aspect ratio (16:9 or 9:16)
   - Set clip length (3s, 5s, or 8s)
   - Select transition effect
   - Optionally upload a style reference image
3. **Enter Creative Brief**: Paste lyrics or describe the visual style
4. **Generate Storyboard**: Click "Generate Storyboard" to create scenes
5. **Render Videos**: Render individual scenes or all scenes in parallel
6. **Preview**: Use the preview player to watch the generated video

## API Key Security

### Development
In development, the API key is loaded from `.env.local` and bundled into the client via Vite's `define`. This is acceptable for local development but **not for production**.

### Production
For production deployments, use the serverless API proxy:

1. Deploy the `api/proxy.ts` function to your hosting platform
2. Set `GEMINI_API_KEY` as an environment variable in your hosting platform
3. Update the client to use the proxy endpoint

The proxy keeps API keys server-side and never exposes them to the client.

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Set `GEMINI_API_KEY` in Vercel environment variables
3. Deploy - Vercel will automatically detect the Vite configuration

### Other Platforms

1. Build the project: `npm run build`
2. Deploy the `dist` directory to your static hosting service
3. Configure environment variables as needed

## Testing

See `TESTING.md` for comprehensive testing documentation, including:
- E2E test setup and execution
- API mocking strategies
- Manual testing procedures
- CI/CD integration examples

## Troubleshooting

### API Key Issues
- Ensure `GEMINI_API_KEY` is set in `.env.local`
- Check that your API key has access to Gemini 3.0, Veo 3.1, and Imagen 3.0
- Verify the key is not expired or rate-limited

### Video Generation Fails
- Check the console for safety filter messages
- The app automatically retries with sanitized prompts
- Some prompts may require manual adjustment

### Audio Not Loading
- Verify the audio file format is supported (MP3, WAV, M4A)
- Check browser console for errors
- Try a different audio file

## Contributing

1. Run linting and formatting before committing:
   ```bash
   npm run lint:fix
   npm run format
   ```
2. Ensure all tests pass:
   ```bash
   npm test
   ```
3. Follow the existing code structure and patterns

## License

Copyright 2025 Google LLC
SPDX-License-Identifier: Apache-2.0
