# zen0 - AI Chat with Blazing Fast Responses

A modern AI chatbot application that delivers blazing fast responses using Groq's lightning-fast inference technology. All data is stored locally in your browser's localStorage for complete privacy.

## Features

- **Blazing Fast Responses**: Powered by Groq's ultra-fast inference for near-instantaneous AI responses
- **Local Storage**: All conversations, messages, and settings are stored locally in your browser
- **Multiple Groq Models**: Access to all Llama, DeepSeek, and other models available through Groq
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

3. **Set up Groq API key**
   - Navigate to the chat page
   - Click "API Settings" to configure your Groq API key
   - Get your API key from [Groq Console](https://console.groq.com/keys)

4. **Start chatting**
   - Create a new conversation
   - Experience blazing fast responses with Groq-powered models
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
- **API Routes**: Simplified endpoints for Groq API communication
- **BYOK Setup**: Groq API key configuration interface

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