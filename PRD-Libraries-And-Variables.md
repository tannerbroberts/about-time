# PRD: Library System & Composite Variables with Confidence Factors

**Version**: 1.0
**Date**: March 7, 2026
**Status**: Draft
**Author**: Claude + Tanner

---

## Executive Summary

This PRD introduces a comprehensive library system for template organization, composite variable definitions with versioning, and scientific confidence factors for measurements. The system solves three critical problems:

1. **Template Organization**: Templates lack scoping, causing namespace pollution and making it difficult to find relevant templates in context
2. **Variable Composability**: No way to define reusable variable bundles (e.g., "1 meal serving = 300cal + 30g protein + 40g carbs")
3. **Measurement Honesty**: False precision in measurements ignores real-world uncertainty (FDA allows ±20% error on nutrition labels)

**Key Innovation**: A "unit algebra" system where templates can work at any abstraction level (raw grams OR composite meal servings), with version control for historical accuracy and confidence bounds for scientific honesty.

---

## Problem Statement

### Current Pain Points

1. **Global Template Pollution**
   - User has 50+ templates in global scope
   - Templates like "Warmup", "Preparation", "Cleanup" are context-specific but clutter global search
   - No way to distinguish "Warmup (Workout)" from "Warmup (Cooking)"
   - Templates intended only for specific lanes pollute the global namespace

2. **Rigid Composition**
   - Lane segments are fixed compositions
   - No "library of possibilities" separate from "currently scheduled"
   - Can't easily swap segments in/out without deleting and recreating
   - Importing a lane template doesn't bring its full context

3. **Variable Repetition**
   - Repeatedly defining "1 meal = X protein + Y carbs + Z fat" across templates
   - No reusable variable bundles
   - Changing a standard definition requires updating dozens of templates
   - Can't work at different abstraction levels (portions vs grams)

4. **False Precision**
   - Nutrition labels can be off by 20% (FDA regulation)
   - Home measurements add 5-10% error
   - Apps show "200 calories" when it's really "200 ±40 calories"
   - Historical data changes when definitions are updated

### Real-World Scenario

**The First Responder Problem**: A first responder has a 500-page manual of possible actions, but any given day only requires 10-20 specific actions. They need:
- Access to ALL possibilities at a moment's notice
- Only RELEVANT actions visible in current context
- Ability to swap actions in/out as situations change
- Historical record of what was ACTUALLY done (not retroactively changed)

Similarly, a "Meal Prep" lane needs:
- Library of 50 possible meal templates
- Only 5 currently scheduled today
- Easy to swap meals based on what's in the fridge
- Historical accuracy when reviewing past meal plans

---

## Goals & Non-Goals

### Goals

**Must Have (MVP)**
1. ✅ Library system where each LaneTemplate owns a library
2. ✅ Global library for truly universal templates
3. ✅ Templates can belong to multiple libraries (many-to-many)
4. ✅ Clear UX distinction between "remove from lane" vs "delete from library"
5. ✅ Composite variables with version control
6. ✅ Confidence factors (±%) on all measurements
7. ✅ Author linking with live-update vs fork choice

**Should Have (Phase 2)**
8. ✅ Composite expansion with uncertainty propagation
9. ✅ Bulk snapshot updates when composite definitions change
10. ✅ Library-scoped search with context awareness
11. ✅ Usage tracking for library cleanup

**Nice to Have (Future)**
12. Custom unit conversions beyond system defaults
13. Confidence visualization (error bars in charts)
14. Dependency graph showing template relationships
15. Library templates for common use cases

### Non-Goals

❌ **Migration from existing data** - No users yet, fresh start
❌ **Multi-user collaboration** on libraries - Single-user scope for now
❌ **AI-powered variable suggestions** - Manual definition only
❌ **Real-time sync** across devices - Not in scope
❌ **Complex permission system** - Simple public/private only

---

## User Personas

### 1. **Tanner the Optimizer**
- Wants precise nutrition tracking
- Frustrated by FDA's ±20% margin on labels
- Values scientific honesty over false precision
- Needs historical accuracy when comparing diet plans
- Creates many templates, wants good organization

### 2. **Alice the Recipe Creator**
- Publishes meal prep templates for others
- Updates recipes based on feedback
- Wants followers to get improvements automatically
- Needs followers to see changelogs
- Values namespace clarity ("Alice's Warmup" vs others)

### 3. **Bob the Template User**
- Downloads templates from creators like Alice
- Wants updates but also stability
- Sometimes modifies templates for personal use
- Needs to understand what changed in updates
- Doesn't want breaking changes without warning

---

## User Stories

### Library Organization

**As a user**, I want to organize templates into libraries so that I can find relevant templates in context without global namespace pollution.

**As a user**, I want my "Workout Routine" lane to have its own library so that "Warmup" and "Cooldown" templates don't clutter my global search when planning meals.

**As a user**, I want templates to exist in multiple libraries so that my "Morning Stretch" template can be in both "Workout Routine" and "Daily Schedule" without duplication.

### Composite Variables

