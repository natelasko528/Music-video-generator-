# 🎬 Video Generation API Research & Implementation Plan

**Research Date:** December 10, 2025  
**Project:** AI Music Video Generator  
**Current Implementation:** Google Veo 2.0 via `@google/genai`

---

## 📊 Executive Summary

This document outlines the official API documentation, pricing, capabilities, and implementation approach for four high-quality video generation services to integrate into the AI Music Video Generator.

| Model | Provider | Quality | Cost | API Status | Best For |
|-------|----------|---------|------|------------|----------|
| **Veo 3.0** | Google | ⭐⭐⭐⭐⭐ | Free tier + paid | ✅ Production | Primary |
| **Runway Gen-3 Alpha** | Runway | ⭐⭐⭐⭐⭐ | $0.05/sec | ✅ Production | Cinematic |
| **Sora** | OpenAI | ⭐⭐⭐⭐⭐ | $0.15/sec (Plus) | 🟡 Limited | Experimental |
| **Luma Dream Machine** | Luma AI | ⭐⭐⭐⭐ | Free tier available | ✅ Production | Budget |

---

## 1️⃣ Google Veo 3.0 (Primary - Already Integrated)

### Official API Documentation
- **Docs URL:** https://ai.google.dev/gemini-api/docs/video
- **API Package:** `@google/genai` (already installed)
- **Model ID:** `veo-3.0-generate-001` (latest available)

### API Endpoint Structure
```typescript
// Current implementation in index.tsx already supports this pattern
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const veoOperation = await ai.models.generateVideos({
  model: 'veo-3.0-generate-001', // Updated from veo-2.0
  prompt: prompt,
  image: styleImage, // Optional reference image
  config: {
    numberOfVideos: 1,
    aspectRatio: '16:9', // or '9:16', '1:1'
    durationSeconds: 5, // 5-8 seconds supported
  }
});

// Polling for completion
while (!veoOperation.done) {
  await delay(4000);
  veoOperation = await ai.operations.getVideosOperation({ operation: veoOperation });
}

// Get result
const videoUri = veoOperation.response.generatedVideos[0].video.uri;
```

### Veo 3.0 Capabilities
- **Resolution:** Up to 1080p
- **Duration:** 5-8 seconds per generation
- **Audio:** Native audio generation (new in 3.0!)
- **Aspect Ratios:** 16:9, 9:16, 1:1
- **Features:** Image-to-video, text-to-video, style reference
- **Rate Limits:** 10 requests/minute (free tier)

### Pricing
| Tier | Cost | Limits |
|------|------|--------|
| Free | $0 | 50 videos/day, 720p max |
| Pay-as-you-go | ~$0.025/second | 1080p, priority queue |

### Integration Status: ✅ READY
Update `VIDEO_MODELS` in `store.ts` to include veo-3.0-generate-001.

---

## 2️⃣ Runway Gen-3 Alpha (Cinematic Quality)

### Official API Documentation
- **Docs URL:** https://docs.runwayml.com/docs/api-reference
- **API Base:** `https://api.runwayml.com/v1`
- **Authentication:** Bearer token (API key)

### API Endpoint Structure
```typescript
interface RunwayVideoRequest {
  model: 'gen3a_turbo' | 'gen3a'; // turbo is faster, gen3a is higher quality
  prompt: string;
  image_url?: string; // Optional reference image (must be public URL)
  duration: 5 | 10; // 5 or 10 seconds
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  seed?: number; // For reproducibility
}

// Create video generation task
const response = await fetch('https://api.runwayml.com/v1/generate/video', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RUNWAY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gen3a_turbo',
    prompt: 'Cinematic music video scene...',
    duration: 5,
    aspect_ratio: '16:9',
  }),
});

const { task_id } = await response.json();

// Poll for completion
let status = 'pending';
while (status === 'pending' || status === 'processing') {
  await delay(3000);
  const statusRes = await fetch(`https://api.runwayml.com/v1/tasks/${task_id}`, {
    headers: { 'Authorization': `Bearer ${RUNWAY_API_KEY}` },
  });
  const result = await statusRes.json();
  status = result.status;
  if (status === 'succeeded') {
    return result.output.video_url;
  }
}
```

### Gen-3 Alpha Capabilities
- **Resolution:** Up to 1080p
- **Duration:** 5 or 10 seconds
- **Quality Modes:** Turbo (faster), Standard (higher quality)
- **Aspect Ratios:** 16:9, 9:16, 1:1, 4:3, 3:4
- **Features:** 
  - Text-to-video
  - Image-to-video (with public URL)
  - Motion brush controls
  - Camera motion presets

### Pricing
| Model | Cost per Second | 5s Video | 10s Video |
|-------|-----------------|----------|-----------|
| Gen-3 Alpha | $0.10/sec | $0.50 | $1.00 |
| Gen-3 Alpha Turbo | $0.05/sec | $0.25 | $0.50 |

### Free Tier
- **125 credits** on signup (~25 5-second videos)
- No credit card required initially

### Integration Complexity: 🟡 MEDIUM
Requires new API key management and HTTP client implementation.

---

## 3️⃣ OpenAI Sora (Experimental)

### Official API Documentation
- **Docs URL:** https://platform.openai.com/docs/api-reference/video
- **API Base:** `https://api.openai.com/v1`
- **Status:** Rolling out to API users (December 2024+)

