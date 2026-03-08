# About Time - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Data Models](#data-models)
4. [Algorithms](#algorithms)
5. [Performance Considerations](#performance-considerations)
6. [Security](#security)

## System Overview

About Time is a full-stack TypeScript application for meal planning and schedule optimization.

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- Zustand for state management
- Vite for build tooling
- React Router for navigation

**Backend:**
- Fastify (Node.js HTTP framework)
- Drizzle ORM for database access
- PostgreSQL for data storage
- Redis for caching
- Lucia for authentication
- Zod for validation

**Shared:**
- `@tannerbroberts/about-time-core`: Core business logic
- `@about-time/types`: Shared TypeScript types
- `@about-time/api-client`: API client library

### Architecture Patterns

**Frontend:**
- Component-based architecture
- Unidirectional data flow (Zustand)
- Context + useReducer for complex state
- Custom hooks for reusable logic

**Backend:**
- Service layer pattern
- Route handlers → Services → Database
- Input validation with Zod schemas
- Caching with Redis
- Database transactions for consistency

## Database Schema

### Entity Relationship Diagram

```
users
├─── sessions (1:N)
├─── templates (1:N)
├─── libraries (1:N)
└─── composite_unit_definitions (1:N)

templates
├─── template_relationships (1:N parent)
├─── template_relationships (1:N child)
├─── template_variables (1:N)
├─── library_memberships (1:N)
└─── schedule_lanes (1:N)

libraries
└─── library_memberships (1:N)

library_memberships (many-to-many: libraries ↔ templates)
```

### Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(100),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_users_email (email),
  INDEX idx_users_oauth (oauth_provider, oauth_id)
);
```

#### sessions (Lucia Auth)
```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at)
);
```

#### templates
```sql
CREATE TABLE templates (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL,
  template_type VARCHAR(10) NOT NULL,  -- 'busy' | 'lane'
  intent TEXT NOT NULL,
  estimated_duration BIGINT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  published_at TIMESTAMPTZ,
  author_display_name VARCHAR(100),

  -- Author linking and versioning
  origin_template_id VARCHAR(255),
  origin_author_id UUID,
  link_type VARCHAR(20) DEFAULT 'original' NOT NULL,
  last_synced_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1 NOT NULL,
  visibility VARCHAR(10) DEFAULT 'private' NOT NULL,
  allow_forking BOOLEAN DEFAULT TRUE NOT NULL,
  allow_live_linking BOOLEAN DEFAULT TRUE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_templates_user_id (user_id),
  INDEX idx_templates_user_type (user_id, template_type),
  INDEX idx_templates_updated (user_id, updated_at),
  INDEX idx_templates_public (is_public, published_at),
  INDEX idx_templates_public_type (is_public, template_type, published_at),
  INDEX idx_templates_origin (origin_template_id),
  INDEX idx_templates_origin_author (origin_author_id),

  CHECK (link_type IN ('original', 'forked', 'live-linked')),
  CHECK (visibility IN ('private', 'unlisted', 'public'))
);
```

#### template_relationships
```sql
CREATE TABLE template_relationships (
  id VARCHAR(255) PRIMARY KEY,
  parent_template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  child_template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  offset BIGINT NOT NULL,  -- Milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_relationships_parent (parent_template_id),
  INDEX idx_relationships_child (child_template_id)
);
```

#### template_variables
```sql
CREATE TABLE template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  variable_name VARCHAR(255) NOT NULL,
  variable_type VARCHAR(10) NOT NULL,  -- 'produce' | 'consume'
  nominal_value BIGINT NOT NULL,
  lower_bound BIGINT,
  upper_bound BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_template_variables_template (template_id),
  INDEX idx_template_variables_name (variable_name),
  UNIQUE (template_id, variable_name, variable_type)
);
```

#### libraries
```sql
CREATE TABLE libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lane_template_id VARCHAR(255) REFERENCES templates(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visibility VARCHAR(10) DEFAULT 'private' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  template_count INTEGER DEFAULT 0 NOT NULL,

  INDEX idx_libraries_owner (owner_id),
  INDEX idx_libraries_lane (lane_template_id),

  CHECK (visibility IN ('private', 'unlisted', 'public'))
);
```

#### library_memberships
```sql
CREATE TABLE library_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[],
  order INTEGER,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0 NOT NULL,

  INDEX idx_library_memberships_library (library_id),
  INDEX idx_library_memberships_template (template_id),
  UNIQUE (library_id, template_id)
);
```

#### composite_unit_definitions
```sql
CREATE TABLE composite_unit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  composition JSONB NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_composite_id UUID,
  link_type VARCHAR(20) DEFAULT 'original' NOT NULL,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_composites_author (author_id),
  INDEX idx_composites_name (name),
  INDEX idx_composites_origin (origin_composite_id),
  UNIQUE (name, author_id, version),

  CHECK (link_type IN ('original', 'forked', 'live-linked'))
);
```

#### schedule_lanes
```sql
CREATE TABLE schedule_lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_key VARCHAR(10) NOT NULL,  -- YYYY-MM-DD
  lane_template_id VARCHAR(255) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  INDEX idx_schedule_user_date (user_id, date_key),
  UNIQUE (user_id, date_key)
);
```

## Data Models

### Template Types

```typescript
// Base template interface
interface BaseTemplate {
  id: string;
  intent: string;
  estimatedDuration: number;
  willProduce: Record<string, number>;
  willConsume: Record<string, number>;
}