**As a user**, I want to define "1 meal serving = 300cal + 30g protein + 40g carbs" so that I can work at the abstraction level of "servings" instead of individual macros.

**As a user**, I want to update my "meal serving" definition from 300cal to 350cal and have all templates using it get notified so I can decide whether to update or keep historical definitions.

**As a user**, I want templates to remember which version of a composite they used so that my January meal plan doesn't retroactively change when I update the definition in March.

### Confidence Factors

**As a user**, I want to mark measurements as "50g protein ±5%" so that I can be honest about measurement uncertainty.

**As a user**, I want to see my daily total as "150g protein ±8%" so that I understand the cumulative uncertainty across multiple meals.

**As a user**, I want the system to correctly propagate uncertainty when converting units so that "50g ±5%" becomes "1.76oz ±5%" (not falsely precise).

### Author Linking

**As Alice (creator)**, I want to publish my "Ultimate Meal Prep" template with updates enabled so that users who live-link it get improvements automatically.

**As Bob (user)**, I want to choose between "live-link" and "fork" when downloading Alice's template so that I can decide between auto-updates vs stability.

**As Bob (user)**, I want to see a changelog when Alice publishes an update so that I can understand what changed before applying it.

---

## Technical Specification

### Data Models

#### Library

```typescript
interface Library {
  id: LibraryId;
  name: string;
  description?: string;

  // Ownership
  laneTemplateId: TemplateId | null;  // null = global library
  ownerId: UUID;

  // Visibility
  visibility: 'private' | 'unlisted' | 'public';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  templateCount: number;
}
```

#### Library Membership (Many-to-Many Join)

```typescript
interface LibraryMembership {
  id: UUID;
  libraryId: LibraryId;
  templateId: TemplateId;
  addedAt: Date;
  addedBy: UUID;

  // Optional: Library-specific metadata
  notes?: string;
  tags?: string[];
  order?: number;  // For custom ordering within library
}
```

#### Composite Variable Definition

```typescript
interface CompositeUnitDefinition {
  id: UUID;
  name: string;
  version: number;  // Increments on each edit
  composition: Record<string, ValueWithConfidence>;

  // Ownership & Linking
  authorId: UUID;
  originCompositeId: UUID | null;  // For forked composites
  linkType: 'original' | 'forked' | 'live-linked';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  changelog?: string;
}

interface ValueWithConfidence {
  value: number;
  unit: string;
  confidence?: number;  // Percentage bounds (e.g., 5 = ±5%)
}
```

#### Template Variable Storage

```typescript
type VariableValue =
  | { type: 'atomic'; data: ValueWithConfidence }
  | { type: 'composite-live'; data: CompositeLiveReference }
  | { type: 'composite-snapshot'; data: CompositeSnapshot };

interface CompositeLiveReference {
  compositeName: string;
  compositeId: UUID;
  count: number;
  confidence?: number;  // Uncertainty in the count
}

interface CompositeSnapshot {
  compositeName: string;
  compositeId: UUID;
  version: number;
  count: number;
  confidence?: number;

  // The actual expansion at time of creation
  expandedValues: Record<string, ValueWithConfidence>;

  // Metadata
  snapshotAt: Date;
}
```

#### Template with Library Support

```typescript
interface Template {
  id: TemplateId;
  intent: string;
  authorId: UUID;

  // Author linking
  originTemplateId: TemplateId | null;
  originAuthorId: UUID | null;
  linkType: 'original' | 'forked' | 'live-linked';
  lastSyncedAt: Date | null;
  version: number;

  // Visibility
  visibility: 'private' | 'unlisted' | 'public';
  allowForking: boolean;
  allowLiveLinking: boolean;

  // Relationships
  libraries: LibraryId[];  // Denormalized for quick access
}

interface LaneTemplate extends Template {
  templateType: 'lane';
  segments: Segment[];
  libraryId: LibraryId;  // Every lane has its own library
}
```

### Database Schema

```sql
-- Libraries
CREATE TABLE libraries (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  lane_template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'unlisted', 'public')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  template_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_libraries_owner ON libraries(owner_id);
CREATE INDEX idx_libraries_lane ON libraries(lane_template_id);

-- Library Membership (Many-to-Many)
CREATE TABLE library_memberships (
  id UUID PRIMARY KEY,
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  added_by UUID NOT NULL,
  notes TEXT,
  tags TEXT[],
  "order" INTEGER,
  UNIQUE(library_id, template_id)
);

CREATE INDEX idx_library_memberships_library ON library_memberships(library_id);
CREATE INDEX idx_library_memberships_template ON library_memberships(template_id);

-- Composite Unit Definitions
CREATE TABLE composite_unit_definitions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  composition JSONB NOT NULL,
  author_id UUID NOT NULL,
  origin_composite_id UUID REFERENCES composite_unit_definitions(id),
  link_type TEXT NOT NULL CHECK (link_type IN ('original', 'forked', 'live-linked')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changelog TEXT,
  UNIQUE(name, author_id, version)
);

CREATE INDEX idx_composites_author ON composite_unit_definitions(author_id);
CREATE INDEX idx_composites_name ON composite_unit_definitions(name);

-- Template Variables
CREATE TABLE template_variables (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('atomic', 'composite-live', 'composite-snapshot')),
  data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_variables_template ON template_variables(template_id);

-- Templates (Add new columns)
ALTER TABLE templates ADD COLUMN origin_template_id UUID REFERENCES templates(id);
ALTER TABLE templates ADD COLUMN origin_author_id UUID;
ALTER TABLE templates ADD COLUMN link_type TEXT CHECK (link_type IN ('original', 'forked', 'live-linked'));
ALTER TABLE templates ADD COLUMN last_synced_at TIMESTAMP;
ALTER TABLE templates ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE templates ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public'));
ALTER TABLE templates ADD COLUMN allow_forking BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE templates ADD COLUMN allow_live_linking BOOLEAN NOT NULL DEFAULT true;

-- Lane Templates (Add library_id)
ALTER TABLE templates ADD COLUMN library_id UUID REFERENCES libraries(id);
```

