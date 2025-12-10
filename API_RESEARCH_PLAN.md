# Video Generation API Research & Integration Plan

## Research Division Strategy

This research is divided into three sections, each handled by a dedicated research agent:

### **Agent 1: Google Veo 3.2 & Runway XL** (Section 1/3)
### **Agent 2: OpenAI Sora 3** (Section 2/3)  
### **Agent 3: Free/Low-Cost Alternative** (Section 3/3)

---

## SECTION 1: Google Veo 3.2 & Runway XL
**Research Agent: Agent 1**

### Google Veo 3.2

#### Official Documentation Sources:
- **Primary**: https://ai.google.dev/api/rest
- **SDK Docs**: https://ai.google.dev/api/nodejs
- **Model Reference**: https://ai.google.dev/models/generative-ai/veo

#### Key API Details:
- **Current Model in Code**: `veo-2.0-generate-001`
- **Target Model**: `veo-3.2-generate-001` (or latest)
- **SDK**: `@google/genai` (already installed)
- **Endpoint**: `ai.models.generateVideos()`
- **Authentication**: Gemini API Key (already configured)

#### API Structure:
```typescript
await ai.models.generateVideos({
  model: 'veo-3.2-generate-001', // or latest version
  prompt: string,
  image?: { imageBytes: string; mimeType: string }, // Optional reference image
  config: {
    numberOfVideos: 1,
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5',
    // Additional params may include:
    // - duration (seconds)
    // - style (if available)
    // - seed (for reproducibility)
  }
})
```

#### Implementation Plan:
1. **Update Model Registry** (`state/store.ts`):
   - Add `veo-3.2-generate-001` to `VIDEO_MODELS`
   - Update `describeVideoModel()` function
   - Set as default or add as option

2. **Verify API Availability**:
   - Check if Veo 3.2 is available in current API
   - Test with existing API key
   - Handle version fallback if 3.2 not available

3. **Enhance Video Generation** (`index.tsx`):
   - Update `generateVideoWithVeo()` to support new model
   - Add any new parameters (duration, style, etc.)
   - Maintain backward compatibility with Veo 2.0

#### Known Limitations:
- Veo 3.2 may have different rate limits
- May require updated API key permissions
- Video length constraints may differ

---

### Runway XL

#### Official Documentation Sources:
- **API Docs**: https://docs.runwayml.com/api
- **Authentication**: https://docs.runwayml.com/api/authentication
- **Video Generation**: https://docs.runwayml.com/api/video-generation

#### Key API Details:
- **Base URL**: `https://api.runwayml.com/v1`
- **Authentication**: API Key (Bearer token)
- **Model**: `gen3a_turbo` or `gen3a_xl` (latest)
- **SDK**: Official SDK or REST API

#### API Structure (REST):
```typescript
// POST https://api.runwayml.com/v1/image-to-video
// Headers: { Authorization: `Bearer ${RUNWAY_API_KEY}` }
{
  "image": "base64_encoded_image", // or URL
  "prompt": "text prompt",
  "duration": 5, // seconds
  "ratio": "16:9",
  "watermark": false
}

// Response includes operation ID for polling
// Poll: GET https://api.runwayml.com/v1/operations/{operation_id}
```

#### Implementation Plan:
1. **Add Runway SDK/Client**:
   - Install `@runwayml/sdk` if available, or use fetch/axios
   - Create `generateVideoWithRunway()` function
   - Implement async operation polling

2. **Environment Configuration**:
   - Add `RUNWAY_API_KEY` to `.env.local.example`
   - Update API key check logic

3. **Integration Points**:
   - Add Runway XL to `VIDEO_MODELS` in `store.ts`
   - Add to video model selector in UI
   - Implement in `renderSingleScene()` with fallback logic

4. **Error Handling**:
   - Handle Runway-specific error codes
   - Implement retry logic for rate limits
   - Support both image-to-video and text-to-video

#### Known Limitations:
- Runway requires separate API key
- May have different pricing structure
- Operation polling required (similar to Veo)

---

## SECTION 2: OpenAI Sora 3
**Research Agent: Agent 2**

### OpenAI Sora 3

#### Official Documentation Sources:
- **API Reference**: https://platform.openai.com/docs/api-reference
- **Sora Documentation**: https://platform.openai.com/docs/guides/video
- **Authentication**: https://platform.openai.com/docs/api-reference/authentication

#### Key API Details:
- **Base URL**: `https://api.openai.com/v1`
- **Authentication**: Bearer token (OpenAI API Key)
- **Model**: `sora-3` or `sora-3.0` (check latest naming)
- **SDK**: `openai` npm package

#### API Structure:
```typescript
// Using OpenAI SDK
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.videos.create({
  model: 'sora-3', // or latest version name
  prompt: 'text prompt',
  duration: 5, // seconds
  aspect_ratio: '16:9',
  // Additional params may include:
  // - seed
  // - style
  // - quality
});

// Response includes video URL or file object
```

#### Implementation Plan:
1. **Install OpenAI SDK**:
   ```bash
   npm install openai
   ```

2. **Add Sora to Model Registry**:
   - Add `sora-3` to `VIDEO_MODELS` in `store.ts`
   - Update `describeVideoModel()` function
   - Add type definitions

3. **Create Sora Integration**:
   - Create `generateVideoWithSora()` function
   - Handle OpenAI-specific error responses
   - Implement video download/URL handling

4. **Environment Setup**:
   - Add `OPENAI_API_KEY` to `.env.local.example`
   - Update API key validation

5. **UI Integration**:
   - Add Sora option to video model dropdown
   - Update model descriptions