// Busy template (atomic unit of work)
interface BusyTemplate extends BaseTemplate {
  templateType: 'busy';
}

// Lane template (container for segments)
interface LaneTemplate extends BaseTemplate {
  templateType: 'lane';
  segments: Array<{
    relationshipId: string;
    templateId: string;
    offset: number;  // Milliseconds from lane start
  }>;
}

type Template = BusyTemplate | LaneTemplate;
```

### Confidence Values

```typescript
interface ValueWithConfidence {
  value: number;           // Nominal/expected value
  lower?: number;          // Lower confidence bound
  upper?: number;          // Upper confidence bound
}

// Example: 500 ±10% → { value: 500, lower: 450, upper: 550 }
```

### Composite Variables

```typescript
interface CompositeUnitDefinition {
  id: string;
  name: string;
  version: number;
  composition: Record<string, ValueWithConfidence>;
  authorId: string;
  originCompositeId: string | null;
  linkType: 'original' | 'forked' | 'live-linked';
  createdAt: Date;
  updatedAt: Date;
  changelog?: string;
}

// Snapshot (frozen)
interface CompositeSnapshot {
  compositeName: string;
  compositeId: string;
  version: number;
  count: number;
  confidence?: number;
  expandedValues: Record<string, ValueWithConfidence>;
  snapshotAt: Date;
}

// Live reference (dynamic)
interface CompositeLiveReference {
  compositeName: string;
  compositeId: string;
  count: number;
  confidence?: number;
}
```

## Algorithms

### Composite Expansion

Expands composite variables by multiplying base values by count.

```typescript
function expandComposite(
  composition: Record<string, ValueWithConfidence>,
  count: number
): Record<string, ValueWithConfidence> {
  const expanded: Record<string, ValueWithConfidence> = {};

  for (const [variableName, value] of Object.entries(composition)) {
    const normalized = normalizeValue(value);
    expanded[variableName] = multiplyByScalar(normalized, count);
  }

  return expanded;
}

// Example:
// Input: { calories: { value: 500, lower: 450, upper: 550 } }, count: 3
// Output: { calories: { value: 1500, lower: 1350, upper: 1650 } }
```

### Confidence Propagation

Combines confidence intervals when aggregating multiple values.

```typescript
function aggregateWithConfidence(
  values: ValueWithConfidence[]
): ValueWithConfidence {
  // Sum nominal values
  const totalValue = values.reduce((sum, v) => sum + v.value, 0);

  // Calculate combined uncertainty
  const totalLower = values.reduce((sum, v) => sum + (v.lower ?? v.value), 0);
  const totalUpper = values.reduce((sum, v) => sum + (v.upper ?? v.value), 0);

  // Apply floor/ceiling to prevent unbounded growth
  const range = totalUpper - totalLower;
  const maxRange = totalValue * 0.5;  // Cap at ±25%

  if (range > maxRange) {
    const adjustment = (range - maxRange) / 2;
    return {
      value: totalValue,
      lower: totalLower + adjustment,
      upper: totalUpper - adjustment,
    };
  }

  return {
    value: totalValue,
    lower: totalLower,
    upper: totalUpper,
  };
}