---

## Core Algorithms

### 1. Composite Expansion

```typescript
function expandComposite(
  compositeName: string,
  compositeId: UUID,
  count: number,
  version?: number  // If provided, use that version; else use latest
): Record<string, ValueWithConfidence> {
  const definition = version
    ? getCompositeVersion(compositeId, version)
    : getLatestComposite(compositeId);

  const expanded: Record<string, ValueWithConfidence> = {};

  for (const [varName, varValue] of Object.entries(definition.composition)) {
    expanded[varName] = {
      value: varValue.value * count,
      unit: varValue.unit,
      confidence: varValue.confidence
    };
  }

  return expanded;
}
```

### 2. Uncertainty Propagation

```typescript
function aggregateValuesWithUncertainty(
  values: ValueWithConfidence[]
): ValueWithConfidence {
  // Sum nominal values
  const totalValue = values.reduce((sum, v) => sum + v.value, 0);

  // Propagate uncertainty assuming independent measurements
  // σ_total = √(σ₁² + σ₂² + ... + σₙ²)
  const totalUncertaintySquared = values.reduce((sum, v) => {
    const absoluteUncertainty = v.value * (v.confidence || 0) / 100;
    return sum + absoluteUncertainty ** 2;
  }, 0);

  const totalUncertainty = Math.sqrt(totalUncertaintySquared);
  const confidencePercent = (totalUncertainty / totalValue) * 100;

  return {
    value: totalValue,
    unit: values[0].unit,
    confidence: confidencePercent
  };
}
```

### 3. Unit Conversion (Preserve Confidence)

```typescript
function convertUnit(
  value: ValueWithConfidence,
  toUnit: string
): ValueWithConfidence {
  const conversionFactor = getConversionFactor(value.unit, toUnit);

  return {
    value: value.value * conversionFactor,
    unit: toUnit,
    confidence: value.confidence  // Percentage stays the same
  };
}
```

### 4. Template Update Notification

```typescript
async function checkForTemplateUpdates(userId: UUID): Promise<UpdateNotification[]> {
  const userTemplates = await getUserTemplates(userId);
  const notifications: UpdateNotification[] = [];

  for (const template of userTemplates) {
    if (template.linkType !== 'live-linked') continue;

    const origin = await getTemplate(template.originTemplateId);

    if (origin.version > template.version) {
      const changes = await getChangesBetweenVersions(
        template.originTemplateId,
        template.version,
        origin.version
      );

      notifications.push({
        templateId: template.id,
        templateName: template.intent,
        currentVersion: template.version,
        latestVersion: origin.version,
        changes,
        author: origin.authorId
      });
    }
  }

  return notifications;
}
```

---

## User Flows

### Flow 1: Create Lane with Library

```
1. User clicks "Create Lane Template"
2. Form appears:
   - Intent: "Sunday Meal Prep"
   - Duration: 120 minutes
   - [Create]

3. On create:
   - Lane template created
   - Library automatically created (name: "Sunday Meal Prep Library")
   - library_id linked to lane template

4. User sees Lane Editor:
   - Top: Lane segments (empty)
   - Right sidebar: Library browser (empty)
   - Button: [Add to Library]
```

### Flow 2: Add Template to Library

```
User is editing "Sunday Meal Prep" lane

Option A: Create New Template
1. Click [Add to Library]
2. Dropdown: "Create New Template"
3. Form appears:
   - Template Type: ○ Busy ○ Lane
   - Intent: "Chicken Marinade"
   - Add to library: ☑ Sunday Meal Prep Library (pre-selected)
   - [Create]
4. Template added to library, NOT to lane segments yet

Option B: Import from Another Library
1. Click [Add to Library]
2. Dropdown: "Import from Library"
3. Library picker:
   - ● Global Library
   - ○ My Workout Routine Library
   - ○ Search Public Templates
4. Template list appears
5. Select "Morning Prep" → Click [Add to Library]
6. Confirmation: "Add to Sunday Meal Prep Library?"
   - ☑ Keep link to original (updates when original changes)
   - [Add]
```

