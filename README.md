# zen0 - AI Chat with Local Storage

A modern AI chatbot application that stores all data locally in the browser's localStorage. No authentication, no database, no external dependencies - just pure local AI conversations.

## Features

- **Local Storage**: All conversations, messages, and settings are stored locally in your browser
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Groq, and Google Gemini
- **Image Upload & OCR**: Upload images and extract text for context
- **Image Generation**: Generate images using DALL-E with `/generate` command
- **Memory System**: Simple local memory system for conversation context
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
   - Click "API Settings" to configure your AI provider API keys
   - Supported providers: OpenAI, Anthropic, Groq, Google Gemini

4. **Start chatting**
   - Create a new conversation
   - Start chatting with AI models
   - Upload images for context
   - Use `/generate [prompt]` for image creation

## Architecture

### Local Storage Structure
- `zen0-conversations`: List of all conversations
- `zen0-messages-{id}`: Messages for each conversation
- `zen0-settings`: User settings and API keys
- `zen0-memory`: Simple memory system for context

### Key Components
- **LocalStorageService**: Handles all data persistence
- **Chat Interface**: Main chat functionality
- **API Routes**: Simplified endpoints for AI provider communication
- **BYOK Setup**: API key configuration interface

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

## API Providers

### OpenAI
- Models: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- Key format: `sk-...`

### Anthropic
- Models: Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus
- Key format: `sk-ant-...`

### Groq
- Models: Llama, DeepSeek, and more (fetched dynamically)
- Key format: `gsk_...`

### Google Gemini
- Models: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- Key format: `AIza...`

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
