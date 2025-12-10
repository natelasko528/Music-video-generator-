#!/bin/bash

echo "=========================================="
echo "  Getting Replicate API Key (FREE!)"
echo "=========================================="
echo ""
echo "Step 1: Opening Replicate website..."
echo ""

# Try to open the browser
if command -v xdg-open > /dev/null; then
    xdg-open "https://replicate.com/account/api-tokens" 2>/dev/null &
elif command -v open > /dev/null; then
    open "https://replicate.com/account/api-tokens" 2>/dev/null &
else
    echo "Please manually visit: https://replicate.com/account/api-tokens"
fi

echo ""
echo "Step 2: Sign up or log in to Replicate (FREE account!)"
echo "Step 3: Go to Account → API Tokens"
echo "Step 4: Create a new token (or use existing)"
echo "Step 5: Copy your API token"
echo ""
read -p "Paste your Replicate API token here: " api_key

if [ -z "$api_key" ]; then
    echo "No API key provided. Exiting."
    exit 1
fi

# Update .env.local
if [ -f .env.local ]; then
    # Check if REPLICATE_API_KEY already exists
    if grep -q "REPLICATE_API_KEY=" .env.local; then
        # Replace existing key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/REPLICATE_API_KEY=.*/REPLICATE_API_KEY=$api_key/" .env.local
        else
            sed -i "s/REPLICATE_API_KEY=.*/REPLICATE_API_KEY=$api_key/" .env.local
        fi
    else
        # Add new key
        echo "REPLICATE_API_KEY=$api_key" >> .env.local
    fi
    echo ""
    echo "✅ API key added to .env.local!"
    echo ""
    echo "You can now run: npm run dev"
else
    echo ""
    echo "⚠️  .env.local file not found. Creating it..."
    cp .env.local.example .env.local
    if grep -q "REPLICATE_API_KEY=" .env.local; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/REPLICATE_API_KEY=.*/REPLICATE_API_KEY=$api_key/" .env.local
        else
            sed -i "s/REPLICATE_API_KEY=.*/REPLICATE_API_KEY=$api_key/" .env.local
        fi
    else
        echo "REPLICATE_API_KEY=$api_key" >> .env.local
    fi
    echo "✅ .env.local created with your API key!"
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