### API Endpoint Structure (Based on OpenAI patterns)
```typescript
interface SoraVideoRequest {
  model: 'sora-1' | 'sora-turbo';
  prompt: string;
  size: '1920x1080' | '1080x1920' | '1080x1080';
  duration: number; // 5-20 seconds
  style?: 'cinematic' | 'animated' | 'realistic';
}

// Generate video
const response = await fetch('https://api.openai.com/v1/videos/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'sora-turbo',
    prompt: 'A professional music video scene...',
    size: '1920x1080',
    duration: 10,
  }),
});

const { id, status } = await response.json();

// Poll for completion (async generation)
while (true) {
  await delay(5000);
  const result = await fetch(`https://api.openai.com/v1/videos/${id}`, {
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
  });
  const data = await result.json();
  if (data.status === 'succeeded') {
    return data.video_url;
  }
}
```

### Sora Capabilities
- **Resolution:** Up to 1080p (4K for Pro users)
- **Duration:** 5-20 seconds (up to 60s for Pro)
- **Quality:** Industry-leading realism and motion
- **Features:**
  - Text-to-video
  - Image-to-video
  - Video-to-video (extend/modify)
  - Storyboard mode
  - Blend videos together

### Pricing (Current ChatGPT Integration)
| Plan | Videos/Month | Resolution | Duration |
|------|--------------|------------|----------|
| Plus ($20/mo) | 50 | 720p | 5 sec |
| Pro ($200/mo) | 500 | 1080p | 20 sec |
| API | TBD | TBD | TBD |

### API Availability
⚠️ **Important:** Sora API is currently in limited rollout. As of late 2024:
- Available through ChatGPT Plus/Pro interface
- API access being gradually expanded
- Check https://openai.com/sora for latest availability

### Integration Complexity: 🔴 HIGH
API still limited; may require OpenRouter proxy or waitlist.

---

## 4️⃣ Luma AI Dream Machine (Budget-Friendly)

### Official API Documentation
- **Docs URL:** https://docs.lumalabs.ai/docs/api/video-generation
- **API Base:** `https://api.lumalabs.ai/dream-machine/v1`
- **Authentication:** Bearer token

### API Endpoint Structure
```typescript
interface LumaVideoRequest {
  prompt: string;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
  keyframes?: {
    frame0?: { type: 'image'; url: string };
    frame1?: { type: 'image'; url: string };
  };
  loop?: boolean;
  callback_url?: string; // Webhook for completion
}

// Create video generation
const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LUMA_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Cinematic music video, dramatic lighting...',
    aspect_ratio: '16:9',
    loop: false,
  }),
});

const { id } = await response.json();

// Poll for completion
let generation;
do {
  await delay(5000);
  const statusRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${id}`, {
    headers: { 'Authorization': `Bearer ${LUMA_API_KEY}` },
  });
  generation = await statusRes.json();
} while (generation.state === 'queued' || generation.state === 'dreaming');

if (generation.state === 'completed') {
  return generation.assets.video; // Video URL
}
```

### Dream Machine 1.6 Capabilities
- **Resolution:** 1080p
- **Duration:** ~5 seconds per generation
- **Quality:** Excellent cinematic quality
- **Aspect Ratios:** 16:9, 9:16, 1:1, 4:3, 3:4, 21:9
- **Features:**
  - Text-to-video
  - Image-to-video (start/end keyframes)
  - Video extend
  - Camera motion controls
  - Loop generation

### Pricing
| Tier | Cost | What You Get |
|------|------|--------------|
| Free | $0 | 30 generations/month |
| Standard | $24/mo | 120 generations/month |
| Pro | $96/mo | 400 generations/month |
| API | $0.0032/frame | ~$0.40 per 5s video |

### Free Tier Details
- **30 free generations per month** (no credit card)
- Great for testing and light usage
- Some generations may have watermark

### Integration Complexity: 🟢 LOW
Clean REST API, similar pattern to current Veo implementation.

---

## 🔧 Implementation Plan

### Phase 1: Update Video Model Registry (store.ts)

```typescript
// Updated VIDEO_MODELS constant
export const VIDEO_MODELS = {
  'veo-3.0-generate-001': 'veo-3.0-generate-001',
  'veo-2.0-generate-001': 'veo-2.0-generate-001',
  'runway-gen3a-turbo': 'runway-gen3a-turbo',
  'runway-gen3a': 'runway-gen3a',
  'luma-dream-machine': 'luma-dream-machine',
  'sora-turbo': 'sora-turbo', // When available
} as const;