// Example:
// Input: [
//   { value: 500, lower: 450, upper: 550 },  // ±10%
//   { value: 600, lower: 510, upper: 690 }   // ±15%
// ]
// Output: { value: 1100, lower: 960, upper: 1240 }  // ±12.7%
```

### Circular Reference Detection

Uses depth-first search to detect cycles in template hierarchies.

```typescript
async function checkCircularReference(
  libraryId: string,
  templateId: string
): Promise<string[] | null> {
  const library = await getLibrary(libraryId);
  if (!library.laneTemplateId) return null;  // Global library

  const visited = new Set<string>();
  const path: string[] = [templateId];

  async function detectCycle(currentId: string): Promise<boolean> {
    // Found cycle
    if (currentId === library.laneTemplateId) {
      path.push(library.laneTemplateId);
      return true;
    }

    // Already visited
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    // Check children
    const hierarchy = await getTemplateHierarchy(currentId);
    for (const child of hierarchy.children) {
      if (child.templateType === 'lane') {
        path.push(child.id);
        if (await detectCycle(child.id)) return true;
        path.pop();
      }
    }

    return false;
  }

  const hasCycle = await detectCycle(templateId);
  return hasCycle ? path : null;
}
```

### Usage Tracking

Tracks template usage automatically when added to lane segments.

```typescript
// In TemplateService.createTemplate()
if (relationships.length > 0) {
  await db.insert(templateRelationships).values(relationships);

  // Track usage for child templates
  const uniqueChildIds = [...new Set(relationships.map(r => r.childTemplateId))];
  await Promise.all(
    uniqueChildIds.map(childId => libraryService.trackTemplateUsage(childId))
  );
}