### Flow 3: Add Library Template to Lane Segments

```
User is editing "Sunday Meal Prep" lane
Library contains: ["Chicken Marinade", "Rice Cooking", "Veggie Prep"]

1. Click empty space in hierarchy viewer (or click segment + button)
2. Template picker modal opens:
   - Search bar at top
   - Tabs: [Lane Library] [Global] [Other Libraries] [Public]
   - Default tab: "Lane Library" (showing Sunday Meal Prep Library)

3. User sees library templates:
   ┌─────────────────────────────────┐
   │ Sunday Meal Prep Library        │
   ├─────────────────────────────────┤
   │ □ Chicken Marinade (15 min)    │
   │ □ Rice Cooking (20 min)        │
   │ □ Veggie Prep (10 min)         │
   └─────────────────────────────────┘

4. Select "Chicken Marinade" → [Add to Lane]
5. Segment appears in hierarchy at clicked position
```

### Flow 4: Remove vs Delete

```
User right-clicks segment "Chicken Marinade" in lane

Context menu appears:
┌─────────────────────────────────────┐
│ Remove from Lane                    │  ← Removes segment, keeps in library
│ ────────────────────────────────    │
│ Delete from Library                 │  ← Deletes entirely
│   └─ Also removes from lane         │
│ ────────────────────────────────    │
│ Duplicate                           │
│ Edit                                │
└─────────────────────────────────────┘

If user clicks "Delete from Library":
  Confirmation dialog:
  ┌──────────────────────────────────────────┐
  │ ⚠️ Delete "Chicken Marinade"?            │
  │                                          │
  │ This will:                               │
  │ • Remove from Sunday Meal Prep Library  │
  │ • Remove from this lane (1 segment)     │
  │ • Remove from 2 other libraries         │
  │                                          │
  │ This cannot be undone.                   │
  │                                          │
  │         [Cancel]  [Delete]               │
  └──────────────────────────────────────────┘
```

### Flow 5: Create Composite Variable

```
User is editing template "Chicken Meal"

1. In "willProduce" section, click [+ Add Variable]
2. Dropdown appears:
   - Add Atomic Variable
   - Add Composite Variable
   - Create New Composite

3. User clicks "Create New Composite"
4. Modal opens:

   Create Composite Unit
   ┌────────────────────────────────────────┐
   │ Name: Tanner's_perfect_portion         │
   │                                        │
   │ Composition:                           │
   │ ┌────────────────────────────────────┐ │
   │ │ protein: 50 grams ±5%             │ │
   │ │ carbs: 100 grams ±5%              │ │
   │ │ fat: 20 grams ±5%                 │ │
   │ └────────────────────────────────────┘ │
   │ [+ Add Variable]                       │
   │                                        │
   │ Visibility: ● Private ○ Public         │
   │                                        │
   │ ℹ️ This creates a reusable unit       │
   │    definition you can use in any      │
   │    template.                          │
   │                                        │
   │           [Cancel]  [Create]           │
   └────────────────────────────────────────┘

5. Composite created, now available in all templates
```

### Flow 6: Use Composite in Template

```
User editing "Chicken Meal" template

1. In "willProduce" section, click [+ Add Variable]
2. Dropdown: "Add Composite Variable"
3. Composite picker:

   Select Composite Unit
   ┌────────────────────────────────────────┐
   │ Search: [                            ] │
   │                                        │
   │ Your Composites:                       │
   │ • Tanner's_perfect_portion (v3)       │
   │   50g protein, 100g carbs, 20g fat    │
   │                                        │
   │ Public Composites:                     │
   │ • FitnessGuru's_meal_serving (v5)     │
   │   40g protein, 60g carbs, 15g fat     │
   │                                        │
   │           [Cancel]  [Select]           │
   └────────────────────────────────────────┘

4. After selection:

   ┌────────────────────────────────────────┐
   │ Produces: 2 × Tanner's_perfect_portion │
   │                                        │
   │ Storage:                               │
   │ ● Snapshot (Lock to v3)               │
   │   Historical accuracy                  │
   │                                        │
   │ ○ Live Link (Always latest)           │
   │   Auto-updates when definition changes │
   │                                        │
   │ Confidence in count: ±0%               │
   │                                        │
   │           [Cancel]  [Add]              │
   └────────────────────────────────────────┘

5. Variable added to template with chosen storage type
```

### Flow 7: Composite Update Notification

