# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (Turbopack, with Node.js compat shim)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev
```

## Architecture

UIGen is a Next.js 15 App Router app where users chat with Claude to generate React components that render in a live preview iframe — no files are written to disk.

### Key data flows

**Chat → AI → File System → Preview**

1. User sends a message via `ChatInterface`
2. `ChatProvider` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat` with the message history and the serialized virtual file system
3. The API route (`src/app/api/chat/route.ts`) reconstructs a `VirtualFileSystem` from the serialized data, calls Claude (or `MockLanguageModel` if no API key), and streams back tool calls
4. Tool calls are handled client-side via `handleToolCall` in `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`), which mutates the in-memory `VirtualFileSystem`
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) watches `refreshTrigger` and re-renders the iframe via `createPreviewHTML` whenever files change

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree with `Map<string, FileNode>`. All paths are absolute (e.g. `/App.jsx`, `/components/Button.jsx`). The VFS is serialized to JSON for the Prisma `Project.data` field and sent with every chat request.

### Preview rendering

`src/lib/transform/jsx-transformer.ts` uses `@babel/standalone` to transpile JSX/TSX in the browser. `createImportMap` builds an ES module import map from VFS files, with `@/` resolving to the root. The preview runs in a sandboxed iframe with `allow-scripts allow-same-origin`.

### AI tools

Claude is given two tools (defined in `src/lib/tools/`):
- `str_replace_editor`: create/view/str_replace/insert in VFS files
- `file_manager`: rename/delete VFS files

The system prompt (`src/lib/prompts/generation.tsx`) requires every project to have `/App.jsx` as the entry point and mandates `@/` import aliases for non-library files.

### AI provider

`src/lib/provider.ts` exports `getLanguageModel()`. If `ANTHROPIC_API_KEY` is set it uses `claude-haiku-4-5` via `@ai-sdk/anthropic`; otherwise it returns a `MockLanguageModel` that returns static code (counter/form/card components) so the app runs without an API key.

### Authentication & persistence

- JWT sessions stored in `auth-token` httpOnly cookie (7-day expiry), logic in `src/lib/auth.ts`
- Anonymous users' work is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts`
- Authenticated users have `Project` records in SQLite (via Prisma). `messages` and `data` are stored as JSON strings. The full database schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the structure of persisted data.
- Projects are owned per-user; the root `/` page redirects authenticated users to their most recent project at `/{projectId}`
- The `[projectId]` dynamic route loads the project and passes `initialMessages` and `initialData` to `MainContent`

### Middleware

`src/middleware.ts` protects `/api/projects` and `/api/filesystem` routes. `/api/chat` is intentionally unprotected — project saving inside the chat handler checks for a session itself and silently skips if unauthenticated.

### Component structure

- `MainContent` (`src/app/main-content.tsx`): root layout with resizable panels — chat on the left, preview/code on the right
- `FileSystemProvider` wraps `ChatProvider` (chat depends on file system context)
- UI components use shadcn/ui patterns with Radix UI primitives in `src/components/ui/`
- Tailwind CSS v4 (PostCSS plugin, not the old `tailwind.config.js` approach)

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files live alongside source in `__tests__/` subdirectories.