// In LibraryService.trackTemplateUsage()
async function trackTemplateUsage(templateId: string): Promise<void> {
  await db.update(library_memberships)
    .set({
      usageCount: sql`${library_memberships.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(library_memberships.templateId, templateId));
}
```

## Performance Considerations

### Database Indexing

**Critical Indexes:**
- `idx_templates_user_id`: Filter templates by user
- `idx_templates_user_type`: Filter by user and template type
- `idx_library_memberships_library`: Get templates in library
- `idx_library_memberships_template`: Find libraries containing template
- `idx_relationships_parent`: Get template's children
- `idx_relationships_child`: Find template's parents

**Composite Indexes:**
- `(user_id, template_type)`: Common filter combination
- `(is_public, published_at)`: Browse public templates
- `(library_id, template_id)`: Prevent duplicate memberships

### Caching Strategy

**Redis Caching:**
```typescript
// Template caching (TTL: 5 minutes)
CACHE_KEYS.TEMPLATE(userId, templateId)

// User templates list (TTL: 1 minute)
CACHE_KEYS.TEMPLATES(userId)

// Public templates (TTL: 15 minutes)
CACHE_KEYS.PUBLIC_TEMPLATES

// Invalidation on:
// - Template create/update/delete
// - Template publish/unpublish
```

**Cache Patterns:**
- Read-through: Check cache → Query DB → Store in cache
- Write-through: Update DB → Invalidate cache
- Pattern-based invalidation: Delete all keys matching pattern

### Query Optimization

**Batch Operations:**
```typescript
// Bad: N+1 queries
for (const templateId of templateIds) {
  await getTemplate(templateId);
}

// Good: Single query
const templates = await db.query.templates.findMany({
  where: or(...templateIds.map(id => eq(templates.id, id)))
});
```

**Pagination:**
```typescript
// Always use LIMIT and OFFSET
const results = await db.query.templates.findMany({
  where: eq(templates.userId, userId),
  orderBy: desc(templates.updatedAt),
  limit: 50,
  offset: page * 50,
});
```

**Selective Loading:**
```typescript
// Only load what you need
const templates = await db
  .select({
    id: templates.id,
    intent: templates.intent,
    // Don't load full template_data JSONB if not needed
  })
  .from(templates)
  .where(eq(templates.userId, userId));
```

### Frontend Performance

**State Management:**
- Zustand for Build feature (fine-grained reactivity)
- Context + useReducer for App/Auth (simpler state)
- Selective subscription to prevent unnecessary re-renders

**Component Optimization:**
```typescript
// Use React.memo for expensive components
export const TemplateCard = React.memo(({ template }) => {
  // ...
});

// Use specific selectors for Zustand
const template = useBuildStore(state => state.templates[templateId]);
// Not: const state = useBuildStore(); (subscribes to everything)
```

**Virtualization:**
- Use virtual scrolling for large lists (>100 items)
- Lazy load template hierarchies
- Paginate search results

## Security

### Authentication

**Lucia Auth:**
- Session-based authentication
- HTTP-only cookies (not localStorage)
- CSRF protection via Fastify
- Secure session storage in PostgreSQL

### Authorization

**Row-Level Security:**
```typescript
// All queries filter by user_id
const templates = await db.query.templates.findMany({
  where: and(
    eq(templates.id, templateId),
    eq(templates.userId, userId)  // ← Always check ownership
  ),
});
```

**Permission Checks:**
- Templates: Only owner can modify/delete
- Libraries: Only owner can modify/delete
- Public templates: Anyone can view, only owner can modify
- Composites: Only author can update/delete

### Input Validation

**Zod Schemas:**
```typescript
const createLibrarySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).optional(),
});

// Validate in route handler
const data = createLibrarySchema.parse(request.body);
```

**SQL Injection Prevention:**
- Drizzle ORM parameterized queries
- No raw SQL with user input
- Validated input types

### Data Protection

**Sensitive Data:**
- Passwords: bcrypt hashed (never stored plain)
- Sessions: Encrypted in database
- API tokens: Rotated regularly
- User emails: Not exposed in public APIs

**HTTPS:**
- All production traffic over TLS
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite`
- HSTS headers enforced

### Rate Limiting

**Future Implementation:**
```typescript
// Per-user limits
const RATE_LIMITS = {
  perMinute: 100,
  perHour: 1000,
  bulkOperations: 10,  // Per hour
};
```

## Monitoring

### Metrics (Prometheus)

- Request latency (p50, p95, p99)
- Request count by endpoint
- Error rate by endpoint
- Database query time
- Cache hit/miss rate
- Active sessions
- Template create/update/delete counts

### Logging (Pino)

**Log Levels:**
- `error`: Unhandled exceptions, critical failures
- `warn`: Degraded performance, recoverable errors
- `info`: Important events (user actions, config changes)
- `debug`: Detailed execution flow
- `trace`: Very detailed (disabled in production)

**Structured Logging:**
```typescript
fastify.log.info({
  event: 'template.created',
  userId: user.id,
  templateId: template.id,
  templateType: template.templateType,
}, 'Template created successfully');
```

## Deployment

### Database Migrations

**Drizzle Kit:**
```bash
# Generate migration from schema changes
npm run migrate:generate

# Apply migrations
npm run migrate
```

**Migration Strategy:**
- Never modify existing migrations
- Always create new migration for schema changes
- Test migrations on staging before production
- Backup database before major migrations

### Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# Auth
SESSION_SECRET=your-secret-key

# API
PORT=3001
NODE_ENV=production
```

### Scaling

**Horizontal Scaling:**
- Stateless backend (session in database)
- Load balancer distributes requests
- Multiple backend instances
- Shared PostgreSQL and Redis

**Database Scaling:**
- Read replicas for read-heavy workloads
- Connection pooling (pg-pool)
- Vertical scaling first (larger instance)
- Partitioning for very large tables (future)
