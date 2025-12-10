# Free Video Generation API Alternatives to Qwen (Outside Alibaba)

This document lists free alternatives to Qwen video generation API that you can use for your music video generator project.

## 🎬 Free Video Generation APIs

### 1. **RunwayML API** (Recommended)
- **Website**: https://runwayml.com
- **Free Tier**: Limited free credits per month
- **API Documentation**: https://docs.runwayml.com
- **Features**: 
  - Text-to-video generation
  - Image-to-video
  - High quality outputs
  - Good for music videos
- **How to get API key**: Sign up at runwayml.com → Go to API settings

### 2. **Stability AI (Stable Video Diffusion)**
- **Website**: https://platform.stability.ai
- **Free Tier**: Limited free credits
- **API Documentation**: https://platform.stability.ai/docs
- **Features**:
  - Open-source based
  - Text-to-video
  - Image-to-video
  - Good community support
- **How to get API key**: Sign up at platform.stability.ai → Get API key from dashboard

### 3. **Pika Labs API**
- **Website**: https://pika.art
- **Free Tier**: Limited free generations
- **Features**:
  - Text-to-video
  - Image-to-video
  - Good for creative content
- **How to get API key**: Sign up at pika.art → Check API section

### 4. **Luma AI (Dream Machine)**
- **Website**: https://lumalabs.ai
- **Free Tier**: Limited free generations
- **Features**:
  - High quality video generation
  - Text-to-video
  - Good cinematic quality
- **How to get API key**: Sign up at lumalabs.ai → API access

### 5. **Google Veo (via Gemini API)**
- **Note**: You're already using Gemini API for planning
- **API**: Available through Google's Generative AI
- **Free Tier**: Limited free tier available
- **Features**:
  - Integrated with your existing Gemini setup
  - High quality video generation
  - Good for professional content
- **How to get**: Already have Gemini API key? Check if Veo access is included

### 6. **Hugging Face Inference API**
- **Website**: https://huggingface.co
- **Free Tier**: Limited free inference
- **Models Available**:
  - ModelScope (text-to-video)
  - AnimateDiff
  - Other open-source video models
- **Features**:
  - Multiple model options
  - Open-source models
  - Community-driven
- **How to get API key**: Sign up at huggingface.co → Settings → Access Tokens

### 7. **Replicate API**
- **Website**: https://replicate.com
- **Free Tier**: Limited free credits
- **Features**:
  - Multiple video generation models
  - Pay-as-you-go pricing
  - Easy API integration
- **How to get API key**: Sign up at replicate.com → Account → API tokens

## 🔧 Implementation Tips

### For Your Project:
1. **Check your current Gemini API**: You might already have access to Veo through your Gemini API key
2. **Start with RunwayML or Stability AI**: These are the most mature options
3. **Consider Hugging Face**: If you want open-source models and more control

### API Integration Pattern:
Your current code structure in `index.tsx` uses:
- `generateVideoWithQwen()` function
- Similar pattern can be used for other APIs
- Just replace the API endpoint and request format

## 📝 Quick Comparison

| Service | Free Tier | Quality | Ease of Use | Best For |
|---------|-----------|---------|-------------|----------|
| RunwayML | Limited | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Professional videos |
| Stability AI | Limited | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Creative projects |
| Pika Labs | Limited | ⭐⭐⭐⭐ | ⭐⭐⭐ | Creative content |
| Luma AI | Limited | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Cinematic videos |
| Google Veo | Limited | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Professional (if available) |
| Hugging Face | Limited | ⭐⭐⭐ | ⭐⭐⭐ | Open-source enthusiasts |
| Replicate | Limited | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Easy integration |

## 🚀 Next Steps

1. **Sign up for 2-3 services** to compare quality
2. **Test with your music video prompts** to see which works best
3. **Update your code** to support the chosen API
4. **Add fallback logic** to try multiple APIs if one fails

## ⚠️ Important Notes

- **Rate Limits**: All free tiers have rate limits
- **Watermarks**: Some free tiers may add watermarks
- **Resolution**: Free tiers may have lower resolution limits
- **Terms of Service**: Check each service's ToS for commercial use

## 🔗 Quick Links

- RunwayML: https://runwayml.com
- Stability AI: https://platform.stability.ai
- Pika Labs: https://pika.art
- Luma AI: https://lumalabs.ai
- Hugging Face: https://huggingface.co
- Replicate: https://replicate.com
- Google AI Studio: https://ai.studio (for Gemini/Veo)

---

**Recommendation**: Start with **RunwayML** or **Stability AI** as they have the most mature APIs and good documentation for integration.
