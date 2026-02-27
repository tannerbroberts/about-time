# about-time

Multi-user nutrition tracking app with offline-first support and enterprise-ready backend.

## Project Structure

```
about-time/  (mono-repo root)
├── apps/
│   ├── frontend/        # Vite + React frontend
│   └── backend/         # Fastify API server
├── packages/
│   ├── core/            # @tannerbroberts/about-time-core (template operations)
│   ├── types/           # Shared TypeScript types
│   └── api-client/      # HTTP client for frontend
├── infrastructure/      # Deployment configs (Kubernetes, Docker)
└── scripts/             # Setup and dev scripts
```

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL 16+ (running locally)
- Redis (running locally)

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup local database**
   ```bash
   # Run PostgreSQL and Redis locally, then:
   ./scripts/setup-local-db.sh
   ```

3. **Configure environment**
   ```bash
   # Backend .env is already configured for local development
   # Just verify apps/backend/.env has correct DATABASE_URL and REDIS_URL
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   npm run dev --workspace=@about-time/backend

   # Terminal 2: Start frontend
   npm run dev --workspace=@about-time/frontend
   ```

5. **Open app**
   - Frontend: http://localhost:5173 (or auto-assigned port)
   - Backend: http://localhost:3001
   - Health check: http://localhost:3001/health

## Available Commands

```bash
# Build all packages
npm run build

# Run linters
npm run lint

# Run tests
npm run test

# Clean all build artifacts
npm run clean

# Start backend dev server
npm run dev --workspace=@about-time/backend

# Start frontend dev server
npm run dev --workspace=@about-time/frontend
```

## Features

### Build ✅
- Create and manage meal/activity templates
- Template editor with hierarchy viewer
- Support for Busy (individual) and Lane (container) templates
- Template variables and customization
- Visual 2D template editor

### Schedule ✅
- Plan daily meals and activities
- Drag-and-drop scheduling interface
- Daily goal tracking
- Template instantiation

### Track (Execute) ✅
- Track meal completion throughout the day
- Real-time progress monitoring
- Completion status tracking

### Infrastructure ✅
- Fastify backend with CORS and security
- PostgreSQL database with Drizzle ORM
- Redis session storage
- Lucia authentication
- Offline-first Service Workers
- React + Vite frontend
- Zustand state management

## Tech Stack

**Frontend:**
- Vite + React 19
- TypeScript
- Material-UI
- Zustand (state management)
- Framer Motion (animations)

**Backend:**
- Fastify (Node.js framework)
- Drizzle ORM
- PostgreSQL 16
- Redis
- Lucia Auth

**DevOps:**
- Docker + docker-compose
- Turborepo (monorepo orchestration)
- npm workspaces

## Database Management

```bash
# Generate new migration
npm run migrate:generate --workspace=@about-time/backend

# Run migrations
npm run migrate --workspace=@about-time/backend

# Drop last migration
npm run migrate:drop --workspace=@about-time/backend

# Open Drizzle Studio (database GUI)
npm run db:studio --workspace=@about-time/backend
```

## Project Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guidelines for Claude Code
- [PRD-Build.md](./PRD-Build.md) - Build feature specification
- [PRD-Execute.md](./PRD-Execute.md) - Execute/Track feature specification

## License

MIT
