# About Time - API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Libraries](#libraries)
3. [Templates](#templates)
4. [Composites](#composites)
5. [Template Variables](#template-variables)
6. [Error Handling](#error-handling)

## Authentication

All API endpoints (except public template browsing) require authentication via Bearer token.

```http
Authorization: Bearer <your-token-here>
```

### Endpoints

**POST /api/auth/login**
```typescript
Request:
{
  email: string;
  password: string;
}

Response: 200 OK
{
  success: true;
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}
```

**POST /api/auth/logout**
```typescript
Response: 200 OK
{
  success: true;
  message: "Logged out successfully";
}
```

## Libraries

### List Libraries

**GET /api/libraries**

Returns all libraries owned by the authenticated user.

```typescript
Response: 200 OK
{
  success: true;
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: 'private' | 'unlisted' | 'public';
    createdAt: string;
    updatedAt: string;
    templateCount: number;
  }>;
}
```

### Get Library

**GET /api/libraries/:id**

```typescript
Response: 200 OK
{
  success: true;
  data: {
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: string;
    createdAt: string;
    updatedAt: string;
    templateCount: number;
  };
}

Error: 404 Not Found
{
  error: "NotFound";
  message: "Library not found";
}
```

### Create Library

**POST /api/libraries**

```typescript
Request:
{
  name: string;
  description?: string;
  laneTemplateId?: string;
  visibility?: 'private' | 'unlisted' | 'public';
}

Response: 201 Created
{
  success: true;
  data: {
    id: string;
    name: string;
    description: string | null;
    laneTemplateId: string | null;
    ownerId: string;
    visibility: string;
    createdAt: string;
    updatedAt: string;
    templateCount: number;
  };
}

Error: 400 Bad Request
{
  error: "ValidationError";
  message: [...];  // Zod validation errors
}
```

### Update Library

**PUT /api/libraries/:id**

```typescript
Request:
{
  name?: string;
  description?: string;
  visibility?: 'private' | 'unlisted' | 'public';
}

Response: 200 OK
{
  success: true;
  data: {
    // Library object
  };
}
```

### Delete Library

**DELETE /api/libraries/:id**

Deletes library and all memberships (CASCADE). Templates themselves are not deleted.

```typescript
Response: 200 OK
{
  success: true;
  message: "Library deleted successfully";
}
```

### Get Library Templates

**GET /api/libraries/:id/templates**

Returns all templates in a library with their membership details.

```typescript
Response: 200 OK
{
  success: true;
  data: Array<{
    template: Template;
    membership: {
      id: string;
      libraryId: string;
      templateId: string;
      addedAt: string;
      addedBy: string;
      notes: string | null;
      tags: string[] | null;
      order: number | null;
      lastUsedAt: string | null;
      usageCount: number;
    };
  }>;
}
```

### Add Template to Library

**POST /api/libraries/:id/templates**

```typescript
Request:
{
  templateId: string;
  notes?: string;
  tags?: string[];
  order?: number;
}

Response: 201 Created
{
  success: true;
  data: {
    id: string;
    libraryId: string;
    templateId: string;
    addedAt: string;
    addedBy: string;
    notes: string | null;
    tags: string[] | null;
    order: number | null;
  };
}

Error: 400 Bad Request
{
  error: "BadRequest";
  message: "Circular reference detected: lane-1 → lane-2 → lane-1";
}
```

### Remove Template from Library

**DELETE /api/libraries/:id/templates/:templateId**

Removes template from library (does NOT delete the template).

```typescript
Response: 200 OK
{
  success: true;
  message: "Template removed from library";
}
```

### Update Membership

**PUT /api/libraries/:id/templates/:templateId**

Update membership metadata (notes, tags, order).

```typescript
Request:
{
  notes?: string;
  tags?: string[];
  order?: number;
}

Response: 200 OK
{
  success: true;
  data: {
    // Membership object
  };
}
```

### Export Library

**GET /api/libraries/:id/export**

Exports library as JSON file.

```typescript
Response: 200 OK
Content-Type: application/json
Content-Disposition: attachment; filename="library-{id}-export.json"

{
  version: "1.0";
  library: {
    name: string;
    description: string | null;
    visibility: string;
  };
  templates: Array<{
    id: string;
    intent: string;
    templateType: string;
    estimatedDuration: number;
    templateData: Template;
    membership: {
      notes: string | null;
      tags: string[] | null;
      order: number | null;
    };
  }>;
  composites: Array<CompositeUnitDefinition>;
}
```

### Import Library

**POST /api/libraries/import**

Imports library from JSON export.

```typescript
Request:
{
  version: string;
  library: {
    name: string;
    description?: string;
    visibility?: string;
  };
  templates: Array<{
    templateData: Record<string, unknown>;
    membership?: Record<string, unknown>;
  }>;
}

Response: 201 Created
{
  success: true;
  data: {
    libraryId: string;
  };
  message: "Library imported successfully";
}
```

### Check Circular References

**GET /api/libraries/:id/check-cycles**

Detects circular references in library.

```typescript
Response: 200 OK
{
  success: true;
  data: {
    hasCycles: boolean;
    cycles: string[][];  // Array of circular paths
  };
}

Example with cycles:
{
  success: true;
  data: {
    hasCycles: true;
    cycles: [
      ["lane-1", "lane-2", "lane-1"],
      ["lane-3", "lane-4", "lane-5", "lane-3"]
    ]
  };
}
```

## Templates

### List Templates

**GET /api/templates**

```typescript
Query Parameters:
{
  offset?: number;        // Default: 0
  limit?: number;         // Default: 50, max: 10000
  templateType?: 'busy' | 'lane';
  searchIntent?: string;  // Search by intent
  sortBy?: 'updatedAt' | 'createdAt' | 'intent';
  sortOrder?: 'asc' | 'desc';
}

Response: 200 OK
{
  success: true;
  data: {
    templates: Template[];
    total: number;
  };
}
```

### Get Template

**GET /api/templates/:id**

```typescript
Response: 200 OK
{
  success: true;
  data: Template;
}

Error: 404 Not Found
{
  error: "NotFound";
  message: "Template not found";
}
```

### Create Template

**POST /api/templates**

```typescript
Request:
{
  template: Template;
}

Response: 201 Created
{
  success: true;
  data: Template;
}

Note: Creating a lane template auto-creates a library for it.
```

### Update Template

**PUT /api/templates/:id**

```typescript
Request:
{
  template: Template;
}

Response: 200 OK
{
  success: true;
  data: Template;
}

Error: 400 Bad Request
{
  error: "BadRequest";
  message: "Template ID mismatch";
}
```

### Delete Template

**DELETE /api/templates/:id**

Deletes template and removes it from all libraries (CASCADE).

```typescript
Response: 200 OK
{
  success: true;
  message: "Template deleted successfully";
}
```

### Fork Template

**POST /api/templates/:id/fork**

Creates independent copy with author attribution.

```typescript
Request:
{
  addToLibraryId?: string;  // Optional library to add to
}

Response: 201 Created
{
  success: true;
  template: Template;
  message: "Template forked successfully";
}

Error: 403 Forbidden
{
  error: "Forbidden";
  message: "Forking is not allowed for this template";
}
```

### Get Template Hierarchy

**GET /api/templates/:id/children**

Returns template with its child templates (for lane templates).

```typescript
Response: 200 OK
{
  success: true;
  data: {
    template: Template;
    children: Template[];
    relationships: Array<{
      relationshipId: string;
      childTemplateId: string;
      offset: number;
    }>;
  };
}
```

### Publish Template

**POST /api/templates/:id/publish**

Makes template public.

```typescript
Response: 200 OK
{
  success: true;
  data: Template;
}
```

### Unpublish Template

**POST /api/templates/:id/unpublish**

Makes template private.

```typescript
Response: 200 OK
{
  success: true;
  data: Template;
}
```

### Import Public Template

**POST /api/templates/:id/import**

Creates copy of public template in user's library.

```typescript
Response: 201 Created
{
  success: true;
  data: Template;
}
```

### Get Template Usage Stats

**GET /api/templates/:id/usage-stats**

Returns usage statistics across all libraries.

```typescript
Response: 200 OK
{
  success: true;
  data: {
    totalUsageCount: number;
    lastUsedAt: string | null;
    libraryCount: number;
  };
}
```

## Composites

### List User Composites

**GET /api/composites**

```typescript
Response: 200 OK
{
  success: true;
  composites: Array<CompositeUnitDefinition>;
}
```

### Get Composite

**GET /api/composites/:id**

```typescript
Response: 200 OK
{
  success: true;
  composite: CompositeUnitDefinition;
}

Error: 404 Not Found
{
  success: false;
  error: "Composite not found";
}
```

### Get Composite Versions

**GET /api/composites/:id/versions**

Returns all versions of a composite.

```typescript
Response: 200 OK
{
  success: true;
  versions: Array<CompositeUnitDefinition>;
}
```

### Create Composite

**POST /api/composites**

```typescript
Request:
{
  name: string;
  composition: Record<string, {
    value: number;
    lower?: number;
    upper?: number;
  }>;
  changelog?: string;
}

Response: 201 Created
{
  success: true;
  composite: CompositeUnitDefinition;
}
```

### Update Composite

**PUT /api/composites/:id**

Creates new version.

```typescript
Request:
{
  composition: Record<string, {
    value: number;
    lower?: number;
    upper?: number;
  }>;
  changelog?: string;
}

Response: 200 OK
{
  success: true;
  composite: CompositeUnitDefinition;
}
```

### Delete Composite

**DELETE /api/composites/:id**

```typescript
Response: 200 OK
{
  success: true;
  message: "Composite deleted successfully";
}

Error: 409 Conflict
{
  success: false;
  error: "Cannot delete composite that is currently used by templates";
}
```

### Fork Composite

**POST /api/composites/:id/fork**

Creates independent copy.

```typescript
Request:
{
  changelog?: string;
}

Response: 201 Created
{
  success: true;
  composite: CompositeUnitDefinition;
}
```

### Create Live Link

**POST /api/composites/:id/live-link**

Creates live-linked reference.

```typescript
Request:
{
  changelog?: string;
}

Response: 201 Created
{
  success: true;
  composite: CompositeUnitDefinition;
}
```

### Bulk Update Snapshots

**POST /api/composites/:id/bulk-update-snapshots**

Updates all templates using this composite's snapshots.

```typescript
Request:
{
  toVersion: number;
  templateIds?: string[];  // Optional: only update specific templates
}

Response: 200 OK
{
  success: true;
  updatedCount: number;
  message: string;
}
```

## Template Variables

### Upsert Template Variable

**POST /api/template-variables/:templateId**

Creates or updates a template variable with confidence bounds.

```typescript
Request:
{
  variableName: string;
  variableType: 'produce' | 'consume';
  nominalValue: number;
  lowerBound?: number;
  upperBound?: number;
}

Response: 201 Created / 200 OK
{
  success: true;
  data: {
    id: string;
    templateId: string;
    variableName: string;
    variableType: string;
    nominalValue: number;
    lowerBound: number | null;
    upperBound: number | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

### Get Template Variables

**GET /api/template-variables/:templateId**

```typescript
Response: 200 OK
{
  success: true;
  data: Array<{
    id: string;
    templateId: string;
    variableName: string;
    variableType: string;
    nominalValue: number;
    lowerBound: number | null;
    upperBound: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### Delete Template Variable

**DELETE /api/template-variables/:templateId/:variableName**

```typescript
Response: 200 OK
{
  success: true;
  message: "Variable deleted successfully";
}
```

## Error Handling

### Standard Error Response

```typescript
{
  error: string;           // Error code
  message: string;         // Human-readable message
  details?: unknown;       // Optional additional context
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Validation error, bad input
- **401 Unauthorized**: Missing or invalid auth token
- **403 Forbidden**: Authenticated but not allowed
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Circular reference, duplicate, constraint violation
- **500 Internal Server Error**: Server-side error

### Common Error Codes

**ValidationError**
- Invalid request body
- Missing required fields
- Type errors

**NotFound**
- Resource doesn't exist
- User doesn't own resource

**Forbidden**
- Forking not allowed
- Can't access other user's private data

**BadRequest**
- Circular reference in library
- Template ID mismatch
- Invalid operation

**InternalServerError**
- Database error
- Unexpected server error

### Error Examples

```typescript
// Validation Error
{
  error: "ValidationError";
  message: [
    {
      code: "invalid_type";
      expected: "string";
      received: "number";
      path: ["name"];
      message: "Expected string, received number";
    }
  ];
}

// Circular Reference
{
  error: "BadRequest";
  message: "Circular reference detected: lane-1 → lane-2 → lane-1";
}

// Not Found
{
  error: "NotFound";
  message: "Library not found";
}

// Forbidden
{
  error: "Forbidden";
  message: "Forking is not allowed for this template";
}
```

## Rate Limiting

Currently no rate limiting is enforced. In production:
- 100 requests per minute per user
- 1000 requests per hour per user
- Bulk operations count as single request

## Versioning

API version is included in the URL path: `/api/v1/...`

Current version: **v1** (implicit, no version in path yet)

Breaking changes will increment major version: `/api/v2/...`
