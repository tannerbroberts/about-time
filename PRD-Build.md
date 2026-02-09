# PRD: Build - Template Creation & Management

## Overview

The Build feature enables users to create and manage reusable meal templates with complete nutritional profiles using the about-time-core template system.

## Goal

Create reusable meal templates with complete nutritional profiles that can be scheduled and tracked.

## User Actions

- Create BusyTemplates for individual meals/snacks
- Define nutritional production (macros, micros, custom variables)
- Specify consumption requirements (prep time, ingredients, cost)
- Build LaneTemplates for meal sequences (meal prep sessions, daily routines)
- Compose nested templates (breakfast routine with multiple components)

## Key Features

### Meal Template Library
- Browse, search, and organize saved meal templates
- Dense template rows in list format
- Sort by Recent, Name, Calories, Protein
- Scroll performance optimized for hundreds of templates

### Quick Entry
- AI-assisted creation as primary method
- Natural language input: "High protein breakfast with eggs and toast"
- Manual override available for all fields

### Nutrition Calculator
- AI estimates nutrition from meal descriptions
- Query nutrition API or LLM with structured prompt
- Return estimated macros, prep time, cost
- Show confidence level (high/medium/low)

### Template Composition
- Nest templates (e.g., "Sunday Meal Prep" contains multiple meal templates)
- Create complex meal sequences
- Reuse components across templates

### Variants
- Create variations of templates (low-carb version, vegan version)
- Quick duplication with modifications
- Track template relationships

### Import/Export
- Share templates with other users
- Import from recipe databases
- Export for backup
- JSON-based template format

## Example User Story

> As a user, I want to create a "High-Protein Breakfast" template that produces 40g protein and 450 calories, takes 10 minutes to prepare, and can be scheduled into my morning routine.

## Technical Implementation

### CRUD Operations with @tannerbroberts/about-time-core

**All template CRUD operations must use the @tannerbroberts/about-time-core npm package.**

```typescript
import {
  type TemplateMap,
  type BusyTemplate,
  type LaneTemplate,
  createBusyTemplate,
  createLaneTemplate,
  updateTemplate,
  deleteTemplate,
} from '@tannerbroberts/about-time-core';
```

The package provides:
- **Create**: `createBusyTemplate()`, `createLaneTemplate()`
- **Read**: Direct access via `TemplateMap.get(id)`
- **Update**: `updateTemplate()` for modifying existing templates
- **Delete**: `deleteTemplate()` for removing templates

### BusyTemplate Structure

```typescript
createBusyTemplate({
  intent: "High-Protein Breakfast - Greek yogurt with berries",
  estimatedDuration: 10 * 60 * 1000, // 10 minutes
  willConsume: {
    prep_time_ms: 10 * 60 * 1000,
    cost_cents: 350
  },
  willProduce: {
    calories: 450,
    protein_g: 40,
    carbs_g: 35,
    fats_g: 15,
    fiber_g: 8
  }
}, templates, generateId);
```

### AI Implementation Strategy

**Core Philosophy**: AI should reduce cognitive load, not replace user control. Every AI suggestion is editable and transparent.

**Template Creation Flow**:

1. **Natural Language Input**
   - User types: "Greek yogurt bowl with berries and granola"
   - AI parses meal description

2. **AI Nutrition Estimation**
   - Query nutrition API or LLM with structured prompt
   - Return estimated macros, prep time, cost
   - Show confidence level (high/medium/low)

3. **User Review & Override**
   - Display AI suggestions in editable form fields
   - User can adjust any value
   - "Looks good?" confirmation or "Let me edit" option

4. **Template Saved**
   - Create BusyTemplate with final values
   - Add to user's library
   - Track which fields were AI-generated vs. user-edited (for learning)

**Technical Implementation Options**:

**Option A: LLM API (Recommended for MVP)**
```typescript
async function estimateNutrition(description: string): Promise<NutritionEstimate> {
  const prompt = `
Given this meal description: "${description}"

Estimate the nutrition information in JSON format:
{
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "fiber_g": number,
  "prepTime_minutes": number,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}
`;

  const response = await callLLM(prompt);
  return JSON.parse(response);
}
```

**Option B: Nutrition Database API**
- Use services like USDA FoodData Central, Nutritionix, or Spoonacular
- Parse meal description into ingredients
- Look up each ingredient
- Sum totals
- More accurate but requires ingredient parsing

**Option C: Hybrid Approach**
- Use LLM to parse ingredients
- Use nutrition database for lookup
- Use LLM to handle ambiguity and portion estimation
- Best accuracy, more complex

**Error Handling**:
- Always provide manual entry option if AI fails
- Clear error messages: "Couldn't estimate nutrition, please enter manually"
- Fallback to defaults (reasonable estimates) with clear labeling
- Allow user to report incorrect AI suggestions for improvement

