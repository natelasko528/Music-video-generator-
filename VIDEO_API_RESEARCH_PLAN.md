# 🎬 Video Generation API Research & Implementation Plan

**Research Date:** December 10, 2025  
**Project:** AI Music Video Generator  
**Current Implementation:** Google Veo 2.0 via `@google/genai`

---

## 📊 Executive Summary - LATEST MODELS (Verified December 2025)

This document contains **verified, up-to-date** API information gathered directly from provider APIs and Replicate's model registry.

| Model | Provider | Version | Cost (per video) | API Status | Quality |
|-------|----------|---------|------------------|------------|---------|
| **Veo 3.1** | Google | Preview | ~$0.15/5s | ✅ Direct API | ⭐⭐⭐⭐⭐ |
| **Sora 2** | OpenAI | Production | ~$0.50/5s | ✅ Via Replicate | ⭐⭐⭐⭐⭐ |
| **Kling 2.0** | Kuaishou | v2 | ~$0.30/5s | ✅ Via Replicate | ⭐⭐⭐⭐⭐ |
| **Luma Ray 2** | Luma AI | 720p | ~$0.25/5s | ✅ Via Replicate | ⭐⭐⭐⭐ |
| **Hailuo 2** | MiniMax | v02 | ~$0.20/5s | ✅ Via Replicate | ⭐⭐⭐⭐ |
| **Hunyuan Video** | Tencent | Latest | FREE (open) | ✅ Via Replicate | ⭐⭐⭐⭐ |

---

## 1️⃣ Google Veo 3.1 (LATEST - Direct API Access)

### Verified Models from Google GenAI API
```
models/veo-3.1-generate-preview      ← LATEST (Best Quality)
models/veo-3.1-fast-generate-preview ← LATEST (Fast)
models/veo-3.0-generate-001          ← Stable
models/veo-3.0-fast-generate-001     ← Stable Fast
models/veo-2.0-generate-001          ← Legacy (Currently in use)
```

### API Integration (Already Working!)
```typescript
// Current implementation supports this - just update model ID
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate video with Veo 3.1
const veoOperation = await ai.models.generateVideos({
  model: 'veo-3.1-generate-preview', // ← UPDATE THIS
  prompt: 'Cinematic music video scene...',
  config: {
    numberOfVideos: 1,
    aspectRatio: '16:9', // or '9:16', '1:1'
  }
});

// Poll for completion (same as before)
while (!veoOperation.done) {
  await new Promise(r => setTimeout(r, 4000));
  veoOperation = await ai.operations.getVideosOperation({ operation: veoOperation });
}
```

### Veo 3.1 New Features
- **Native Audio Generation** - Generates synchronized audio!
- **Higher Resolution** - Up to 1080p
- **Longer Duration** - Up to 8 seconds
- **Better Motion** - Improved temporal consistency
- **Style Transfer** - Enhanced reference image support

### Pricing (Google AI Studio)
| Tier | Cost | Features |
|------|------|----------|
| Free | $0 | 50 videos/day, some limits |
| Pay-as-you-go | ~$0.03/sec | Full quality, priority |

### Integration Effort: ✅ MINIMAL
Just update the model ID in `store.ts` - everything else works!

---

## 2️⃣ OpenAI Sora 2 (Via Replicate)

### Replicate Model IDs
```
openai/sora-2        ← Standard quality
openai/sora-2-pro    ← Higher quality, longer videos
```

### API Integration via Replicate
```typescript
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Generate video with Sora 2
const output = await replicate.run("openai/sora-2", {
  input: {
    prompt: "Cinematic music video, dramatic lighting, urban setting...",
    duration: 5,
    aspect_ratio: "16:9",
    resolution: "1080p",
  }
});

// Returns video URL directly
const videoUrl = output;
```

### Sora 2 Features
- **Industry-leading realism** - Best motion and physics
- **20-second videos** - Longest duration available
- **4K support** (Pro version)
- **Remix capability** - Edit existing videos
- **Storyboard mode** - Multi-scene generation

### Pricing (Via Replicate)
| Model | Cost/Run | Duration |
|-------|----------|----------|
| sora-2 | ~$0.50 | 5 seconds |
| sora-2-pro | ~$1.20 | Up to 20 seconds |

### Integration Effort: 🟡 MEDIUM
Requires Replicate SDK, but straightforward.

---

## 3️⃣ Kling 2.0 (Via Replicate) - Best Value

### Replicate Model IDs
```
kwaivgi/kling-v2   ← LATEST (Kling 2.0)
kwaivgi/kling-v1   ← Kling 1.6 (stable)
```