```
System detects Tanner updated "perfect_portion" v3 → v4

Notification appears:
┌───────────────────────────────────────────┐
│ 🔔 Composite Definition Updated           │
│                                           │
│ "Tanner's_perfect_portion" v3 → v4       │
│                                           │
│ Changes:                                  │
│ • protein: 50g → 55g (+10%)              │
│                                           │
│ Affected templates (using snapshots):     │
│ • Chicken Meal (2× v3)                   │
│ • Morning Bowl (1× v3)                   │
│ • Dinner Plate (3× v3)                   │
│                                           │
│ [Update All]  [Review Each]  [Keep v3]   │
└───────────────────────────────────────────┘

If user clicks "Review Each":
  For each template:
  ┌───────────────────────────────────────────┐
  │ Template: Chicken Meal                    │
  │                                           │
  │ Current: 2× perfect_portion (v3)         │
  │   → 100g protein, 200g carbs, 40g fat    │
  │                                           │
  │ Update to v4 would give:                  │
  │   → 110g protein, 200g carbs, 40g fat    │
  │                                           │
  │ [Update This]  [Keep v3]  [Skip]         │
  └───────────────────────────────────────────┘
```

### Flow 8: Download Template with Live-Link

```
User browsing public templates, finds "Alice's Ultimate Meal Prep"

1. Click template card
2. Template detail page:

   Alice's Ultimate Meal Prep
   ────────────────────────────
   4.8★ (2.3k downloads)
   Duration: 90 minutes

   Produces:
   • 5 × Alice's_meal_portion (v12)
     300 cal, 35g protein, 40g carbs

   Library Contents (8 templates):
   • Marinade Station
   • Grill Setup
   • Rice Cooker
   • Veggie Prep
   • ... (5 more)

   [Download]

3. Click [Download]
4. Modal appears:

   Download Options
   ┌────────────────────────────────────────┐
   │ Choose how to download:                │
   │                                        │
   │ ● Live Link (Recommended)             │
   │   • Get updates from Alice            │
   │   • See changelogs                    │
   │   • Can break link anytime            │
   │                                        │
   │ ○ Fork (Independent Copy)             │
   │   • No automatic updates              │
   │   • Fully yours to modify             │
   │   • Credit to Alice preserved         │
   │                                        │
   │ ℹ️ All 8 library templates will also  │
   │    be downloaded with the same link   │
   │    type.                               │
   │                                        │
   │ Add to library:                        │
   │ ☑ Global Library                      │
   │                                        │
   │         [Cancel]  [Download]           │
   └────────────────────────────────────────┘

5. After download:
   - Lane template added to user's templates
   - Library created: "Alice's Ultimate Meal Prep Library"
   - All 8 templates added to that library
   - Link metadata preserved
```

---

## UI/UX Requirements

### Library Browser (Right Sidebar in Lane Editor)

```
┌─────────────────────────────────────┐
│ Sunday Meal Prep Library       [⚙️] │
├─────────────────────────────────────┤
│ [Search templates...            ] 🔍│
├─────────────────────────────────────┤
│                                     │
│ Chicken Marinade          [+] [⋮]  │
│ 15 min • 2 variables                │
│ Last used: 2 days ago               │
│                                     │
│ Rice Cooking              [+] [⋮]  │
│ 20 min • 5 variables                │
│ Never used                          │
│                                     │
│ Veggie Prep               [+] [⋮]  │
│ 10 min • 3 variables                │
│ Last used: Today                    │
│                                     │
├─────────────────────────────────────┤
│ [+ Add to Library]                  │
└─────────────────────────────────────┘

[+] button: Add to lane segments
[⋮] button: Template actions menu
[⚙️] button: Library settings
```

### Library Settings Modal

```
┌────────────────────────────────────────┐
│ Library Settings                       │
├────────────────────────────────────────┤
│ Name: Sunday Meal Prep Library         │
│ Templates: 12                          │
│ Created: Jan 15, 2026                  │
│                                        │
│ Cleanup:                               │
│ [Archive Unused (>90 days)]            │
│ [Remove Never Used]                    │
│                                        │
│ Export:                                │
│ [Export as JSON]                       │
│                                        │
│          [Close]                       │
└────────────────────────────────────────┘
```

### Composite Variable Display

**In Template Editor:**
```
Produces:
┌────────────────────────────────────────┐
│ 2 × Tanner's_perfect_portion (v3) ⚠️  │
│     ↳ New version available (v4)      │
│     ↳ [Update] [Keep v3] [View Diff]  │
│                                        │
│ Expanded (v3):                         │
│ • 100g protein ±5% (95-105g)          │
│ • 200g carbs ±5% (190-210g)           │
│ • 40g fat ±5% (38-42g)                │
│                                        │
│ [Toggle: Show Composite / Expanded]    │
└────────────────────────────────────────┘
```

**In Lane Aggregation:**
```
Total Lane Production:
┌────────────────────────────────────────┐
│ Composite View:                        │
│ • 5 × Tanner's_perfect_portion        │
│ • 2 × Alice's_meal_serving            │
│                                        │
│ [Switch to Expanded View]              │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Expanded View:                         │
│ • 320g protein ±7.2% (297-343g)       │
│ • 580g carbs ±6.8% (541-619g)         │
│ • 125g fat ±7.5% (116-134g)           │
│                                        │
│ [Switch to Composite View]             │
└────────────────────────────────────────┘
```

### Confidence Factor Input