// Provider detection helper
export function getVideoProvider(modelId: VideoModelId): 'google' | 'runway' | 'luma' | 'openai' {
  if (modelId.startsWith('veo-')) return 'google';
  if (modelId.startsWith('runway-')) return 'runway';
  if (modelId.startsWith('luma-')) return 'luma';
  if (modelId.startsWith('sora-')) return 'openai';
  return 'google'; // Default
}
```

### Phase 2: Create Provider Abstraction (video-providers.ts)

```typescript
// New file: video-providers.ts

export interface VideoGenerationResult {
  uri: string;
  blobUrl: string;
  provider: string;
}

export interface VideoGenerationOptions {
  prompt: string;
  aspectRatio: string;
  styleImage?: { base64: string; mimeType: string };
  duration?: number;
}

// Provider implementations
export async function generateWithVeo(options: VideoGenerationOptions): Promise<VideoGenerationResult>;
export async function generateWithRunway(options: VideoGenerationOptions): Promise<VideoGenerationResult>;
export async function generateWithLuma(options: VideoGenerationOptions): Promise<VideoGenerationResult>;
export async function generateWithSora(options: VideoGenerationOptions): Promise<VideoGenerationResult>;

// Unified interface
export async function generateVideo(
  modelId: VideoModelId, 
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const provider = getVideoProvider(modelId);
  switch (provider) {
    case 'google': return generateWithVeo(options);
    case 'runway': return generateWithRunway(options);
    case 'luma': return generateWithLuma(options);
    case 'openai': return generateWithSora(options);
  }
}
```

### Phase 3: Environment Variables (.env.local)

```bash
# Existing
GEMINI_API_KEY=your_gemini_key

# New additions
RUNWAY_API_KEY=your_runway_key
LUMA_API_KEY=your_luma_key
OPENAI_API_KEY=your_openai_key # For Sora when available
```

### Phase 4: UI Updates (index.html)

Add new options to the video model dropdown:
```html
<select id="video-model" class="...">
  <optgroup label="Google Veo">
    <option value="veo-3.0-generate-001">Veo 3.0 (Recommended)</option>
    <option value="veo-2.0-generate-001">Veo 2.0 (Legacy)</option>
  </optgroup>
  <optgroup label="Runway">
    <option value="runway-gen3a-turbo">Gen-3 Alpha Turbo (Fast)</option>
    <option value="runway-gen3a">Gen-3 Alpha (Quality)</option>
  </optgroup>
  <optgroup label="Luma AI">
    <option value="luma-dream-machine">Dream Machine 1.6</option>
  </optgroup>
  <optgroup label="OpenAI" disabled>
    <option value="sora-turbo">Sora Turbo (Coming Soon)</option>
  </optgroup>
</select>
```

---

## 📋 Implementation Checklist

### Immediate Actions (Ready Now)
- [ ] Update `VIDEO_MODELS` in `store.ts` to add Veo 3.0
- [ ] Test Veo 3.0 model availability
- [ ] Add Runway API integration
- [ ] Add Luma AI integration
- [ ] Update `.env.local.example` with new API keys

### Short-term (This Week)
- [ ] Create `video-providers.ts` abstraction layer
- [ ] Add provider detection logic
- [ ] Update UI with model selector groups
- [ ] Add error handling for each provider
- [ ] Test all providers end-to-end

### Medium-term (When Available)
- [ ] Monitor Sora API availability
- [ ] Integrate Sora when API opens
- [ ] Add fallback logic between providers
- [ ] Add cost estimation UI

---

## 🎯 Recommended Strategy

### For Best Quality (Production)
**Primary:** Google Veo 3.0 → **Fallback:** Runway Gen-3 Alpha

### For Budget-Conscious Usage
**Primary:** Luma Dream Machine (free tier) → **Fallback:** Veo 2.0

### For Maximum Compatibility
Implement all four providers with automatic fallback chain:
1. Try primary provider
2. On failure, try next in priority
3. Log which provider succeeded

---

## 📞 API Key Sources

| Provider | Get API Key | Free Tier |
|----------|-------------|-----------|
| Google (Veo) | https://ai.google.dev | ✅ 50 videos/day |
| Runway | https://runwayml.com/api | ✅ 125 credits |
| Luma AI | https://lumalabs.ai/dream-machine/api | ✅ 30 videos/month |
| OpenAI (Sora) | https://platform.openai.com | ❌ Requires Plus/Pro |

---

**Document prepared for review. Awaiting approval to proceed with implementation.**
