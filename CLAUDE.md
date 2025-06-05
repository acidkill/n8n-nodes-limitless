# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node package for Limitless AI API integration. The project structure follows n8n's node development conventions with TypeScript, providing credentials and node implementations for accessing Limitless lifelogs data.

**Key Components:**
- `nodes/Limitless/` - Main node implementation with operations for getting lifelogs, exporting markdown, and AI summarization
- `credentials/LimitlessApi.credentials.ts` - API authentication using X-API-Key headers
- Built as a community package distributed via npm

## Development Commands

### Build & Development
```bash
npm run build       # Compile TypeScript and copy icons
npm run dev         # Watch mode compilation
npm test           # Run Jest test suite
```

### Code Quality
```bash
npm run lint       # ESLint validation 
npm run lintfix    # Auto-fix linting issues
npm run format     # Prettier formatting
```

### Testing
```bash
jest                           # Run all tests
jest Limitless.node.test.ts   # Run specific test file
```

## Architecture Notes

**n8n Integration:**
- Uses n8n-workflow types and interfaces throughout
- Implements INodeType with proper credential binding
- Outputs follow n8n's INodeExecutionData format
- Supports cursor-based pagination for API responses

**API Integration:**
- Uses request-promise-native for HTTP calls
- Authentication via X-API-Key header injection
- Configurable API endpoint paths via node properties
- Error handling with NodeOperationError and NodeApiError

**AI Features:**
- Integrates LangChain for summarization operations
- Supports multiple Chat Model providers (OpenAI, Ollama, Azure)
- Uses PromptTemplate with {text} placeholder for content injection

**Build Process:**
- TypeScript compilation to dist/ folder
- Gulp task copies SVG icons to distribution
- Strict TypeScript configuration with full error checking
- Package distributed as n8n community node via dist/ folder

## Code Standards

The project uses extensive ESLint rules specific to n8n node development:
- Follows n8n-nodes-base plugin conventions
- Strict naming conventions for credentials and node files
- Required documentation URLs and descriptions
- Proper parameter validation and type assertions