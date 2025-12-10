# 🚀 Get Your Free Replicate API Key

## Quick Setup (2 minutes)

### Step 1: Sign Up for Replicate (FREE!)
1. Visit: **https://replicate.com/signin**
2. Click "Sign up" or use Google/GitHub to sign in
3. **No credit card required!** Free tier includes credits

### Step 2: Get Your API Token
1. After signing in, go to: **https://replicate.com/account/api-tokens**
2. Click **"Create token"**
3. Give it a name (e.g., "Music Video Generator")
4. **Copy the token** - it looks like: `r8_xxxxxxxxxxxxxxxxxxxxx`

### Step 3: Add to Your Project
1. Open the file: `.env.local`
2. Find the line: `REPLICATE_API_KEY=your_replicate_api_key_here`
3. Replace `your_replicate_api_key_here` with your actual token
4. Save the file

### Step 4: Run the App!
```bash
npm run dev
```

## Alternative: Use the Helper Script

Run this command in your terminal:
```bash
./get-api-key.sh
```

This will:
- Open the Replicate website in your browser
- Guide you through getting the key
- Automatically add it to `.env.local`

## Free Tier Details

✅ **Free credits** when you sign up  
✅ **No credit card required**  
✅ **Perfect for testing**  
✅ **Pay-as-you-go** after free credits

## Troubleshooting

**Can't find the API tokens page?**
- Make sure you're logged in
- Direct link: https://replicate.com/account/api-tokens

**Token not working?**
- Make sure there are no extra spaces
- Token should start with `r8_`
- Check that you copied the entire token

**Need help?**
- Replicate docs: https://replicate.com/docs
- Check the console for error messages

---

**That's it!** Once you add your API key, the app will automatically use Replicate's AnimateDiff model for free video generation! 🎬