#### Known Limitations:
- Requires OpenAI API key (separate from Gemini)
- May have different rate limits and pricing
- Video generation may be synchronous or async (check docs)
- May require different video format handling

#### Status Check:
- **Note**: Sora 3 may still be in preview/limited access
- Verify availability in OpenAI API
- Check for waitlist or access requirements

---

## SECTION 3: High-Quality Free/Low-Cost Alternative
**Research Agent: Agent 3**

### Recommended Option: Stability AI (Stable Video Diffusion)

#### Official Documentation Sources:
- **API Docs**: https://platform.stability.ai/docs/api-reference
- **Video Generation**: https://platform.stability.ai/docs/api-reference#tag/Video
- **Authentication**: https://platform.stability.ai/docs/getting-started/authentication

#### Key API Details:
- **Base URL**: `https://api.stability.ai/v2beta`
- **Authentication**: API Key (Bearer token)
- **Model**: `stable-video-diffusion-xt-1.1` or latest
- **Free Tier**: Limited free credits available
- **SDK**: REST API (fetch/axios)

#### API Structure:
```typescript
// POST https://api.stability.ai/v2beta/video/generate
// Headers: { Authorization: `Bearer ${STABILITY_API_KEY}` }
{
  "image": "base64_encoded_image", // Required - image-to-video
  "seed": 0,
  "cfg_scale": 1.8,
  "motion_bucket_id": 127
}

// Response includes video URL or base64
// May require polling for async operations
```

#### Alternative Options Considered:

1. **Hugging Face Inference API**
   - **Docs**: https://huggingface.co/docs/api-inference
   - **Model**: ModelScope, AnimateDiff
   - **Pros**: Free tier, multiple models
   - **Cons**: Lower quality, rate limits

2. **Replicate API**
   - **Docs**: https://replicate.com/docs
   - **Model**: Various video models
   - **Pros**: Easy integration, pay-as-you-go
   - **Cons**: Costs per generation

3. **Luma AI Dream Machine**
   - **Docs**: https://docs.lumalabs.ai
   - **Pros**: High quality, free tier
   - **Cons**: May have limited API access

#### Implementation Plan (Stability AI):
1. **Add Stability Integration**:
   - Create `generateVideoWithStability()` function
   - Handle image-to-video conversion (required)
   - Implement async operation polling if needed

2. **Environment Setup**:
   - Add `STABILITY_API_KEY` to `.env.local.example`
   - Document free tier limits

3. **Image Generation First**:
   - Since Stability requires image input, generate image first using Imagen 3
   - Or use existing style image from project state
   - Pass to Stability API

4. **Add to Model Registry**:
   - Add `stability-video-xt-1.1` to `VIDEO_MODELS`
   - Update UI with model description

5. **Cost Optimization**:
   - Implement fallback chain: Veo → Runway → Stability
   - Track API usage per model
   - Add usage indicators in UI

#### Known Limitations:
- Stability requires image input (not pure text-to-video)
- Free tier has strict limits
- May have lower quality than premium options
- Video length may be limited

---

## Integration Architecture

### Unified Video Generation Interface

```typescript
interface VideoGenerationConfig {
  prompt: string;
  aspectRatio: string;
  styleImage?: { imageBytes: string; mimeType: string };
  duration?: number;
}

interface VideoGenerationResult {
  uri?: string; // For Veo
  url?: string; // For others
  blobUrl: string; // Local blob URL
  model: VideoModelId;
}

async function generateVideo(
  model: VideoModelId,
  config: VideoGenerationConfig
): Promise<VideoGenerationResult> {
  switch (model) {
    case 'veo-3.2-generate-001':
      return generateVideoWithVeo(config);
    case 'runway-xl':
      return generateVideoWithRunway(config);
    case 'sora-3':
      return generateVideoWithSora(config);
    case 'stability-video':
      return generateVideoWithStability(config);
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}
```

### Model Selection Strategy

1. **Primary**: User-selected model from dropdown
2. **Fallback Chain**: If primary fails, try alternatives
3. **Cost-Aware**: Prefer free/low-cost when quality acceptable
4. **Quality-Aware**: Use premium models for critical scenes

---

## Implementation Priority

### Phase 1: Research & Documentation ✅
- [x] Research all four APIs
- [x] Document official sources
- [x] Create integration plans

### Phase 2: Veo 3.2 Integration
- [ ] Update model registry
- [ ] Test API availability
- [ ] Update generation function
- [ ] Test with existing infrastructure

### Phase 3: Runway XL Integration
- [ ] Set up API key management
- [ ] Implement Runway client
- [ ] Add to model selector
- [ ] Test end-to-end

### Phase 4: Sora 3 Integration
- [ ] Install OpenAI SDK
- [ ] Implement Sora client
- [ ] Add to model selector
- [ ] Test with OpenAI API

### Phase 5: Stability AI Integration
- [ ] Implement Stability client
- [ ] Add image-to-video pipeline
- [ ] Add to model selector
- [ ] Test free tier limits

### Phase 6: Unified Interface & Testing
- [ ] Create unified generation interface
- [ ] Implement fallback logic
- [ ] Add error handling
- [ ] Test all models
- [ ] Update UI with all options

---

## Next Steps for Approval

1. **Review Research**: Verify API documentation sources are correct
2. **Approve Model Selection**: Confirm Sora 3 and Stability AI choices
3. **Approve Implementation Order**: Confirm priority sequence
4. **Approve Architecture**: Confirm unified interface approach

Once approved, implementation will proceed in parallel across all three research sections.
