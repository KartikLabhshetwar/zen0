# zen0 - AI Chat with Blazing Fast Responses

A modern AI chatbot application that delivers blazing fast responses using Groq's lightning-fast inference technology and enhanced with Mem0 AI Memory for intelligent, persistent conversations. All data is stored locally in your browser's localStorage for complete privacy.

## Features

- **Blazing Fast Responses**: Powered by Groq's ultra-fast inference for near-instantaneous AI responses
- **Mem0 AI Memory**: Advanced AI-powered memory system that learns from conversations and provides intelligent context
- **Local Storage**: All conversations, messages, and settings are stored locally in your browser
- **Multiple Groq Models**: Access to all Llama, DeepSeek, and other models available through Groq
- **Image Upload & OCR**: Upload images and extract text for context
- **Image Generation**: Generate images using DALL-E with `/generate` command
- **Intelligent Memory**: Mem0-powered memory system for conversation context and learning
- **Data Export/Import**: Backup and restore your conversations
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zen0-1
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up API keys**
   - Navigate to the chat page
   - Click "API Settings" to configure your API keys
   - **Groq API Key**: Get your key from [Groq Console](https://console.groq.com/keys)
   - **Mem0 API Key** (Optional): Get your key from [Mem0 Dashboard](https://app.mem0.ai/dashboard/api-keys) for advanced AI memory

4. **Start chatting**
   - Create a new conversation
   - Experience blazing fast responses with Groq-powered models
   - Enjoy intelligent memory with Mem0 AI Memory (if configured)
   - Upload images for context
   - Use `/generate [prompt]` for image creation

## Architecture

### Local Storage Structure
- `zen0-conversations`: List of all conversations
- `zen0-messages-{id}`: Messages for each conversation
- `zen0-settings`: User settings and API keys
- `zen0-memory`: Local memory system for context
- `mem0-batch`: Mem0 AI Memory batching for efficient storage

### Key Components
- **LocalStorageService**: Handles all data persistence
- **Mem0Service**: Manages AI memory operations for personal context
- **Chat Interface**: Main chat functionality with memory integration
- **API Routes**: Simplified endpoints for Groq API communication
- **BYOK Setup**: API key configuration for both Groq and Mem0

## Data Management

### Export Data
- Use the Data Manager to export all your conversations and settings
- Data is exported as a JSON file for backup

### Import Data
- Import previously exported data to restore conversations
- Useful for migrating between browsers or devices

### Clear Data
- Option to clear all local data if needed
- Use with caution as this action cannot be undone

## Groq API

### Models
- Access to all models available through Groq including:
  - Llama 3.1 (8B, 70B)
  - Llama 3 (8B, 70B)
  - Mixtral 8x7B
  - Gemma 2 9B
  - And more (fetched dynamically)

### Key Format
- Groq API keys start with `gsk_`
- Get your key from [Groq Console](https://console.groq.com/keys)

## Mem0 AI Memory

### Overview
Mem0 AI Memory provides intelligent, persistent memory across conversations. It learns from your interactions and provides relevant context for better, more personalized responses.

### Features
- **Personal Context Retrieval**: Finds relevant memories for personal questions and preferences
- **Persistent Learning**: Remembers user preferences, facts, and conversation patterns across sessions
- **Simple & Clean**: Straightforward memory operations without unnecessary complexity
- **Privacy-First**: All memory operations happen locally with optional cloud sync

### Setup
1. Get your Mem0 API key from [Mem0 Dashboard](https://app.mem0.ai/dashboard/api-keys)
2. Configure it in the API Settings section
3. Enable memory in your chat settings
4. Start chatting - Mem0 will automatically learn and provide context

### Key Format
- Mem0 API keys start with `m0-`
- Get your key from [Mem0 Dashboard](https://app.mem0.ai/dashboard/api-keys)

## Development

### Prerequisites
- Node.js 18+
- pnpm

### Commands
```bash
# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Lint
pnpm lint
```

### Project Structure
```
zen0-1/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── chat/              # Chat page
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # UI components
│   ├── byok-setup.tsx     # API key setup
│   └── header.tsx         # Header component
├── lib/                    # Utility libraries
│   ├── local-storage.ts   # Local storage service
│   └── utils.ts           # Utility functions
└── public/                 # Static assets
```

## Security & Privacy

- **No Server Storage**: All data stays in your browser
- **No Authentication**: No user accounts or external services
- **API Keys**: Stored locally, never sent to our servers
- **Privacy First**: Your conversations remain private and local

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Requires localStorage support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Check existing issues
- Create a new issue with detailed information
- Include browser version and error messages

---

**Note**: This application stores all data locally in your browser. Make sure to export your data regularly if you want to preserve conversations across browser sessions or device changes.