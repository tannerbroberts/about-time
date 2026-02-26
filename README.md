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
- Docker Desktop (for PostgreSQL + Redis)
- npm >= 9

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup local database**
   ```bash
   ./scripts/setup-local-db.sh
   ```

3. **Configure environment**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   # Update SESSION_SECRET in apps/backend/.env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   npm run dev --workspace=@about-time/backend

   # Terminal 2: Start frontend
   npm run dev --workspace=@about-time/frontend
   ```

5. **Open app**
   - Frontend: http://localhost:5173
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

### Phase 1: Mono-repo Setup ✅
- npm workspaces with Turborepo
- Shared type definitions
- API client package skeleton

### Phase 2: Backend Scaffolding ✅
- Fastify server with CORS and security headers
- PostgreSQL database with Drizzle ORM
- Redis for session storage
- Lucia authentication (email/password)
- Database migrations

### Phase 3: Template API (In Progress)
- Template CRUD endpoints
- Pagination and search
- Row-level security

### Phase 4-10: Coming Soon
- Schedule & Execute APIs
- Full API client implementation
- Frontend integration
- Offline-first Service Workers
- Kubernetes deployment
- Performance optimization

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
- [PRD.md](./PRD.md) - Product requirements
- [PRD-Build.md](./PRD-Build.md) - Build feature spec
- [PRD-Schedule.md](./PRD-Schedule.md) - Schedule feature spec
- [PRD-Execute.md](./PRD-Execute.md) - Execute feature spec

## License

MIT