```
Add Variable
┌────────────────────────────────────────┐
│ Variable: protein                      │
│ Value: 50                              │
│ Unit: grams                            │
│                                        │
│ ☑ Include confidence bounds           │
│   Confidence: [±5%      ] ▼           │
│   Range: 47.5g - 52.5g                │
│                                        │
│ ℹ️ Why use confidence?                │
│    • Food labels can be ±20% off      │
│    • Measuring adds ±5-10% error      │
│    • Be honest about uncertainty      │
│                                        │
│ Presets:                               │
│ [Exact ±0%] [Typical ±5%] [Label ±20%]│
│                                        │
│          [Cancel]  [Add]               │
└────────────────────────────────────────┘
```

### Search with Library Context

```
Search: "warmup"  [in: Current Library ▼]

Results:
┌────────────────────────────────────────┐
│ 📍 Workout Routine Library             │
│ ├─ Morning Warmup (by you)            │
│ │   15 min • Last used: Today          │
│ └─ Cardio Warmup (linked to FitnessPro)│
│     20 min • v2.0                      │
│                                        │
│ 📍 Global Library                      │
│ └─ Morning Warmup (by you)            │
│     [Same as above]                    │
│                                        │
│ 🌐 Public Database (3 results)         │
│ ├─ Ultimate Warmup by Coach Mike      │
│ │   ⭐ 4.9 (2.3k downloads)            │
│ └─ ... (2 more)                        │
│     [Show All Public]                  │
└────────────────────────────────────────┘

[x] De-duplicate templates across libraries
```

### Update Notification Badge

