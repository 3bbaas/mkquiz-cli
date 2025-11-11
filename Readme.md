# mkquiz CLI

A command-line tool for managing quiz content for static quiz websites. Handles HTML templates, quiz JSON files, and metadata tracking.

## Features

- Interactive CLI with intuitive prompts
- Web-based GUI for browser management
- **AI-Powered PDF Extraction** - Convert PDF quizzes to JSON using Gemini AI
- Automatic math formula conversion to KaTeX
- Comprehensive logging and error handling
- Shell autocomplete support (bash, zsh, PowerShell)
- Docker deployment support
- TypeScript with strict type safety

## Installation

```bash
npm install -g @3bbas/mkquiz
```

## Quick Start

```bash
# Configure your project
mkquiz config

# Add a new quiz
mkquiz add

# Remove quizzes
mkquiz remove
```

## Commands

| Command      | Description                          |
|--------------|--------------------------------------|
| `config`     | Configure project paths              |
| `add`        | Add a new quiz                       |
| `remove`     | Remove existing quizzes              |
| `completion` | Generate shell completion script     |

## Web GUI

Start the web server to manage quizzes through your browser:

```bash
npm run server
```

Access the GUI at `http://localhost:3000`

### PDF to Quiz (AI-Powered)

Upload a PDF file containing quiz questions and let Gemini AI automatically extract and convert them:

1. Set your Gemini API key (get it free from [Google AI Studio](https://makersuite.google.com/app/apikey))
2. Upload your PDF file
3. AI extracts questions and converts math formulas to KaTeX
4. Quiz is automatically created and added to your project

Set API key via environment variable:
```bash
export GEMINI_API_KEY=your_key_here
npm run server
```

## Docker

Deploy using Docker:

```bash
docker-compose up -d
```

Or build and run manually:

```bash
docker build -t mkquiz .
docker run -p 3000:3000 -v /path/to/project:/quiz-project:ro mkquiz
```

## License

ISC

## Author

**3bbas** - [GitHub](https://github.com/3bbaas)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues or questions, please [open an issue](https://github.com/3bbaas/mkquiz-cli/issues) on GitHub.

## Documentation

For detailed documentation, see [docs.md](./docs.md).
