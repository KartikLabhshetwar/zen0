# zen0 - AI Chat Interface

*AI conversations with perfect memory*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/kartik-labhshetwars-projects/v0-ai-chat-interface)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/eF9GrgK7XHY)

## Overview

zen0 is an AI chatbot application with persistent memory, multi-provider support, and real-time streaming responses. Built with Next.js, Better Auth, and PostgreSQL.

## Features

- 🧠 **Persistent Memory** - Conversations with long-term memory using Mem0
- 🔄 **Multi-Provider Support** - OpenAI, Anthropic, Groq, and Google Gemini
- ⚡ **Real-time Streaming** - Server-sent events for blazing fast responses
- 🔐 **Google OAuth** - Secure authentication with Better Auth
- 💾 **Chat History** - Complete conversation persistence
- 🎨 **Swiss Design** - Clean, minimalist interface

## Quick Start

### 1. Install Dependencies
\`\`\`bash
pnpm install
\`\`\`

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your API keys:

\`\`\`bash
cp .env.example .env
\`\`\`

**Required:**
- `BETTER_AUTH_SECRET` - Generate with `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `DATABASE_URL` - PostgreSQL connection string from Neon
- `GROQ_API_KEY` - For AI chat functionality

**Optional:**
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` - For additional providers
- `MEM0_API_KEY` - For enhanced memory features

### 3. Set Up Database
\`\`\`bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push
\`\`\`

### 4. Run Development Server
\`\`\`bash
pnpm dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`
6. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

## Database Setup

This project uses PostgreSQL with Prisma. The schema includes:
- User authentication tables (Better Auth)
- Conversation and message storage
- Proper indexing for performance

## Architecture

- **Frontend**: Next.js 15 with App Router
- **Authentication**: Better Auth with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **AI Providers**: Groq, OpenAI, Anthropic, Google Gemini
- **Memory**: Mem0 for persistent conversation context
- **Styling**: Tailwind CSS with Swiss design principles

## Deployment

Your project is live at:
**[https://vercel.com/kartik-labhshetwars-projects/v0-ai-chat-interface](https://vercel.com/kartik-labhshetwars-projects/v0-ai-chat-interface)**

Continue building on:
**[https://v0.app/chat/projects/eF9GrgK7XHY](https://v0.app/chat/projects/eF9GrgK7XHY)**

## Troubleshooting

### Prisma Client Error
If you see `Cannot find module '.prisma/client/default'`:
\`\`\`bash
pnpm prisma generate
pnpm prisma db push
\`\`\`

### Authentication Issues
- Verify Google OAuth credentials in `.env`
- Check redirect URIs in Google Cloud Console
- Ensure `BETTER_AUTH_SECRET` is set

### Database Connection
- Verify `DATABASE_URL` is correct
- Ensure database is accessible
- Run `pnpm prisma db push` to sync schema