```
Top App Bar:
┌────────────────────────────────────────┐
│ About Time          🔔3    [@Tanner ⏏️]│
└────────────────────────────────────────┘

Notification dropdown:
┌────────────────────────────────────────┐
│ Updates Available (3)                  │
├────────────────────────────────────────┤
│ Alice's Ultimate Meal Prep v12 → v13  │
│ • Updated marinade timing              │
│ [View] [Update] [Dismiss]              │
│                                        │
│ perfect_portion composite v3 → v4      │
│ • Increased protein 50g → 55g          │
│ • Affects 5 templates                  │
│ [Review] [Dismiss]                     │
│                                        │
│ FitnessPro's Workout v8 → v9          │
│ • Added cooldown segment               │
│ [View] [Update] [Dismiss]              │
└────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Library Foundation (2-3 weeks)

**Backend:**
- ✅ Create `libraries` table
- ✅ Create `library_memberships` table (many-to-many)
- ✅ Add `library_id` to lane templates
- ✅ Auto-create library when lane template created
- ✅ API endpoints:
  - `GET /api/libraries` - List user's libraries
  - `GET /api/libraries/:id/templates` - Get library contents
  - `POST /api/libraries/:id/templates` - Add template to library
  - `DELETE /api/library-memberships/:id` - Remove template from library

**Frontend:**
- ✅ Library browser sidebar in lane editor
- ✅ "Add to Library" flow
- ✅ Template picker filtered by library
- ✅ Clear "Remove from lane" vs "Delete from library" UX

**Testing:**
- User can create lane with auto-generated library
- User can add templates to library
- User can add library templates to lane segments
- User can remove segment without deleting from library
- User can delete template from library (removes all segments)

### Phase 2: Multi-Library Membership (1-2 weeks)

**Backend:**
- ✅ Enforce many-to-many relationship via `library_memberships`
- ✅ API endpoints:
  - `POST /api/templates/:id/add-to-library` - Add existing template to another library
  - `GET /api/templates/:id/libraries` - Get all libraries containing template

**Frontend:**
- ✅ "Import from Library" flow
- ✅ Library picker with search
- ✅ Show library badges in search results
- ✅ "In X libraries" indicator in template cards

**Testing:**
- Template can be added to multiple libraries
- Deleting template removes from all libraries
- Search shows library context
- De-duplication toggle works

### Phase 3: Confidence Factors (1-2 weeks)

**Backend:**
- ✅ Update `template_variables` to support `ValueWithConfidence`
- ✅ Implement uncertainty propagation algorithm
- ✅ Unit conversion with preserved confidence
- ✅ API endpoints:
  - `GET /api/lanes/:id/aggregated` - Returns aggregated values with confidence

**Frontend:**
- ✅ Confidence input in variable editor
- ✅ Display confidence bounds in lists (e.g., "50g ±5%")
- ✅ Expanded view shows ranges (e.g., "47.5-52.5g")
- ✅ Aggregation shows cumulative confidence

**Testing:**
- Confidence correctly propagates in addition
- Unit conversion preserves confidence percentage
- Aggregation across segments calculates proper uncertainty
- User can set/edit confidence on any value

### Phase 4: Composite Variables (2-3 weeks)

**Backend:**
- ✅ Create `composite_unit_definitions` table
- ✅ Implement versioning (increment on update)
- ✅ Composite expansion algorithm
- ✅ API endpoints:
  - `GET /api/composites` - List user's composites
  - `POST /api/composites` - Create new composite
  - `PUT /api/composites/:id` - Update (creates new version)
  - `GET /api/composites/:id/versions` - Version history

**Frontend:**
- ✅ Create composite modal
- ✅ Composite picker in variable editor
- ✅ Live-link vs snapshot choice UI
- ✅ Composite/expanded toggle view

**Testing:**
- User can create composite definition
- User can use composite in template (live or snapshot)
- Expansion produces correct values
- Snapshot locks to specific version
- Live-link uses latest version

### Phase 5: Composite Versioning & Updates (2 weeks)

**Backend:**
- ✅ Version change detection
- ✅ Bulk update snapshots
- ✅ Changelog tracking
- ✅ API endpoints:
  - `GET /api/composites/:id/changelog/:fromVersion/:toVersion`
  - `POST /api/templates/:id/update-composite-snapshots`

**Frontend:**
- ✅ Update notification system
- ✅ Changelog display
- ✅ Bulk update modal ("Update All" vs "Review Each")
- ✅ Warning badge on outdated snapshots
- ✅ Diff view (old version vs new version)

**Testing:**
- System detects outdated snapshots
- Notification shows affected templates
- User can update all or review individually
- Historical templates remain unchanged unless explicitly updated

### Phase 6: Author Linking (2-3 weeks)

**Backend:**
- ✅ Add author linking columns to templates
- ✅ Fork vs live-link logic
- ✅ Update propagation system
- ✅ API endpoints:
  - `POST /api/templates/:id/fork`
  - `POST /api/templates/:id/live-link`
  - `GET /api/templates/:id/updates` - Check for updates
  - `POST /api/templates/:id/apply-update`

**Frontend:**
- ✅ Download modal (fork vs live-link choice)
- ✅ Update notification for live-linked templates
- ✅ Changelog display for template updates
- ✅ "Break link" action
- ✅ Author attribution in template cards

**Testing:**
- User can fork a public template
- User can live-link a public template
- Updates propagate to live-linked templates
- User receives notification of updates
- User can break link (converts to fork)

### Phase 7: Polish & Performance (1-2 weeks)

**Features:**
- ✅ Library usage stats (last used, usage count)
- ✅ Bulk archive/cleanup operations
- ✅ Library export/import (JSON)
- ✅ Performance optimization (indexing, caching)
- ✅ Error handling edge cases

**Testing:**
- Full end-to-end user flows
- Performance testing with large libraries (100+ templates)
- Edge case validation (circular dependencies, deleted composites, etc.)

---

## Success Metrics

### Quantitative

1. **Library Adoption**
   - % of users creating lanes with libraries (target: >80%)
   - Average library size (target: 10-30 templates)
   - % of templates in libraries vs global (target: >60% in libraries)

2. **Composite Usage**
   - Number of composite definitions created per user (target: 5+)
   - % of templates using composites (target: >40%)
   - Snapshot vs live-link ratio (baseline to track)

3. **Confidence Factor Usage**
   - % of variables with confidence bounds (target: >30%)
   - Average confidence percentage (baseline to track)

4. **Author Linking**
   - % of public template downloads using live-link (target: >50%)
   - Update acceptance rate (target: >70%)

### Qualitative

1. **User Feedback**
   - "I can finally organize my templates"
   - "Love seeing the uncertainty ranges"
   - "Composite variables save so much time"

2. **Feature Requests**
   - Tracking which features users request most
   - Pain points in current implementation

---

## Risks & Mitigations

### Risk 1: Complexity Overwhelms Users

**Mitigation:**
- Progressive disclosure: Start with simple global templates, introduce libraries gradually
- Tutorial/onboarding flow explaining benefits
- Smart defaults (auto-create libraries, suggest confidence values)
- "Simple mode" that hides advanced features

### Risk 2: Performance with Large Libraries

**Mitigation:**
- Pagination/virtualization in library browser
- Lazy loading of template details
- Database indexing on all foreign keys
- Caching composite expansions

### Risk 3: Composite Version Conflicts

**Mitigation:**
- Clear warnings before updating snapshots
- Diff view showing exactly what changed
- Ability to undo bulk updates
- Keep old versions accessible in history

### Risk 4: Author Update Spam

**Mitigation:**
- Batch notifications (1 notification for multiple updates)
- "Snooze" or "Ignore this update" options
- Configurable update frequency
- Auto-apply minor updates, prompt for major changes

---

## Open Questions

1. **Should there be a "Library Template" marketplace?**
   - Pre-built libraries for common use cases (Meal Prep 101, Marathon Training, etc.)
   - User-submitted libraries vs curated only

2. **How to handle composite name collisions?**
   - Current plan: Composites are global but owned
   - Alternative: Namespace composites by author (Alice:meal_portion)

3. **Should visibility be library-level or template-level?**
   - Current plan: Template-level with validation
   - Alternative: Libraries can override template visibility

4. **Max library size limits?**
   - Should there be a cap (e.g., 100 templates per library)?
   - Or rely on UI patterns to encourage organization?

5. **Composite inheritance?**
   - Should composites be able to reference other composites?
   - Example: "1 full_meal = 1 protein_portion + 1 carb_portion"

---

## Appendix A: Glossary

- **Library**: A collection of templates scoped to a lane or global context
- **Library Membership**: Many-to-many relationship allowing templates to belong to multiple libraries
- **Composite Variable**: A reusable bundle of multiple variables (e.g., "1 meal serving = 300cal + 30g protein")
- **Confidence Factor**: Percentage bounds representing measurement uncertainty (e.g., ±5%)
- **Atomic Variable**: A single variable with value, unit, and optional confidence
- **Snapshot**: A locked version of a composite definition for historical accuracy
- **Live-Link**: A dynamic reference to the latest version of a composite or template
- **Author Linking**: Connection between downloaded template and original author for updates
- **Fork**: An independent copy of a template with no update propagation

---

## Appendix B: Example Data

### Example Composite Definition

```json
{
  "id": "c1b2e3f4-...",
  "name": "Tanner's_perfect_portion",
  "version": 3,
  "composition": {
    "protein": {
      "value": 50,
      "unit": "grams",
      "confidence": 5
    },
    "carbs": {
      "value": 100,
      "unit": "grams",
      "confidence": 5
    },
    "fat": {
      "value": 20,
      "unit": "grams",
      "confidence": 5
    }
  },
  "authorId": "user-123",
  "linkType": "original",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-02-20T15:30:00Z",
  "changelog": "Increased protein from 45g to 50g based on updated nutritional analysis"
}
```

### Example Template Variable (Snapshot)

```json
{
  "id": "var-456",
  "templateId": "tmpl-789",
  "variableName": "meal_portions",
  "storageType": "composite-snapshot",
  "data": {
    "compositeName": "Tanner's_perfect_portion",
    "compositeId": "c1b2e3f4-...",
    "version": 3,
    "count": 2,
    "confidence": 0,
    "expandedValues": {
      "protein": { "value": 100, "unit": "grams", "confidence": 5 },
      "carbs": { "value": 200, "unit": "grams", "confidence": 5 },
      "fat": { "value": 40, "unit": "grams", "confidence": 5 }
    },
    "snapshotAt": "2026-02-25T12:00:00Z"
  }
}
```

### Example Library with Memberships

```json
{
  "library": {
    "id": "lib-abc",
    "name": "Sunday Meal Prep Library",
    "laneTemplateId": "lane-xyz",
    "ownerId": "user-123",
    "visibility": "private",
    "templateCount": 8
  },
  "memberships": [
    {
      "id": "mem-1",
      "libraryId": "lib-abc",
      "templateId": "tmpl-chicken",
      "addedAt": "2026-01-20T09:00:00Z",
      "addedBy": "user-123",
      "notes": "Main protein source",
      "order": 1
    },
    {
      "id": "mem-2",
      "libraryId": "lib-abc",
      "templateId": "tmpl-rice",
      "addedAt": "2026-01-20T09:05:00Z",
      "addedBy": "user-123",
      "order": 2
    }
  ]
}
```

---

## Appendix C: API Endpoints Summary

### Libraries
- `GET /api/libraries` - List user's libraries
- `GET /api/libraries/:id` - Get library details
- `POST /api/libraries` - Create library (usually auto-created with lane)
- `PUT /api/libraries/:id` - Update library metadata
- `DELETE /api/libraries/:id` - Delete library

### Library Memberships
- `GET /api/libraries/:id/templates` - Get templates in library
- `POST /api/libraries/:id/templates` - Add template to library
- `DELETE /api/library-memberships/:id` - Remove template from library
- `GET /api/templates/:id/libraries` - Get all libraries containing template

### Composites
- `GET /api/composites` - List user's composite definitions
- `GET /api/composites/:id` - Get composite details
- `POST /api/composites` - Create composite
- `PUT /api/composites/:id` - Update composite (creates new version)
- `GET /api/composites/:id/versions` - Get version history
- `GET /api/composites/:id/changelog/:from/:to` - Get changelog between versions

### Template Variables
- `GET /api/templates/:id/variables` - Get template variables
- `POST /api/templates/:id/variables` - Add variable to template
- `PUT /api/template-variables/:id` - Update variable
- `DELETE /api/template-variables/:id` - Remove variable
- `POST /api/templates/:id/update-composite-snapshots` - Bulk update outdated snapshots

### Author Linking
- `POST /api/templates/:id/fork` - Create independent fork
- `POST /api/templates/:id/live-link` - Create live-linked copy
- `GET /api/templates/:id/updates` - Check for updates from origin
- `POST /api/templates/:id/apply-update` - Apply update from origin
- `POST /api/templates/:id/break-link` - Convert live-link to fork

### Aggregation
- `GET /api/lanes/:id/aggregated` - Get aggregated variables with confidence
- `GET /api/lanes/:id/aggregated?view=composite` - Get composite view
- `GET /api/lanes/:id/aggregated?view=expanded` - Get expanded view

---

**End of PRD**

**Next Steps:**
1. Review and approve PRD
2. Create technical design document
3. Break down into implementation tickets
4. Begin Phase 1 development
