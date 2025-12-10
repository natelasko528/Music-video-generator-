# How to Get Your Free Stability AI API Key

## Quick Steps:

1. **Visit**: https://platform.stability.ai
2. **Click**: "Sign Up" or "Get Started"
3. **Create Account**: Use email or Google/GitHub OAuth
4. **Navigate to**: Account Settings → API Keys
5. **Create New Key**: Click "Create API Key"
6. **Copy the Key**: It will look like: `sk-xxxxxxxxxxxxxxxxxxxxx`
7. **Add to .env.local**: Replace `your_stability_api_key_here` with your actual key

## Free Tier Details:

- **25 credits** free when you sign up
- **Additional credits** available monthly
- Perfect for testing and small projects
- No credit card required for free tier

## Alternative: Use This Script

Run this command to open the signup page:
```bash
# On Linux/Mac:
xdg-open https://platform.stability.ai/account/keys 2>/dev/null || open https://platform.stability.ai/account/keys 2>/dev/null || echo "Please visit: https://platform.stability.ai/account/keys"

# Or just visit in your browser:
# https://platform.stability.ai/account/keys
```

## After Getting Your Key:

1. Open `.env.local` file
2. Find the line: `STABILITY_API_KEY=your_stability_api_key_here`
3. Replace `your_stability_api_key_here` with your actual key
4. Save the file
5. Restart your dev server if running

## Testing Your Key:

Once you have the key, the app will automatically use Stability AI for video generation!