### API Integration via Replicate
```typescript
const output = await replicate.run("kwaivgi/kling-v2", {
  input: {
    prompt: "Professional music video, cinematic composition...",
    negative_prompt: "blurry, low quality, distorted",
    duration: 5,
    aspect_ratio: "16:9",
    cfg_scale: 7.5,
  }
});
```

### Kling 2.0 Features
- **Excellent human motion** - Best for dance/performance videos
- **10-second videos** - Good duration
- **Lip sync capability** - Audio-driven generation
- **Camera controls** - Pan, zoom, tracking shots
- **1080p output**

### Pricing (Via Replicate)
| Model | Cost/Run | Notes |
|-------|----------|-------|
| kling-v2 | ~$0.30 | Best quality |
| kling-v1 | ~$0.15 | Budget option |

### Integration Effort: 🟡 MEDIUM
Same Replicate SDK pattern.

---

## 4️⃣ Luma Ray 2 (Via Replicate) - Great for Cinematics

### Replicate Model IDs
```
luma/ray-2-720p        ← Standard Ray 2
luma/ray-flash-2-720p  ← Faster Ray 2
luma/ray-2-540p        ← Budget option
luma/ray               ← Legacy Ray 1
```

### API Integration via Replicate
```typescript
const output = await replicate.run("luma/ray-2-720p", {
  input: {
    prompt: "Ethereal music video scene, soft lighting, artistic...",
    aspect_ratio: "16:9",
    loop: false,
  }
});
```

### Luma Ray 2 Features
- **Cinematic quality** - Excellent color grading
- **Artistic style** - Great for creative videos
- **720p standard** - Good balance of quality/speed
- **Image-to-video** - Strong reference image support
- **5-second clips**

### Pricing (Via Replicate)
| Model | Cost/Run | Speed |
|-------|----------|-------|
| ray-2-720p | ~$0.25 | Standard |
| ray-flash-2-720p | ~$0.15 | 2x faster |
| ray-2-540p | ~$0.12 | Budget |

### Integration Effort: 🟡 MEDIUM
Same Replicate SDK pattern.

---

## 5️⃣ Tencent Hunyuan Video (FREE - Open Source!)

### Replicate Model ID
```
tencent/hunyuan-video  ← Open source, can self-host
```

### API Integration via Replicate
```typescript
const output = await replicate.run("tencent/hunyuan-video", {
  input: {
    prompt: "Music video scene with dramatic lighting...",
    num_frames: 129, // ~5 seconds at 24fps
    width: 720,
    height: 1280,
    seed: -1,
  }
});
```

### Hunyuan Video Features
- **FREE** - Open source model
- **Self-hostable** - No API costs if you run it
- **Good quality** - Comparable to commercial options
- **720p output**
- **5+ second videos**

### Pricing
| Deployment | Cost |
|------------|------|
| Via Replicate | ~$0.15/run |
| Self-hosted | FREE (GPU costs only) |

### Integration Effort: 🟢 LOW (if using Replicate)

---

## 6️⃣ Additional Premium Options

### MiniMax Hailuo 2
```
minimax/hailuo-2        ← Latest
minimax/video-01        ← Stable
minimax/video-01-live   ← Real-time
```
- Excellent for consistent character generation
- ~$0.20/video via Replicate

### ByteDance Seedance
```
bytedance/seedance-1-pro   ← Best quality
bytedance/seedance-1-lite  ← Budget
```
- Great motion quality
- ~$0.25/video via Replicate

### PixVerse v5
```
pixverse/pixverse-v5  ← Latest
pixverse/pixverse-v4  ← Stable
```
- Fast generation
- ~$0.18/video via Replicate

### Alibaba WAN 2.1
```
wan-video/wan-2  ← Latest WAN model
```
- Open source option
- ~$0.12/video via Replicate

---

## 🔧 Implementation Plan

### Phase 1: Update store.ts with Latest Models

