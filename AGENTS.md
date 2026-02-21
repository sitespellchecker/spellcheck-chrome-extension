# AGENTS.md - Site Spellchecker Extension

Guidelines for agentic coding agents working on this Chrome extension project.

## Project Overview

This is a Chrome browser extension (Manifest V3) for spellchecking websites. Built with TypeScript and modern web extension APIs.

## Build Commands

```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Watch mode
npm run watch
```

## Test Commands

```bash
# Run all tests
npm test

# Run single test file
npm test -- <filename>.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Lint Commands

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck

# Run all checks (lint + typecheck)
npm run check
```

## Code Style Guidelines

### TypeScript

- Use strict TypeScript with full type annotations
- Prefer `type` over `interface` for object shapes
- Use explicit return types on exported functions
- Avoid `any` - use `unknown` with type guards instead
- Enable strict mode in tsconfig.json

### Naming Conventions

- Files: kebab-case (e.g., `spell-checker.ts`)
- Components/functions: camelCase (e.g., `checkSpelling()`)
- Constants: UPPER_SNAKE_CASE for true constants
- Types/interfaces: PascalCase with descriptive names (e.g., `SpellingError`)
- Chrome API callbacks: Prefix with `handle` (e.g., `handleMessage`)

### Imports

```typescript
// Order: built-in → external → internal → relative
import { useState } from 'react';
import { debounce } from 'lodash';
import { storage } from '@/utils/storage';
import { SpellChecker } from './spell-checker';

// Use path aliases for src/ imports (@/)
// Group imports by category with blank lines between
```

### Formatting

- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multi-line objects/arrays
- 100 character line limit
- Use Prettier for consistent formatting

### Error Handling

```typescript
// Always handle errors in async functions
try {
  const result = await chrome.storage.local.get('settings');
} catch (error) {
  console.error('Failed to load settings:', error);
  // Provide fallback or re-throw with context
}

// Use custom error types for domain-specific errors
class SpellCheckError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SpellCheckError';
  }
}
```

## Chrome Extension Best Practices

### Manifest V3

- Follow strict CSP (Content Security Policy)
- Use service worker for background scripts
- Declare minimal required permissions in manifest
- Use `chrome.action` API for browser actions

### Security

- Never use `innerHTML` - use `textContent` or proper DOM methods
- Sanitize all user input before display
- Validate message origins in runtime message handlers
- Use `chrome.storage` instead of localStorage

### Performance

- Debounce spell checking on scroll/resize events
- Use Intersection Observer for lazy checking
- Throttle storage writes
- Clean up event listeners in content scripts

### Architecture

```
src/
├── background/          # Service worker
│   └── index.ts
├── content/            # Content scripts
│   ├── spell-checker.ts
│   └── highlighter.ts
├── popup/              # Extension popup UI
│   ├── App.tsx
│   └── index.tsx
├── utils/              # Shared utilities
│   ├── storage.ts
│   └── dom.ts
├── types/              # TypeScript types
│   └── index.ts
└── manifest.json
```

## Testing Guidelines

- Unit test pure utility functions
- Mock Chrome APIs in tests
- Test error scenarios and edge cases
- Use Jest with jsdom for DOM testing

## Git Workflow

```bash
# Feature branch naming: feature/description
# Bug fix naming: fix/description
# Format commit messages: type(scope): description

feat(spell-checker): add real-time checking
fix(popup): resolve settings save issue
docs(readme): update installation instructions
```

## Pre-commit Checklist

Before committing, run:
```bash
npm run check
```

This ensures:
- All TypeScript compiles without errors
- ESLint passes
- Tests pass
- Code is properly formatted
