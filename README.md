# zen0 - AI Chat Interface

*AI conversations with perfect memory*

## Overview

zen0 is an AI chatbot application with persistent memory, multi-provider support, and real-time streaming responses. Built with Next.js and designed for simplicity - no authentication required, just bring your own API keys.

## Features

- 🧠 **Persistent Memory** - Conversations with long-term memory using Mem0
- 🔄 **Multi-Provider Support** - OpenAI, Anthropic, Groq, and Google Gemini
- ⚡ **Real-time Streaming** - Server-sent events for blazing fast responses
- 🔑 **Bring Your Own Keys** - No sign-up required, use your own API keys
- 💾 **Local Storage** - Chat history saved in your browser
- 🎨 **Swiss Design** - Clean, minimalist interface

## Quick Start

### 1. Install Dependencies
\`\`\`bash
pnpm install
\`\`\`

### 2. Set Up Environment Variables (Optional)
Copy `.env.example` to `.env` for server-side API keys:

\`\`\`bash
cp .env.example .env
\`\`\`

**All API keys can be managed in the browser - no server setup required!**

### 3. Run Development Server
\`\`\`bash
pnpm dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to start chatting.

## How It Works

1. **Visit the app** - No sign-up required
2. **Add your API keys** - Configure providers in the browser
3. **Start chatting** - Create conversations with AI models
4. **Everything is local** - Chat history stored in your browser

## Supported Providers

- **Groq** - Fast inference with Llama models
- **OpenAI** - GPT-3.5, GPT-4, and latest models
- **Anthropic** - Claude models
- **Google Gemini** - Gemini Pro and other models
- **Mem0** - Enhanced memory for conversations (optional)

## API Keys Setup

All API keys are managed in the browser. Get your keys from:

- **Groq**: [console.groq.com](https://console.groq.com)
- **OpenAI**: [platform.openai.com](https://platform.openai.com)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com)
- **Google AI**: [makersuite.google.com](https://makersuite.google.com)
- **Mem0**: [mem0.ai](https://mem0.ai) (optional)

## Architecture

- **Frontend**: Next.js 15 with App Router
- **Storage**: Browser localStorage (no database required)
- **AI Providers**: Direct API integration
- **Memory**: Optional Mem0 integration
- **Styling**: Tailwind CSS with Swiss design principles

## Privacy

- No user accounts or authentication
- All data stored locally in your browser
- API keys never leave your device
- No server-side data collection

## Development

The app is designed to work entirely client-side with optional server-side streaming for better performance. All user data remains local.
