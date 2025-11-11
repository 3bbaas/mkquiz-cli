# mkquiz CLI - Complete Documentation

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commands](#commands)
- [Quiz JSON Format](#quiz-json-format)
- [Shell Autocompletion](#shell-autocompletion)
- [Web GUI](#web-gui)
- [Docker Deployment](#docker-deployment)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

mkquiz is a CLI tool designed to manage and migrate quiz content for static quiz websites. It provides:

- HTML template processing with placeholder replacement
- Quiz JSON file validation and management
- Website workspace structure automation
- Metadata tracking for all quizzes (paths, publish status, etc.)
- Web-based GUI for browser management
- Docker deployment support

### How It Works

1. **Configuration** - Set up project paths and template file
2. **Add Quizzes** - Process JSON files, generate HTML, update metadata
3. **Remove Quizzes** - Clean up quiz folders and metadata
4. **Web GUI** - Manage quizzes through a browser interface
5. **Docker** - Deploy as a containerized service

## Installation

### Global Installation

```bash
npm install -g @3bbas/mkquiz
```

### Local Development

```bash
git clone https://github.com/3bbaas/mkquiz-cli.git
cd mkquiz-cli
npm install
npm link
```

## Configuration

### Initial Setup

Run the configuration command to set up your project:

```bash
mkquiz config
```

You'll be prompted for:

- **Project Path**: Root directory of your quiz website
- **All Quizzes JSON Path**: JSON file containing metadata for all quizzes
- **Template File**: HTML template with placeholders

### Configuration File

Configuration is saved in `.mkquizrc` in your current directory:

```json
{
  "projectPath": "/path/to/quiz-project",
  "allQuizzezJsonPath": "/path/to/allQuizzes.json",
  "templateFile": "/path/to/template.html"
}
```

### Template Placeholders

Your HTML template should contain these placeholders:

- `{% Quiz Name %}` - Quiz title
- `{% Final/Midterm Sheet %}` - Quiz type
- `{% N %}` - Number of questions
- `{% T %}` - Quiz duration in minutes
- `{% JSON Path %}` - Relative path to quiz JSON file

## Commands

### config

Set up or update project configuration.

```bash
mkquiz config
```

**Interactive Prompts:**
- Project path
- All quizzes JSON path
- Template file path

### add

Add a new quiz to your project.

```bash
mkquiz add
```

**Interactive Prompts:**
- Quiz name
- Quiz type (Midterm/Final)
- Question type (MCQ/TF/QB)
- Year (1st/2nd/3rd/4th)
- Path to quiz JSON file
- Published status

**Process:**
1. Validates JSON structure
2. Counts questions automatically
3. Calculates duration: `(questionsCount / 10) * 4 + 1`
4. Creates folder: `/quizzes/{year}/{midterm|final}/{quiz_name}/`
5. Processes HTML template
6. Updates metadata JSON

### remove (rmv)

Remove quizzes from your project.

```bash
mkquiz remove
# or
mkquiz rmv
```

**Interactive Process:**
1. Select year
2. Choose quiz(zes) to remove (multi-select)
3. Confirm removal
4. Removes folders and updates metadata

### completion

Generate shell completion script.

```bash
mkquiz completion
```

## Quiz JSON Format

### Basic Structure

Quiz JSON files must contain an array of question objects:

```json
[
  {
    "id": 1,
    "question": "What is the capital of France?",
    "options": {
      "a": "London",
      "b": "Paris",
      "c": "Berlin",
      "d": "Madrid"
    },
    "answer": "b"
  },
  {
    "id": 2,
    "question": "2 + 2 = 4",
    "options": {
      "a": "True",
      "b": "False"
    },
    "answer": "a"
  }
]
```

### Required Fields

Each question must have:
- `id` (number): Unique identifier
- `question` (string): Question text
- `options` (object): Answer choices
- `answer` (string): Correct option key

### Question Types

**MCQ (Multiple Choice)**
- 2+ options
- Any option labels (a, b, c, d, etc.)

**TF (True/False)**
- Exactly 2 options
- Options must be "True" and "False"

**QB (Question Bank)**
- Combination of MCQ and TF questions
- Automatically detected based on options

## Shell Autocompletion

mkquiz supports autocompletion for bash, zsh, and PowerShell.

### Bash

Add to `~/.bashrc`:

```bash
source <(mkquiz completion)
```

Then reload:

```bash
source ~/.bashrc
```

### Zsh

Add to `~/.zshrc`:

```bash
eval "$(mkquiz completion)"
```

Then reload:

```bash
source ~/.zshrc
```

### PowerShell

Add to your PowerShell profile:

```powershell
mkquiz completion | Invoke-Expression
```

Find your profile location:

```powershell
echo $PROFILE
```

## Web GUI

### Starting the Server

Start the web server:

```bash
npm run server
```

Or after building:

```bash
node dist/server/index.js
```

The GUI will be available at `http://localhost:3000`

### Features

**Configuration Tab**
- Set project path
- Configure template file
- Set all quizzes JSON path

**Add Quiz Tab**
- Upload JSON files
- Select quiz options (type, year, etc.)
- Set publish status

**PDF to Quiz Tab** (AI-Powered)
- Upload PDF files containing quiz questions
- Automatic question extraction using Gemini AI
- Math formula conversion to KaTeX format
- Direct quiz creation from extracted content

**Manage Quizzes Tab**
- View all quizzes
- Filter by year
- Multi-select removal

### PDF to Quiz Feature

The PDF to Quiz feature uses Google's Gemini AI to automatically extract quiz questions from PDF files.

**Requirements:**
- Gemini API key (free from [Google AI Studio](https://makersuite.google.com/app/apikey))
- PDF file containing quiz questions

**How it works:**
1. Upload a PDF file in the "PDF to Quiz" tab
2. Provide your Gemini API key (or set it in environment variables)
3. AI analyzes the PDF and extracts questions
4. Mathematical formulas are converted to KaTeX format
5. Extracted questions are validated and formatted
6. Quiz is automatically created and added to your project

**Supported Question Formats:**
- Multiple choice questions (MCQ)
- True/False questions
- Mixed question types (QB - Question Bank)

**Math Formula Support:**
The AI automatically converts mathematical notation to KaTeX format:
- Fractions: `\frac{a}{b}`
- Superscripts: `x^2`
- Greek letters: `\alpha, \beta, \gamma`
- Square roots: `\sqrt{x}`
- Integrals: `\int_{a}^{b}`
- And more...

**Setting up API Key:**

Option 1: Environment Variable (Recommended)
```bash
# Set in .env file
GEMINI_API_KEY=your_key_here

# Or export directly
export GEMINI_API_KEY=your_key_here
npm run server
```

When set in `.env` file, the API key is automatically loaded and pre-filled in the form when you open the PDF to Quiz tab.

Option 2: Through GUI
- If not set in environment, you can enter API key directly in the PDF to Quiz form
- The form will show a status message indicating if the key was loaded from `.env`
- Key is used only for that request (not stored in database)

### API Endpoints

The server exposes these REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get current configuration |
| POST | `/api/config` | Save configuration |
| GET | `/api/quizzes` | Get all quizzes |
| GET | `/api/quizzes/:year` | Get quizzes by year |
| POST | `/api/quizzes` | Add new quiz |
| POST | `/api/quizzes/from-pdf` | Extract quiz from PDF using AI |
| GET | `/api/gemini-key` | Get Gemini API key status from environment |
| DELETE | `/api/quizzes` | Remove quizzes |
| GET | `/api/health` | Health check |

## Docker Deployment

### Quick Start

Using Docker Compose (recommended):

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your paths
nano .env

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Manual Docker

Build and run:

```bash
# Build image
docker build -t mkquiz .

# Run container
docker run -p 3000:3000 \
  -v /path/to/quiz-project:/quiz-project:ro \
  -v $(pwd)/.mkquizrc:/app/.mkquizrc \
  -v $(pwd)/logs:/app/logs \
  mkquiz
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QUIZ_PROJECT_PATH` | Path to quiz project directory | `./quiz-project` |
| `MKQUIZ_CONFIG` | Path to `.mkquizrc` file | `./.mkquizrc` |
| `LOG_LEVEL` | Logging level | `info` |
| `PORT` | Server port | `3000` |

### Docker Volumes

- `/quiz-project` - Quiz project directory (read-only recommended)
- `/app/.mkquizrc` - Configuration file
- `/app/logs` - Application logs
- `/app/uploads` - Temporary file uploads

### Health Check

The container includes a health check endpoint at `/api/health` that runs every 30 seconds.

```bash
# Check health
curl http://localhost:3000/api/health
```

## Logging

mkquiz uses Winston for comprehensive logging.

### Log Files

- **Error Log**: `logs/error.log` - Error messages only
- **Combined Log**: `logs/combined.log` - All log levels
- **Console Output**: Formatted colored output

### Log Levels

Set the log level using the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug mkquiz add
```

Available levels:
- `error` - Error messages only
- `warn` - Warnings and errors
- `info` - Informational messages (default)
- `debug` - Detailed debugging information

### Viewing Logs

```bash
# View all logs
cat logs/combined.log

# View errors only
cat logs/error.log

# Follow logs in real-time
tail -f logs/combined.log
```

## Error Handling

mkquiz provides meaningful error messages for common issues:

### Error Types

**ConfigError**
- Configuration file missing or invalid
- Required fields not set

**FileSystemError**
- File or directory operations failed
- Permission denied
- Path not found

**ValidationError**
- Input validation failed
- Invalid quiz JSON structure
- Missing required fields

**JsonError**
- JSON parsing failed
- Invalid JSON syntax
- Malformed structure

**TemplateError**
- Template processing failed
- Placeholder not found
- Invalid template syntax

**QuizOperationError**
- Quiz operation failed
- Duplicate quiz name
- Quiz not found

### Common Solutions

**Configuration not found**
```bash
mkquiz config
```

**Invalid JSON file**
- Ensure valid JSON syntax
- Check required fields: id, question, options, answer
- Verify all options are non-empty strings

**Template processing failed**
- Check template file path
- Ensure template contains valid HTML
- Verify placeholder syntax

**Permission denied**
- Check write permissions on project directory
- Verify configuration file location access
- Ensure logs directory is writable

## Project Structure

```
mkquiz/
├── src/
│   ├── commands/              # CLI command implementations
│   │   ├── config.ts          # Configuration setup
│   │   ├── add.ts             # Add quiz functionality
│   │   └── rmv.ts             # Remove quiz functionality
│   ├── server/                # Web server
│   │   ├── index.ts           # Server entry point
│   │   └── api.ts             # REST API endpoints
│   ├── lib/                   # Core library code
│   │   └── templateProcessor.ts  # Template processing
│   ├── utils/                 # Utility modules
│   │   ├── configManager.ts   # Config management
│   │   ├── errors.ts          # Custom error classes
│   │   ├── fileUtils.ts       # File operations
│   │   ├── jsonUtils.ts       # JSON operations
│   │   ├── logger.ts          # Winston logger
│   │   ├── pathUtils.ts       # Path utilities
│   │   └── validation.ts      # Input validation
│   ├── index.ts               # CLI entry point
│   └── types.ts               # TypeScript types
├── public/                    # Web GUI files
│   ├── index.html             # GUI interface
│   ├── styles.css             # Styling
│   └── app.js                 # Frontend JavaScript
├── dist/                      # Compiled JavaScript
├── logs/                      # Application logs
├── .dockerignore              # Docker ignore rules
├── .env.example               # Environment template
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose config
├── package.json               # NPM package config
├── tsconfig.json              # TypeScript config
└── README.md                  # Quick start guide
```

### Design Principles

- **Separation of Concerns**: Utility functions separated from CLI code
- **Strong TypeScript Typing**: Strict types, no 'any', proper interfaces
- **Error Handling**: Custom error classes with meaningful messages
- **Logging**: Comprehensive logging at multiple levels
- **Best Practices**: Modular architecture, JSDoc comments, clean code

## Development

### Setup

```bash
git clone https://github.com/3bbaas/mkquiz-cli.git
cd mkquiz-cli
npm install
```

### Scripts

```bash
# Run in development mode
npm start

# Build TypeScript to JavaScript
npm run build

# Watch mode - auto-rebuild
npm run dev

# Type check
npm run lint

# Start web server
npm run server
```

### Local Testing

```bash
# Test with ts-node
npm start

# Test compiled version
npm run build
node dist/index.js --help

# Install globally for testing
npm link
mkquiz --help
```

### Building

The project compiles TypeScript to CommonJS in the `dist/` directory:

```bash
npm run build
```

Output structure:
```
dist/
├── commands/
├── lib/
├── utils/
├── server/
└── index.js
```

## Troubleshooting

### Configuration Issues

**Problem**: Configuration not found

**Solution**:
```bash
mkquiz config
```

**Problem**: Invalid configuration

**Solution**:
- Check `.mkquizrc` file syntax
- Verify all paths are absolute
- Ensure required fields are set

### JSON Validation

**Problem**: Invalid JSON file

**Solution**:
- Validate JSON syntax (use JSONLint)
- Check required fields: id, question, options, answer
- Ensure all options are non-empty strings

**Problem**: Questions not counted correctly

**Solution**:
- Verify JSON is an array
- Check each question has valid structure
- Ensure no duplicate IDs

### Template Issues

**Problem**: Template processing failed

**Solution**:
- Verify template file path
- Check placeholder syntax: `{% Placeholder %}`
- Ensure template is valid HTML

**Problem**: Placeholders not replaced

**Solution**:
- Check exact placeholder syntax
- Verify template processor logic
- Review logs for errors

### File System

**Problem**: Permission denied

**Solution**:
```bash
# Check permissions
ls -la /path/to/project

# Fix permissions
chmod 755 /path/to/project
```

**Problem**: Path not found

**Solution**:
- Use absolute paths
- Verify directory exists
- Check for typos

### Web Server

**Problem**: Port already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port
PORT=3001 npm run server
```

**Problem**: Cannot upload files

**Solution**:
- Check uploads directory exists
- Verify write permissions
- Ensure sufficient disk space

### Docker

**Problem**: Container won't start

**Solution**:
```bash
# Check logs
docker-compose logs

# Rebuild image
docker-compose build --no-cache
docker-compose up -d
```

**Problem**: Volume mount issues

**Solution**:
- Use absolute paths in .env
- Check file/directory exists
- Verify permissions

## Examples

### Complete Workflow

```bash
# 1. Install
npm install -g @3bbas/mkquiz

# 2. Configure
mkquiz config
# Enter:
# - Project Path: /Users/name/quiz-website
# - All Quizzes JSON: /Users/name/quiz-website/allQuizzes.json
# - Template File: /Users/name/template.html

# 3. Add a quiz
mkquiz add
# Enter:
# - Quiz name: Computer Architecture
# - Quiz for: Midterm
# - Type: MCQ
# - Year: 2nd
# - JSON path: /Users/name/questions.json
# - Published: Yes

# 4. Remove a quiz
mkquiz remove
# Select year: 2nd
# Select quizzes to remove
# Confirm: Yes

# 5. View logs
cat logs/combined.log
```

### Using Web GUI

```bash
# Start server
npm run server

# Open browser to http://localhost:3000

# Use Configuration tab to set paths
# Use Add Quiz tab to upload JSON
# Use Manage tab to view/remove quizzes
```

### Docker Deployment

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env
nano .env
# Set:
# QUIZ_PROJECT_PATH=/path/to/quiz-project
# MKQUIZ_CONFIG=/path/to/.mkquizrc
# LOG_LEVEL=info

# 3. Start service
docker-compose up -d

# 4. Check health
curl http://localhost:3000/api/health

# 5. View logs
docker-compose logs -f

# 6. Stop service
docker-compose down
```

### Development Workflow

```bash
# 1. Clone repository
git clone https://github.com/3bbaas/mkquiz-cli.git
cd mkquiz-cli

# 2. Install dependencies
npm install

# 3. Start development mode
npm run dev

# 4. Make changes to src/

# 5. Test changes
npm start

# 6. Build for production
npm run build

# 7. Test build
node dist/index.js --help

# 8. Link globally for testing
npm link
mkquiz --help
```

### Environment-Specific Logging

```bash
# Production (minimal logging)
LOG_LEVEL=error mkquiz add

# Development (detailed logging)
LOG_LEVEL=debug mkquiz add

# View specific log level
LOG_LEVEL=warn mkquiz add 2>&1 | grep WARN
```

### Automation Scripts

```bash
#!/bin/bash
# bulk-add-quizzes.sh

# Set log level
export LOG_LEVEL=info

# Configure project
mkquiz config <<EOF
/path/to/quiz-project
/path/to/allQuizzes.json
/path/to/template.html
EOF

# Add multiple quizzes
for json_file in /path/to/quizzes/*.json; do
  echo "Adding quiz: $json_file"
  # Add quiz logic here
done
```

## API Reference

### REST Endpoints

**GET /api/config**
```javascript
// Response
{
  "projectPath": "/path/to/project",
  "allQuizzezJsonPath": "/path/to/allQuizzes.json",
  "templateFile": "/path/to/template.html"
}
```

**POST /api/config**
```javascript
// Request
{
  "projectPath": "/path/to/project",
  "allQuizzezJsonPath": "/path/to/allQuizzes.json",
  "templateFile": "/path/to/template.html"
}
```

**GET /api/quizzes**
```javascript
// Response
{
  "1st": { /* year quizzes */ },
  "2nd": { /* year quizzes */ },
  "3rd": { /* year quizzes */ },
  "4th": { /* year quizzes */ }
}
```

**POST /api/quizzes**
```javascript
// Form data
{
  "quizName": "Computer Architecture",
  "year": "2nd",
  "quizFor": "Midterm",
  "questionType": "MCQ",
  "published": true,
  "jsonFile": File
}
```

**DELETE /api/quizzes**
```javascript
// Request
{
  "year": "2nd",
  "quizNames": ["Quiz 1", "Quiz 2"]
}
```

## License

ISC

## Author

**3bbas** - [GitHub](https://github.com/3bbaas)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/3bbaas/mkquiz-cli/issues)
- **Documentation**: This file
- **Quick Start**: [README.md](./README.md)
