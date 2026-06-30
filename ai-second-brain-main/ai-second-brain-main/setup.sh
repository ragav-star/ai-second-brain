#!/bin/bash

echo ""
echo "🧠 AI Second Brain — Setup Script"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. You have $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "📋 Created .env file from template"
fi

# Create data directory
mkdir -p data
echo "✅ Created data/ directory"

# Check for API key
if grep -q "your_anthropic_api_key_here" .env; then
  echo ""
  echo "⚠️  ACTION REQUIRED: Add your Anthropic API key to .env"
  echo "   Get your key at: https://console.anthropic.com"
  echo "   Edit .env and set: ANTHROPIC_API_KEY=sk-ant-..."
  echo ""
fi

# Check Docker for ChromaDB
echo ""
if command -v docker &> /dev/null; then
  echo "✅ Docker detected — you can run ChromaDB for vector search:"
  echo "   docker run -d -p 8000:8000 chromadb/chroma"
  echo "   (Optional but recommended for better search quality)"
else
  echo "ℹ️  Docker not found. ChromaDB vector search will be disabled."
  echo "   The brain still works with SQLite keyword search!"
  echo "   Install Docker later for better AI search."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env and add your ANTHROPIC_API_KEY"
echo "   2. Run: npm start"
echo "   3. Open: http://localhost:3001"
echo "   4. Install Chrome Extension:"
echo "      - Open chrome://extensions"
echo "      - Enable Developer mode"
echo "      - Click 'Load unpacked'"
echo "      - Select the chrome-extension/ folder"
echo ""
echo "🚀 Then browse Stack Overflow, GitHub, blogs..."
echo "   Your brain will capture everything automatically!"
echo ""