## UI/UX Design Specifications

### Template Library Display

**Dense template rows** in list format:
- Template name (bold, prominent)
- Quick macro summary (calories, protein, carbs, fats)
- Template type badge (Busy/Lane)
- Quick action buttons (edit, duplicate, delete)
- Search bar at top with live filtering
- Sort options: Recent, Name, Calories, Protein
- Scroll performance optimized for hundreds of templates

### Template Creation Interface

**AI-Assisted Creation** as primary method:
- Natural language input: "High protein breakfast with eggs and toast"
- AI suggests:
  - Estimated nutrition values
  - Preparation time
  - Common variations
- Manual override available for all fields
- Iterative refinement approach:
  - Start with basic template
  - Add details progressively
  - Save at any stage

### Template Editor

- Inline editing for quick adjustments
- Full editor modal for comprehensive changes
- Real-time validation feedback
- Preview of how template appears in schedules

### Visual Design

**Style: Colorful & Playful**
- Vibrant, approachable color palette
- Clean typography with personality
- Smooth animations and transitions
- Food-centric iconography and illustrations

**Theme Support**
- Auto-detect dark mode following system preference
- Automatic switching between light/dark themes
- High contrast ratios for accessibility

## State Management

Following the codebase's established pattern:

```
Build/
├── index.tsx          # Component with useReducer
├── Context.ts         # BuildContextValue type
├── Provider.tsx       # BuildProvider export
├── reducer.ts         # State, actions, reducer
└── useContext.ts      # useBuildContext hook
```

### State Structure

```typescript
interface BuildState {
  templates: TemplateMap;
  selectedTemplateId: string | null;
  searchQuery: string;
  sortBy: 'recent' | 'name' | 'calories' | 'protein';
  isCreating: boolean;
  aiEstimation: NutritionEstimate | null;
}

type BuildAction =
  | { type: 'CREATE_TEMPLATE'; template: BusyTemplate | LaneTemplate }
  | { type: 'UPDATE_TEMPLATE'; id: string; updates: Partial<BusyTemplate | LaneTemplate> }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'SELECT_TEMPLATE'; id: string | null }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_SORT_BY'; sortBy: BuildState['sortBy'] }
  | { type: 'SET_AI_ESTIMATION'; estimation: NutritionEstimate | null };
```

## Data Model

### State Variables (StateLedger)

**Macronutrients**:
- `calories`: Total energy (kcal)
- `protein_g`: Protein (grams)
- `carbs_g`: Carbohydrates (grams)
- `fats_g`: Fats (grams)

**Micronutrients** (optional):
- `fiber_g`: Dietary fiber (grams)
- `sodium_mg`: Sodium (milligrams)
- `sugar_g`: Sugars (grams)
- Custom vitamins/minerals

**Time & Cost**:
- `prep_time_ms`: Preparation time (milliseconds)
- `consume_time_ms`: Eating time (milliseconds)
- `cost_cents`: Monetary cost (cents)

**Custom Variables**:
- `water_ml`: Water intake (milliliters)
- `caffeine_mg`: Caffeine (milligrams)
- Users can define custom tracking variables

## MVP Feature Priority

### Phase 1 (MVP Core)
- AI-assisted template creation (natural language → nutrition data)
- Dense template library with basic search
- Manual override for all AI suggestions
- LocalStorage persistence
- Basic CRUD operations (Create, Read, Update, Delete)

### Phase 2 (Enhanced Features)
- Template variants and composition
- Advanced search and filtering
- Template categories and tags
- Batch operations (duplicate, delete multiple)
- Template usage analytics

### Phase 3 (Advanced Features)
- Recipe import from URLs
- Photo nutrition estimation
- Community template sharing
- Template recommendations based on goals
- Nutritional analysis and insights

## Success Metrics

1. **Template Creation Rate**: Number of templates created per user
2. **AI Acceptance Rate**: Percentage of AI suggestions accepted without modification
3. **Template Reuse**: Average number of times each template is scheduled
4. **Library Size**: Total templates in user's library over time
5. **Search Usage**: Percentage of users using search vs. scrolling

## Technical Considerations

### Validation
- Ensure all required fields are present (intent, duration)
- Validate positive values for nutrition data
- Check for duplicate template names (warn user)
- Validate nested template references (no circular dependencies)

### Performance
- Lazy-load template details (show summaries first)
- Virtualize list rendering for large libraries
- Debounce search input
- Cache AI estimation results

### Persistence
- LocalStorage for MVP (TemplateMap serialization)
- Auto-save on every change
- Export/Import functionality for backup
- Future: Backend API for sync across devices

### Accessibility
- Keyboard navigation for template list
- Screen reader support for nutrition values
- Focus management for modals
- Clear error messages and validation feedback