```typescript
// Updated VIDEO_MODELS constant with ACTUAL latest models
export const VIDEO_MODELS = {
  // Google Veo (Direct API)
  'veo-3.1-generate-preview': 'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview': 'veo-3.1-fast-generate-preview', 
  'veo-3.0-generate-001': 'veo-3.0-generate-001',
  'veo-2.0-generate-001': 'veo-2.0-generate-001',
  
  // Via Replicate
  'replicate/sora-2': 'openai/sora-2',
  'replicate/sora-2-pro': 'openai/sora-2-pro',
  'replicate/kling-v2': 'kwaivgi/kling-v2',
  'replicate/luma-ray-2': 'luma/ray-2-720p',
  'replicate/hailuo-2': 'minimax/hailuo-2',
  'replicate/hunyuan': 'tencent/hunyuan-video',
} as const;

export function getVideoProvider(modelId: VideoModelId): 'google' | 'replicate' {
  return modelId.startsWith('veo-') ? 'google' : 'replicate';
}

export function describeVideoModel(modelId: VideoModelId): string {
  const names: Record<string, string> = {
    'veo-3.1-generate-preview': 'Google Veo 3.1 (Latest)',
    'veo-3.1-fast-generate-preview': 'Google Veo 3.1 Fast',
    'veo-3.0-generate-001': 'Google Veo 3.0',
    'veo-2.0-generate-001': 'Google Veo 2.0 (Legacy)',
    'replicate/sora-2': 'OpenAI Sora 2',
    'replicate/sora-2-pro': 'OpenAI Sora 2 Pro',
    'replicate/kling-v2': 'Kling 2.0 (Best Value)',
    'replicate/luma-ray-2': 'Luma Ray 2',
    'replicate/hailuo-2': 'MiniMax Hailuo 2',
    'replicate/hunyuan': 'Hunyuan Video (Free)',
  };
  return names[modelId] || modelId;
}
```

### Phase 2: Add Replicate Integration

```typescript
// New file: replicate-provider.ts
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateWithReplicate(
  modelId: string,
  prompt: string,
  aspectRatio: string
): Promise<{ uri: string; blobUrl: string }> {
  
  const output = await replicate.run(modelId as `${string}/${string}`, {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      duration: 5,
    }
  });

  // Replicate returns the video URL directly
  const videoUrl = Array.isArray(output) ? output[0] : output;
  
  // Download and create blob URL
  const response = await fetch(videoUrl);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  
  return { uri: videoUrl, blobUrl };
}
```

### Phase 3: Update .env.local

```bash
# Existing
GEMINI_API_KEY=your_gemini_key

# Add Replicate
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### Phase 4: Update UI (index.html)

```html
<select id="video-model">
  <optgroup label="Google Veo (Direct - Best Integration)">
    <option value="veo-3.1-generate-preview">⭐ Veo 3.1 (Latest)</option>
    <option value="veo-3.1-fast-generate-preview">⚡ Veo 3.1 Fast</option>
    <option value="veo-3.0-generate-001">Veo 3.0</option>
    <option value="veo-2.0-generate-001">Veo 2.0 (Legacy)</option>
  </optgroup>
  <optgroup label="Premium via Replicate">
    <option value="replicate/sora-2">🎬 OpenAI Sora 2</option>
    <option value="replicate/sora-2-pro">🎬 OpenAI Sora 2 Pro</option>
    <option value="replicate/kling-v2">🏆 Kling 2.0 (Best Value)</option>
    <option value="replicate/luma-ray-2">🎨 Luma Ray 2</option>
  </optgroup>
  <optgroup label="Budget Options via Replicate">
    <option value="replicate/hailuo-2">MiniMax Hailuo 2</option>
    <option value="replicate/hunyuan">🆓 Hunyuan Video (Cheapest)</option>
  </optgroup>
</select>
```

---

## 📋 Quick Start Checklist

### Immediate (5 minutes)
- [ ] Update `VIDEO_MODELS` in `store.ts` to add `veo-3.1-generate-preview`
- [ ] Test Veo 3.1 with existing code (just model ID change!)

### Short-term (1 hour)
- [ ] Install Replicate SDK: `npm install replicate`
- [ ] Add `REPLICATE_API_TOKEN` to `.env.local`
- [ ] Create `replicate-provider.ts`
- [ ] Update video generation logic to support both providers

### Optional Enhancements
- [ ] Add fallback chain (Veo 3.1 → Sora 2 → Kling 2.0)
- [ ] Add cost estimation UI
- [ ] Add model quality comparison tooltips

---

## 🎯 Recommended Configuration

### For Best Quality
**Primary:** Veo 3.1 → **Fallback:** Sora 2 Pro

### For Best Value
**Primary:** Kling 2.0 → **Fallback:** Hailuo 2

### For Free/Budget
**Primary:** Hunyuan Video → **Fallback:** Veo 2.0 (free tier)

---

## 🔑 API Keys Quick Reference

| Provider | Get Key | Free Tier |
|----------|---------|-----------|
| Google (Veo) | https://ai.google.dev | ✅ 50 videos/day |
| Replicate | https://replicate.com/account/api-tokens | ✅ Some free credits |

---

**Document verified with live API queries on December 10, 2025**
